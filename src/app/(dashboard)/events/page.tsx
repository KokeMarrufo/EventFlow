import { Suspense } from "react";
import { getEventSummaries } from "@/lib/reports";
import { PilotBanner } from "@/components/pilot-banner";
import { StatRow, StatTile } from "@/components/stat-tile";
import { EventsTable } from "@/components/events-table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, netTone } from "@/components/format";

export const metadata = {
  title: "Events | EventFlow",
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Events</h1>
        <p className="mt-1 text-sm text-muted">
          Cost, revenue and net per fundraising event, traceable to source files.
        </p>
      </div>

      <PilotBanner />

      <Suspense fallback={<EventsSkeleton />}>
        <EventsContent />
      </Suspense>
    </div>
  );
}

async function EventsContent() {
  const { events, grandTotal } = await getEventSummaries();

  return (
    <div className="space-y-6">
      <StatRow>
        <StatTile label="Total cost" value={formatCurrency(grandTotal.totalCost)} tone="navy" rotate="left" />
        <StatTile
          label="Total revenue"
          value={formatCurrency(grandTotal.totalRevenue)}
          tone="sky"
          overlap
        />
        <StatTile
          label="Net"
          value={formatCurrency(grandTotal.net)}
          tone={netTone(grandTotal.net)}
          rotate="right"
          overlap
        />
      </StatRow>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Import a source file to see event-level totals here."
        />
      ) : (
        <EventsTable events={events} />
      )}
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 w-full rounded-2xl bg-navy/10 sm:w-56" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-navy/5" />
    </div>
  );
}
