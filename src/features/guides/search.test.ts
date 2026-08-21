import { describe, expect, it } from "vitest";

import { GUIDE_REGISTRY } from "./registry";
import { searchGuides } from "./search";

describe("guide search", () => {
  it("ranks an exact title ahead of broader content matches", () => {
    const results = searchGuides(GUIDE_REGISTRY, "Get started with Console");
    expect(results[0]).toMatchObject({
      guide: { id: "getting-started.console-basics" },
      matchKind: "title",
    });
  });

  it("finds aliases and safe error phrases", () => {
    expect(searchGuides(GUIDE_REGISTRY, "403")[0]).toMatchObject({
      guide: { id: "troubleshooting.permission-denied" },
      matchKind: "alias",
    });
    expect(searchGuides(GUIDE_REGISTRY, "permission denied")[0]?.guide.id).toBe(
      "troubleshooting.permission-denied",
    );
    expect(searchGuides(GUIDE_REGISTRY, "invite expired")[0]?.guide.id).toBe(
      "getting-started.activate-and-sign-in",
    );
    expect(searchGuides(GUIDE_REGISTRY, "forgot my password")[0]?.guide.id).toBe(
      "getting-started.reset-password",
    );
  });

  it("finds article section headings and token prefixes", () => {
    expect(searchGuides(GUIDE_REGISTRY, "understand your access")[0]?.guide.id).toBe("getting-started.console-basics");
    expect(searchGuides(GUIDE_REGISTRY, "quick act")[0]).toMatchObject({
      guide: { id: "getting-started.console-basics" },
      matchKind: "prefix",
    });
  });

  it("matches partial words in any order and across metadata fields", () => {
    expect(searchGuides(GUIDE_REGISTRY, "pass for")[0]?.guide.id).toBe(
      "getting-started.reset-password",
    );
    expect(searchGuides(GUIDE_REGISTRY, "expired invite")[0]?.guide.id).toBe(
      "getting-started.activate-and-sign-in",
    );
    expect(searchGuides(GUIDE_REGISTRY, "access understand")[0]?.guide.id).toBe(
      "getting-started.console-basics",
    );
  });

  it("finds route and audience language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "/overview")[0]?.guide.id).toBe(
      "getting-started.console-basics",
    );
    expect(searchGuides(GUIDE_REGISTRY, "procurement officer")[0]?.guide.category).toBe(
      "procurement-and-inventory",
    );
  });

  it("finds schools and users tasks using current interface language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "add new school")[0]?.guide.id).toBe(
      "schools.create-and-configure",
    );
    expect(searchGuides(GUIDE_REGISTRY, "add branch")[0]?.guide.id).toBe(
      "schools.manage-schools-and-branches",
    );
    expect(searchGuides(GUIDE_REGISTRY, "unlock user")[0]?.guide.id).toBe(
      "schools.invite-and-manage-users",
    );
  });

  it("finds roles and permission tasks using access language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "change role")[0]?.guide.id).toBe(
      "roles.create-and-assign",
    );
    expect(searchGuides(GUIDE_REGISTRY, "transfer super admin")[0]?.guide.id).toBe(
      "roles.review-changes-and-transfer-super-admin",
    );
    expect(searchGuides(GUIDE_REGISTRY, "add dependency")[0]?.guide.id).toBe(
      "roles.maintain-permission-catalogue",
    );
  });

  it("finds organogram and task workflows using current interface language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "new org node")[0]?.guide.id).toBe(
      "organogram.build-structure",
    );
    expect(searchGuides(GUIDE_REGISTRY, "assign seat")[0]?.guide.id).toBe(
      "organogram.maintain-staff-profiles",
    );
    expect(searchGuides(GUIDE_REGISTRY, "mark task done")[0]?.guide.id).toBe(
      "tasks.create-and-complete",
    );
  });

  it("finds C6a finance workflows using accounting and recovery language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "account mapping")[0]?.guide.id).toBe(
      "finance.configure-foundations",
    );
    expect(searchGuides(GUIDE_REGISTRY, "direct entry")[0]?.guide.id).toBe(
      "finance.create-and-post-journal",
    );
    expect(searchGuides(GUIDE_REGISTRY, "no fiscal period covers this date")[0]?.guide.id).toBe(
      "finance.close-lock-or-reopen-period",
    );
  });

  it("finds C6b finance workflows using customer, banking, and report language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "unallocated receipt")[0]?.guide.id).toBe(
      "finance.invoice-and-allocate-receipt",
    );
    expect(searchGuides(GUIDE_REGISTRY, "customer did not receive invoice")[0]?.guide.id).toBe(
      "finance.email-customer-documents",
    );
    expect(searchGuides(GUIDE_REGISTRY, "unreconciled difference")[0]?.guide.id).toBe(
      "finance.reconcile-bank-statement",
    );
    expect(searchGuides(GUIDE_REGISTRY, "statement of financial position")[0]?.guide.id).toBe(
      "finance.run-financial-reports",
    );
  });

  it("finds C6c workflows using payroll, operations, tax, and provider language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "pay salaries")[0]?.guide.id).toBe("finance.run-payroll");
    expect(searchGuides(GUIDE_REGISTRY, "employee reimbursement")[0]?.guide.id).toBe("finance.submit-and-settle-expense-claim");
    expect(searchGuides(GUIDE_REGISTRY, "replenish float")[0]?.guide.id).toBe("finance.manage-petty-cash");
    expect(searchGuides(GUIDE_REGISTRY, "budget heatmap")[0]?.guide.id).toBe("finance.build-and-approve-budget");
    expect(searchGuides(GUIDE_REGISTRY, "dispose asset")[0]?.guide.id).toBe("finance.manage-fixed-assets");
    expect(searchGuides(GUIDE_REGISTRY, "partial tax payment")[0]?.guide.id).toBe("finance.file-and-pay-tax");
    expect(searchGuides(GUIDE_REGISTRY, "customer paid online")[0]?.guide.id).toBe("finance.collect-online-payments");
    expect(searchGuides(GUIDE_REGISTRY, "payout failed")[0]?.guide.id).toBe("finance.send-payouts-and-resolve-settlements");
  });

  it("finds C7a procurement workflows using supplier and sourcing language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "put vendor on hold")[0]?.guide.id).toBe("procurement.add-and-govern-vendor");
    expect(searchGuides(GUIDE_REGISTRY, "add catalogue item")[0]?.guide.id).toBe("procurement.manage-categories-and-catalogue");
    expect(searchGuides(GUIDE_REGISTRY, "sole source exception")[0]?.guide.id).toBe("procurement.run-rfq-and-award");
    expect(searchGuides(GUIDE_REGISTRY, "complete milestone")[0]?.guide.id).toBe("procurement.manage-contract-lifecycle");
  });

  it("finds C7b workflows using purchasing, stock, reporting, and policy language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "invoice blocked by receipt")[0]?.guide.id).toBe("procurement.complete-procure-to-pay");
    expect(searchGuides(GUIDE_REGISTRY, "issue stock")[0]?.guide.id).toBe("procurement.stock-locations");
    expect(searchGuides(GUIDE_REGISTRY, "goods received not invoiced")[0]?.guide.id).toBe("procurement.review-analytics");
    expect(searchGuides(GUIDE_REGISTRY, "change match tolerance")[0]?.guide.id).toBe("procurement.configure-settings");
  });

  it("finds C8 workflows using import, export, and recovery language", () => {
    expect(searchGuides(GUIDE_REGISTRY, "validate rows")[0]?.guide.id).toBe("data.import-batch");
    expect(searchGuides(GUIDE_REGISTRY, "publish template")[0]?.guide.id).toBe("data.import-templates");
    expect(searchGuides(GUIDE_REGISTRY, "restricted column")[0]?.guide.id).toBe("data.build-and-run-export");
    expect(searchGuides(GUIDE_REGISTRY, "rollback import")[0]?.guide.id).toBe("data.recover-import-export");
  });

  it("respects the caller's visibility boundary and result limit", () => {
    const publicSubset = GUIDE_REGISTRY.filter((guide) => guide.access.mode === "authenticated");
    const results = searchGuides(publicSubset, "account", 1);
    expect(results).toHaveLength(1);
    expect(results[0].guide.access.mode).toBe("authenticated");
  });

  it("returns no results for blank or unrelated queries", () => {
    expect(searchGuides(GUIDE_REGISTRY, "   ")).toEqual([]);
    expect(searchGuides(GUIDE_REGISTRY, "zephyr quantum")).toEqual([]);
  });
});
