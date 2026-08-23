import { describe, expect, it } from "vitest";

import type { ActionDef } from "@/lib/action-palette/types";
import { ACTIONS } from "@/lib/action-palette/registry";

import { buildGuideOperationsReport, guideFreshness } from "./operations";
import { GUIDE_REGISTRY } from "./registry";
import { GUIDE_COVERAGE_ROUTE_PATTERNS } from "./route-catalog";
import type { GuideRecord } from "./types";
import { WALKTHROUGH_REGISTRY } from "./walkthroughs/registry";
import { WALKTHROUGH_VERIFICATION_RECORDS } from "./walkthroughs/verification";

const baseGuide: GuideRecord = GUIDE_REGISTRY[0];
const action = (id: string, kind: "view" | "do" = "do"): ActionDef => ({
  id,
  label: id,
  aliases: [],
  console: "Main",
  group: "Test",
  kind,
  gate: null,
  run: { to: `/test/${id}` },
});

describe("guide operations reporting", () => {
  it("uses shorter review intervals for higher-risk guides", () => {
    const now = new Date("2026-04-15T12:00:00Z");
    expect(guideFreshness({ ...baseGuide, risk: "high", reviewedAt: "2026-01-01" }, now).status).toBe("stale");
    expect(guideFreshness({ ...baseGuide, risk: "medium", reviewedAt: "2026-01-01" }, now).status).toBe("current");
    expect(guideFreshness({ ...baseGuide, risk: "low", reviewedAt: "2026-01-01" }, now).status).toBe("current");
  });

  it("reports unmapped shipped routes and high-value actions", () => {
    const report = buildGuideOperationsReport({
      guides: [baseGuide],
      shippedRoutes: [baseGuide.routes[0], "/missing-screen"],
      actions: [action(baseGuide.actionIds![0]), action("missing-action"), action("view-only", "view")],
      walkthroughs: [],
      verificationRecords: [],
      now: new Date("2026-08-21T12:00:00Z"),
    });

    expect(report.routeGaps).toEqual([{ route: "/missing-screen" }]);
    expect(report.actionGaps).toEqual([{ actionId: "missing-action", label: "missing-action", destination: "/test/missing-action" }]);
    expect(report.actionCount).toBe(2);
  });

  it("reports broken relations through the registry validator", () => {
    const broken = [{ ...baseGuide, relatedGuideIds: ["missing-guide"] }] as GuideRecord[];
    const report = buildGuideOperationsReport({
      guides: broken,
      shippedRoutes: [baseGuide.routes[0]],
      actions: [],
      walkthroughs: [],
      verificationRecords: [],
      now: new Date("2026-08-21T12:00:00Z"),
    });

    expect(report.integrityIssues).toContainEqual(expect.objectContaining({ code: "missing-related-guide" }));
  });

  it("invalidates target verification when a walkthrough version changes", () => {
    const walkthrough = WALKTHROUGH_REGISTRY[0];
    const targetCount = new Set(walkthrough.steps.flatMap((step) => (
      "target" in step && step.target ? [step.target] : []
    ))).size;
    const report = buildGuideOperationsReport({
      guides: GUIDE_REGISTRY,
      shippedRoutes: [],
      actions: [],
      walkthroughs: [walkthrough],
      verificationRecords: [{
        walkthroughId: walkthrough.id,
        version: walkthrough.version - 1,
        verifiedAt: "2026-08-20",
        missingTargetIds: [],
      }],
      now: new Date("2026-08-21T12:00:00Z"),
    });

    expect(report.walkthroughTargetGaps).toHaveLength(targetCount);
    expect(report.walkthroughTargetGaps.every((gap) => gap.reason === "version-mismatch")).toBe(true);
  });

  it("reports targets that the latest verification could not find", () => {
    const walkthrough = WALKTHROUGH_REGISTRY[0];
    const report = buildGuideOperationsReport({
      guides: GUIDE_REGISTRY,
      shippedRoutes: [],
      actions: [],
      walkthroughs: [walkthrough],
      verificationRecords: [{
        walkthroughId: walkthrough.id,
        version: walkthrough.version,
        verifiedAt: "2026-08-21",
        missingTargetIds: ["header.workspace-search"],
      }],
      now: new Date("2026-08-21T12:00:00Z"),
    });

    expect(report.walkthroughTargetGaps).toEqual([expect.objectContaining({
      targetId: "header.workspace-search",
      reason: "target-not-found",
    })]);
  });

  it("keeps the production registry and walkthrough verification contract valid", () => {
    const report = buildGuideOperationsReport({
      guides: GUIDE_REGISTRY,
      shippedRoutes: GUIDE_COVERAGE_ROUTE_PATTERNS,
      actions: ACTIONS,
      walkthroughs: WALKTHROUGH_REGISTRY,
      verificationRecords: WALKTHROUGH_VERIFICATION_RECORDS,
      now: new Date("2026-08-21T12:00:00Z"),
    });

    expect(report.integrityIssues).toEqual([]);
    expect(report.actionGaps).toEqual([]);
    expect(report.routeGaps.filter(({ route }) => route.startsWith("/procurement"))).toEqual([]);
    expect(report.walkthroughTargetGaps).toEqual([]);
    expect(new Set(WALKTHROUGH_VERIFICATION_RECORDS.map((record) => record.walkthroughId)).size)
      .toBe(WALKTHROUGH_REGISTRY.length);
  });
});
