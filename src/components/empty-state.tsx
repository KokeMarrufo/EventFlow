import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

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
      className="rounded-xl border border-dashed border-border bg-surface-container-lowest px-6 py-12 text-center"
    >
      <Inbox aria-hidden="true" className="mx-auto h-8 w-8 text-outline" />
      <p className="mt-3 font-display text-lg font-bold text-navy">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
