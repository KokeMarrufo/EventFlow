import { EVENT_STATUS_LABEL, type EventStatus } from "@/lib/event-status";

/** Colored pill, text-only — no dot/icon, the color + label alone carry the status. */
const STATUS_CLASSES: Record<EventStatus, string> = {
  ahead: "bg-success-subtle text-success",
  down: "bg-crimson-subtle text-crimson-dark",
  even: "bg-surface-container text-navy",
  incomplete: "bg-warning-subtle text-warning",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_CLASSES[status]}`}
    >
      {EVENT_STATUS_LABEL[status]}
    </span>
  );
}
