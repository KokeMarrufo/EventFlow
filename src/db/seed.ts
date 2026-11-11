/**
 * Seeds the same demo events/line-items that live in src/lib/mock-data.ts
 * into real Postgres, so `npm run db:push && npm run db:seed` gives a
 * working local demo against the real DB instead of the mock placeholder.
 *
 * mock-data.ts only has full per-line-item detail for the Spring Gala demo
 * event (MOCK_LINE_ITEMS.evt_spring_gala) — the other two demo events only
 * have pre-aggregated EventSummary numbers. For those, this script
 * synthesizes one cost + one revenue line item each (tagged with the
 * filenames already listed in that event's mock summary) so the seeded DB
 * reproduces the same summary totals through the real aggregation query in
 * lib/reports/index.ts, end-to-end. Run against a fresh DB — reruns will
 * create duplicate line items (events are de-duplicated by name).
 *
 * Run with: npx tsx src/db/seed.ts (or `npm run db:seed`).
 */
import { eq } from "drizzle-orm";
import { db, sql } from "./client";
import { events, lineItems, sourceFiles } from "./schema";
import { MOCK_EVENTS, MOCK_LINE_ITEMS } from "../lib/mock-data";

function inferSourceType(filename: string): "event_budget" | "donorperfect" | "sage" {
  const lower = filename.toLowerCase();
  if (lower.includes("donorperfect") || lower.includes("platform")) return "donorperfect";
  if (lower.includes("sage")) return "sage";
  return "event_budget";
}

async function main() {
  if (!db) {
    console.error(
      "DATABASE_URL is not set (or Postgres isn't reachable) — cannot seed.\n" +
        "Copy .env.example to .env.local, run `docker compose up -d`, then `npm run db:push`.",
    );
    process.exit(1);
  }

  console.log("Seeding demo data (src/lib/mock-data.ts) into Postgres...");

  for (const summary of MOCK_EVENTS) {
    const inserted = await db
      .insert(events)
      .values({ name: summary.eventName })
      .onConflictDoNothing()
      .returning();
    const event =
      inserted[0] ?? (await db.select().from(events).where(eq(events.name, summary.eventName)))[0];

    const detailItems = MOCK_LINE_ITEMS[summary.eventId];

    if (detailItems && detailItems.length > 0) {
      // Real per-line detail exists in mock-data for this event — seed it verbatim.
      const sourceFileIdByName = new Map<string, string>();
      for (const item of detailItems) {
        let sourceFileId = sourceFileIdByName.get(item.sourceFileName);
        if (!sourceFileId) {
          const rowCount = detailItems.filter((i) => i.sourceFileName === item.sourceFileName).length;
          const [sf] = await db
            .insert(sourceFiles)
            .values({
              filename: item.sourceFileName,
              sourceType: inferSourceType(item.sourceFileName),
              rowCount,
              status: "parsed",
              declaredTotal: null,
            })
            .returning();
          sourceFileId = sf.id;
          sourceFileIdByName.set(item.sourceFileName, sourceFileId);
        }
        await db.insert(lineItems).values({
          eventId: event.id,
          sourceFileId,
          sourceRow: item.sourceRow,
          kind: item.kind,
          amount: item.amount.toFixed(2),
          description: item.description,
          occurredOn: item.occurredOn,
        });
      }
    } else {
      const [budgetFilename, revenueFilename] = summary.sourceFiles;
      if (summary.totalCost > 0 && budgetFilename) {
        const [sf] = await db
          .insert(sourceFiles)
          .values({
            filename: budgetFilename,
            sourceType: "event_budget",
            rowCount: 1,
            status: "parsed",
            declaredTotal: null,
          })
          .returning();
        await db.insert(lineItems).values({
          eventId: event.id,
          sourceFileId: sf.id,
          sourceRow: 2,
          kind: "cost",
          amount: summary.totalCost.toFixed(2),
          description: `Costs (seed demo total for ${summary.eventName})`,
          occurredOn: null,
        });
      }
      if (summary.totalRevenue > 0 && revenueFilename) {
        const [sf] = await db
          .insert(sourceFiles)
          .values({
            filename: revenueFilename,
            sourceType: inferSourceType(revenueFilename),
            rowCount: 1,
            status: "parsed",
            declaredTotal: null,
          })
          .returning();
        await db.insert(lineItems).values({
          eventId: event.id,
          sourceFileId: sf.id,
          sourceRow: 2,
          kind: "revenue",
          amount: summary.totalRevenue.toFixed(2),
          description: `Revenue (seed demo total for ${summary.eventName})`,
          occurredOn: null,
        });
      }
    }
  }

  console.log("Seed complete.");
  await sql?.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
