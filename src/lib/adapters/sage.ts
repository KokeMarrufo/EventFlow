/**
 * PLACEHOLDER FORMAT — pending real anonymized Mission exports.
 *
 * No confirmed sample of a Sage accounting export exists yet (see
 * docs/evidence-log.md, E2 — monthly Sage financial reports are an
 * observation, the export *shape* is not confirmed). This adapter assumes
 * a general-ledger-style CSV/XLSX with columns:
 *
 *   event, date, amount, account[, description]
 *
 * `account` is read as free text and classified by keyword:
 * - contains "revenue", "income", "donation" or "grant" -> revenue
 * - contains "expense", "cost", "fee" or "supplies"      -> cost
 * - otherwise, falls back to the sign of `amount` (negative = cost,
 *   positive = revenue), matching common GL sign conventions.
 * The stored amount is always the absolute value. The `account` text
 * itself is also read verbatim into LineItem.category (real Sage/GL
 * exports are organized by chart-of-accounts entries like "6100 -
 * Professional Fees" or "4000 - Contributed Revenue") — it powers the
 * cost-by-category chart the same way event-budget's `category` does.
 *
 * A row whose `event` cell is "total"/"totals"/"grand total" is read as
 * the file's declared total, not a line item. Sage exports are also where
 * an "event" tag is least likely to exist natively (GL entries are coded
 * by account, not campaign) — see D2/D3 in decision-log.md — so this is
 * the adapter most likely to need revisiting once a real export is seen.
 */
import { buildLineItems, parseRows, type KindResolution, type RawRow } from "./shared";
import type { Adapter } from "./types";

const COLUMNS = {
  event: "event",
  date: "date",
  amount: "amount",
  description: "description",
  category: "account",
};

const REVENUE_KEYWORDS = ["revenue", "income", "donation", "grant"];
const COST_KEYWORDS = ["expense", "cost", "fee", "supplies"];

function resolveKind(row: RawRow, amount: number): KindResolution {
  const account = (row["account"] ?? "").toLowerCase();
  if (!account) {
    return { error: 'missing "account" column value.' };
  }
  if (REVENUE_KEYWORDS.some((kw) => account.includes(kw))) {
    return { kind: "revenue", amount: Math.abs(amount) };
  }
  if (COST_KEYWORDS.some((kw) => account.includes(kw))) {
    return { kind: "cost", amount: Math.abs(amount) };
  }
  return amount < 0
    ? { kind: "cost", amount: Math.abs(amount) }
    : { kind: "revenue", amount: Math.abs(amount) };
}

export const sageAdapter: Adapter = (buffer, filename) => {
  const rows = parseRows(buffer, filename);
  return buildLineItems(rows, COLUMNS, resolveKind);
};
