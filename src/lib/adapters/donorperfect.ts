/**
 * PLACEHOLDER FORMAT — pending real anonymized Mission exports.
 *
 * No confirmed sample of a DonorPerfect export exists yet (see
 * docs/evidence-log.md, E2 — donations flowing through DonorPerfect is an
 * observation, the export *shape* is not confirmed). This adapter assumes
 * a CSV/XLSX that has ALREADY been aggregated per event before reaching
 * EventFlow, with columns:
 *
 *   event, date, amount[, description]
 *
 * Per D3 (decision-log.md) and the project privacy rule, this adapter
 * deliberately never reads donor name/email/address columns even if a
 * file contains them (e.g. "donor_name", "email", "first_name",
 * "last_name") — only `event`, `date`, `amount` and `description` are
 * consulted. If such columns are present this adapter does not reject the
 * file (aggregation may legitimately come with a lookup/export tool that
 * always includes a name column for *other* reports); it simply never
 * reads them, so no donor-level personal data is parsed into memory here,
 * let alone persisted. If the Mission's real exports turn out to be
 * donor-level (one row per gift, not per event), this adapter must be
 * replaced with one that aggregates by event *before* any row is held
 * past that aggregation step — not just relabeled.
 *
 * Every row is revenue. A row whose `event` cell is "total"/"totals"/
 * "grand total" is read as the file's declared total, not a line item.
 */
import { buildLineItems, parseRows, type KindResolution, type RawRow } from "./shared";
import type { Adapter } from "./types";

const COLUMNS = {
  event: "event",
  date: "date",
  amount: "amount",
  description: "description",
};

function resolveKind(_row: RawRow, amount: number): KindResolution {
  return { kind: "revenue", amount: Math.abs(amount) };
}

export const donorPerfectAdapter: Adapter = (buffer, filename) => {
  const rows = parseRows(buffer, filename);
  return buildLineItems(rows, COLUMNS, resolveKind);
};
