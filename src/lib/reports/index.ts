import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { events, lineItems, sourceFiles, validationErrors } from "@/db/schema";
import type {
  CategoryAmount,
  EventDetail,
  EventFileBreakdown,
  EventSummary,
  EventValidationIssue,
  LineItem,
  LineItemKind,
  RecentImport,
  SourceFile,
  SourceType,
} from "@/lib/types";
import { reconcile, round2 } from "./reconciliation";

/**
 * Backend-owned module. Frontend imports these functions directly (server
 * components) rather than self-fetching /api/*, and the API routes under
 * src/app/api/** call the same functions so there's one source of truth.
 *
 * Real Drizzle-backed implementation. This repo has no live DB provisioned
 * by default, so every path here falls back to an empty/not-found result
 * instead of throwing when `db` is unset or the query fails (e.g. Postgres
 * isn't running locally yet).
 */

export interface GrandTotal {
  totalCost: number;
  totalRevenue: number;
  net: number;
}

const EMPTY_SUMMARIES: { events: EventSummary[]; grandTotal: GrandTotal } = {
  events: [],
  grandTotal: { totalCost: 0, totalRevenue: 0, net: 0 },
};

export async function getEventSummaries(): Promise<{
  events: EventSummary[];
  grandTotal: GrandTotal;
}> {
  if (!db) return EMPTY_SUMMARIES;

  try {
    const eventRows = await db.select().from(events);
    if (eventRows.length === 0) return EMPTY_SUMMARIES;

    const itemRows = await db
      .select({
        eventId: lineItems.eventId,
        kind: lineItems.kind,
        amount: lineItems.amount,
        sourceFileName: sourceFiles.filename,
      })
      .from(lineItems)
      .innerJoin(sourceFiles, eq(sourceFiles.id, lineItems.sourceFileId));

    const summaries = new Map<string, EventSummary>();
    const sourceFileSets = new Map<string, Set<string>>();
    for (const e of eventRows) {
      summaries.set(e.id, {
        eventId: e.id,
        eventName: e.name,
        totalCost: 0,
        totalRevenue: 0,
        net: 0,
        lineItemCount: 0,
        sourceFiles: [],
        hasCostData: false,
        hasRevenueData: false,
      });
      sourceFileSets.set(e.id, new Set());
    }

    for (const row of itemRows) {
      const summary = summaries.get(row.eventId);
      if (!summary) continue; // orphaned row; shouldn't happen given FK constraint
      const amount = Number(row.amount);
      if (row.kind === "cost") {
        summary.totalCost = round2(summary.totalCost + amount);
        summary.hasCostData = true;
      } else {
        summary.totalRevenue = round2(summary.totalRevenue + amount);
        summary.hasRevenueData = true;
      }
      summary.net = round2(summary.totalRevenue - summary.totalCost);
      summary.lineItemCount += 1;
      sourceFileSets.get(row.eventId)?.add(row.sourceFileName);
    }

    for (const summary of summaries.values()) {
      summary.sourceFiles = Array.from(sourceFileSets.get(summary.eventId) ?? []);
    }

    const eventSummaries = Array.from(summaries.values());
    const grandTotal = eventSummaries.reduce<GrandTotal>(
      (acc, e) => ({
        totalCost: round2(acc.totalCost + e.totalCost),
        totalRevenue: round2(acc.totalRevenue + e.totalRevenue),
        net: round2(acc.net + e.net),
      }),
      { totalCost: 0, totalRevenue: 0, net: 0 },
    );

    return { events: eventSummaries, grandTotal };
  } catch (err) {
    console.error("getEventSummaries: DB unreachable or query failed, returning empty list.", err);
    return EMPTY_SUMMARIES;
  }
}

export async function getEventDetail(eventId: string): Promise<EventDetail | null> {
  if (!db) return null;

  try {
    const [eventRow] = await db.select().from(events).where(eq(events.id, eventId));
    if (!eventRow) return null;

    const rows = await db
      .select({
        id: lineItems.id,
        sourceFileId: lineItems.sourceFileId,
        sourceFileName: sourceFiles.filename,
        sourceType: sourceFiles.sourceType,
        declaredTotal: sourceFiles.declaredTotal,
        sourceRow: lineItems.sourceRow,
        kind: lineItems.kind,
        amount: lineItems.amount,
        description: lineItems.description,
        category: lineItems.category,
        occurredOn: lineItems.occurredOn,
      })
      .from(lineItems)
      .innerJoin(sourceFiles, eq(sourceFiles.id, lineItems.sourceFileId))
      .where(eq(lineItems.eventId, eventId));

    let totalCost = 0;
    let totalRevenue = 0;
    let hasCostData = false;
    let hasRevenueData = false;
    const sourceFileSet = new Set<string>();

    const items: LineItem[] = rows.map((row) => {
      const amount = Number(row.amount);
      if (row.kind === "cost") {
        totalCost = round2(totalCost + amount);
        hasCostData = true;
      } else {
        totalRevenue = round2(totalRevenue + amount);
        hasRevenueData = true;
      }
      sourceFileSet.add(row.sourceFileName);

      return {
        id: row.id,
        eventId,
        eventName: eventRow.name,
        sourceFileId: row.sourceFileId,
        sourceFileName: row.sourceFileName,
        sourceRow: row.sourceRow,
        kind: row.kind as LineItemKind,
        amount,
        description: row.description,
        category: row.category,
        occurredOn: row.occurredOn,
      };
    });

    const costByCategory = aggregateByCategory(rows, "cost");
    const revenueByCategory = aggregateByCategory(rows, "revenue");

    // Per-file contribution to this event, so cost/revenue can be traced
    // back to which import produced it, not just which row.
    const fileAgg = new Map<
      string,
      {
        sourceFileName: string;
        sourceType: SourceType;
        declaredTotal: number | null;
        cost: number;
        revenue: number;
        count: number;
      }
    >();
    for (const row of rows) {
      const amount = Number(row.amount);
      const agg = fileAgg.get(row.sourceFileId) ?? {
        sourceFileName: row.sourceFileName,
        sourceType: row.sourceType as SourceType,
        declaredTotal: row.declaredTotal != null ? Number(row.declaredTotal) : null,
        cost: 0,
        revenue: 0,
        count: 0,
      };
      if (row.kind === "cost") agg.cost = round2(agg.cost + amount);
      else agg.revenue = round2(agg.revenue + amount);
      agg.count += 1;
      fileAgg.set(row.sourceFileId, agg);
    }

    // A file's declared total only reconciles cleanly at the event level
    // when that file covers exactly this one event — otherwise "declared
    // total" is the whole file's claim, not this event's share of it.
    const fileIds = Array.from(fileAgg.keys());
    const eventsPerFile = new Map<string, Set<string>>();
    if (fileIds.length > 0) {
      const spanRows = await db
        .select({ sourceFileId: lineItems.sourceFileId, eventId: lineItems.eventId })
        .from(lineItems)
        .where(inArray(lineItems.sourceFileId, fileIds));
      for (const r of spanRows) {
        const set = eventsPerFile.get(r.sourceFileId) ?? new Set<string>();
        set.add(r.eventId);
        eventsPerFile.set(r.sourceFileId, set);
      }
    }

    const fileBreakdown: EventFileBreakdown[] = Array.from(fileAgg.entries()).map(
      ([sourceFileId, agg]) => {
        const isSingleEventFile = (eventsPerFile.get(sourceFileId)?.size ?? 1) <= 1;
        const computedTotal = round2(agg.revenue - agg.cost);
        return {
          sourceFileId,
          sourceFileName: agg.sourceFileName,
          sourceType: agg.sourceType,
          cost: agg.cost,
          revenue: agg.revenue,
          lineItemCount: agg.count,
          reconciliation: isSingleEventFile ? reconcile(sourceFileId, agg.sourceFileName, agg.declaredTotal, computedTotal) : null,
        };
      },
    );

    const validationIssues: EventValidationIssue[] = [];
    if (fileIds.length > 0) {
      const errorRows = await db
        .select({ sourceFileId: validationErrors.sourceFileId, row: validationErrors.row, message: validationErrors.message })
        .from(validationErrors)
        .where(inArray(validationErrors.sourceFileId, fileIds));
      for (const e of errorRows) {
        validationIssues.push({
          sourceFileName: fileAgg.get(e.sourceFileId)?.sourceFileName ?? "unknown file",
          row: e.row,
          message: e.message,
        });
      }
    }

    return {
      eventId,
      eventName: eventRow.name,
      totalCost,
      totalRevenue,
      net: round2(totalRevenue - totalCost),
      lineItemCount: items.length,
      sourceFiles: Array.from(sourceFileSet),
      hasCostData,
      hasRevenueData,
      lineItems: items,
      fileBreakdown,
      costByCategory,
      revenueByCategory,
      validationIssues,
    };
  } catch (err) {
    console.error("getEventDetail: DB unreachable, query failed, or invalid id.", err);
    return null;
  }
}

/** Groups rows of one `kind` by category (falling back to "Uncategorized"),
 * sorted largest first — feeds the cost/revenue-by-category charts. */
function aggregateByCategory(
  rows: Array<{ kind: string; amount: string; category: string | null }>,
  kind: "cost" | "revenue",
): CategoryAmount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.kind !== kind) continue;
    const category = row.category?.trim() || "Uncategorized";
    totals.set(category, round2((totals.get(category) ?? 0) + Number(row.amount)));
  }
  return Array.from(totals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** System-wide import audit trail (newest first) — real source_files rows,
 * not derived from any one event. Used by the import/events pages to show
 * "what's actually been ingested" rather than just per-event totals. */
export async function getRecentImports(limit = 10): Promise<RecentImport[]> {
  if (!db) return [];

  try {
    const rows = await db
      .select({
        id: sourceFiles.id,
        filename: sourceFiles.filename,
        sourceType: sourceFiles.sourceType,
        uploadedAt: sourceFiles.uploadedAt,
        rowCount: sourceFiles.rowCount,
        status: sourceFiles.status,
        declaredTotal: sourceFiles.declaredTotal,
      })
      .from(sourceFiles)
      .orderBy(desc(sourceFiles.uploadedAt))
      .limit(limit);

    if (rows.length === 0) return [];

    const fileIds = rows.map((r) => r.id);
    const errorRows = await db
      .select({ sourceFileId: validationErrors.sourceFileId })
      .from(validationErrors)
      .where(inArray(validationErrors.sourceFileId, fileIds));
    const errorCounts = new Map<string, number>();
    for (const e of errorRows) {
      errorCounts.set(e.sourceFileId, (errorCounts.get(e.sourceFileId) ?? 0) + 1);
    }

    return rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      sourceType: r.sourceType as SourceType,
      uploadedAt: r.uploadedAt.toISOString(),
      rowCount: r.rowCount,
      status: r.status as SourceFile["status"],
      declaredTotal: r.declaredTotal != null ? Number(r.declaredTotal) : null,
      errorCount: errorCounts.get(r.id) ?? 0,
    }));
  } catch (err) {
    console.error("getRecentImports: DB unreachable or query failed, returning empty list.", err);
    return [];
  }
}

/** Cost by category across every event, largest first — "where does our
 * money actually go," not per-event. This is the portfolio-level view the
 * per-event detail page's chart can't give on its own. */
export async function getOrgCostByCategory(): Promise<CategoryAmount[]> {
  if (!db) return [];
  try {
    const rows = await db
      .select({ kind: lineItems.kind, amount: lineItems.amount, category: lineItems.category })
      .from(lineItems)
      .where(eq(lineItems.kind, "cost"));
    return aggregateByCategory(rows, "cost");
  } catch (err) {
    console.error("getOrgCostByCategory: DB unreachable or query failed, returning empty list.", err);
    return [];
  }
}

export { reconcile } from "./reconciliation";
