import { describe, expect, it } from "vitest";

import { GUIDE_REGISTRY } from "./registry";
import {
  buildSafeTicketContext,
  contextualGuideContext,
  resolveGuideRoutePattern,
  routePatternMatches,
} from "./context";

describe("contextual guides", () => {
  it("matches dynamic route patterns without retaining record identifiers", () => {
    expect(routePatternMatches("/support/tickets/:id", "/support/tickets/4831")).toBe(true);
    expect(resolveGuideRoutePattern("/support/tickets/4831?tab=activity")).toBe("/support/tickets/:id");
  });

  it("returns only permitted guides mapped to the current screen", () => {
    const overview = contextualGuideContext(GUIDE_REGISTRY, "/overview", []);
    expect(overview.guides.map((guide) => guide.id)).toEqual(["getting-started.console-basics"]);

    const school = contextualGuideContext(GUIDE_REGISTRY, "/school-management/create", []);
    expect(school.guides).toEqual([]);
  });

  it("resolves the current article by slug", () => {
    const context = contextualGuideContext(
      GUIDE_REGISTRY,
      "/support/guides/get-started-with-console",
      [],
    );
    expect(context.guides[0]?.id).toBe("getting-started.console-basics");
  });

  it("includes published troubleshooting related by the page guide", () => {
    const published = GUIDE_REGISTRY.map((guide) => (
      guide.id === "troubleshooting.permission-denied"
        ? { ...guide, status: "published" as const, article: GUIDE_REGISTRY[0].article }
        : guide
    ));
    const context = contextualGuideContext(published, "/overview", []);
    expect(context.troubleshooting.map((guide) => guide.id)).toEqual([
      "troubleshooting.permission-denied",
    ]);
  });

  it("builds an allowlisted ticket context from patterns, never the live URL", () => {
    const context = contextualGuideContext(GUIDE_REGISTRY, "/support/tickets/4831", []);
    expect(buildSafeTicketContext(context)).toEqual({
      route_pattern: "/support/tickets/:id",
      product_area: "Support",
    });
    expect(buildSafeTicketContext(
      contextualGuideContext(GUIDE_REGISTRY, "/overview", []),
    )).toMatchObject({
      guide_id: "getting-started.console-basics",
      route_pattern: "/overview",
      product_area: "Console",
    });
  });

  it("uses backend-approved product-area labels for every catalogued route", () => {
    expect(contextualGuideContext(GUIDE_REGISTRY, "/roles", []).productArea).toBe("Roles");
    expect(contextualGuideContext(GUIDE_REGISTRY, "/how-to-guide", []).productArea).toBe("Support");
  });
});
