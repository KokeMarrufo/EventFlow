import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  events,
  lineItems as lineItemsTable,
  sourceFiles,
  validationErrors as validationErrorsTable,
} from "@/db/schema";
import { runAdapter } from "@/lib/adapters";
import { reconcile } from "@/lib/reports/reconciliation";
import type { ImportResponse, LineItem, SourceFile, SourceType } from "@/lib/types";

/**
 * Accepts a multipart upload (fields: "file", "sourceType", optional
 * "declaredTotal"), runs the matching adapter (lib/adapters/*), persists
 * source_files/events/line_items/validation_errors via Drizzle, and
 * returns an ImportResponse (lib/types.ts). Creates the `events` row if
 * the parsed event name doesn't exist yet.
 */

const VALID_SOURCE_TYPES: SourceType[] = ["event_budget", "donorperfect", "sage"];

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Expected multipart form data with a 'file' field." },
      { status: 400 },
    );
  }

  const sourceTypeRaw = form.get("sourceType");
  const sourceType = typeof sourceTypeRaw === "string" ? sourceTypeRaw : "";
  if (!VALID_SOURCE_TYPES.includes(sourceType as SourceType)) {
    return NextResponse.json(
      {
        error: `Invalid or missing 'sourceType'. Expected one of: ${VALID_SOURCE_TYPES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const declaredTotalRaw = form.get("declaredTotal");
  let formDeclaredTotal: number | null = null;
  if (typeof declaredTotalRaw === "string" && declaredTotalRaw.trim() !== "") {
    const parsed = Number(declaredTotalRaw);
    if (!Number.isFinite(parsed)) {
      return NextResponse.json({ error: "'declaredTotal' must be a number." }, { status: 400 });
    }
    formDeclaredTotal = parsed;
  }

  if (!db) {
    return NextResponse.json(
      {
        error:
          "Database is not configured; cannot import. Set DATABASE_URL and ensure Postgres is running (see docker-compose.yml).",
      },
      { status: 503 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const adapterResult = runAdapter(sourceType as SourceType, buffer, file.name);

  const declaredTotal = formDeclaredTotal ?? adapterResult.declaredTotal;
  // Recompute using the same signed convention the file's own total row
  // would have used (cost negative, revenue positive) before we split
  // kind out and stored absolute values — see lib/adapters/shared.ts.
  const computedTotal = adapterResult.lineItems.reduce(
    (sum, item) => sum + (item.kind === "cost" ? -item.amount : item.amount),
    0,
  );

  const status: SourceFile["status"] =
    adapterResult.lineItems.length === 0 && adapterResult.errors.length > 0
      ? "error"
      : adapterResult.errors.length > 0
        ? "parsed_with_errors"
        : "parsed";

  try {
    const [sourceFileRow] = await db
      .insert(sourceFiles)
      .values({
        filename: file.name,
        sourceType: sourceType as SourceType,
        rowCount: adapterResult.lineItems.length,
        status,
        declaredTotal: declaredTotal != null ? declaredTotal.toFixed(2) : null,
      })
      .returning();

    if (adapterResult.errors.length > 0) {
      await db.insert(validationErrorsTable).values(
        adapterResult.errors.map((e) => ({
          sourceFileId: sourceFileRow.id,
          row: e.row,
          message: e.message,
        })),
      );
    }

    const persistedLineItems: LineItem[] = [];
    const eventIdByName = new Map<string, { id: string; name: string }>();

    for (const item of adapterResult.lineItems) {
      let eventRow = eventIdByName.get(item.eventName);
      if (!eventRow) {
        const existing = await db.select().from(events).where(eq(events.name, item.eventName));
        if (existing[0]) {
          eventRow = existing[0];
        } else {
          const inserted = await db
            .insert(events)
            .values({ name: item.eventName })
            .onConflictDoNothing()
            .returning();
          eventRow =
            inserted[0] ??
            (await db.select().from(events).where(eq(events.name, item.eventName)))[0];
        }
        eventIdByName.set(item.eventName, eventRow);
      }

      const [inserted] = await db
        .insert(lineItemsTable)
        .values({
          eventId: eventRow.id,
          sourceFileId: sourceFileRow.id,
          sourceRow: item.sourceRow,
          kind: item.kind,
          amount: item.amount.toFixed(2),
          description: item.description,
          category: item.category,
          occurredOn: item.occurredOn,
        })
        .returning();

      persistedLineItems.push({
        id: inserted.id,
        eventId: eventRow.id,
        eventName: eventRow.name,
        sourceFileId: sourceFileRow.id,
        sourceFileName: sourceFileRow.filename,
        sourceRow: inserted.sourceRow,
        kind: inserted.kind as LineItem["kind"],
        amount: Number(inserted.amount),
        description: inserted.description,
        category: inserted.category,
        occurredOn: inserted.occurredOn,
      });
    }

    const reconciliation = reconcile(
      sourceFileRow.id,
      sourceFileRow.filename,
      declaredTotal,
      computedTotal,
    );

    const responseBody: ImportResponse = {
      sourceFile: {
        id: sourceFileRow.id,
        filename: sourceFileRow.filename,
        sourceType: sourceFileRow.sourceType as SourceType,
        uploadedAt: sourceFileRow.uploadedAt.toISOString(),
        rowCount: sourceFileRow.rowCount,
        status: sourceFileRow.status as SourceFile["status"],
        declaredTotal: sourceFileRow.declaredTotal != null ? Number(sourceFileRow.declaredTotal) : null,
        errors: adapterResult.errors,
      },
      lineItems: persistedLineItems,
      reconciliation,
    };

    const httpStatus = status === "error" ? 422 : 200;
    return NextResponse.json(responseBody, { status: httpStatus });
  } catch (err) {
    console.error("POST /api/import failed while writing to the database.", err);
    return NextResponse.json(
      { error: "Import failed while writing to the database." },
      { status: 503 },
    );
  }
}
