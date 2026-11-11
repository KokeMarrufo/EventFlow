import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ImportResultPanel, type ImportOutcome } from "./import-result";
import type { ImportResponse } from "@/lib/types";

/**
 * /api/import is owned by the backend agent and currently always returns
 * 501 (see src/app/api/import/route.ts). These tests render both the
 * current interim state and the real ImportResponse shape the route is
 * expected to return once parsing lands, so the import UI is exercised
 * against both without needing the real endpoint to be live yet.
 */

function render(outcome: ImportOutcome) {
  return renderToStaticMarkup(ImportResultPanel({ outcome }));
}

describe("ImportResultPanel", () => {
  it("renders nothing for the idle state", () => {
    expect(render({ kind: "idle" })).toBe("");
  });

  it("shows an uploading status", () => {
    const html = render({ kind: "uploading" });
    expect(html).toContain("Uploading and parsing file");
  });

  it("renders the current 501 placeholder as a calm, non-alarming interim state", () => {
    const html = render({
      kind: "not_implemented",
      message: "Import parsing is not implemented yet (placeholder route). See lib/adapters/.",
    });
    expect(html).toContain("live yet");
    expect(html).toContain("Import parsing is not implemented yet");
    // Should read as informational, not as a crash/error.
    expect(html).not.toContain('role="alert"');
  });

  it("renders a hard error distinctly from the 501 interim state", () => {
    const html = render({ kind: "error", message: "Could not reach the import endpoint." });
    expect(html).toContain("Import failed");
    expect(html).toContain("Could not reach the import endpoint.");
    expect(html).toContain('role="alert"');
  });

  it("renders a full success ImportResponse: parse summary, validation errors and reconciliation", () => {
    const data: ImportResponse = {
      sourceFile: {
        id: "sf_1",
        filename: "event_budget_spring_gala.csv",
        sourceType: "event_budget",
        uploadedAt: "2026-03-14T12:00:00.000Z",
        rowCount: 3,
        status: "parsed_with_errors",
        declaredTotal: 17000,
        errors: [{ row: 5, message: "Missing amount column" }],
      },
      lineItems: [
        {
          id: "li_1",
          eventId: "evt_1",
          eventName: "Spring Gala (demo)",
          sourceFileId: "sf_1",
          sourceFileName: "event_budget_spring_gala.csv",
          sourceRow: 2,
          kind: "cost",
          amount: 1800,
          description: "Venue rental",
          occurredOn: "2026-03-14",
        },
        {
          id: "li_2",
          eventId: "evt_1",
          eventName: "Spring Gala (demo)",
          sourceFileId: "sf_1",
          sourceFileName: "event_budget_spring_gala.csv",
          sourceRow: 3,
          kind: "revenue",
          amount: 17000,
          description: "Aggregated gifts",
          occurredOn: "2026-03-15",
        },
      ],
      reconciliation: {
        sourceFileId: "sf_1",
        sourceFileName: "event_budget_spring_gala.csv",
        declaredTotal: 17000,
        computedTotal: 15200,
        difference: 1800,
        withinTolerance: false,
      },
    };

    const html = render({ kind: "success", data });

    expect(html).toContain("event_budget_spring_gala.csv");
    expect(html).toContain("Parsed with errors");
    expect(html).toContain("Missing amount column");
    expect(html).toContain("Reconciliation");
    expect(html).toContain("Out of tolerance");
    expect(html).toContain("Venue rental");
    expect(html).toContain("Aggregated gifts");
  });

  it("renders a success response with no reconciliation check and no validation errors", () => {
    const data: ImportResponse = {
      sourceFile: {
        id: "sf_2",
        filename: "sage_gl_march.csv",
        sourceType: "sage",
        uploadedAt: "2026-03-20T09:00:00.000Z",
        rowCount: 1,
        status: "parsed",
        declaredTotal: null,
        errors: [],
      },
      lineItems: [
        {
          id: "li_3",
          eventId: "evt_1",
          eventName: "Spring Gala (demo)",
          sourceFileId: "sf_2",
          sourceFileName: "sage_gl_march.csv",
          sourceRow: 2,
          kind: "cost",
          amount: 500,
          description: "Printing",
          occurredOn: null,
        },
      ],
      reconciliation: null,
    };

    const html = render({ kind: "success", data });

    expect(html).toContain("sage_gl_march.csv");
    expect(html).toContain("Parsed");
    expect(html).not.toContain("Reconciliation");
    expect(html).not.toContain("validation issue");
  });
});
