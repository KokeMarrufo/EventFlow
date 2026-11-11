import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { events, lineItems, sourceFiles } from "@/db/schema";
import type { EventDetail, EventSummary, LineItem, LineItemKind } from "@/lib/types";
import { round2 } from "./reconciliation";

/**
 * Backend-owned module. Frontend imports these functions directly (server
 * components) rather than self-fetching /api/*, and the API routes under
 * src/app/api/** call the same functions so there's one source of truth.
 *
 * Real Drizzle-backed implementation. Signatures are unchanged from the
 * mock placeholder so the frontend never needs to change. This repo has
 * no live DB provisioned by default, so every path here falls back to an
 * empty/not-found result instead of throwing when `db` is unset or the
 * query fails (e.g. Postgres isn't running locally yet).
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
      });
      sourceFileSets.set(e.id, new Set());
    }

    for (const row of itemRows) {
      const summary = summaries.get(row.eventId);
      if (!summary) continue; // orphaned row; shouldn't happen given FK constraint
      const amount = Number(row.amount);
      if (row.kind === "cost") summary.totalCost = round2(summary.totalCost + amount);
      else summary.totalRevenue = round2(summary.totalRevenue + amount);
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
        sourceRow: lineItems.sourceRow,
        kind: lineItems.kind,
        amount: lineItems.amount,
        description: lineItems.description,
        occurredOn: lineItems.occurredOn,
      })
      .from(lineItems)
      .innerJoin(sourceFiles, eq(sourceFiles.id, lineItems.sourceFileId))
      .where(eq(lineItems.eventId, eventId));

    let totalCost = 0;
    let totalRevenue = 0;
    const sourceFileSet = new Set<string>();

    const items: LineItem[] = rows.map((row) => {
      const amount = Number(row.amount);
      if (row.kind === "cost") totalCost = round2(totalCost + amount);
      else totalRevenue = round2(totalRevenue + amount);
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
        occurredOn: row.occurredOn,
      };
    });

    return {
      eventId,
      eventName: eventRow.name,
      totalCost,
      totalRevenue,
      net: round2(totalRevenue - totalCost),
      lineItemCount: items.length,
      sourceFiles: Array.from(sourceFileSet),
      lineItems: items,
    };
  } catch (err) {
    console.error("getEventDetail: DB unreachable, query failed, or invalid id.", err);
    return null;
  }
}

export { reconcile } from "./reconciliation";
