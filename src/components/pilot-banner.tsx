import { Route } from "lucide-react";

/**
 * Honest, operational status banner — this is a real constraint of the
 * project (early pilot, draft data, no final go/no-go yet), not marketing
 * copy. See README.md and docs/success-thresholds-PLACEHOLDER.md.
 */
export function PilotBanner() {
  return (
    <section className="relative overflow-hidden rounded-xl bg-primary px-5 py-3 text-white shadow-sm">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-mission-sky/20 blur-2xl"
      />
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="inline-flex shrink-0 rounded-lg bg-white/10 p-1.5">
          <Route aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <span className="rounded bg-warning-subtle px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-warning">
          Pilot
        </span>
        <p className="text-sm">
          Draft data from the early pilot, not final. See{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">docs/</code> for the decision
          log, evidence log and open success thresholds.
        </p>
      </div>
    </section>
  );
}
