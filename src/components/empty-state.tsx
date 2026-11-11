import type { ReactNode } from "react";

/**
 * Generic empty / not-found / error placeholder for a content area. Used for
 * "no events yet", "event not found", and similar real (non-crash) states.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <p className="font-display text-lg font-semibold text-navy">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
