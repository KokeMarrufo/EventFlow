/**
 * PLACEHOLDER FORMAT — pending real anonymized Mission exports.
 *
 * No confirmed sample of a Downtown Mission event-budget export exists yet
 * (see docs/evidence-log.md, E1/E5 — the planning process is observed, the
 * file *shape* is not). This adapter assumes a CSV/XLSX with columns:
 *
 *   event, date, amount, description[, kind]
 *
 * - `kind` is optional and, if present, must be "cost" or "revenue"
 *   (case-insensitive) — a budget can include a few planned-revenue lines
 *   (e.g. "ticket sales") alongside costs.
 * - If `kind` is absent, the sign of `amount` decides it: negative (or a
 *   parenthesized accounting negative, e.g. "(500.00)") is a cost, positive
 *   is revenue. The stored amount is always the absolute value.
 * - A row whose `event` cell is "total"/"totals"/"grand total" is read as
 *   the file's declared total, not a line item.
 *
 * Swap this out once real (anonymized) budget exports are available —
 * nothing outside this file should need to change (see
 * src/lib/adapters/types.ts for the contract).
 */
import { buildLineItems, parseRows, type KindResolution, type RawRow } from "./shared";
import type { Adapter } from "./types";

const COLUMNS = {
  event: "event",
  date: "date",
  amount: "amount",
  description: "description",
};

function resolveKind(row: RawRow, amount: number): KindResolution {
  const rawKind = (row["kind"] ?? row["type"] ?? "").trim().toLowerCase();
  if (rawKind) {
    if (rawKind === "cost" || rawKind === "revenue") {
      return { kind: rawKind, amount: Math.abs(amount) };
    }
    return { error: `unrecognized kind "${rawKind}" (expected "cost" or "revenue").` };
  }
  return amount < 0
    ? { kind: "cost", amount: Math.abs(amount) }
    : { kind: "revenue", amount: Math.abs(amount) };
}

export const eventBudgetAdapter: Adapter = (buffer, filename) => {
  const rows = parseRows(buffer, filename);
  return buildLineItems(rows, COLUMNS, resolveKind);
};
