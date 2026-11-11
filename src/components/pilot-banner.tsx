/**
 * Honest, operational status banner — this is a real constraint of the
 * project (early pilot, draft data, no final go/no-go yet), not marketing
 * copy. See README.md and docs/success-thresholds-PLACEHOLDER.md.
 */
export function PilotBanner() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-navy">
      <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-navy">
        Pilot
      </span>
      <p>
        Draft data from the early pilot — not final. See{" "}
        <code className="rounded bg-navy/10 px-1 py-0.5 text-xs">docs/</code> for the decision log,
        evidence log and open success thresholds.
      </p>
    </div>
  );
}
