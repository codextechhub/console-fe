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
});
