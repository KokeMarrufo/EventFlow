import type { EventFileBreakdown } from "@/lib/types";
import { formatCurrency } from "./format";
import { ReconciliationBadge } from "./reconciliation-badge";

const SOURCE_TYPE_LABEL: Record<EventFileBreakdown["sourceType"], string> = {
  event_budget: "Event budget",
  donorperfect: "DonorPerfect",
  sage: "Sage",
};

/**
 * Per-file contribution to this event's cost/revenue, with a reconciliation
 * check for files that cover exactly this one event. Ties the headline
 * numbers back to the specific imports that produced them — the
 * traceability requirement made visible, not just a filename tag.
 */
export function FileBreakdown({ files }: { files: EventFileBreakdown[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-muted">No source files yet.</p>;
  }

  const maxAmount = Math.max(1, ...files.map((f) => Math.max(f.cost, f.revenue)));

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div key={file.sourceFileId} className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <p className="text-sm font-semibold text-navy">{file.sourceFileName}</p>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {SOURCE_TYPE_LABEL[file.sourceType]} &middot; {file.lineItemCount} line item
              {file.lineItemCount === 1 ? "" : "s"}
            </span>
          </div>
          {file.cost > 0 ? (
            <Bar label="Cost" amount={file.cost} max={maxAmount} className="bg-navy" />
          ) : null}
          {file.revenue > 0 ? (
            <Bar label="Revenue" amount={file.revenue} max={maxAmount} className="bg-success" />
          ) : null}
          {file.reconciliation ? (
            <ReconciliationBadge check={file.reconciliation} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Bar({
  label,
  amount,
  max,
  className,
}: {
  label: string;
  amount: number;
  max: number;
  className: string;
}) {
  const pct = Math.max(4, Math.round((amount / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums font-semibold text-navy">{formatCurrency(amount)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
