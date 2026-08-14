import { describe, expect, it } from "vitest";

import { GUIDE_REGISTRY } from "../registry";
import { WALKTHROUGH_REGISTRY } from "./registry";
import {
  followingContentStep,
  loadWalkthroughProgress,
  saveWalkthroughProgress,
  validateWalkthroughs,
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
    expect(loadWalkthroughProgress(storage, "42:direct", { ...walkthrough, version: 2 })).toBeNull();
  });

  it("branches around an unavailable optional page target", () => {
    expect(followingContentStep(walkthrough, "welcome", () => true)?.id).toBe("quick-actions");
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
