"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, User, CalendarDays, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { formatDate } from "./format";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return task.dueDate < new Date().toISOString().slice(0, 10);
}

async function apiCall<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Per-event task board (Monday.com-style: status columns, assignee, due
 * date) — operational/logistics tracking distinct from the financial
 * reconciliation data on the rest of this page. Backed by real
 * /api/events/[eventId]/tasks endpoints and src/db/schema.ts#tasks, not a
 * static mockup: adding, moving and deleting a task here persists.
 */
export function TaskBoard({ eventId, initialTasks }: { eventId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const titleId = useId();

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const task of tasks) groups[task.status].push(task);
    return groups;
  }, [tasks]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (title.trim() === "") return;
    setIsAdding(true);
    const created = await apiCall<{ task: Task }>(`/api/events/${eventId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        assignee: assignee.trim() || null,
        dueDate: dueDate || null,
      }),
    });
    if (created) {
      setTasks((prev) => [...prev, created.task]);
      setTitle("");
      setAssignee("");
      setDueDate("");
    }
    setIsAdding(false);
  }

  async function moveTask(task: Task, status: TaskStatus) {
    setBusyId(task.id);
    const updated = await apiCall<{ task: Task }>(`/api/events/${eventId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated.task : t)));
    }
    setBusyId(null);
  }

  async function removeTask(task: Task) {
    setBusyId(task.id);
    const res = await fetch(`/api/events/${eventId}/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    }
    setBusyId(null);
  }

  return (
    <section className="rounded-xl border border-border bg-surface-container-lowest shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-base font-bold text-navy">Event tasks</h2>
        <p className="mt-0.5 text-xs text-muted">
          Logistics and follow-ups for this event — separate from its financial data above.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 border-b border-border bg-surface-container-low px-5 py-3">
        <div className="min-w-[180px] flex-1">
          <label htmlFor={titleId} className="sr-only">
            New task title
          </label>
          <input
            id={titleId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task (e.g. confirm venue, send thank-yous)…"
            className="w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assignee (optional)"
          className="w-36 rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Due date (optional)"
          className="rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-sm text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <button
          type="submit"
          disabled={isAdding || title.trim() === ""}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.status} className="rounded-lg bg-surface-container-low p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{col.label}</h3>
              <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-xs font-semibold text-muted">
                {byStatus[col.status].length}
              </span>
            </div>
            <div className="space-y-2">
              {byStatus[col.status].length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
                  No tasks here
                </p>
              ) : (
                byStatus[col.status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    busy={busyId === task.id}
                    onMove={moveTask}
                    onDelete={removeTask}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  busy,
  onMove,
  onDelete,
}: {
  task: Task;
  busy: boolean;
  onMove: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
}) {
  const overdue = isOverdue(task);

  return (
    <div className="rounded-lg border border-border bg-surface-container-lowest p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-navy">{task.title}</p>
        <button
          type="button"
          onClick={() => onDelete(task)}
          disabled={busy}
          aria-label={`Delete task "${task.title}"`}
          className="shrink-0 rounded p-1 text-muted hover:bg-crimson-subtle hover:text-crimson-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {task.assignee || task.dueDate ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          {task.assignee ? (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" aria-hidden="true" />
              {task.assignee}
            </span>
          ) : null}
          {task.dueDate ? (
            <span
              className={`inline-flex items-center gap-1 ${overdue ? "font-semibold text-crimson-dark" : ""}`}
            >
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {formatDate(task.dueDate)}
              {overdue ? " (overdue)" : ""}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center gap-1.5">
        {task.status === "todo" ? (
          <TaskActionButton onClick={() => onMove(task, "in_progress")} disabled={busy} icon={ArrowRight}>
            Start
          </TaskActionButton>
        ) : null}
        {task.status === "in_progress" ? (
          <>
            <TaskActionButton onClick={() => onMove(task, "done")} disabled={busy} icon={ArrowRight}>
              Done
            </TaskActionButton>
            <TaskActionButton onClick={() => onMove(task, "todo")} disabled={busy} icon={ArrowLeft}>
              Back
            </TaskActionButton>
          </>
        ) : null}
        {task.status === "done" ? (
          <TaskActionButton onClick={() => onMove(task, "todo")} disabled={busy} icon={RotateCcw}>
            Reopen
          </TaskActionButton>
        ) : null}
      </div>
    </div>
  );
}

function TaskActionButton({
  children,
  onClick,
  disabled,
  icon: Icon,
}: {
  children: string;
  onClick: () => void;
  disabled: boolean;
  icon: typeof ArrowRight;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-primary hover:bg-blue-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {children}
    </button>
  );
}
