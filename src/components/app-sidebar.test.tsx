// Characterization test for the Main sidebar: who sees which nav entries.
//
// Written against the pre-refactor component and kept unchanged across the move
// to a data module, so it proves the extraction did not alter visibility. Each
// profile holds a realistic slice of keys; the assertion is the exact nav tree,
// because a *missing* entry and an entry that *appeared* are both regressions
// and both silent.
//
// It captures what AppSidebar hands to NavMain rather than scraping the rendered
// DOM: only one group is expanded at a time, so the DOM shows almost no children
// and would "pass" while proving nothing.

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { P, resolvePermissionKey, type PermissionCode } from "@/permissions";

// usePermissions is a thin wrapper over a raw key array, so the array is the
// whole input to the component's gating.
let heldKeys: string[] = [];
vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    hasPermission: (c: PermissionCode) => heldKeys.includes(resolvePermissionKey(c)),
    hasAnyPermission: (...cs: PermissionCode[]) =>
      cs.some((c) => heldKeys.includes(resolvePermissionKey(c))),
    hasAllPermissions: (...cs: PermissionCode[]) =>
      cs.every((c) => heldKeys.includes(resolvePermissionKey(c))),
    hasModuleAccess: (...prefixes: string[]) =>
      heldKeys.some((k) => prefixes.some((p) => k.startsWith(p))),
  }),
}));

interface CapturedItem {
  title: string;
  url: string;
  isActive: boolean;
  childActive: boolean;
  affordance?: boolean;
  items?: { title: string; url: string; isActive: boolean }[];
}
let captured: CapturedItem[] = [];
vi.mock("./nav-main", () => ({
  NavMain: ({ items }: { items: CapturedItem[] }) => {
    captured = items;
    return null;
  },
}));

const { AppSidebar } = await import("./app-sidebar");
const { SidebarProvider } = await import("./ui/sidebar");

const keys = (...codes: PermissionCode[]) => codes.map(resolvePermissionKey);

let container: HTMLDivElement;
let root: Root;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  heldKeys = [];
  captured = [];
});

/**
 * Render for a permission profile and flatten the nav to "Parent" /
 * "Parent > Child" strings, in order. Leaves are marked so a group collapsing
 * into a leaf (or the reverse) shows up as a diff rather than passing silently.
 */
async function renderNav(held: string[], location = "/overview"): Promise<string[]> {
  heldKeys = held;
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[location]}>
        <SidebarProvider defaultOpen>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );
  });

  return captured.flatMap((item) => {
    const kind = item.items?.length ? "group" : "leaf";
    return [
      `${item.title} [${kind}]`,
      ...(item.items ?? []).map((child) => `${item.title} > ${child.title}`),
    ];
  });
}

describe("Main sidebar visibility", () => {
  it("shows only the ungated entries to a user with no permissions", async () => {
    expect(await renderNav([])).toMatchSnapshot();
  });

  it("shows the school-and-users profile", async () => {
    expect(await renderNav(keys(P.BROWSE_SCHOOLS, P.ACCESS_TEAM_PANEL))).toMatchSnapshot();
  });

  it("shows the RBAC administrator profile", async () => {
    expect(
      await renderNav(
        keys(P.VIEW_ROLES, P.MODIFY_ROLE, P.TRANSFER_SUPER_ADMIN, P.VIEW_PERMISSIONS),
      ),
    ).toMatchSnapshot();
  });

  it("shows a role viewer without the modify or transfer keys", async () => {
    expect(await renderNav(keys(P.VIEW_ROLES))).toMatchSnapshot();
  });

  it("shows the auditor profile", async () => {
    expect(await renderNav(keys(P.VIEW_AUDIT, P.EXPORT_AUDIT, P.MANAGE_AUDIT))).toMatchSnapshot();
  });

  it("shows an auditor without the export or manage keys", async () => {
    expect(await renderNav(keys(P.VIEW_AUDIT))).toMatchSnapshot();
  });

  // The two independent keys that open Health must each reveal only their own
  // screens - gating the group on one would hide the other holder's only screen.
  it("shows health telemetry alone", async () => {
    expect(await renderNav(keys(P.VIEW_HEALTH))).toMatchSnapshot();
  });

  it("shows payments webhooks alone", async () => {
    expect(await renderNav(keys(P.PAY_VIEW_UNATTRIBUTED_WEBHOOKS))).toMatchSnapshot();
  });

  // Notifications is a leaf without an admin key and a collapsible group with one.
  it("shows notifications as a group with an admin key", async () => {
    expect(await renderNav(keys(P.CONFIGURE_NOTIFICATION_TEMPLATES))).toMatchSnapshot();
  });

  // Console visibility is by raw key prefix, not a specific key.
  it("shows the finance console for any finance key", async () => {
    expect(await renderNav(["finance.report.view"])).toMatchSnapshot();
  });

  it("shows the finance console for a payments key", async () => {
    expect(await renderNav(["payments.payout.view"])).toMatchSnapshot();
  });

  it("shows the procurement console for any procurement key", async () => {
    expect(await renderNav(["procurement.requisition.view"])).toMatchSnapshot();
  });

  it("shows the export centre children by their own keys", async () => {
    expect(await renderNav(keys(P.VIEW_SAVED_EXPORTS, P.VIEW_EXPORT_RUNS))).toMatchSnapshot();
  });

  it("shows the workflow admin children by their own keys", async () => {
    expect(
      await renderNav(
        keys(P.VIEW_WORKFLOW_INSTANCES, P.VIEW_APPROVER_GROUPS, P.VIEW_WORKFLOW_TEMPLATES),
      ),
    ).toMatchSnapshot();
  });

  it("shows data imports children by their own keys", async () => {
    expect(await renderNav(keys(P.VIEW_IMPORT_BATCHES))).toMatchSnapshot();
  });

  it("shows organogram manage only with the manage key", async () => {
    expect(await renderNav(keys(P.MANAGE_ORGANOGRAM))).toMatchSnapshot();
  });

  it("shows settings for a security-settings holder", async () => {
    expect(await renderNav(keys(P.VIEW_SECURITY_SETTINGS))).toMatchSnapshot();
  });

  it("shows documents only with the requirements key", async () => {
    expect(await renderNav(keys(P.VIEW_REQUIREMENTS_DOCS))).toMatchSnapshot();
  });

  it("shows everything to a super admin", async () => {
    expect(await renderNav(SUPER_ADMIN)).toMatchSnapshot();
  });

  // Highlighting is part of the contract too: the extraction must keep deriving
  // isActive/childActive from the same routes.
  it.each([
    ["/overview"],
    ["/users/schools"],
    ["/roles/permission-groups"],
    ["/export/new"],
    ["/notifications/admin"],
    ["/support/guides"],
    ["/how-to-guide"],
    ["/finance/ledger"],
  ])("marks the active entry for %s", async (location) => {
    heldKeys = SUPER_ADMIN;
    await renderNav(SUPER_ADMIN, location);
    const active = captured.flatMap((item) => [
      ...(item.isActive ? [`${item.title} [isActive]`] : []),
      ...(item.childActive ? [`${item.title} [childActive]`] : []),
      ...(item.items ?? []).filter((c) => c.isActive).map((c) => `${item.title} > ${c.title}`),
    ]);
    expect(active).toMatchSnapshot();
  });
});

const SUPER_ADMIN = [
  ...keys(
    P.BROWSE_SCHOOLS, P.ACCESS_TEAM_PANEL, P.MANAGE_ORGANOGRAM, P.VIEW_ROLES,
    P.MODIFY_ROLE, P.TRANSFER_SUPER_ADMIN, P.VIEW_PERMISSIONS,
    P.VIEW_IMPORT_BATCHES, P.VIEW_IMPORT_TEMPLATES, P.VIEW_SAVED_EXPORTS,
    P.VIEW_EXPORT_RUNS, P.VIEW_WORKFLOW_INSTANCES, P.VIEW_APPROVER_GROUPS,
    P.VIEW_WORKFLOW_TEMPLATES, P.VIEW_AUDIT, P.EXPORT_AUDIT, P.MANAGE_AUDIT,
    P.VIEW_HEALTH, P.PAY_VIEW_UNATTRIBUTED_WEBHOOKS,
    P.AUDIT_NOTIFICATION_ACTIVITY, P.ENFORCE_NOTIFICATION_SETTINGS,
    P.CONFIGURE_NOTIFICATION_TEMPLATES, P.VIEW_CONFIG_VALUES,
    P.VIEW_REQUIREMENTS_DOCS, P.VIEW_GO_LIVE,
  ),
  "finance.report.view",
  "procurement.requisition.view",
];
