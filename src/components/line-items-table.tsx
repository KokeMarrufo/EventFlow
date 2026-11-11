import type { LineItem } from "@/lib/types";
import { KindBadge } from "./kind-badge";
import { formatCurrency, formatDate } from "./format";

function groupByFile(items: LineItem[]): Array<[string, LineItem[]]> {
  const groups = new Map<string, LineItem[]>();
  for (const item of items) {
    const list = groups.get(item.sourceFileName) ?? [];
    list.push(item);
    groups.set(item.sourceFileName, list);
  }
  return Array.from(groups.entries());
}

/**
 * Line items grouped by source file. Traceability is a stated project
 * requirement, so every row repeats an explicit "traced to: <file> row <n>"
 * tag rather than relying solely on the group header.
 */
export function LineItemsTable({ items }: { items: LineItem[] }) {
  const groups = groupByFile(items);

  return (
    <div className="space-y-6">
      {groups.map(([fileName, fileItems]) => (
        <section key={fileName} className="overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-container-low px-4 py-3">
            <h3 className="font-display text-sm font-semibold text-navy">{fileName}</h3>
            <span className="text-xs text-muted">
              {fileItems.length} line item{fileItems.length === 1 ? "" : "s"}
            </span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Line items from {fileName}</caption>
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Kind
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Traced to
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fileItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <KindBadge kind={item.kind} />
                    </td>
                    <td
                      className={`px-4 py-3 tabular-nums font-semibold ${
                        item.kind === "revenue" ? "text-success" : "text-navy"
                      }`}
                    >
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-navy">{item.description}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(item.occurredOn)}</td>
                    <td className="px-4 py-3">
                      <code className="whitespace-nowrap rounded bg-blue-subtle px-2 py-1 text-xs font-medium text-primary">
                        traced to: {item.sourceFileName} &middot; row {item.sourceRow}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
