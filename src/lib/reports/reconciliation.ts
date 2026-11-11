import { RECONCILIATION_TOLERANCE } from "@/lib/types";
import type { ReconciliationCheck } from "@/lib/types";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Compares a file's declared total (if it stated one) against the sum of
 * the line items actually parsed from it, within RECONCILIATION_TOLERANCE
 * (lib/types.ts). Returns null when the file made no declared-total claim
 * to check against — that's not a failure, just nothing to reconcile.
 */
export function reconcile(
  sourceFileId: string,
  sourceFileName: string,
  declaredTotal: number | null,
  computedTotal: number,
): ReconciliationCheck | null {
  if (declaredTotal == null) return null;
  const computed = round2(computedTotal);
  const declared = round2(declaredTotal);
  const difference = round2(computed - declared);
  return {
    sourceFileId,
    sourceFileName,
    declaredTotal: declared,
    computedTotal: computed,
    difference,
    withinTolerance: Math.abs(difference) <= RECONCILIATION_TOLERANCE,
  };
}
