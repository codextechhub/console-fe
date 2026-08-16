// The Finance half of the palette's coverage contract, mirroring
// procurement-registry.test.ts. Its point is drift: a screen added to the Finance
// sidebar without a matching action is reachable by clicking and invisible to
// typing, which is how the console accumulated unsearchable screens before.
//
// The Main console has no equivalent guard because its nav is inline JSX in
// app-sidebar.tsx rather than a data module - see the note at the end of
// docs/ACTION_PALETTE_CATALOG.md.

import { describe, expect, it } from "vitest";

import { filterActionsForPermissions } from "./gate";
import { ACTIONS } from "./registry";
import { financeNav } from "@/pages/protected/finance/finance-nav";

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
});
