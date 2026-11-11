import { describe, expect, it } from "vitest";
import { donorPerfectAdapter } from "./donorperfect";

function csv(lines: string[]): Buffer {
  return Buffer.from(lines.join("\n"), "utf-8");
}

describe("donorPerfectAdapter", () => {
  it("parses a valid aggregated-per-event file as revenue line items", () => {
    const result = donorPerfectAdapter(
      csv([
        "event,date,amount,description",
        "Spring Gala,2026-03-15,17000,Aggregated gifts",
        "Holiday Appeal,2026-12-10,6200,Aggregated gifts",
        "Total,,23200,Grand total",
      ]),
      "donorperfect_export_q1.csv",
    );
    expect(result.errors).toEqual([]);
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems.every((i) => i.kind === "revenue")).toBe(true);
    expect(result.declaredTotal).toBe(23200);
  });

  it("never reads donor name/email columns even when present in the file", () => {
    const result = donorPerfectAdapter(
      csv([
        "event,date,amount,description,donor_name,email",
        "Spring Gala,2026-03-15,17000,Aggregated gifts,Jane Donor,jane@example.com",
      ]),
      "donorperfect_export.csv",
    );
    expect(result.lineItems).toHaveLength(1);
    // The parsed shape has no field that could carry a name/email through.
    const keys = Object.keys(result.lineItems[0]);
    expect(keys).not.toContain("donor_name");
    expect(keys).not.toContain("email");
    expect(JSON.stringify(result.lineItems)).not.toMatch(/Jane Donor|jane@example\.com/);
  });

  it("flags missing event tag, unparsable date and duplicate rows", () => {
    const result = donorPerfectAdapter(
      csv([
        "event,date,amount,description",
        "Spring Gala,2026-03-15,17000,Aggregated gifts",
        "Spring Gala,2026-03-15,17000,Aggregated gifts", // duplicate
        ",2026-03-15,500,No event", // missing event tag
        "Holiday Appeal,13/40/2026,6200,Bad date", // unparsable date
        "Holiday Appeal,2026-12-10,not-a-number,Bad amount", // bad amount
      ]),
      "donorperfect_export.csv",
    );
    expect(result.lineItems).toHaveLength(1);
    expect(result.errors).toHaveLength(4);
    expect(result.errors.map((e) => e.message).join(" | ")).toMatch(/duplicate/);
    expect(result.errors.map((e) => e.message).join(" | ")).toMatch(/missing event tag/);
    expect(result.errors.map((e) => e.message).join(" | ")).toMatch(/unparsable date/);
    expect(result.errors.map((e) => e.message).join(" | ")).toMatch(/missing or unparsable amount/);
  });

  it("reports a declared total that does not match the computed sum (left to reconciliation to flag)", () => {
    const result = donorPerfectAdapter(
      csv([
        "event,date,amount,description",
        "Spring Gala,2026-03-15,17000,Aggregated gifts",
        "Total,,5,Grand total (wrong)",
      ]),
      "donorperfect_export.csv",
    );
    expect(result.declaredTotal).toBe(5);
    const computed = result.lineItems.reduce((sum, i) => sum + i.amount, 0);
    expect(computed).toBe(17000);
    expect(computed).not.toBe(result.declaredTotal);
  });
});
