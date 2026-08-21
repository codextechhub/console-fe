import { describe, expect, it } from "vitest";

import { GUIDE_REGISTRY } from "../registry";
import { WALKTHROUGH_REGISTRY } from "./registry";
import {
  followingContentStep,
  loadWalkthroughProgress,
  saveWalkthroughProgress,
  validateWalkthroughs,
  walkthroughStepRoute,
  walkthroughStorageKey,
} from "./engine";

const walkthrough = WALKTHROUGH_REGISTRY[0];

describe("walkthrough engine", () => {
  it("keeps direct and proxy-session progress separate", () => {
    expect(walkthroughStorageKey("42:direct", walkthrough.id)).not.toBe(
      walkthroughStorageKey("42:proxy-9", walkthrough.id),
    );
  });

  it("invalidates stored progress when the walkthrough version changes", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    saveWalkthroughProgress(storage, "42:direct", {
      walkthroughId: walkthrough.id,
      guideId: walkthrough.guideId,
      version: walkthrough.version,
      currentStepId: "workspace-search",
      completedStepIds: ["welcome", "quick-actions"],
    });
    expect(loadWalkthroughProgress(storage, "42:direct", walkthrough)?.currentStepId).toBe("workspace-search");
    expect(loadWalkthroughProgress(storage, "42:direct", { ...walkthrough, version: walkthrough.version + 1 })).toBeNull();
  });

  it("branches around an unavailable optional page target", () => {
    expect(followingContentStep(walkthrough, "welcome", () => true)?.id).toBe("todays-focus");
    // Nothing on the page: the focus panel branch falls through to the quick
    // actions branch, which falls through again to a target that always exists.
    expect(followingContentStep(walkthrough, "welcome", () => false)?.id).toBe("workspace-search");
  });

  it("validates guide relations, routes, versions, steps, and branches", () => {
    expect(validateWalkthroughs(
      WALKTHROUGH_REGISTRY,
      new Set(GUIDE_REGISTRY.map((guide) => guide.id)),
    )).toEqual([]);
  });

  it("reports invalid guide and branch contracts", () => {
    expect(validateWalkthroughs([{
      ...walkthrough,
      guideId: "missing.guide",
      version: 0,
      route: "overview",
      steps: [{
        id: "broken-branch",
        kind: "branch",
        target: "missing.target",
        whenPresent: "missing-present-step",
        whenMissing: "missing-fallback-step",
      }],
    }], new Set())).toEqual([
      `Missing guide for ${walkthrough.id}`,
      `Invalid route for ${walkthrough.id}`,
      `Invalid version for ${walkthrough.id}`,
      `Invalid branch in ${walkthrough.id}:broken-branch`,
    ]);
  });

  it("rejects walkthrough step searches that are not URL search strings", () => {
    expect(validateWalkthroughs([{
      ...walkthrough,
      steps: [{
        id: "bad-search",
        title: "Bad search",
        body: "This search is missing its leading question mark.",
        search: "step=school",
        advance: "manual",
      }],
    }], new Set(GUIDE_REGISTRY.map((guide) => guide.id)))).toContain(
      `Invalid search in ${walkthrough.id}:bad-search`,
    );
  });

  it("rejects walkthrough step routes that are not absolute paths", () => {
    expect(validateWalkthroughs([{
      ...walkthrough,
      steps: [{
        id: "bad-route",
        title: "Bad route",
        body: "This route is not absolute.",
        route: "procurement/quotations",
        advance: "manual",
      }],
    }], new Set(GUIDE_REGISTRY.map((guide) => guide.id)))).toContain(
      `Invalid step route in ${walkthrough.id}:bad-route`,
    );
  });

  it("maps the sourcing walkthrough across RFQs and quotations", () => {
    const sourcing = WALKTHROUGH_REGISTRY.find(
      (item) => item.id === "walkthrough.procurement.run-rfq-and-award",
    );
    const quotationStep = sourcing?.steps.find((item) => item.id === "quotation-scope");

    expect(quotationStep).toMatchObject({
      route: "/procurement/sourcing/quotations",
      target: "procurement-quotations.heading",
    });
    expect(walkthroughStepRoute(sourcing!, "quotation-list")).toBe(
      "/procurement/sourcing/quotations",
    );
    expect(walkthroughStepRoute(sourcing!, "rfq-list")).toBe(
      "/procurement/sourcing/rfqs",
    );
  });

  it("maps the procure-to-pay walkthrough across its five source lists", () => {
    const p2p = WALKTHROUGH_REGISTRY.find(
      (item) => item.id === "walkthrough.procurement.complete-procure-to-pay",
    );

    expect(walkthroughStepRoute(p2p!, "requisition-list")).toBe("/procurement/requisitions");
    expect(walkthroughStepRoute(p2p!, "po-scope")).toBe("/procurement/purchase-orders");
    expect(walkthroughStepRoute(p2p!, "receipt-scope")).toBe("/procurement/goods-receipts");
    expect(walkthroughStepRoute(p2p!, "invoice-summary")).toBe("/procurement/vendor-invoices");
    expect(walkthroughStepRoute(p2p!, "payment-scope")).toBe("/procurement/vendor-payments");
  });

  it("maps the procurement settings walkthrough without opening save actions", () => {
    const settings = WALKTHROUGH_REGISTRY.find(
      (item) => item.id === "walkthrough.procurement.configure-settings",
    );

    expect(walkthroughStepRoute(settings!, "purchasing")).toBe("/procurement/settings/purchasing");
    expect(walkthroughStepRoute(settings!, "matching")).toBe("/procurement/settings/matching");
    expect(walkthroughStepRoute(settings!, "approvals")).toBe("/procurement/settings/approvals");
  });

  it("maps C8 walkthroughs across safe import and export screens", () => {
    const batch = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.data.import-batch");
    const templates = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.data.import-templates");
    const recovery = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.data.recover-import-export");

    expect(walkthroughStepRoute(batch!, "upload")).toBe("/data-imports/batches/new");
    expect(walkthroughStepRoute(templates!, "editor")).toBe("/data-imports/templates/new");
    expect(walkthroughStepRoute(recovery!, "queue")).toBe("/export/queues");
    expect(walkthroughStepRoute(recovery!, "files")).toBe("/export/files");
  });

  it("maps C9 walkthroughs across read-only audit and security screens", () => {
    const investigation = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.audit.investigate-event");
    const operations = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.audit.review-security-operations");
    const compliance = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.audit.export-and-compliance");

    expect(walkthroughStepRoute(investigation!, "entity-trails")).toBe("/audit/entity-trails");
    expect(walkthroughStepRoute(operations!, "attempts")).toBe("/audit/login-attempts");
    expect(walkthroughStepRoute(operations!, "proxy")).toBe("/audit/impersonations");
    expect(walkthroughStepRoute(compliance!, "builder")).toBe("/audit/exports/new");
    expect(walkthroughStepRoute(compliance!, "rule-form")).toBe("/audit/compliance-rules/create");
  });

  it("maps C10 walkthroughs across read-only platform operations screens", () => {
    const health = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.platform.investigate-health");
    const settings = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.platform.configure-platform");
    const notifications = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.platform.administer-notifications");
    const integrations = WALKTHROUGH_REGISTRY.find((item) => item.id === "walkthrough.platform.manage-integrations");

    expect(walkthroughStepRoute(health!, "jobs")).toBe("/health/jobs");
    expect(walkthroughStepRoute(health!, "slos")).toBe("/health/slos");
    expect(walkthroughStepRoute(settings!, "onboarding")).toBe("/settings/school-onboarding");
    expect(walkthroughStepRoute(notifications!, "new-template")).toBe("/notifications/admin/templates/new");
    expect(walkthroughStepRoute(integrations!, "connections")).toBe("/settings/integrations");
  });

  it("keeps the support-ticket walkthrough on evidence fields and before submit", () => {
    const ticket = WALKTHROUGH_REGISTRY.find(
      (item) => item.id === "walkthrough.troubleshooting.prepare-support-ticket",
    );

    expect(ticket?.route).toBe("/support/tickets/new");
    expect(ticket?.steps.flatMap((step) => (
      "target" in step && step.target ? [step.target] : []
    ))).toEqual([
      "support-ticket.issue",
      "support-ticket.classification",
      "support-ticket.attachments",
      "support-ticket.submit-boundary",
    ]);
    expect(ticket?.steps.filter((step) => "target" in step && step.target).every(
      (step) => "advance" in step && step.advance === "manual",
    )).toBe(true);
  });

  it("maps every school wizard explanation to its matching view and target", () => {
    const schoolWalkthrough = WALKTHROUGH_REGISTRY.find(
      (item) => item.id === "walkthrough.schools.create-and-configure",
    );
    const mappedSteps = schoolWalkthrough?.steps.flatMap((item) => (
      "search" in item && "target" in item
        ? [{ id: item.id, search: item.search, target: item.target }]
        : []
    ));

    expect(mappedSteps).toEqual([
      { id: "school-details", search: "?step=school", target: "school-create.school-details" },
      { id: "branches", search: "?step=branch", target: "school-create.branches" },
      { id: "school-admin", search: "?step=admin", target: "school-create.school-admin" },
      { id: "package-boundary", search: "?step=plan", target: "school-create.package" },
    ]);
  });
});
