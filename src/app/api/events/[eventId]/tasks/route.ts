import { NextResponse } from "next/server";
import { createTask, getTasksForEvent } from "@/lib/tasks";
import type { CreateTaskInput } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const tasks = await getTasksForEvent(eventId);
  return NextResponse.json({ tasks });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const body = (await req.json().catch(() => null)) as Partial<CreateTaskInput> | null;

  if (!body || typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json({ error: "A non-empty 'title' is required." }, { status: 400 });
  }

  const task = await createTask(eventId, {
    title: body.title,
    assignee: body.assignee ?? null,
    dueDate: body.dueDate ?? null,
    notes: body.notes ?? null,
  });

  if (!task) {
    return NextResponse.json(
      { error: "Could not create task (database not configured, or event does not exist)." },
      { status: 503 },
    );
  }

  return NextResponse.json({ task }, { status: 201 });
}
