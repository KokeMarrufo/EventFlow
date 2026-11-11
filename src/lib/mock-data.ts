/**
 * Placeholder/demo data only. No real Downtown Mission or donor data.
 * Shapes mirror evidence E5 (one branded event: ~30→~180 attendees,
 * ~$3,000→~$17,000 raised) so the dashboard is demoable before real
 * anonymized exports (§5.3) are obtained. Replace once Iteration 0 sample
 * files arrive.
 */
import type { EventSummary, LineItem } from "./types";

export const MOCK_EVENTS: EventSummary[] = [
  {
    eventId: "evt_spring_gala",
    eventName: "Spring Gala (demo)",
    totalCost: 4200,
    totalRevenue: 17000,
    net: 12800,
    lineItemCount: 18,
    sourceFiles: ["event_budget_spring_gala.csv", "donorperfect_export_q1.csv", "sage_gl_march.csv"],
    hasCostData: true,
    hasRevenueData: true,
  },
  {
    eventId: "evt_third_party_walk",
    eventName: "Third-Party Platform Walk (demo)",
    totalCost: 9800,
    totalRevenue: 150000,
    net: 140200,
    lineItemCount: 42,
    sourceFiles: ["event_budget_walk.csv", "platform_export_walk.csv", "sage_gl_year.csv"],
    hasCostData: true,
    hasRevenueData: true,
  },
  {
    eventId: "evt_holiday_appeal",
    eventName: "Holiday Appeal Campaign (demo)",
    totalCost: 1500,
    totalRevenue: 6200,
    net: 4700,
    lineItemCount: 11,
    sourceFiles: ["event_budget_holiday.csv", "donorperfect_export_q4.csv"],
    hasCostData: true,
    hasRevenueData: true,
  },
  {
    // Deliberately incomplete demo event: only the budget side has been
    // imported, no DonorPerfect/Sage data yet. Shows how the dashboard
    // handles a partial import instead of a misleading "loss".
    eventId: "evt_fall_fundraiser",
    eventName: "Fall Fundraiser (demo, incomplete)",
    totalCost: 900,
    totalRevenue: 0,
    net: -900,
    lineItemCount: 2,
    sourceFiles: ["event_budget_fall.csv"],
    hasCostData: true,
    hasRevenueData: false,
  },
];

export const MOCK_LINE_ITEMS: Record<string, LineItem[]> = {
  evt_spring_gala: [
    {
      id: "li_1",
      eventId: "evt_spring_gala",
      eventName: "Spring Gala (demo)",
      sourceFileId: "sf_budget_1",
      sourceFileName: "event_budget_spring_gala.csv",
      sourceRow: 2,
      kind: "cost",
      amount: 1800,
      description: "Venue rental",
      category: "Venue",
      occurredOn: "2026-03-14",
    },
    {
      id: "li_2",
      eventId: "evt_spring_gala",
      eventName: "Spring Gala (demo)",
      sourceFileId: "sf_budget_1",
      sourceFileName: "event_budget_spring_gala.csv",
      sourceRow: 3,
      kind: "cost",
      amount: 2400,
      description: "Catering",
      category: "Catering",
      occurredOn: "2026-03-14",
    },
    {
      id: "li_3",
      eventId: "evt_spring_gala",
      eventName: "Spring Gala (demo)",
      sourceFileId: "sf_dp_1",
      sourceFileName: "donorperfect_export_q1.csv",
      sourceRow: 14,
      kind: "revenue",
      amount: 17000,
      description: "Aggregated gifts tagged Spring Gala (no donor names)",
      category: "Ticket Sales",
      occurredOn: "2026-03-15",
    },
  ],
};

