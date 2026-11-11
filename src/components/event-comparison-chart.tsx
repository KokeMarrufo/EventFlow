"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EventSummary } from "@/lib/types";
import { isEventComplete } from "@/lib/event-status";
import { formatCurrency } from "./format";

/**
 * Cost vs. revenue per event, side by side — the chart that actually
 * answers "which events were worth running," at a glance, instead of
 * reading a table top to bottom. Only complete events are charted; an
 * incomplete event's bars would misrepresent it (see headline-summary.tsx
 * for the same rule applied to the totals).
 */
export function EventComparisonChart({ events }: { events: EventSummary[] }) {
  const complete = events.filter(isEventComplete);

  if (complete.length === 0) {
    return (
      <p className="text-sm text-muted">
        No events have both cost and revenue data yet, so there&apos;s nothing to compare.
      </p>
    );
  }

  const chartData = complete.map((e) => ({
    name: e.eventName.length > 22 ? `${e.eventName.slice(0, 20)}…` : e.eventName,
    Cost: e.totalCost,
    Revenue: e.totalRevenue,
  }));

  return (
    <div style={{ width: "100%", height: Math.max(220, complete.length * 60) }}>
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
            dataKey="name"
            width={140}
            tick={{ fontSize: 12, fill: "#191c1d" }}
            axisLine={{ stroke: "#e2e5e7" }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e5e7" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Cost" fill="#0f2441" radius={[0, 4, 4, 0]} maxBarSize={16} />
          <Bar dataKey="Revenue" fill="#1e7e45" radius={[0, 4, 4, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
