import { Suspense } from "react";
import Link from "next/link";
import { getEventDetail } from "@/lib/reports";
import { StatRow, StatTile } from "@/components/stat-tile";
import { LineItemsTable } from "@/components/line-items-table";
import { EmptyState } from "@/components/empty-state";
import { PillButton } from "@/components/pill-button";
import { formatCurrency, netTone } from "@/components/format";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EventDetailContent paramsPromise={params} />
    </Suspense>
  );
}

async function EventDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ eventId: string }>;
}) {
  const { eventId } = await paramsPromise;
  const event = await getEventDetail(eventId);

  if (!event) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState
          title="Event not found"
          description={`No event matches "${eventId}". It may have been removed, or the link is out of date.`}
          action={<PillButton href="/events">Back to events</PillButton>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div>
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">{event.eventName}</h1>
        <p className="mt-1 text-sm text-muted">
          {event.lineItemCount} line item{event.lineItemCount === 1 ? "" : "s"} from{" "}
          {event.sourceFiles.length} source file{event.sourceFiles.length === 1 ? "" : "s"}
        </p>
      </div>

      <StatRow>
        <StatTile label="Cost" value={formatCurrency(event.totalCost)} tone="navy" rotate="left" />
        <StatTile label="Revenue" value={formatCurrency(event.totalRevenue)} tone="sky" overlap />
        <StatTile
          label="Net"
          value={formatCurrency(event.net)}
          tone={netTone(event.net)}
          rotate="right"
          overlap
        />
      </StatRow>

      <div className="flex flex-wrap gap-1">
        {event.sourceFiles.map((file) => (
          <span key={file} className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-muted">
            {file}
          </span>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-navy">Line items</h2>
        <p className="mb-3 text-sm text-muted">Every figure below is traceable to its source file and row.</p>
        {event.lineItems.length === 0 ? (
          <EmptyState
            title="No line items recorded"
            description="This event has summary totals but no itemized line items yet."
          />
        ) : (
          <LineItemsTable items={event.lineItems} />
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/events"
      className="inline-flex items-center gap-1 rounded text-sm font-semibold text-sky-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      &larr; Back to events
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 rounded bg-navy/10" />
      <div className="h-8 w-64 rounded bg-navy/10" />
      <div className="flex flex-col gap-3 sm:flex-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 w-full rounded-2xl bg-navy/10 sm:w-56" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-navy/5" />
    </div>
  );
}
