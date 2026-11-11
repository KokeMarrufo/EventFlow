import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "warning" | "crimson" | "sky";

const ICON_CHIP_CLASSES: Record<Tone, string> = {
  primary: "bg-blue-subtle text-primary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  crimson: "bg-crimson-subtle text-crimson-dark",
  sky: "bg-blue-subtle text-mission-sky",
};

const PROGRESS_BAR_CLASSES: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  crimson: "bg-crimson",
  sky: "bg-mission-sky",
};

/**
 * KPI telemetry card: icon chip + label, a big number, an explanatory
 * subtext (never a fabricated trend — only state a delta/comparison here
 * when real prior-period data backs it), and an optional progress bar for
 * "N of M" style metrics.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "primary",
  subtext,
  progress,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  subtext?: ReactNode;
  /** 0-100. Renders a thin progress bar under the subtext when provided. */
  progress?: number;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className={`rounded-lg p-2 ${ICON_CHIP_CLASSES[tone]}`}>
          <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div>
        <p className="font-display text-3xl font-bold tabular-nums text-navy">{value}</p>
        {subtext ? <p className="mt-1 text-xs text-muted">{subtext}</p> : null}
      </div>
      {progress != null ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div
            className={`h-full rounded-full ${PROGRESS_BAR_CLASSES[tone]}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
