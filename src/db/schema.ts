import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

/**
 * Postgres schema for EventFlow, matching lib/types.ts.
 * No donor-level personal data is stored anywhere in this schema (§D3) —
 * DonorPerfect adapters must aggregate gifts per event before insertion.
 */

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sourceFiles = pgTable("source_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  sourceType: text("source_type", {
    enum: ["event_budget", "donorperfect", "sage"],
  }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  rowCount: integer("row_count").notNull(),
  status: text("status", {
    enum: ["parsed", "parsed_with_errors", "error"],
  }).notNull(),
  declaredTotal: numeric("declared_total", { precision: 12, scale: 2 }),
});

export const lineItems = pgTable("line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  sourceFileId: uuid("source_file_id").notNull().references(() => sourceFiles.id),
  sourceRow: integer("source_row").notNull(),
  kind: text("kind", { enum: ["cost", "revenue"] }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  occurredOn: date("occurred_on"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const validationErrors = pgTable("validation_errors", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceFileId: uuid("source_file_id").notNull().references(() => sourceFiles.id),
  row: integer("row").notNull(),
  message: text("message").notNull(),
});
