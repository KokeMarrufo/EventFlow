import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { LineItemKind, ValidationError } from "@/lib/types";
import type { ParsedLineItem } from "./types";

/**
 * Shared parsing/validation helpers used by every per-source adapter.
 * See docs/evidence-log.md — the real export formats are not confirmed
 * yet (E1/E2 are observations about *where* data lives, not its shape),
 * so these helpers are deliberately permissive about column naming
 * (case-insensitive, trims whitespace) and raise a ValidationError for
 * anything they can't confidently parse rather than guessing.
 */

export type RawRow = Record<string, string>;

/** Parses a CSV or XLSX buffer into an array of rows keyed by lower-cased,
 * trimmed header names. Returns [] for an empty file. */
export function parseRows(buffer: Buffer, filename: string): RawRow[] {
  const isXlsx = /\.xlsx?$/i.test(filename);
  if (isXlsx) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    return rows.map(normalizeRow);
  }

  const text = buffer.toString("utf-8");
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  return result.data.map(normalizeRow);
}

function normalizeRow(row: Record<string, unknown>): RawRow {
  const out: RawRow = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.trim().toLowerCase()] = value == null ? "" : String(value).trim();
  }
  return out;
}

/** Parses an amount string like "1,234.56", "$1234.56" or "(123.45)" (accounting
 * negative) into a number. Returns null if it can't be confidently parsed. */
export function parseAmount(raw: string | undefined): number | null {
  if (raw == null) return null;
  let s = raw.trim();
  if (s === "") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$,\s]/g, "");
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Parses a date into an ISO "yyyy-mm-dd" string. Accepts "yyyy-mm-dd",
 * "mm/dd/yyyy" and "m/d/yy". Returns null for an empty string (dates are
 * optional on LineItem); returns undefined if non-empty but unparsable. */
export function parseDateFlexible(raw: string | undefined): string | null | undefined {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === "") return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (isoMatch) {
    return isValidYmd(+isoMatch[1], +isoMatch[2], +isoMatch[3]) ? s : undefined;
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (slashMatch) {
    const month = +slashMatch[1];
    const day = +slashMatch[2];
    let year = +slashMatch[3];
    if (year < 100) year += year < 50 ? 2000 : 1900;
    if (!isValidYmd(year, month, day)) return undefined;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return undefined;
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/** Row values the string "total"/"totals"/"grand total" in the event-tag
 * column is treated as the file's declared-total footer row, not as a
 * line item — a common CSV export convention. */
export function isTotalRow(eventTag: string): boolean {
  const v = eventTag.trim().toLowerCase();
  return v === "total" || v === "totals" || v === "grand total";
}

export interface ColumnMap {
  event: string;
  date: string;
  amount: string;
  description?: string;
  /** Column read into LineItem.category (e.g. "category", "fund", or
   * "account" when an adapter reuses another required column). Optional:
   * null when the file has no such column. */
  category?: string;
}

export type KindResolution =
  | { kind: LineItemKind; amount: number }
  | { error: string };

/**
 * Shared row-by-row validation/build pipeline: resolves the event tag,
 * date, amount and (via `resolveKind`) cost/revenue split for every row,
 * emitting a ValidationError instead of a LineItem whenever a row can't be
 * trusted (missing amount, unparsable date, missing event tag, duplicate
 * row) so bad data never turns into a silently wrong number.
 */
export function buildLineItems(
  rows: RawRow[],
  columns: ColumnMap,
  resolveKind: (row: RawRow, amount: number) => KindResolution,
): { lineItems: ParsedLineItem[]; errors: ValidationError[]; declaredTotal: number | null } {
  const lineItems: ParsedLineItem[] = [];
  const errors: ValidationError[] = [];
  const seen = new Map<string, number>(); // dedupe key -> first row number
  let declaredTotal: number | null = null;

  rows.forEach((row, idx) => {
    const sourceRow = idx + 2; // +1 for 1-indexing, +1 for the header row
    const eventTag = row[columns.event] ?? "";
    const rawAmount = row[columns.amount];
    const amount = parseAmount(rawAmount);

    if (isTotalRow(eventTag)) {
      if (amount != null) declaredTotal = amount;
      else errors.push({ row: sourceRow, message: `Row ${sourceRow}: total row has no parsable amount.` });
      return;
    }

    if (eventTag.trim() === "") {
      errors.push({ row: sourceRow, message: `Row ${sourceRow}: missing event tag.` });
      return;
    }

    if (amount == null) {
      errors.push({
        row: sourceRow,
        message: `Row ${sourceRow}: missing or unparsable amount ("${rawAmount ?? ""}").`,
      });
      return;
    }

    const dateResult = parseDateFlexible(row[columns.date]);
    if (dateResult === undefined) {
      errors.push({
        row: sourceRow,
        message: `Row ${sourceRow}: unparsable date ("${row[columns.date] ?? ""}").`,
      });
      return;
    }

    const kindResult = resolveKind(row, amount);
    if ("error" in kindResult) {
      errors.push({ row: sourceRow, message: `Row ${sourceRow}: ${kindResult.error}` });
      return;
    }

    const description = columns.description ? row[columns.description] ?? "" : "";
    const category = columns.category ? row[columns.category]?.trim() || null : null;
    const dedupeKey = JSON.stringify([
      eventTag.trim().toLowerCase(),
      dateResult,
      kindResult.amount,
      description.trim().toLowerCase(),
    ]);
    const firstRow = seen.get(dedupeKey);
    if (firstRow != null) {
      errors.push({
        row: sourceRow,
        message: `Row ${sourceRow}: duplicate of row ${firstRow} (same event, date, amount and description).`,
      });
      return;
    }
    seen.set(dedupeKey, sourceRow);

    lineItems.push({
      eventName: eventTag.trim(),
      sourceRow,
      kind: kindResult.kind,
      amount: kindResult.amount,
      description,
      category,
      occurredOn: dateResult,
    });
  });

  return { lineItems, errors, declaredTotal };
}
