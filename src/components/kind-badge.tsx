import type { LineItemKind } from "@/lib/types";

export function KindBadge({ kind }: { kind: LineItemKind }) {
  const isRevenue = kind === "revenue";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isRevenue ? "bg-success/10 text-success" : "bg-navy/10 text-navy"
      }`}
    >
      {isRevenue ? "Revenue" : "Cost"}
    </span>
  );
}
