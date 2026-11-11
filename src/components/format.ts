/**
 * Small presentation helpers shared by the dashboard UI. Kept framework-free
 * (no React/Next imports) so it can be used from server or client components,
 * and unit-tested in isolation.
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  // A bare "yyyy-mm-dd" (e.g. a line item's occurredOn, a calendar date with
  // no time-of-day) is parsed by `Date` as UTC midnight. Formatting that in
  // the viewer's local timezone can shift it back a day for any timezone
  // behind UTC (e.g. "2026-03-14" rendering as "Mar 13, 2026" in America/
  // Toronto) — so pin the formatter to UTC for date-only strings. A full
  // timestamp (e.g. an uploadedAt ISO instant) still formats in local time.
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: DATE_ONLY.test(iso) ? "UTC" : undefined,
  }).format(date);
}

/** Semantic tone for a net figure, consumed by components that map tones to classes. */
export function netTone(net: number): "success" | "danger" {
  return net >= 0 ? "success" : "danger";
}

/**
 * Full literal Tailwind class name for a net figure's text color. Returns
 * complete class-name tokens (not interpolated fragments) so Tailwind's
 * source scanner can find them.
 */
export function netTextClass(net: number): string {
  return net >= 0 ? "text-success" : "text-danger";
}
