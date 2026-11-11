import { Suspense } from "react";
import { CalendarRange, TrendingUp, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { getEventSummaries, getRecentImports } from "@/lib/reports";
import { isEventComplete } from "@/lib/event-status";
import { PilotBanner } from "@/components/pilot-banner";
import { HeadlineSummary } from "@/components/headline-summary";
import { StatRow, StatTile } from "@/components/stat-tile";
import { EventsTable } from "@/components/events-table";
import { RecentImports } from "@/components/recent-imports";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/components/format";

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
  const [{ events }, recentImports] = await Promise.all([getEventSummaries(), getRecentImports(5)]);

  if (events.length === 0) {
    return (
      <EmptyState
        title="No events yet"
        description="Import a source file to see event-level totals here."
      />
    );
  }

  const complete = events.filter(isEventComplete);
  const confirmedTotals = complete.reduce(
    (acc, e) => ({
      totalCost: acc.totalCost + e.totalCost,
      totalRevenue: acc.totalRevenue + e.totalRevenue,
      net: acc.net + e.net,
    }),
    { totalCost: 0, totalRevenue: 0, net: 0 },
  );
  const completenessPct = Math.round((complete.length / events.length) * 100);
  const uniqueFiles = new Set(events.flatMap((e) => e.sourceFiles));
  const totalIssues = recentImports.reduce((sum, i) => sum + i.errorCount, 0);

  return (
    <div className="space-y-6">
      <HeadlineSummary events={events} />

      <StatRow>
        <StatTile
          label="Fundraising events"
          value={events.length}
          icon={CalendarRange}
          tone="primary"
          subtext={`${complete.length} with complete data, ${events.length - complete.length} incomplete`}
        />
        <StatTile
          label="Net raised (complete events)"
          value={formatCurrency(confirmedTotals.net)}
          icon={TrendingUp}
          tone={confirmedTotals.net >= 0 ? "success" : "crimson"}
          subtext={`${formatCurrency(confirmedTotals.totalRevenue)} revenue vs ${formatCurrency(confirmedTotals.totalCost)} cost`}
        />
        <StatTile
          label="Data completeness"
          value={`${completenessPct}%`}
          icon={ShieldCheck}
          tone={completenessPct === 100 ? "success" : "warning"}
          subtext={`${complete.length} of ${events.length} events have both cost & revenue data`}
          progress={completenessPct}
        />
        <StatTile
          label="Files ingested"
          value={uniqueFiles.size}
          icon={FileSpreadsheet}
          tone={totalIssues > 0 ? "warning" : "success"}
          subtext={totalIssues > 0 ? `${totalIssues} validation issue${totalIssues === 1 ? "" : "s"} flagged` : "No open issues"}
        />
      </StatRow>

      <EventsTable events={events} />

      <div>
        <h2 className="mb-2 font-display text-base font-bold text-navy">Recent imports</h2>
        <RecentImports imports={recentImports} />
      </div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 rounded-xl bg-surface-container" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-container" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-surface-container" />
    </div>
  );
}
