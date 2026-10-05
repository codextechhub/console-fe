/**
 * The Finance half of the palette's coverage contract, mirroring
 * procurement-registry.test.ts. Its point is drift: a screen added to the Finance
 * sidebar without a matching action is reachable by clicking and invisible to
 * typing, which is how the console accumulated unsearchable screens before.
 *
 * The Main console has no equivalent guard because its nav is inline JSX in
 * app-sidebar.tsx rather than a data module - see the note at the end of
 * docs/ACTION_PALETTE_CATALOG.md.
 */

import { describe, expect, it } from "vitest";

import { filterActionsForPermissions } from "./gate";
import { ACTIONS } from "./registry";
import { BACKEND_KEY_CATALOGUE } from "@xvs/finance/backend-key-catalogue";
import type { ConsoleNavGroup } from "@/components/finance-ui/console-nav";
import type { ActionDef } from "./types";
import { financeNav } from "@/pages/protected/finance/finance-nav";
import { P, resolvePermissionKey } from "@/permissions";
import { financeRoutes } from "@/routes/protected/finance-routes";
import { scoreAction } from "./match";

const financeActions = ACTIONS.filter((action) => action.console === "Finance");

/**
 * Every "View ..." action for a menu screen must show exactly when the menu
 * shows that screen: for each key that opens the screen, and never for a
 * reader holding every other key in the catalogue. Returns the mismatches.
 */
function gateMismatches(nav: ConsoleNavGroup[], actions: ActionDef[]): string[] {
  const visible = (id: string, keys: readonly string[]) =>
    filterActionsForPermissions(actions, keys).some((action) => action.id === id);
  const problems: string[] = [];
  for (const entry of nav.flatMap((g) => g.items.flatMap((i) => (i.children?.length ? i.children : [i])))) {
    if (!entry.permissions?.length) continue;
    const action = actions.find((a) => a.kind === "view" && "to" in a.run && a.run.to === entry.url);
    if (!action) continue;
    const keys = entry.permissions.map((code) => resolvePermissionKey(code));
    for (const key of keys) {
      if (!visible(action.id, [key])) problems.push(`${action.id} hidden from ${key}, which opens ${entry.title}`);
    }
    if (visible(action.id, BACKEND_KEY_CATALOGUE.filter((key) => !keys.includes(key)))) {
      problems.push(`${action.id} shown without ${keys.join(" or ")}, which ${entry.title} needs`);
    }
  }
  return problems;
}

describe("Finance action-palette destinations", () => {
  it("shows each screen's view action exactly when the menu shows the screen", () => {
    expect(gateMismatches(financeNav, financeActions)).toEqual([]);
  });

  it("covers every Finance sidebar destination", () => {
    const viewDestinations = new Set(
      financeActions.flatMap((action) =>
        action.kind === "view" && "to" in action.run ? [action.run.to] : [],
      ),
    );
    const navDestinations = financeNav.flatMap((group) =>
      group.items.flatMap((item) => [
        item.url,
        ...(item.children ?? []).map((child) => child.url),
      ]),
    );

    expect(navDestinations.filter((url) => !viewDestinations.has(url))).toEqual([]);
  });

  it("gates every Finance action - none is visible without permissions", () => {
    expect(filterActionsForPermissions(financeActions, [])).toEqual([]);
  });

  it("opens direct journal entry only for its immediate-post permission", () => {
    const direct = (permissions: readonly string[]) => filterActionsForPermissions(financeActions, permissions)
      .some((action) => action.id === "new-journal-entry");

    expect(direct([resolvePermissionKey(P.FIN_POST_DIRECT_ENTRY)])).toBe(true);
    expect(direct([resolvePermissionKey(P.FIN_SUBMIT_JOURNAL)])).toBe(false);
  });

  it("offers payment-plan creation only when create and activate are both allowed", () => {
    const visible = (permissions: readonly string[]) => filterActionsForPermissions(financeActions, permissions)
      .some((action) => action.id === "create-payment-plan");

    expect(visible([resolvePermissionKey(P.FIN_CREATE_PAYMENT_PLAN)])).toBe(false);
    expect(visible([resolvePermissionKey(P.FIN_ACTIVATE_PAYMENT_PLAN)])).toBe(false);
    expect(visible([
      resolvePermissionKey(P.FIN_CREATE_PAYMENT_PLAN),
      resolvePermissionKey(P.FIN_ACTIVATE_PAYMENT_PLAN),
    ])).toBe(true);
  });
});

/**
 * Screens the Finance console serves at their own address but does not list in
 * its sidebar: four Settings sections and the close workbench. The coverage
 * test above cannot see them, so each is pinned here to its address, its gate,
 * and the words a bursar types for it.
 */
describe("Finance screens outside the sidebar", () => {
  const key = (code: Parameters<typeof resolvePermissionKey>[0]) => resolvePermissionKey(code);
  const shown = (id: string, keys: readonly string[]) =>
    filterActionsForPermissions(financeActions, keys).some((action) => action.id === id);
  const destination = (id: string) => {
    const action = financeActions.find((candidate) => candidate.id === id);
    return action && "to" in action.run ? action.run.to : undefined;
  };
  const mounted = new Set(
    (financeRoutes[0].children ?? []).flatMap((route) => (route.path ? [route.path] : [])),
  );

  const SECTIONS = {
    "view-finance-settings-receivables": "/finance/settings/receivables",
    "view-finance-settings-payroll": "/finance/settings/payroll",
    "view-finance-record-keeping": "/finance/settings/fiscal-calendar",
    "view-online-payment-settings": "/finance/settings/banking-cash",
    "view-periods-and-close": "/finance/reports/periods",
  };

  it("opens each at an address the console mounts", () => {
    for (const [id, to] of Object.entries(SECTIONS)) {
      expect(destination(id), id).toBe(to);
      expect(mounted.has(to), to).toBe(true);
    }
  });

  it("gates each settings section on the finance settings key", () => {
    for (const id of [
      "view-finance-settings-receivables",
      "view-finance-settings-payroll",
      "view-finance-record-keeping",
    ]) {
      expect(shown(id, [key(P.FIN_VIEW_SETTINGS)]), id).toBe(true);
      expect(shown(id, [key(P.FIN_UPDATE_SETTINGS)]), id).toBe(false);
    }
  });

  it("needs both settings keys for online payments", () => {
    const id = "view-online-payment-settings";
    expect(shown(id, [key(P.FIN_VIEW_SETTINGS)])).toBe(false);
    expect(shown(id, [key(P.PAY_VIEW_PAYMENT_SETTINGS)])).toBe(false);
    expect(shown(id, [key(P.FIN_VIEW_SETTINGS), key(P.PAY_VIEW_PAYMENT_SETTINGS)])).toBe(true);
  });

  it("gates the close workbench on the periods key", () => {
    expect(shown("view-periods-and-close", [key(P.FIN_VIEW_PERIODS)])).toBe(true);
    expect(shown("view-periods-and-close", [key(P.FIN_VIEW_REPORTS)])).toBe(false);
  });

  it.each([
    ["provision bands", "view-finance-settings-receivables"],
    ["paye method", "view-finance-settings-payroll"],
    ["retention", "view-finance-record-keeping"],
    ["held or direct", "view-online-payment-settings"],
    ["close the month", "view-periods-and-close"],
    ["reduce float", "view-petty-cash"],
    ["owner capital", "view-bank-accounts"],
    ["earlier pay", "view-payroll"],
    ["annual paye return", "view-tax-remittance"],
    ["reopen year", "view-fiscal-periods"],
    ["book settlement", "view-settlement"],
    ["payer links", "view-customers"],
  ])("finds %s as %s", (query, id) => {
    const action = financeActions.find((candidate) => candidate.id === id);
    expect(action, id).toBeDefined();
    expect(scoreAction(action!, query), query).toBeTruthy();
  });

  it("keeps the finance payroll settings apart from the Main console's payroll scope", () => {
    const labels = ACTIONS.map((action) => action.label.toLowerCase());
    expect(labels.filter((label) => label === "view finance payroll settings")).toHaveLength(1);
    expect(ACTIONS.find((action) => action.id === "view-settings-payroll")?.console).toBe("Main");
  });
});
