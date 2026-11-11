import type { SourceType } from "@/lib/types";
import { eventBudgetAdapter } from "./event-budget";
import { donorPerfectAdapter } from "./donorperfect";
import { sageAdapter } from "./sage";
import type { Adapter, AdapterResult } from "./types";

export type { AdapterResult, ParsedLineItem, Adapter } from "./types";

const ADAPTERS: Record<SourceType, Adapter> = {
  event_budget: eventBudgetAdapter,
  donorperfect: donorPerfectAdapter,
  sage: sageAdapter,
};

export function getAdapter(sourceType: SourceType): Adapter {
  return ADAPTERS[sourceType];
}

export function runAdapter(
  sourceType: SourceType,
  buffer: Buffer,
  filename: string,
): AdapterResult {
  return getAdapter(sourceType)(buffer, filename);
}
