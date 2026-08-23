import { describe, expect, it } from "vitest";

import { P, resolvePermissionKey } from "@/permissions";

import {
  canDiscoverGuide,
  featuredGuides,
  guideLandingView,
  guidesForAudience,
  recentlyReviewedGuides,
  visibleGuides,
} from "./discovery";
import { GUIDE_REGISTRY } from "./registry";

const byId = (id: string) => {
  const guide = GUIDE_REGISTRY.find((candidate) => candidate.id === id);
  if (!guide) throw new Error(`Missing guide fixture: ${id}`);
  return guide;
};

describe("guide discovery", () => {
  it("keeps authenticated guides visible without extra permissions", () => {
    expect(canDiscoverGuide(byId("getting-started.console-basics"), [])).toBe(true);
  });

  it("hides restricted guide details until its complete access rule is satisfied", () => {
    const guide = byId("roles.create-and-assign");
    const partial = [P.VIEW_ROLES, P.DEFINE_ROLE].map(resolvePermissionKey);
    const complete = [P.VIEW_ROLES, P.DEFINE_ROLE, P.ASSIGN_ROLE].map(resolvePermissionKey);

    expect(canDiscoverGuide(guide, partial)).toBe(false);
    expect(canDiscoverGuide(guide, complete)).toBe(true);
  });

  it("filters before audience selection so restricted titles never leak", () => {
    const visible = visibleGuides(GUIDE_REGISTRY, []);

    expect(visible.map((guide) => guide.id)).toEqual([
      "getting-started.console-basics",
      "getting-started.activate-and-sign-in",
      "getting-started.reset-password",
      "tasks.create-and-complete",
      "workflow.review-and-act",
      "workflow.delegate-and-track",
      "account.secure-account",
      "account.maintain-profile-and-privacy",
      "troubleshooting.permission-denied",
      "troubleshooting.account-and-invitation",
      "troubleshooting.search-filter-and-download",
      "troubleshooting.prepare-support-ticket",
    ]);
    expect(guidesForAudience(visible, "finance-officer")).toEqual([]);
  });

  it("keeps draft guides out of normal discovery and publishes universal C11 and C12 help", () => {
    const visible = visibleGuides(GUIDE_REGISTRY, []);

    expect(visible.every((guide) => guide.status === "published")).toBe(true);
    expect(visible.map((guide) => guide.id)).toEqual(expect.arrayContaining([
      "account.secure-account",
      "account.maintain-profile-and-privacy",
      "troubleshooting.permission-denied",
      "troubleshooting.account-and-invitation",
      "troubleshooting.search-filter-and-download",
      "troubleshooting.prepare-support-ticket",
    ]));
  });

  it("publishes C6a guides only inside the caller's finance permissions", () => {
    const accountReader = [resolvePermissionKey(P.FIN_VIEW_ACCOUNTS)];
    const periodReader = [resolvePermissionKey(P.FIN_VIEW_PERIODS)];
    const directPoster = [resolvePermissionKey(P.FIN_POST_DIRECT_ENTRY)];

    expect(visibleGuides(GUIDE_REGISTRY, accountReader).map((guide) => guide.id)).toContain(
      "finance.configure-foundations",
    );
    expect(visibleGuides(GUIDE_REGISTRY, periodReader).map((guide) => guide.id)).toContain(
      "finance.close-lock-or-reopen-period",
    );
    expect(visibleGuides(GUIDE_REGISTRY, directPoster).map((guide) => guide.id)).toContain(
      "finance.create-and-post-journal",
    );
  });

  it("publishes C6b guides only inside the caller's finance permissions", () => {
    const invoiceReader = [resolvePermissionKey(P.FIN_VIEW_INVOICES)];
    const emailSender = [resolvePermissionKey(P.FIN_EMAIL_INVOICE)];
    const bankReader = [resolvePermissionKey(P.FIN_VIEW_BANK_ACCOUNTS)];
    const reportReader = [resolvePermissionKey(P.FIN_VIEW_REPORTS)];

    expect(visibleGuides(GUIDE_REGISTRY, invoiceReader).map((guide) => guide.id)).toContain(
      "finance.invoice-and-allocate-receipt",
    );
    expect(visibleGuides(GUIDE_REGISTRY, emailSender).map((guide) => guide.id)).toContain(
      "finance.email-customer-documents",
    );
    expect(visibleGuides(GUIDE_REGISTRY, bankReader).map((guide) => guide.id)).toContain(
      "finance.reconcile-bank-statement",
    );
    expect(visibleGuides(GUIDE_REGISTRY, reportReader).map((guide) => guide.id)).toContain(
      "finance.run-financial-reports",
    );
  });

  it("publishes C6c guides only inside the caller's finance and payment permissions", () => {
    const payrollReader = [resolvePermissionKey(P.FIN_VIEW_PAYROLL)];
    const expenseReader = [resolvePermissionKey(P.FIN_VIEW_EXPENSE_CLAIMS)];
    const assetReader = [resolvePermissionKey(P.FIN_VIEW_FIXED_ASSETS)];
    const collectionReader = [resolvePermissionKey(P.PAY_VIEW_COLLECTIONS)];
    const payoutReader = [resolvePermissionKey(P.PAY_VIEW_PAYOUTS)];

    expect(visibleGuides(GUIDE_REGISTRY, payrollReader).map((guide) => guide.id)).toContain("finance.run-payroll");
    expect(visibleGuides(GUIDE_REGISTRY, expenseReader).map((guide) => guide.id)).toContain("finance.submit-and-settle-expense-claim");
    expect(visibleGuides(GUIDE_REGISTRY, assetReader).map((guide) => guide.id)).toContain("finance.manage-fixed-assets");
    expect(visibleGuides(GUIDE_REGISTRY, collectionReader).map((guide) => guide.id)).toContain("finance.collect-online-payments");
    expect(visibleGuides(GUIDE_REGISTRY, payoutReader).map((guide) => guide.id)).toContain("finance.send-payouts-and-resolve-settlements");
  });

  it("publishes finance recovery guides only for their receivables permissions", () => {
    const noteReader = [resolvePermissionKey(P.FIN_VIEW_CREDIT_NOTES)];
    const refundReader = [resolvePermissionKey(P.FIN_VIEW_REFUNDS)];
    const planReader = [resolvePermissionKey(P.FIN_VIEW_PAYMENT_PLANS)];

    expect(visibleGuides(GUIDE_REGISTRY, noteReader).map((guide) => guide.id)).toContain("finance.adjust-credit-notes-and-concessions");
    expect(visibleGuides(GUIDE_REGISTRY, refundReader).map((guide) => guide.id)).toContain("finance.refund-or-write-off-balance");
    expect(visibleGuides(GUIDE_REGISTRY, planReader).map((guide) => guide.id)).toContain("finance.create-and-manage-payment-plan");
    expect(visibleGuides(GUIDE_REGISTRY, []).map((guide) => guide.id)).not.toContain("finance.refund-or-write-off-balance");
  });

  it("publishes C7a guides only inside the caller's procurement permissions", () => {
    const vendorReader = [resolvePermissionKey(P.PROC_VIEW_VENDORS)];
    const categoryReader = [resolvePermissionKey(P.PROC_VIEW_CATEGORIES)];
    const rfqReader = [resolvePermissionKey(P.PROC_VIEW_RFQS)];
    const contractReader = [resolvePermissionKey(P.PROC_VIEW_CONTRACTS)];

    expect(visibleGuides(GUIDE_REGISTRY, vendorReader).map((guide) => guide.id)).toContain("procurement.add-and-govern-vendor");
    expect(visibleGuides(GUIDE_REGISTRY, categoryReader).map((guide) => guide.id)).toContain("procurement.manage-categories-and-catalogue");
    expect(visibleGuides(GUIDE_REGISTRY, rfqReader).map((guide) => guide.id)).toContain("procurement.run-rfq-and-award");
    expect(visibleGuides(GUIDE_REGISTRY, contractReader).map((guide) => guide.id)).toContain("procurement.manage-contract-lifecycle");
  });

  it("publishes C7b guides only inside the caller's procurement permissions", () => {
    const requisitionReader = [resolvePermissionKey(P.PROC_VIEW_REQUISITIONS)];
    const stockReader = [resolvePermissionKey(P.PROC_VIEW_STOCK)];
    const reportReader = [resolvePermissionKey(P.PROC_VIEW_PROC_REPORTS)];
    const settingsReader = [resolvePermissionKey(P.PROC_VIEW_SETTINGS)];

    expect(visibleGuides(GUIDE_REGISTRY, requisitionReader).map((guide) => guide.id)).toContain("procurement.complete-procure-to-pay");
    expect(visibleGuides(GUIDE_REGISTRY, stockReader).map((guide) => guide.id)).toContain("procurement.stock-locations");
    expect(visibleGuides(GUIDE_REGISTRY, reportReader).map((guide) => guide.id)).toContain("procurement.review-analytics");
    expect(visibleGuides(GUIDE_REGISTRY, settingsReader).map((guide) => guide.id)).toContain("procurement.configure-settings");
  });

  it("publishes C8 guides only inside the caller's import and export permissions", () => {
    const batchReader = [resolvePermissionKey(P.VIEW_IMPORT_BATCHES)];
    const templateReader = [resolvePermissionKey(P.VIEW_IMPORT_TEMPLATES)];
    const exportBuilder = [resolvePermissionKey(P.CREATE_EXPORT)];
    const exportReader = [resolvePermissionKey(P.VIEW_EXPORT_RUNS)];

    expect(visibleGuides(GUIDE_REGISTRY, batchReader).map((guide) => guide.id)).toContain("data.import-batch");
    expect(visibleGuides(GUIDE_REGISTRY, templateReader).map((guide) => guide.id)).toContain("data.import-templates");
    expect(visibleGuides(GUIDE_REGISTRY, exportBuilder).map((guide) => guide.id)).toContain("data.build-and-run-export");
    expect(visibleGuides(GUIDE_REGISTRY, exportReader).map((guide) => guide.id)).toContain("data.recover-import-export");
  });

  it("publishes C9 guides only inside the caller's audit and security permissions", () => {
    const auditReader = [resolvePermissionKey(P.VIEW_AUDIT)];
    const securityReader = [resolvePermissionKey(P.VIEW_AUDIT)];
    const exportReader = [resolvePermissionKey(P.EXPORT_AUDIT)];
    const ruleManager = [resolvePermissionKey(P.MANAGE_AUDIT)];

    expect(visibleGuides(GUIDE_REGISTRY, auditReader).map((guide) => guide.id)).toContain("audit.investigate-event");
    expect(visibleGuides(GUIDE_REGISTRY, securityReader).map((guide) => guide.id)).toContain("audit.review-security-operations");
    expect(visibleGuides(GUIDE_REGISTRY, exportReader).map((guide) => guide.id)).toContain("audit.export-and-compliance");
    expect(visibleGuides(GUIDE_REGISTRY, ruleManager).map((guide) => guide.id)).toContain("audit.export-and-compliance");
  });

  it("publishes C10 guides only inside the caller's platform operations permissions", () => {
    const healthReader = [resolvePermissionKey(P.VIEW_HEALTH)];
    const configReader = [resolvePermissionKey(P.VIEW_CONFIG_VALUES)];
    const notificationAdmin = [resolvePermissionKey(P.CONFIGURE_NOTIFICATION_TEMPLATES)];
    const integrationReader = [resolvePermissionKey(P.VIEW_INTEGRATION_SETTINGS)];

    expect(visibleGuides(GUIDE_REGISTRY, healthReader).map((guide) => guide.id)).toContain("platform.investigate-health");
    expect(visibleGuides(GUIDE_REGISTRY, configReader).map((guide) => guide.id)).toContain("platform.configure-platform");
    expect(visibleGuides(GUIDE_REGISTRY, notificationAdmin).map((guide) => guide.id)).toContain("platform.administer-notifications");
    expect(visibleGuides(GUIDE_REGISTRY, integrationReader).map((guide) => guide.id)).toContain("platform.manage-integrations");
  });

  it("chooses one focused landing layout for each filter state", () => {
    expect(guideLandingView({ category: null, audience: null, query: "" })).toBe("browse");
    expect(guideLandingView({ category: null, audience: "approver", query: "" })).toBe("audience-results");
    expect(guideLandingView({ category: null, audience: "approver", query: "approve" })).toBe("search-results");
    expect(guideLandingView({ category: "approvals-and-workflow", audience: "approver", query: "approve" })).toBe("category-results");
  });

  it("returns curated and recently reviewed records deterministically", () => {
    const visible = visibleGuides(GUIDE_REGISTRY, []);

    expect(featuredGuides(visible).map((guide) => guide.id)).toEqual([
      "getting-started.console-basics",
      "getting-started.activate-and-sign-in",
      "getting-started.reset-password",
      "tasks.create-and-complete",
      "workflow.review-and-act",
      "workflow.delegate-and-track",
    ]);
    expect(recentlyReviewedGuides(visible, 2).map((guide) => guide.id)).toEqual([
      "tasks.create-and-complete",
      "troubleshooting.prepare-support-ticket",
    ]);
  });
});
