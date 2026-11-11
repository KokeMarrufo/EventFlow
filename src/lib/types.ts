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
  /** e.g. "Venue"/"Catering" (event budget), "Ticket Sales" (DonorPerfect
   * fund), or the Sage GL account name. Null if the source had no such
   * column. See lib/adapters/* for how each source maps to this. */
  category: string | null;
  occurredOn: string | null; // ISO date
}

export interface CategoryAmount {
  category: string;
  amount: number;
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
  /**
   * Whether this event has at least one cost/revenue line item. A net
   * figure is only meaningful when both are true — an event with only a
   * budget imported (no DonorPerfect/Sage yet) would otherwise show a
   * misleadingly large "loss" that's really just missing data. See
   * src/lib/event-status.ts.
   */
  hasCostData: boolean;
  hasRevenueData: boolean;
}

/** Per-source-file contribution to one event, with its own reconciliation
 * check when that file covers exactly one event (see getEventDetail). */
export interface EventFileBreakdown {
  sourceFileId: string;
  sourceFileName: string;
  sourceType: SourceType;
  cost: number;
  revenue: number;
  lineItemCount: number;
  /** Null when this file's rows span more than one event — a per-file
   * declared total wouldn't be this event's number alone, so there's
   * nothing honest to reconcile at the event level. */
  reconciliation: ReconciliationCheck | null;
}

export interface EventValidationIssue {
  sourceFileName: string;
  row: number;
  message: string;
}

export interface EventDetail extends EventSummary {
  lineItems: LineItem[];
  fileBreakdown: EventFileBreakdown[];
  costByCategory: CategoryAmount[];
  revenueByCategory: CategoryAmount[];
  /** Validation errors from this event's source files — labeled by file,
   * since a row rejected for a missing event tag can't be attributed to a
   * specific event. */
  validationIssues: EventValidationIssue[];
}

/** A row in the system-wide import audit trail (lib/reports#getRecentImports). */
export interface RecentImport {
  id: string;
  filename: string;
  sourceType: SourceType;
  uploadedAt: string;
  rowCount: number;
  status: SourceFile["status"];
  declaredTotal: number | null;
  errorCount: number;
}

export interface ImportResponse {
  sourceFile: SourceFile;
  lineItems: LineItem[];
  reconciliation: ReconciliationCheck | null;
}

/** Reconciliation tolerance: §7.1 "within an agreed margin" — placeholder until staff confirm. */
export const RECONCILIATION_TOLERANCE = 0.01;

export type TaskStatus = "todo" | "in_progress" | "done";

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

export interface Task {
  id: string;
  eventId: string;
  title: string;
  status: TaskStatus;
  assignee: string | null;
  dueDate: string | null; // ISO date
  notes: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  assignee?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatus;
  assignee?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}
