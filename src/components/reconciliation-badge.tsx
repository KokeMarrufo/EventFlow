import type { ReconciliationCheck } from "@/lib/types";
import { formatCurrency } from "./format";

export function ReconciliationBadge({ check }: { check: ReconciliationCheck }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        check.withinTolerance ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display font-semibold text-navy">
          Reconciliation &mdash; {check.sourceFileName}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
            check.withinTolerance ? "bg-success text-white" : "bg-danger text-white"
          }`}
        >
          {check.withinTolerance ? "Within tolerance" : "Out of tolerance"}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-xs sm:text-sm">
        <div>
          <dt className="uppercase tracking-wide text-muted">Declared</dt>
          <dd className="font-semibold text-navy">{formatCurrency(check.declaredTotal)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-muted">Computed</dt>
          <dd className="font-semibold text-navy">{formatCurrency(check.computedTotal)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-muted">Difference</dt>
          <dd className="font-semibold text-navy">{formatCurrency(check.difference)}</dd>
        </div>
      </dl>
    </div>
  );
}
