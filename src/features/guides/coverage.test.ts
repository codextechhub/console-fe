import { describe, expect, it } from "vitest";

import { buildGuideCoverageReport, type GuideCoverageTarget } from "./coverage";
import { GUIDE_REGISTRY } from "./registry";
import { WALKTHROUGH_REGISTRY } from "./walkthroughs/registry";

describe("guide coverage reporting", () => {
  it("distinguishes covered targets from missing guides", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "school-setup", route: "/school-management/create", actionId: "create-school", risk: "high", walkthroughRequired: true },
      { id: "unknown-flow", route: "/overview", actionId: "action-that-is-not-mapped", risk: "low" },
    ];

    expect(buildGuideCoverageReport(GUIDE_REGISTRY, targets)).toMatchObject({
      targetCount: 2,
      coveredTargetCount: 1,
      publishedGuideCount: GUIDE_REGISTRY.filter((guide) => guide.status === "published").length,
      draftGuideCount: GUIDE_REGISTRY.filter((guide) => guide.status === "draft").length,
      gaps: [{ targetId: "unknown-flow", kind: "missing-guide" }],
    });
  });

  it("requires a walkthrough or a recorded reason for complex coverage", () => {
    const guideWithoutWalkthrough = [{ ...GUIDE_REGISTRY[0], walkthroughId: undefined }];
    const targets: GuideCoverageTarget[] = [
      { id: "console-basics", route: "/overview", risk: "high", walkthroughRequired: true },
    ];

    expect(buildGuideCoverageReport(guideWithoutWalkthrough, targets).gaps).toEqual([
      { targetId: "console-basics", kind: "missing-walkthrough-or-reason" },
    ]);
  });

  it("accepts a recorded reason when a high-risk workflow should not use a walkthrough", () => {
    const targets: GuideCoverageTarget[] = [
      {
        id: "console-basics",
        route: "/overview",
        risk: "high",
        walkthroughException: "The workflow is completed outside Console.",
      },
    ];

    expect(buildGuideCoverageReport(GUIDE_REGISTRY, targets).gaps).toEqual([]);
  });

  it("counts the implemented school walkthrough definition", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "school-setup", route: "/school-management/create", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts implemented high-risk roles walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "role-setup", route: "/roles/create", actionId: "create-role", risk: "high" },
      { id: "permission-setup", route: "/permissions/create", actionId: "create-permission", risk: "high" },
      { id: "super-admin-transfer", route: "/roles/transfer-super-admin", actionId: "transfer-super-admin", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts implemented organogram and staff-profile walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "organogram-setup", route: "/organogram/manage", actionId: "manage-organogram", risk: "medium", walkthroughRequired: true },
      { id: "staff-profile-setup", route: "/organogram/staff/create", risk: "medium", walkthroughRequired: true },
      { id: "personal-tasks", route: "/tasks", actionId: "view-tasks", risk: "low" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts implemented high-risk workflow walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "approval-decision", route: "/workflow/approvals", actionId: "view-approvals", risk: "high" },
      { id: "approval-delegation", route: "/workflow/delegations", actionId: "view-delegations", risk: "high" },
      { id: "workflow-template", route: "/workflow/templates/new", actionId: "create-workflow-template", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts the three high-risk C6a finance walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "finance-foundations", route: "/finance/setup/entities", actionId: "create-entity", risk: "high" },
      { id: "manual-journal", route: "/finance/ledger", actionId: "new-journal-entry", risk: "high" },
      { id: "fiscal-close", route: "/finance/setup/periods", actionId: "view-fiscal-periods", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts the three high-risk C6b finance walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "customer-receipt", route: "/finance/receivables/receipts", actionId: "record-receipt", risk: "high" },
      { id: "customer-email", route: "/finance/receivables/invoices", actionId: "view-ar-invoices", risk: "high" },
      { id: "bank-reconciliation", route: "/finance/bank-reconciliation", actionId: "view-bank-reconciliation", risk: "high" },
      {
        id: "financial-reports",
        route: "/finance/reports/trial-balance",
        actionId: "view-trial-balance",
        risk: "medium",
        walkthroughException: "Reports are read-only views with simple filters and exports.",
      },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts the eight high-risk C6c finance and payment walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "payroll", route: "/finance/payroll", actionId: "create-payroll-run", risk: "high" },
      { id: "expense-claim", route: "/finance/expenses/claims", actionId: "create-expense-claim", risk: "high" },
      { id: "petty-cash", route: "/finance/expenses/petty-cash", actionId: "new-petty-cash-voucher", risk: "high" },
      { id: "budget", route: "/finance/budgets/budgets", actionId: "create-budget", risk: "high" },
      { id: "fixed-asset", route: "/finance/budgets/assets", actionId: "create-fixed-asset", risk: "high" },
      { id: "tax", route: "/finance/budgets/tax", actionId: "view-tax-remittance", risk: "high" },
      { id: "collection", route: "/finance/collections", actionId: "view-collections", risk: "high" },
      { id: "payout", route: "/finance/payments/payouts", actionId: "new-payout", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts the three high-risk C7a procurement walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "vendor-governance", route: "/procurement/vendors/vendors", actionId: "create-vendor", risk: "high" },
      {
        id: "category-catalogue",
        route: "/procurement/vendors/categories",
        actionId: "create-category",
        risk: "medium",
        walkthroughException: "Short master-data forms have no cross-screen or irreversible action.",
      },
      { id: "sourcing-award", route: "/procurement/sourcing/rfqs", actionId: "create-rfq", risk: "high" },
      { id: "contract-lifecycle", route: "/procurement/contracts", actionId: "create-contract", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts the C7b procurement and inventory coverage", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "procure-to-pay", route: "/procurement/requisitions", actionId: "create-requisition", risk: "high" },
      { id: "stock-movement", route: "/procurement/inventory/items", actionId: "create-stock-item", risk: "high" },
      {
        id: "procurement-analytics",
        route: "/procurement/analytics/ap-aging",
        actionId: "view-ap-aging",
        risk: "medium",
        walkthroughException: "The report views are read-only; the article records the separate assessment boundary.",
      },
      { id: "procurement-settings", route: "/procurement/settings", actionId: "view-procurement-settings", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });

  it("counts the four high-risk C8 import and export walkthroughs", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "import-batch", route: "/data-imports/batches", actionId: "upload-import-batch", risk: "high" },
      { id: "import-template", route: "/data-imports/templates", actionId: "create-import-template", risk: "high" },
      { id: "saved-export", route: "/export/new", actionId: "create-export", risk: "high" },
      { id: "data-recovery", route: "/export/queues", actionId: "view-export-queues", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([]);
  });
});
