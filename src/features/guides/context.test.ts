import { describe, expect, it } from "vitest";

import { P, resolvePermissionKey } from "@/permissions";

import { GUIDE_REGISTRY } from "./registry";
import { GUIDE_ROUTE_PATTERNS } from "./route-catalog";
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

    const school = contextualGuideContext(GUIDE_REGISTRY, "/school-management/create", ["platform.schools.create"]);
    expect(school.guides.map((guide) => guide.id)).toEqual(["schools.create-and-configure"]);

    const schoolList = contextualGuideContext(GUIDE_REGISTRY, "/school-management", ["platform.schools.view"]);
    expect(schoolList.guides.map((guide) => guide.id)).toEqual(["schools.manage-schools-and-branches"]);

    const users = contextualGuideContext(GUIDE_REGISTRY, "/users/cx", ["platform.team.view"]);
    expect(users.guides.map((guide) => guide.id)).toEqual(["schools.invite-and-manage-users"]);

    const roleCreate = contextualGuideContext(GUIDE_REGISTRY, "/roles/create", [
      "platform.roles.view", "platform.roles.create", "platform.roles.assign",
    ]);
    expect(roleCreate.guides.map((guide) => guide.id)).toEqual(["roles.create-and-assign"]);

    const permissionCreate = contextualGuideContext(GUIDE_REGISTRY, "/permissions/create", ["platform.permissions.create"]);
    expect(permissionCreate.guides.map((guide) => guide.id)).toEqual(["roles.maintain-permission-catalogue"]);

    const organogramManage = contextualGuideContext(GUIDE_REGISTRY, "/organogram/manage", ["platform.organogram.manage"]);
    expect(organogramManage.guides.map((guide) => guide.id)).toEqual(["organogram.build-structure"]);

    const staffCreate = contextualGuideContext(GUIDE_REGISTRY, "/organogram/staff/create", ["platform.staff_profile.create"]);
    expect(staffCreate.guides.map((guide) => guide.id)).toEqual(["organogram.maintain-staff-profiles"]);

    const tasks = contextualGuideContext(GUIDE_REGISTRY, "/tasks", []);
    expect(tasks.guides.map((guide) => guide.id)).toEqual(["tasks.create-and-complete"]);

    const rfqs = contextualGuideContext(GUIDE_REGISTRY, "/procurement/sourcing/rfqs", ["procurement.rfq.view"]);
    expect(rfqs.guides.map((guide) => guide.id)).toEqual(["procurement.run-rfq-and-award"]);

    const contracts = contextualGuideContext(GUIDE_REGISTRY, "/procurement/contracts", ["procurement.contract.view"]);
    expect(contracts.guides.map((guide) => guide.id)).toEqual(["procurement.manage-contract-lifecycle"]);

    const requisitions = contextualGuideContext(GUIDE_REGISTRY, "/procurement/requisitions", ["procurement.requisition.view"]);
    expect(requisitions.guides.map((guide) => guide.id)).toEqual(["procurement.complete-procure-to-pay"]);

    const stock = contextualGuideContext(GUIDE_REGISTRY, "/procurement/inventory/items", ["procurement.stock.view"]);
    expect(stock.guides.map((guide) => guide.id)).toEqual(["procurement.stock-locations"]);

    const analytics = contextualGuideContext(GUIDE_REGISTRY, "/procurement/analytics/grir", ["procurement.report.view"]);
    expect(analytics.guides.map((guide) => guide.id)).toEqual(["procurement.review-analytics"]);

    const settings = contextualGuideContext(GUIDE_REGISTRY, "/procurement/settings/matching", ["procurement.settings.view"]);
    expect(settings.guides.map((guide) => guide.id)).toEqual(["procurement.configure-settings"]);

    const imports = contextualGuideContext(GUIDE_REGISTRY, "/data-imports/batches", [resolvePermissionKey(P.VIEW_IMPORT_BATCHES)]);
    expect(imports.guides.map((guide) => guide.id)).toContain("data.import-batch");

    const exportBuilder = contextualGuideContext(GUIDE_REGISTRY, "/export/new", [resolvePermissionKey(P.CREATE_EXPORT)]);
    expect(exportBuilder.guides.map((guide) => guide.id)).toContain("data.build-and-run-export");
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

  it("labels a screen for the reader, which is not always the wire value", () => {
    // `productArea` is displayed ("Guidance matched to ..."), so it is allowed to
    // read better than the API's vocabulary. The translation happens on the way out.
    expect(contextualGuideContext(GUIDE_REGISTRY, "/roles", []).productArea).toBe("Roles");
    expect(contextualGuideContext(GUIDE_REGISTRY, "/how-to-guide", []).productArea).toBe("Support");
    expect(contextualGuideContext(GUIDE_REGISTRY, "/forgot-password", []).productArea).toBe("Account access");
  });

  it("translates a display-only area to the spelling the API accepts", () => {
    // "Account access" is not one of the API's 19 values; "Account" is. Sending the
    // former fails the whole ticket create, not just the field.
    expect(buildSafeTicketContext(
      contextualGuideContext(GUIDE_REGISTRY, "/forgot-password", []),
    ).product_area).toBe("Account");
  });

  it("cannot produce a payload the ticket API would refuse, from any catalogued route", () => {
    // The guarantee that matters: every field is either absent or valid. A rejected
    // value takes the whole ticket with it, on a screen the user came to for help.
    const areas = new Set([
      "Account", "Audit and security", "Console", "Data imports", "Exports",
      "Finance", "Health", "Notifications", "Organogram", "Permissions",
      "Platform health", "Procurement", "Roles", "School management",
      "Settings", "Support", "Tasks", "Users", "Workflow",
    ]);
    for (const pattern of GUIDE_ROUTE_PATTERNS) {
      // Stand in a real id for each parameter, the way a live URL would.
      const pathname = pattern.replace(/:[^/]+/g, "4831");
      const ctx = buildSafeTicketContext(contextualGuideContext(GUIDE_REGISTRY, pathname, []));
      if (ctx.product_area !== undefined) {
        expect(areas.has(ctx.product_area), `${pattern} -> ${ctx.product_area}`).toBe(true);
      }
      if (ctx.route_pattern !== undefined) {
        expect(ctx.route_pattern, pattern).toMatch(/^\/[a-z_./:-]*$/);
        expect(ctx.route_pattern, pattern).not.toMatch(/[\d?#]/);
      }
      if (ctx.guide_id !== undefined) {
        expect(ctx.guide_id, pattern).toMatch(/^[a-z0-9][a-z0-9.-]{0,119}$/);
      }
    }
  });

  it("drops a route pattern that still carries an identifier", () => {
    // Belt and braces for the digit rule: if resolution ever hands back a raw URL,
    // the field is omitted rather than sent and refused.
    expect(buildSafeTicketContext({
      routePattern: "/finance/invoices/8842",
      productArea: "Finance",
      guides: [], troubleshooting: [], walkthroughs: [],
    })).toEqual({ product_area: "Finance" });
  });

  it("drops an unmappable area rather than guessing one", () => {
    expect(buildSafeTicketContext({
      routePattern: "/overview",
      productArea: "Something New",
      guides: [], troubleshooting: [], walkthroughs: [],
    })).toEqual({ route_pattern: "/overview" });
  });
});
