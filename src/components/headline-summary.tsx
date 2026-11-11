import { isEventComplete } from "@/lib/event-status";
import type { EventSummary } from "@/lib/types";
import { formatCurrency } from "./format";

/**
 * The one plain-English sentence this whole dashboard exists to answer:
 * "did fundraising make money, and which events were worth repeating?"
 * Everything else on the page (tables, file names, line-item counts) is
 * supporting detail for someone who wants to double-check this sentence,
 * not the headline itself.
 */
export function HeadlineSummary({ events }: { events: EventSummary[] }) {
  if (events.length === 0) return null;

  const complete = events.filter(isEventComplete);
  const incomplete = events.filter((e) => !isEventComplete(e));

  const totals = complete.reduce(
    (acc, e) => ({
      cost: acc.cost + e.totalCost,
      revenue: acc.revenue + e.totalRevenue,
      net: acc.net + e.net,
    }),
    { cost: 0, revenue: 0, net: 0 },
  );

  const best =
    complete.length > 1 ? complete.reduce((a, b) => (b.net > a.net ? b : a)) : null;

  return (
    <div className="rounded-xl border border-border bg-surface-container-lowest px-5 py-4 shadow-sm">
      {complete.length > 0 ? (
        <p className="text-base leading-relaxed text-navy">
          Across <strong>{complete.length}</strong> fundraising event{complete.length === 1 ? "" : "s"}{" "}
          with complete data, Downtown Mission raised{" "}
          <strong>{formatCurrency(totals.revenue)}</strong> against{" "}
          <strong>{formatCurrency(totals.cost)}</strong> in costs, for a net of{" "}
          <strong className={totals.net >= 0 ? "text-success" : "text-danger"}>
            {formatCurrency(totals.net)}
          </strong>
          .
          {best ? (
            <>
              {" "}
              <strong>{best.eventName}</strong> performed best, netting{" "}
              {formatCurrency(best.net)}.
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-base leading-relaxed text-navy">
          No event has both cost and revenue data yet. Import a budget file and a
          DonorPerfect/Sage file for the same event to see a net figure here.
        </p>
      )}
      {incomplete.length > 0 ? (
        <p className="mt-2 text-sm text-muted">
          <span className="font-semibold text-warning">{incomplete.length}</span> more event
          {incomplete.length === 1 ? "" : "s"} not counted above yet, still missing data:{" "}
          {incomplete.map((e) => e.eventName).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
