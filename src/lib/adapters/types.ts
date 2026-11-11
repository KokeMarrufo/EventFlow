import type { LineItemKind, SourceType, ValidationError } from "@/lib/types";

/**
 * A line item as produced directly by an adapter, before it has been
 * persisted. The import route is responsible for resolving/creating the
 * `events` row and the `source_files` row and filling in the ids that
 * `LineItem` (lib/types.ts) requires — adapters never touch the DB.
 */
export interface ParsedLineItem {
  eventName: string;
  sourceRow: number;
  kind: LineItemKind;
  amount: number;
  description: string;
  occurredOn: string | null; // ISO date, or null if the source had none
}

export interface AdapterResult {
  lineItems: ParsedLineItem[];
  errors: ValidationError[];
  /** Total declared inside the file itself (e.g. a "TOTAL" row), if any. */
  declaredTotal: number | null;
}

export type Adapter = (buffer: Buffer, filename: string) => AdapterResult;

export const ADAPTER_SOURCE_TYPES: SourceType[] = [
  "event_budget",
  "donorperfect",
  "sage",
];
