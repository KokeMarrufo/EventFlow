import type { LineItemKind } from "@/lib/types";

export function KindBadge({ kind }: { kind: LineItemKind }) {
  const isRevenue = kind === "revenue";
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
        isRevenue ? "bg-success-subtle text-success" : "bg-surface-container text-navy"
      }`}
    >
      {isRevenue ? "Revenue" : "Cost"}
    </span>
  );
}
