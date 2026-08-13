import { describe, expect, it } from "vitest";

import { P, resolvePermissionKey } from "@/permissions";

import {
  canDiscoverGuide,
  featuredGuides,
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
      "account.secure-account",
      "troubleshooting.permission-denied",
    ]);
    expect(guidesForAudience(visible, "finance-officer")).toEqual([]);
  });

  it("returns curated and recently reviewed records deterministically", () => {
    const visible = visibleGuides(GUIDE_REGISTRY, []);

    expect(featuredGuides(visible).map((guide) => guide.id)).toEqual(["getting-started.console-basics"]);
    expect(recentlyReviewedGuides(visible, 2).map((guide) => guide.title)).toEqual([
      "Get started with Console",
      "Resolve permission denied or missing navigation",
    ]);
  });
});
