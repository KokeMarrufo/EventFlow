"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryAmount } from "@/lib/types";
import { formatCurrency } from "./format";

const BAR_COLOR: Record<"cost" | "revenue", string> = {
  cost: "#0f2441", // --color-navy
  revenue: "#1e7e45", // --color-success
};

/**
 * Horizontal bar chart of cost or revenue broken down by category (event
 * budget line, DonorPerfect fund, or Sage GL account — see
 * lib/adapters/*). This is the actual analytical payoff of importing
 * structured data instead of a flat total: "where does the money go,"
 * not just "how much."
 */
export function CategoryChart({
  data,
  kind,
}: {
  data: CategoryAmount[];
  kind: "cost" | "revenue";
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">No categorized data yet.</p>;
  }

  // Longest 8 bars keeps the chart legible; anything smaller still totals
  // correctly in the categories shown, it's a display cap, not data loss.
  const chartData = data.slice(0, 8).map((d) => ({ ...d, label: d.category }));
  const height = Math.max(120, chartData.length * 36);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e7" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11, fill: "#424751" }}
            axisLine={{ stroke: "#e2e5e7" }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fontSize: 12, fill: "#191c1d" }}
            axisLine={{ stroke: "#e2e5e7" }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e5e7" }}
          />
          <Bar dataKey="amount" fill={BAR_COLOR[kind]} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
