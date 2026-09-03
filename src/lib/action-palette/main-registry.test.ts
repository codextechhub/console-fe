/**
 * Coverage for the Main-console screens that shipped after the palette did and
 * went unsearchable until now: the Export Centre beyond Queues, Approver Groups,
 * Provider Webhooks, How-to Guides, the Settings sections, the Notification
 * administration panels, and Create task.
 *
 * Each case pins the destination and asserts the gate both ways - a holder of the
 * key sees the action, a user with an unrelated key does not - because a wrong
 * gate is worse than a missing action: it offers a row that lands on a denied
 * page.
 */

import { describe, expect, it } from "vitest";

import { passesActionGate } from "./gate";
import { ACTIONS } from "./registry";
import { MAIN_NAV } from "@/components/main-nav";
import { P, resolvePermissionKey } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import type { ActionDef } from "./types";

const R = routesPath.PROTECTED;
const UNRELATED = [resolvePermissionKey(P.BROWSE_SCHOOLS)];

function byId(id: string): ActionDef {
  const action = ACTIONS.find((candidate) => candidate.id === id);
  if (!action) throw new Error(`Missing action: ${id}`);
  return action;
}

describe("Main-console actions added for post-palette screens", () => {
  it.each([
    ["view-saved-exports", R.EXPORT.SAVED, P.VIEW_SAVED_EXPORTS],
    ["create-export", R.EXPORT.NEW, P.CREATE_EXPORT],
    ["view-export-files", R.EXPORT.FILES, P.VIEW_EXPORT_RUNS],
    ["view-approver-groups", R.WORKFLOW.APPROVER_GROUPS, P.VIEW_APPROVER_GROUPS],
    ["view-provider-webhooks", R.HEALTH.PROVIDER_WEBHOOKS, P.PAY_VIEW_UNATTRIBUTED_WEBHOOKS],
    ["create-notification-template", R.NOTIFICATION_TEMPLATE_NEW, P.CONFIGURE_NOTIFICATION_TEMPLATES],
    ["view-notification-history", `${R.NOTIFICATIONS_ADMIN}?panel=history`, P.AUDIT_NOTIFICATION_ACTIVITY],
    ["view-notification-settings", `${R.NOTIFICATIONS_ADMIN}?panel=settings`, P.ENFORCE_NOTIFICATION_SETTINGS],
    ["view-notification-templates", `${R.NOTIFICATIONS_ADMIN}?panel=templates`, P.CONFIGURE_NOTIFICATION_TEMPLATES],
    ["view-settings-platform-profile", `${R.SETTINGS.INDEX}/platform-profile`, P.VIEW_CONFIG_VALUES],
    ["view-settings-school-onboarding", `${R.SETTINGS.INDEX}/school-onboarding`, P.VIEW_CONFIG_VALUES],
    ["view-settings-security", `${R.SETTINGS.INDEX}/security`, P.VIEW_SECURITY_SETTINGS],
    ["view-settings-integrations", `${R.SETTINGS.INDEX}/integrations`, P.VIEW_INTEGRATION_SETTINGS],
    ["view-settings-features", `${R.SETTINGS.INDEX}/features`, P.VIEW_CAPABILITIES],
    ["view-settings-audit", `${R.SETTINGS.INDEX}/audit`, P.VIEW_CONFIG_AUDIT],
    ["view-guide-coverage", R.SUPPORT.GUIDE_COVERAGE, P.VIEW_HEALTH],
  ])("%s lands on its screen and needs its key", (id, destination, permission) => {
    const action = byId(id);
    expect("to" in action.run && action.run.to).toBe(destination);
    expect(passesActionGate(action.gate, [resolvePermissionKey(permission)])).toBe(true);
    expect(passesActionGate(action.gate, UNRELATED)).toBe(false);
  });

  it("Advanced catalogue needs both config keys, not either", () => {
    const action = byId("view-settings-advanced");
    expect("to" in action.run && action.run.to).toBe(`${R.SETTINGS.INDEX}/advanced`);
    expect(passesActionGate(action.gate, [resolvePermissionKey(P.VIEW_CONFIG_DEFINITIONS)])).toBe(false);
    expect(passesActionGate(action.gate, [
      resolvePermissionKey(P.VIEW_CONFIG_DEFINITIONS),
      resolvePermissionKey(P.VIEW_CONFIG_VALUES),
    ])).toBe(true);
  });

  it.each([
    ["view-notification-event-types", `${R.NOTIFICATIONS_ADMIN}?panel=events`],
    ["view-settings-administration", `${R.SETTINGS.INDEX}/administration`],
  ])("%s rides the page's own any-of gate", (id, destination) => {
    const action = byId(id);
    expect("to" in action.run && action.run.to).toBe(destination);
    // Readable by any one of the page's keys, and by none outside them.
    expect(passesActionGate(action.gate, UNRELATED)).toBe(false);
    expect(action.gate && "any" in action.gate && action.gate.any.length).toBeGreaterThan(1);
    for (const key of (action.gate as { any: typeof P.VIEW_CONFIG_AUDIT[] }).any) {
      expect(passesActionGate(action.gate, [resolvePermissionKey(key)])).toBe(true);
    }
  });

  it("Settings is findable by every key that opens it from the nav", () => {
    // A gate omitting these two lets their holders reach Settings by clicking
    // and never by typing.
    const action = byId("view-settings");
    for (const key of [P.VIEW_SECURITY_SETTINGS, P.VIEW_INTEGRATION_SETTINGS]) {
      expect(passesActionGate(action.gate, [resolvePermissionKey(key)])).toBe(true);
    }
  });

  it.each([
    ["view-how-to-guides", R.SUPPORT.GUIDES],
    ["create-task", `${R.TODO.INDEX}?action=new`],
  ])("%s is ungated - everyone has it", (id, destination) => {
    const action = byId(id);
    expect("to" in action.run && action.run.to).toBe(destination);
    expect(action.gate).toBeNull();
  });

  it("keeps action ids unique - popularity storage is keyed on them", () => {
    const ids = ACTIONS.map((action) => action.id);
    expect(ids).toHaveLength(new Set(ids).size);
  });
});

// The drift guard. Procurement and Finance already have one; Main could not have
// one until its nav became data (src/components/main-nav.ts), which is exactly
// why Main was the console that accumulated unsearchable screens. Adding a screen
// to the sidebar without an action now fails here instead of going unnoticed.
describe("Main sidebar coverage", () => {
  it("gives every Main sidebar destination an action", () => {
    // Kind-agnostic on purpose: the question is whether typing can reach the
    // screen, and some Main entries are served by a `do` action rather than a
    // list view (Manage organogram, Transfer super admin).
    const reachable = new Set(
      ACTIONS.flatMap((action) => ("to" in action.run ? [action.run.to] : [])),
    );

    // A group's own url is a pointer to its first child rather than a screen of
    // its own, so only leaves and children need an action of their own.
    const navDestinations = MAIN_NAV.flatMap((entry) =>
      entry.items?.length
        ? entry.items.map((child) => child.url)
        : [entry.url],
    );

    expect(navDestinations.filter((url) => !reachable.has(url))).toEqual([]);
  });
});
