"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { EVENT_STATUS_LABEL, getEventStatus, isEventComplete, missingDataNote, type EventStatus } from "@/lib/event-status";
import { EventStatusBadge } from "./status-badge";
import { formatCurrency, netTextClass } from "./format";

const STATUS_FILTERS: Array<{ value: EventStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "ahead", label: EVENT_STATUS_LABEL.ahead },
  { value: "down", label: EVENT_STATUS_LABEL.down },
  { value: "even", label: EVENT_STATUS_LABEL.even },
  { value: "incomplete", label: EVENT_STATUS_LABEL.incomplete },
];

export function EventsTable({ events }: { events: EventSummary[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (q !== "" && !event.eventName.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && getEventStatus(event) !== statusFilter) return false;
      return true;
    });
  }, [events, query, statusFilter]);

  return (
    <div className="rounded-xl border border-border bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border bg-surface-container-low p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            aria-label="Search events by name"
            className="w-full rounded-lg border border-border bg-surface-container-lowest py-1.5 pl-9 pr-3 text-sm text-navy shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
        <label className="sr-only" htmlFor="events-status-filter">
          Filter by status
        </label>
        <select
          id="events-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EventStatus | "all")}
          className="rounded-lg border border-border bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-navy shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">No events match your search.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Per-event cost, revenue and net totals</caption>
            <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Event
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Cost
                </th>
                <th scope="col" className="px-4 py-3">
                  Revenue
                </th>
                <th scope="col" className="px-4 py-3">
                  Net
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((event) => {
                const complete = isEventComplete(event);
                const status = getEventStatus(event);
                const note = missingDataNote(event);
                return (
                  <tr key={event.eventId} className="align-top hover:bg-surface-container-low">
                    <th scope="row" className="px-4 py-3 font-semibold text-navy">
                      <Link
                        href={`/events/${event.eventId}`}
                        className="rounded hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {event.eventName}
                      </Link>
                      {note ? <p className="mt-0.5 text-xs font-normal text-muted">{note}</p> : null}
                    </th>
                    <td className="px-4 py-3">
                      <EventStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {event.hasCostData ? formatCurrency(event.totalCost) : "Pending"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {event.hasRevenueData ? formatCurrency(event.totalRevenue) : "Pending"}
                    </td>
                    <td
                      className={`px-4 py-3 tabular-nums font-semibold ${complete ? netTextClass(event.net) : "text-muted"}`}
                    >
                      {complete ? formatCurrency(event.net) : "Pending"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      <details>
                        <summary className="cursor-pointer select-none rounded font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                          Files ({event.sourceFiles.length})
                        </summary>
                        <p className="mt-1 whitespace-nowrap">{event.lineItemCount} line items from</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {event.sourceFiles.map((file) => (
                            <span
                              key={file}
                              className="rounded bg-surface-container px-2 py-0.5 text-xs text-muted"
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
