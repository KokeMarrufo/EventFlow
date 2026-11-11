import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import type { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from "@/lib/types";

/**
 * Per-event task board (a small Monday.com-style list: title, status,
 * assignee, due date). Independent of the financial reconciliation data —
 * this is operational/logistics tracking ("confirm venue", "send
 * thank-yous"), not a line item. Every function fails soft (empty list /
 * null / false) when the DB isn't configured, matching the rest of
 * lib/reports — this repo has no live DB provisioned by default.
 */

function toTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    eventId: row.eventId,
    title: row.title,
    status: row.status as TaskStatus,
    assignee: row.assignee,
    dueDate: row.dueDate,
    notes: row.notes,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getTasksForEvent(eventId: string): Promise<Task[]> {
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.eventId, eventId))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));
    return rows.map(toTask);
  } catch (err) {
    console.error("getTasksForEvent: DB unreachable or query failed, returning empty list.", err);
    return [];
  }
}

export async function createTask(eventId: string, input: CreateTaskInput): Promise<Task | null> {
  if (!db) return null;
  const title = input.title.trim();
  if (title === "") return null;

  try {
    const [{ maxPosition }] = await db
      .select({ maxPosition: sql<number>`coalesce(max(${tasks.position}), -1)` })
      .from(tasks)
      .where(eq(tasks.eventId, eventId));

    const [row] = await db
      .insert(tasks)
      .values({
        eventId,
        title,
        assignee: input.assignee?.trim() || null,
        dueDate: input.dueDate || null,
        notes: input.notes?.trim() || null,
        position: Number(maxPosition) + 1,
      })
      .returning();
    return toTask(row);
  } catch (err) {
    console.error("createTask: DB unreachable or insert failed.", err);
    return null;
  }
}

export async function updateTask(
  eventId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  if (!db) return null;
  try {
    const patch: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.status !== undefined) patch.status = input.status;
    if (input.assignee !== undefined) patch.assignee = input.assignee?.trim() || null;
    if (input.dueDate !== undefined) patch.dueDate = input.dueDate || null;
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;

    const [row] = await db
      .update(tasks)
      .set(patch)
      .where(and(eq(tasks.id, taskId), eq(tasks.eventId, eventId)))
      .returning();
    return row ? toTask(row) : null;
  } catch (err) {
    console.error("updateTask: DB unreachable or update failed.", err);
    return null;
  }
}

export async function deleteTask(eventId: string, taskId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.eventId, eventId)))
      .returning({ id: tasks.id });
    return deleted.length > 0;
  } catch (err) {
    console.error("deleteTask: DB unreachable or delete failed.", err);
    return false;
  }
}
