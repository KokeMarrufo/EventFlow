import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { EventValidationIssue } from "@/lib/types";

/**
 * Data-quality notes from this event's source files — a bad row produces an
 * explicit error here instead of a silently wrong number elsewhere on the
 * page. Labeled by file, not by event: a row rejected for a missing event
 * tag can't be attributed to a specific event.
 */
export function ValidationIssues({ issues }: { issues: EventValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        No data-quality issues from this event&apos;s source files.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {issues.map((issue, i) => (
        <li
          key={`${issue.sourceFileName}-${issue.row}-${i}`}
          className="flex items-start gap-2 rounded-lg bg-warning-subtle px-3 py-2 text-sm text-navy"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            <span className="font-mono text-xs text-muted">
              {issue.sourceFileName} &middot; row {issue.row}
            </span>
            <br />
            {issue.message}
          </span>
        </li>
      ))}
    </ul>
  );
}
