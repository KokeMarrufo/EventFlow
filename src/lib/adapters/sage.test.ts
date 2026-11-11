import { describe, expect, it } from "vitest";
import { sageAdapter } from "./sage";

function csv(lines: string[]): Buffer {
  return Buffer.from(lines.join("\n"), "utf-8");
}

describe("sageAdapter", () => {
  it("classifies kind from the account column and reads the declared total row", () => {
    const result = sageAdapter(
      csv([
        "event,date,amount,account,description",
        "Spring Gala,2026-03-14,1800,Event Expenses,Venue rental",
        "Spring Gala,2026-03-15,17000,Donation Revenue,Gala donations",
        "Total,,15200,,Grand total",
      ]),
      "sage_gl_march.csv",
    );
    expect(result.errors).toEqual([]);
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]).toMatchObject({ kind: "cost", amount: 1800 });
    expect(result.lineItems[1]).toMatchObject({ kind: "revenue", amount: 17000 });
    expect(result.declaredTotal).toBe(15200);
  });

  it("falls back to amount sign when the account text doesn't match known keywords", () => {
    const result = sageAdapter(
      csv([
        "event,date,amount,account,description",
        "Spring Gala,2026-03-14,-1800,Misc GL 4010,Venue rental",
        "Spring Gala,2026-03-15,17000,Misc GL 4020,Gala donations",
      ]),
      "sage_gl_march.csv",
    );
    expect(result.errors).toEqual([]);
    expect(result.lineItems.map((i) => i.kind)).toEqual(["cost", "revenue"]);
  });

  it("flags rows with missing event tag, unparsable date, missing amount and duplicates", () => {
    const result = sageAdapter(
      csv([
        "event,date,amount,account,description",
        "Spring Gala,2026-03-14,1800,Expenses,Venue rental",
        "Spring Gala,2026-03-14,1800,Expenses,Venue rental", // duplicate
        ",2026-03-14,500,Expenses,No event", // missing event tag
        "Spring Gala,2026/99/14,500,Expenses,Bad date", // unparsable date
        "Spring Gala,2026-03-16,,Expenses,Missing amount", // missing amount
      ]),
      "sage_gl_march.csv",
    );
    expect(result.lineItems).toHaveLength(1);
    expect(result.errors).toHaveLength(4);
  });

  it("flags a row with no account value as an error rather than guessing", () => {
    const result = sageAdapter(
      csv(["event,date,amount,account,description", "Spring Gala,2026-03-14,1800,,Venue rental"]),
      "sage_gl_march.csv",
    );
    expect(result.lineItems).toHaveLength(0);
    expect(result.errors[0].message).toMatch(/missing "account" column/);
  });

  it("reports a declared total that does not match the computed sum", () => {
    const result = sageAdapter(
      csv([
        "event,date,amount,account,description",
        "Spring Gala,2026-03-14,1800,Expenses,Venue rental",
        "Spring Gala,2026-03-15,17000,Revenue,Donations",
        "Total,,1,,Grand total (wrong)",
      ]),
      "sage_gl_march.csv",
    );
    const computed = result.lineItems.reduce(
      (sum, i) => sum + (i.kind === "cost" ? -i.amount : i.amount),
      0,
    );
    expect(computed).toBe(15200);
    expect(result.declaredTotal).toBe(1);
    expect(computed).not.toBe(result.declaredTotal);
  });
});
