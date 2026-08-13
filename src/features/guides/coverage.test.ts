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

  it("does not count a planned walkthrough ID as an implemented engine definition", () => {
    const targets: GuideCoverageTarget[] = [
      { id: "school-setup", route: "/school-management/create", risk: "high" },
    ];
    expect(buildGuideCoverageReport(
      GUIDE_REGISTRY,
      targets,
      new Set(WALKTHROUGH_REGISTRY.map((walkthrough) => walkthrough.id)),
    ).gaps).toEqual([{ targetId: "school-setup", kind: "missing-walkthrough-or-reason" }]);
  });
});
