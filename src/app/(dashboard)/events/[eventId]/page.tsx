import { Suspense } from "react";
import Link from "next/link";
import { Wallet, HandCoins, Scale, ArrowLeft } from "lucide-react";
import { getEventDetail } from "@/lib/reports";
import { getTasksForEvent } from "@/lib/tasks";
import { getEventStatus, isEventComplete, missingDataNote } from "@/lib/event-status";
import { StatRow, StatTile } from "@/components/stat-tile";
import { EventStatusBadge } from "@/components/status-badge";
import { FileBreakdown } from "@/components/file-breakdown";
import { CategoryChart } from "@/components/category-chart";
import { ValidationIssues } from "@/components/validation-issues";
import { LineItemsTable } from "@/components/line-items-table";
import { TaskBoard } from "@/components/task-board";
import { EmptyState } from "@/components/empty-state";
import { PillButton } from "@/components/pill-button";
import { formatCurrency } from "@/components/format";

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
  const [event, tasks] = await Promise.all([getEventDetail(eventId), getTasksForEvent(eventId)]);

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

  const complete = isEventComplete(event);
  const status = getEventStatus(event);
  const note = missingDataNote(event);

  return (
    <div className="space-y-6">
      <BackLink />

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">{event.eventName}</h1>
          <EventStatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {event.lineItemCount} line item{event.lineItemCount === 1 ? "" : "s"} from{" "}
          {event.sourceFiles.length} source file{event.sourceFiles.length === 1 ? "" : "s"}
        </p>
      </div>

      {note ? (
        <div className="rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-sm text-navy">
          <strong>Not yet comparable:</strong> this event is {note}, so cost/revenue/net below
          isn&apos;t the full picture. Import the missing file to see an accurate net.
        </div>
      ) : null}

      <StatRow>
        <StatTile
          label="Cost"
          value={event.hasCostData ? formatCurrency(event.totalCost) : "Pending"}
          icon={Wallet}
          tone="primary"
        />
        <StatTile
          label="Revenue"
          value={event.hasRevenueData ? formatCurrency(event.totalRevenue) : "Pending"}
          icon={HandCoins}
          tone="sky"
        />
        <StatTile
          label="Net"
          value={complete ? formatCurrency(event.net) : "Pending"}
          icon={Scale}
          tone={!complete ? "warning" : event.net >= 0 ? "success" : "crimson"}
        />
      </StatRow>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-container-lowest p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-navy">Cost by category</h2>
          <p className="mb-3 text-xs text-muted">
            Where this event&apos;s money actually went (event-budget category / Sage GL account).
          </p>
          <CategoryChart data={event.costByCategory} kind="cost" />
        </section>
        <section className="rounded-xl border border-border bg-surface-container-lowest p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-navy">Revenue by category</h2>
          <p className="mb-3 text-xs text-muted">
            Where this event&apos;s money came from (DonorPerfect fund / campaign).
          </p>
          <CategoryChart data={event.revenueByCategory} kind="revenue" />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-container-lowest p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-navy">Cost &amp; revenue by source file</h2>
          <p className="mb-3 text-xs text-muted">
            Every figure is traceable to the import that produced it.
          </p>
          <FileBreakdown files={event.fileBreakdown} />
        </section>
        <section className="rounded-xl border border-border bg-surface-container-lowest p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-navy">Data quality</h2>
          <p className="mb-3 text-xs text-muted">
            Issues found while parsing this event&apos;s source files.
          </p>
          <ValidationIssues issues={event.validationIssues} />
        </section>
      </div>

      <div>
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">Line items</h2>
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

      <TaskBoard eventId={event.eventId} initialTasks={tasks} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/events"
      className="inline-flex items-center gap-1 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to events
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 rounded bg-surface-container" />
      <div className="h-8 w-64 rounded bg-surface-container" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-container" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-surface-container" />
    </div>
  );
}
