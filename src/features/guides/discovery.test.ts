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
    ]);
    expect(guidesForAudience(visible, "finance-officer")).toEqual([]);
  });

  it("keeps draft guides out of normal discovery and availability counts", () => {
    const visible = visibleGuides(GUIDE_REGISTRY, []);

    expect(visible.every((guide) => guide.status === "published")).toBe(true);
    expect(visible.some((guide) => guide.id === "account.secure-account")).toBe(false);
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
    expect(recentlyReviewedGuides(visible, 2).map((guide) => guide.title)).toEqual([
      "Create, assign, and complete tasks",
      "Delegate and track approvals",
    ]);
  });
});
