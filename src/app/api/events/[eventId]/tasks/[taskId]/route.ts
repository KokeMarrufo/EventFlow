import { NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/tasks";
import { TASK_STATUSES, type UpdateTaskInput } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string; taskId: string }> },
) {
  const { eventId, taskId } = await params;
  const body = (await req.json().catch(() => null)) as Partial<UpdateTaskInput> | null;

  if (!body) {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  if (body.status !== undefined && !TASK_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `'status' must be one of: ${TASK_STATUSES.join(", ")}.` },
      { status: 400 },
    );
  }
  if (body.title !== undefined && body.title.trim() === "") {
    return NextResponse.json({ error: "'title' cannot be empty." }, { status: 400 });
  }

  const task = await updateTask(eventId, taskId, body);
  if (!task) {
    return NextResponse.json({ error: "Task not found, or database not configured." }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ eventId: string; taskId: string }> },
) {
  const { eventId, taskId } = await params;
  const deleted = await deleteTask(eventId, taskId);
  if (!deleted) {
    return NextResponse.json({ error: "Task not found, or database not configured." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
