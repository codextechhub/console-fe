import { describe, expect, it } from "vitest";

import concessionSource from "../../../pages/protected/finance/receivables/concessions-tab.tsx?raw";
import creditNoteSource from "../../../pages/protected/finance/receivables/credit-notes-tab.tsx?raw";
import paymentPlanSource from "../../../pages/protected/finance/receivables/payment-plans-tab.tsx?raw";
import refundSource from "../../../pages/protected/finance/receivables/refunds-tab.tsx?raw";
import periodsSource from "../../../pages/protected/finance/reports/periods-tab.tsx?raw";

function componentSource(source: string, functionName: string): string {
  const start = source.indexOf(`function ${functionName}`);
  const next = source.indexOf("\nfunction ", start + 1);
  expect(start, `${functionName} must exist`).toBeGreaterThanOrEqual(0);
  return source.slice(start, next < 0 ? undefined : next);
}

describe("finance recovery walkthrough targets", () => {
  it.each([
    {
      source: creditNoteSource,
      owner: "IssueNoteDrawer",
      targets: ["finance-credit-notes.form", "finance-credit-notes.posting", "finance-credit-notes.submit"],
    },
    {
      source: refundSource,
      owner: "NewActionDrawer",
      targets: ["finance-refunds.form", "finance-refunds.posting", "finance-refunds.submit"],
    },
    {
      source: concessionSource,
      owner: "NewConcessionDrawer",
      targets: ["finance-concessions.form", "finance-concessions.posting", "finance-concessions.submit"],
    },
    {
      source: paymentPlanSource,
      owner: "NewPlanDrawer",
      targets: ["finance-payment-plans.form", "finance-payment-plans.schedule", "finance-payment-plans.submit"],
    },
  ])("keeps $owner targets inside their intended drawer", ({ source, owner, targets }) => {
    const ownerSource = componentSource(source, owner);
    for (const target of targets) expect(ownerSource).toContain(`data-guide="${target}"`);
  });

  it("highlights a selectable period card before waiting for its drawer", () => {
    const cardSource = componentSource(periodsSource, "PeriodCard");

    expect(cardSource).toContain('data-guide="finance-periods.period"');
    expect(cardSource).toContain("onClick={onClick}");
  });
});
