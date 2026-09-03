/**
 * The sidebar's highlight rule: exactly one child row is the current page.
 *
 * The bug this guards: a child whose url is a prefix of a sibling's url stayed
 * lit on the sibling's route, so School Onboarding and Go-Live Requests were
 * both grey at once and the sidebar named two current pages.
 */

import { describe, expect, it } from "vitest";

import { buildMainNav, type NavGate } from "./main-nav";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";

const R = routesPath.PROTECTED;

/** A viewer who holds everything: the nav tree is then the whole declaration. */
const allowAll: NavGate = {
  hasPermission: () => true,
  hasAnyPermission: () => true,
  hasAllPermissions: () => true,
  hasModuleAccess: () => true,
};

const childrenOf = (title: string, location: string, gate: NavGate = allowAll) =>
  buildMainNav(gate, location).find((entry) => entry.title === title)?.items ?? [];

const litTitles = (title: string, location: string, gate: NavGate = allowAll) =>
  childrenOf(title, location, gate)
    .filter((child) => child.isActive)
    .map((child) => child.title);

describe("buildMainNav child highlighting", () => {
  it("lights only Go-Live Requests on the go-live route", () => {
    expect(litTitles("School Management", R.SCHOOL_MGT.GO_LIVE)).toEqual([
      "Go-Live Requests",
    ]);
  });

  it("lights School Onboarding on its own route", () => {
    expect(litTitles("School Management", R.SCHOOL_MGT.INDEX)).toEqual([
      "School Onboarding",
    ]);
  });

  it("keeps School Onboarding lit on the routes that hang off it", () => {
    expect(litTitles("School Management", R.SCHOOL_MGT.CREATE)).toEqual([
      "School Onboarding",
    ]);
    expect(litTitles("School Management", R.SCHOOL_MGT.VIEW("bright-star"))).toEqual([
      "School Onboarding",
    ]);
    expect(
      litTitles("School Management", R.SCHOOL_MGT.VIEW_BRANCH("bright-star", 4)),
    ).toEqual(["School Onboarding"]);
  });

  it("still lights the parent when a hidden sibling owns the deeper url", () => {
    // Without VIEW_GO_LIVE the Go-Live row is not rendered at all, so it must
    // not be allowed to unlight the row that is.
    const noGoLive: NavGate = {
      ...allowAll,
      hasPermission: (code) => code !== P.VIEW_GO_LIVE,
    };
    expect(litTitles("School Management", R.SCHOOL_MGT.INDEX, noGoLive)).toEqual([
      "School Onboarding",
    ]);
  });

  it("never lights two children of one group at once", () => {
    const routes = [
      R.SCHOOL_MGT.INDEX,
      R.SCHOOL_MGT.GO_LIVE,
      R.TEAM_MGT.CX,
      R.TEAM_MGT.SCHOOL,
      R.ORGANOGRAM.INDEX,
      R.ORGANOGRAM.MANAGE,
      R.ROLES.INDEX,
      R.ROLES.USER_ASSIGNMENTS,
      R.ROLES.CHANGE_REQUESTS,
      R.ROLES.TRANSFER_SUPER_ADMIN,
      R.PERMISSIONS.INDEX,
      R.PERMISSIONS.MODULES.INDEX,
      R.PERMISSIONS.RESOURCES.INDEX,
      R.PERMISSIONS.ACTIONS.INDEX,
      R.PERMISSIONS.DEPENDENCIES.INDEX,
      R.DATA_IMPORTS.BATCHES.INDEX,
      R.DATA_IMPORTS.TEMPLATES.INDEX,
      R.EXPORT.SAVED,
      R.EXPORT.FILES,
      R.EXPORT.QUEUES,
      R.WORKFLOW.APPROVALS,
      R.WORKFLOW.MY_SUBMISSIONS,
      R.WORKFLOW.DELEGATIONS,
      R.WORKFLOW.INSTANCES,
      R.WORKFLOW.TEAM_LOAD,
      R.WORKFLOW.APPROVER_GROUPS,
      R.WORKFLOW.TEMPLATES,
      R.AUDIT.DASHBOARD,
      R.AUDIT.EVENTS,
      R.AUDIT.SESSIONS,
      R.HEALTH.INDEX,
      R.HEALTH.UPTIME,
      R.NOTIFICATIONS,
      R.NOTIFICATIONS_ADMIN,
      R.SUPPORT.INDEX,
      R.SUPPORT.GUIDES,
      R.SUPPORT.GUIDE_ALIAS,
    ];

    for (const location of routes) {
      for (const entry of buildMainNav(allowAll, location)) {
        const lit = (entry.items ?? [])
          .filter((child) => child.isActive)
          .map((child) => child.title);
        expect(lit.length, `${entry.title} on ${location}: ${lit.join(", ")}`)
          .toBeLessThanOrEqual(1);
      }
    }
  });

  it("does not let one child claim a sibling that merely shares its prefix", () => {
    // `/users/cx` must not light on `/users/cx-archive`: the old rule was a bare
    // startsWith, which ignores segment boundaries.
    const lit = litTitles("Users", `${R.TEAM_MGT.CX}-archive`);
    expect(lit).not.toContain("CX Users");
  });
});
