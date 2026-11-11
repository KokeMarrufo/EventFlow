import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { ReconciliationCheck } from "@/lib/types";
import { formatCurrency } from "./format";

export function ReconciliationBadge({ check }: { check: ReconciliationCheck }) {
  const ok = check.withinTolerance;
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        ok ? "border-success/30 bg-success-subtle" : "border-crimson/30 bg-crimson-subtle"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-sm font-bold text-navy">
          Reconciliation &middot; {check.sourceFileName}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
            ok ? "bg-success text-white" : "bg-crimson text-white"
          }`}
        >
          {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {ok ? "Within tolerance" : "Out of tolerance"}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-xs sm:text-sm">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-muted">Declared</dt>
          <dd className="tabular-nums font-semibold text-navy">{formatCurrency(check.declaredTotal)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-muted">Computed</dt>
          <dd className="tabular-nums font-semibold text-navy">{formatCurrency(check.computedTotal)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-muted">Difference</dt>
          <dd className="tabular-nums font-semibold text-navy">{formatCurrency(check.difference)}</dd>
        </div>
      </dl>
    </div>
  );
}
