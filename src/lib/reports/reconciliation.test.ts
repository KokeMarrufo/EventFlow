import { describe, expect, it } from "vitest";
import { reconcile } from "./reconciliation";
import { RECONCILIATION_TOLERANCE } from "@/lib/types";

describe("reconcile", () => {
  it("returns null when the file made no declared-total claim", () => {
    expect(reconcile("sf1", "file.csv", null, 100)).toBeNull();
  });

  it("flags an exact match as within tolerance with a zero difference", () => {
    const check = reconcile("sf1", "file.csv", 12800, 12800);
    expect(check).toEqual({
      sourceFileId: "sf1",
      sourceFileName: "file.csv",
      declaredTotal: 12800,
      computedTotal: 12800,
      difference: 0,
      withinTolerance: true,
    });
  });

  it("stays within tolerance for a difference exactly at RECONCILIATION_TOLERANCE", () => {
    const check = reconcile("sf1", "file.csv", 100, 100 + RECONCILIATION_TOLERANCE);
    expect(check?.withinTolerance).toBe(true);
    expect(check?.difference).toBeCloseTo(RECONCILIATION_TOLERANCE, 5);
  });

  it("flags out-of-tolerance mismatches, in either direction", () => {
    const over = reconcile("sf1", "file.csv", 100, 150);
    expect(over?.withinTolerance).toBe(false);
    expect(over?.difference).toBe(50);

    const under = reconcile("sf1", "file.csv", 150, 100);
    expect(under?.withinTolerance).toBe(false);
    expect(under?.difference).toBe(-50);
  });

  it("rounds to the nearest cent before comparing, avoiding float noise", () => {
    const check = reconcile("sf1", "file.csv", 0.1 + 0.2, 0.3); // 0.1+0.2 !== 0.3 in raw float
    expect(check?.difference).toBe(0);
    expect(check?.withinTolerance).toBe(true);
  });
});
