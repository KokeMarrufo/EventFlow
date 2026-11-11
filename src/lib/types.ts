/**
 * Shared data contract between the backend (parsing/reconciliation) and the
 * frontend (dashboard/import UI). Keep this file in sync with db/schema.ts.
 * Amounts are always in whole-dollar decimal (e.g. 1234.56), never cents.
 */

export type SourceType = "event_budget" | "donorperfect" | "sage";

export type LineItemKind = "cost" | "revenue";

export interface ValidationError {
  row: number;
  message: string;
}

export interface SourceFile {
  id: string;
  filename: string;
  sourceType: SourceType;
  uploadedAt: string; // ISO date
  rowCount: number;
  status: "parsed" | "parsed_with_errors" | "error";
  declaredTotal: number | null; // total as stated in the source file/export, for reconciliation
  errors: ValidationError[];
}

export interface LineItem {
  id: string;
  eventId: string;
  eventName: string;
  sourceFileId: string;
  sourceFileName: string;
  sourceRow: number;
  kind: LineItemKind;
  amount: number;
  description: string;
  occurredOn: string | null; // ISO date
}

export interface ReconciliationCheck {
  sourceFileId: string;
  sourceFileName: string;
  declaredTotal: number;
  computedTotal: number;
  difference: number;
  withinTolerance: boolean;
}

export interface EventSummary {
  eventId: string;
  eventName: string;
  totalCost: number;
  totalRevenue: number;
  net: number;
  lineItemCount: number;
  sourceFiles: string[];
}

export interface EventDetail extends EventSummary {
  lineItems: LineItem[];
}

export interface ImportResponse {
  sourceFile: SourceFile;
  lineItems: LineItem[];
  reconciliation: ReconciliationCheck | null;
}

/** Reconciliation tolerance: §7.1 "within an agreed margin" — placeholder until staff confirm. */
export const RECONCILIATION_TOLERANCE = 0.01;
