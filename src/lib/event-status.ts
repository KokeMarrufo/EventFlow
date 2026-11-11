import type { EventSummary } from "./types";

/**
 * Translates an event's raw numbers into the plain-language status a
 * non-technical viewer (a Downtown Mission director, not a developer)
 * actually wants: did this event make money, lose money, break even, or is
 * there not enough data yet to say? "Incomplete" takes priority over the
 * net figure — an event with only a budget imported (no DonorPerfect/Sage)
 * would otherwise show a misleadingly large "loss" that's really just
 * missing data.
 */
export type EventStatus = "ahead" | "down" | "even" | "incomplete";

export function isEventComplete(
  event: Pick<EventSummary, "hasCostData" | "hasRevenueData">,
): boolean {
  return event.hasCostData && event.hasRevenueData;
}

export function getEventStatus(
  event: Pick<EventSummary, "hasCostData" | "hasRevenueData" | "net">,
): EventStatus {
  if (!isEventComplete(event)) return "incomplete";
  if (event.net > 0) return "ahead";
  if (event.net < 0) return "down";
  return "even";
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  ahead: "Ahead",
  down: "Down",
  even: "Break-even",
  incomplete: "Incomplete",
};

/** Why an event is incomplete, for a short explanatory note. Null when it isn't. */
export function missingDataNote(
  event: Pick<EventSummary, "hasCostData" | "hasRevenueData">,
): string | null {
  if (event.hasCostData && event.hasRevenueData) return null;
  if (!event.hasCostData && !event.hasRevenueData) return "no cost or revenue data imported yet";
  if (!event.hasCostData) return "missing cost data";
  return "missing revenue data (e.g. DonorPerfect or Sage)";
}
