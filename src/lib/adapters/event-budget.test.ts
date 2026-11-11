import { describe, expect, it } from "vitest";
import { eventBudgetAdapter } from "./event-budget";

function csv(lines: string[]): Buffer {
  return Buffer.from(lines.join("\n"), "utf-8");
}

describe("eventBudgetAdapter", () => {
  it("parses a valid file, infers kind from amount sign, and reads the declared total row", () => {
    const result = eventBudgetAdapter(
      csv([
        "event,date,amount,description",
        "Spring Gala,2026-03-14,-1800,Venue rental",
        "Spring Gala,2026-03-14,-2400,Catering",
        "Spring Gala,2026-03-15,17000,Ticket sales",
        "Total,,12800,Grand total",
      ]),
      "event_budget_spring_gala.csv",
    );

    expect(result.errors).toEqual([]);
    expect(result.lineItems).toHaveLength(3);
    expect(result.declaredTotal).toBe(12800);

    const [venue, catering, tickets] = result.lineItems;
    expect(venue).toMatchObject({ kind: "cost", amount: 1800, eventName: "Spring Gala" });
    expect(catering).toMatchObject({ kind: "cost", amount: 2400 });
    expect(tickets).toMatchObject({ kind: "revenue", amount: 17000, occurredOn: "2026-03-15" });
  });

  it("respects an explicit kind column when present", () => {
    const result = eventBudgetAdapter(
      csv([
        "event,date,amount,description,kind",
        "Spring Gala,2026-03-14,1800,Venue rental,cost",
        "Spring Gala,2026-03-15,17000,Ticket sales,revenue",
      ]),
      "budget.csv",
    );
    expect(result.errors).toEqual([]);
    expect(result.lineItems.map((i) => i.kind)).toEqual(["cost", "revenue"]);
  });

  it("produces a clear ValidationError for each kind of bad row instead of a silently wrong number", () => {
    const result = eventBudgetAdapter(
      csv([
        "event,date,amount,description",
        "Spring Gala,2026-03-14,-1800,Venue rental", // row 2: valid
        "Spring Gala,2026-03-14,-1800,Venue rental", // row 3: duplicate of row 2
        ",2026-03-14,-100,No event tag", // row 4: missing event tag
        "Spring Gala,not-a-date,500,Bad date", // row 5: unparsable date
        "Spring Gala,2026-03-16,,Missing amount", // row 6: missing amount
      ]),
      "budget.csv",
    );

    expect(result.lineItems).toHaveLength(1);
    expect(result.errors).toHaveLength(4);
    expect(result.errors.map((e) => e.row)).toEqual([3, 4, 5, 6]);
    expect(result.errors[0].message).toMatch(/duplicate of row 2/);
    expect(result.errors[1].message).toMatch(/missing event tag/);
    expect(result.errors[2].message).toMatch(/unparsable date/);
    expect(result.errors[3].message).toMatch(/missing or unparsable amount/);
  });

  it("flags a mismatched declared total as data for the caller to reconcile, not as a parse error", () => {
    const result = eventBudgetAdapter(
      csv([
        "event,date,amount,description",
        "Spring Gala,2026-03-14,-1800,Venue rental",
        "Spring Gala,2026-03-15,17000,Ticket sales",
        "Total,,999999,Grand total (wrong)",
      ]),
      "budget.csv",
    );
    expect(result.errors).toEqual([]);
    expect(result.declaredTotal).toBe(999999);
    const computed = result.lineItems.reduce(
      (sum, i) => sum + (i.kind === "cost" ? -i.amount : i.amount),
      0,
    );
    expect(computed).toBe(15200);
    expect(computed).not.toBe(result.declaredTotal);
  });

  it("rejects an unrecognized explicit kind value", () => {
    const result = eventBudgetAdapter(
      csv(["event,date,amount,description,kind", "Spring Gala,2026-03-14,1800,Venue,maybe"]),
      "budget.csv",
    );
    expect(result.lineItems).toHaveLength(0);
    expect(result.errors[0].message).toMatch(/unrecognized kind/);
  });
});
