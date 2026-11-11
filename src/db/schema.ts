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
  /** e.g. "Venue", "Catering" (event budget); "Ticket Sales" (DonorPerfect
   * fund); the GL account name verbatim (Sage) — see lib/adapters/*. Null
   * when the source file had no such column. Powers the cost/revenue
   * breakdown charts, not just the per-file traceability view. */
  category: text("category"),
  occurredOn: date("occurred_on"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const validationErrors = pgTable("validation_errors", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceFileId: uuid("source_file_id").notNull().references(() => sourceFiles.id),
  row: integer("row").notNull(),
  message: text("message").notNull(),
});

/**
 * Per-event task tracking (a small Monday.com-style board), e.g. "confirm
 * venue", "send thank-you letters". Independent of the financial
 * reconciliation data above — deleting an event's tasks never touches its
 * line items, and vice versa.
 */
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  title: text("title").notNull(),
  status: text("status", { enum: ["todo", "in_progress", "done"] })
    .notNull()
    .default("todo"),
  assignee: text("assignee"),
  dueDate: date("due_date"),
  notes: text("notes"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
