import Link from "next/link";
import type { EventSummary } from "@/lib/types";
import { formatCurrency, netTextClass } from "./format";

export function EventsTable({ events }: { events: EventSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Per-event cost, revenue and net totals</caption>
        <thead className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Event
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Cost
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Revenue
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Net
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Line items
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Source files
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {events.map((event) => (
            <tr key={event.eventId} className="hover:bg-background/60">
              <th scope="row" className="px-4 py-3 font-semibold text-navy">
                <Link
                  href={`/events/${event.eventId}`}
                  className="rounded hover:text-sky-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {event.eventName}
                </Link>
              </th>
              <td className="px-4 py-3 text-muted">{formatCurrency(event.totalCost)}</td>
              <td className="px-4 py-3 text-muted">{formatCurrency(event.totalRevenue)}</td>
              <td className={`px-4 py-3 font-semibold ${netTextClass(event.net)}`}>
                {formatCurrency(event.net)}
              </td>
              <td className="px-4 py-3 text-muted">{event.lineItemCount}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {event.sourceFiles.map((file) => (
                    <span key={file} className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-muted">
                      {file}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
