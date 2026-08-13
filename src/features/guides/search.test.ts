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
    expect(searchGuides(GUIDE_REGISTRY, "procurement officer")[0]?.guide.id).toBe(
      "procurement.complete-procure-to-pay",
    );
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
