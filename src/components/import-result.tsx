import type { ImportResponse, ValidationError } from "@/lib/types";
import { formatCurrency, formatDate } from "./format";
import { KindBadge } from "./kind-badge";
import { ReconciliationBadge } from "./reconciliation-badge";

/**
 * Pure, presentational outcome of a /api/import attempt. Kept decoupled from
 * fetch logic (see upload-form.tsx) so it can be rendered directly with a
 * mocked outcome, for the "501 now, real shape later" states described in
 * the project brief.
 */
export type ImportOutcome =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "not_implemented"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; data: ImportResponse };

const STATUS_LABEL: Record<ImportResponse["sourceFile"]["status"], string> = {
  parsed: "Parsed",
  parsed_with_errors: "Parsed with errors",
  error: "Error",
};

function statusClass(status: ImportResponse["sourceFile"]["status"]): string {
  if (status === "parsed") return "bg-success text-white";
  if (status === "parsed_with_errors") return "bg-warning text-white";
  return "bg-crimson text-white";
}

function ValidationErrorsList({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-lg border border-warning/30 bg-warning-subtle px-4 py-3">
      <p className="text-sm font-semibold text-navy">
        {errors.length} validation issue{errors.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-navy/80">
        {errors.map((err, i) => (
          <li key={`${err.row}-${i}`}>
            <span className="font-mono text-xs">row {err.row}</span> &middot; {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ImportResultPanel({ outcome }: { outcome: ImportOutcome }) {
  if (outcome.kind === "idle") return null;

  if (outcome.kind === "uploading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted"
      >
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-mission-sky border-t-transparent"
        />
        Uploading and parsing file&hellip;
      </div>
    );
  }

  if (outcome.kind === "not_implemented") {
    return (
      <div role="status" className="rounded-xl border border-mission-sky/40 bg-blue-subtle px-4 py-3 text-sm text-navy">
        <p className="font-semibold">Import isn&apos;t live yet</p>
        <p className="mt-1 text-navy/80">{outcome.message}</p>
        <p className="mt-2 text-xs text-muted">
          Expected during the pilot build. The backend parsing work (
          <code className="rounded bg-navy/10 px-1 py-0.5">lib/adapters/</code>) is in progress.
        </p>
      </div>
    );
  }

  if (outcome.kind === "error") {
    return (
      <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-navy">
        <p className="font-semibold text-danger">Import failed</p>
        <p className="mt-1">{outcome.message}</p>
      </div>
    );
  }

  const { sourceFile, lineItems, reconciliation } = outcome.data;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-base font-semibold text-navy">{sourceFile.filename}</p>
            <p className="text-xs text-muted">
              Uploaded {formatDate(sourceFile.uploadedAt)} &middot; {sourceFile.rowCount} row
              {sourceFile.rowCount === 1 ? "" : "s"}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusClass(sourceFile.status)}`}>
            {STATUS_LABEL[sourceFile.status]}
          </span>
        </div>
      </div>

      <ValidationErrorsList errors={sourceFile.errors} />

      {reconciliation ? <ReconciliationBadge check={reconciliation} /> : null}

      {lineItems.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">Parsed line items preview</caption>
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Kind
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Amount
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Description
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Row
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItems.slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    <KindBadge kind={item.kind} />
                  </td>
                  <td className="px-3 py-2 font-semibold text-navy">{formatCurrency(item.amount)}</td>
                  <td className="px-3 py-2 text-navy">{item.description}</td>
                  <td className="px-3 py-2 text-muted">{item.sourceRow}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lineItems.length > 10 ? (
            <p className="px-3 py-2 text-xs text-muted">+{lineItems.length - 10} more not shown</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
