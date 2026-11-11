import { FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { RecentImport } from "@/lib/types";
import { formatDate } from "./format";

const SOURCE_TYPE_LABEL: Record<RecentImport["sourceType"], string> = {
  event_budget: "Event budget",
  donorperfect: "DonorPerfect",
  sage: "Sage",
};

function StatusIcon({ status, errorCount }: { status: RecentImport["status"]; errorCount: number }) {
  if (status === "error") {
    return <XCircle className="h-4 w-4 text-crimson" aria-hidden="true" />;
  }
  if (status === "parsed_with_errors" || errorCount > 0) {
    return <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />;
  }
  return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />;
}

/**
 * System-wide import audit trail — real source_files rows (lib/reports
 * #getRecentImports), not a per-event view. Lets staff see "what's actually
 * been ingested and when" at a glance, the way an ops dashboard should.
 */
export function RecentImports({ imports }: { imports: RecentImport[] }) {
  if (imports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-container-lowest px-5 py-8 text-center text-sm text-muted">
        No files imported yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface-container-lowest shadow-sm">
      {imports.map((imp) => (
        <div key={imp.id} className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-subtle text-primary">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">{imp.filename}</p>
            <p className="text-xs text-muted">
              {SOURCE_TYPE_LABEL[imp.sourceType]} &middot; {imp.rowCount} row{imp.rowCount === 1 ? "" : "s"} &middot;{" "}
              {formatDate(imp.uploadedAt)}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted">
            <StatusIcon status={imp.status} errorCount={imp.errorCount} />
            {imp.errorCount > 0
              ? `${imp.errorCount} issue${imp.errorCount === 1 ? "" : "s"}`
              : "Clean"}
          </span>
        </div>
      ))}
    </div>
  );
}
