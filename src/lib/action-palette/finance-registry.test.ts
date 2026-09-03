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
import { financeNav } from "@/pages/protected/finance/finance-nav";
import { P, resolvePermissionKey } from "@/permissions";

const financeActions = ACTIONS.filter((action) => action.console === "Finance");

describe("Finance action-palette destinations", () => {
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
