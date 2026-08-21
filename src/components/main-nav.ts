// The Main console's sidebar, as data.
//
// Finance and Procurement already declare their sidebars this way
// (finance-nav.ts, procurement-nav.ts), which is what lets a test assert that
// every nav destination has an action-palette entry. Main used to build its
// items inline inside app-sidebar.tsx, mixed with permission calls and the
// current URL, so nothing could read it - and it drifted: screens shipped into
// the nav that the palette could not find. This module exists so the same guard
// covers all three consoles (see main-registry.test.ts).
//
// Two rules keep the declaration honest:
//
//   * **One `match` per entry, not two active flags.** A leaf highlights itself
//     (`isActive`); a group highlights its parent row because a child is open
//     (`childActive`). Which one applies follows from whether the entry renders
//     as a group, so the declaration states the route rule once and `buildMainNav`
//     assigns it. Children default to a prefix match on their own url and only
//     declare `match` when that is wrong (exact matches, and sections that must
//     exclude a sibling's prefix).
//   * **Gates are fields, not control flow.** Entry-level `permission` decides
//     whether the entry appears at all; a child's `permission` decides that child.
//     `modulePrefixes` gates by raw backend key prefix, for whole-console entries
//     where one specific key would be too narrow.
//
// ── Adding a destination touches four other places ───────────────────────────
//
// None of them is optional and none of them announces itself: each is enforced
// by a different test, so the first you hear of the list is three unrelated
// failures. Written down here because this file is where you start.
//
//   1. `lib/action-palette/registry.ts` - an action for the new destination.
//      `main-registry.test.ts` asserts every Main nav destination has one, so
//      the palette can never fall behind the sidebar.
//   2. `features/guides/route-catalog.ts` - the route, or any guide that maps
//      to it fails validation as an unknown product route.
//   3. The guide record in `features/guides/registry.ts` - add the route to
//      `routes` and the action to `actionIds`, or contextual help on the new
//      screen offers nothing.
//   4. `components/__snapshots__/app-sidebar.test.tsx.snap` - review the diff
//      before updating. A gated child that does NOT appear for a profile is
//      the assertion working, not a snapshot to be overwritten.

import type { ElementType } from "react";
import {
  Bell, ClipboardCheck, FileOutput, Headset, HeartPulse, Landmark, Library,
  Network, Settings, Shield, ShoppingCart, Workflow,
} from "lucide-react";
import {
  HomeIcon, SchoolIcon, TeamMgtIcon, RolesIcon, PermissionsIcon, DataImportsIcon,
} from "@/assets/navbar-svg";
import { P, type PermissionCode } from "@/permissions";
import { routesPath } from "@/routes/routes-path";

const R = routesPath.PROTECTED;

// First path segment of a route, e.g. "/workflow/approvals" → "/workflow".
// Group-level matching derives its prefix from a real routesPath constant via
// this, so renaming a path propagates here instead of silently breaking
// highlighting against a stale literal.
const moduleRoot = (path: string) => "/" + path.split("/")[1];

export type NavPermission = PermissionCode | PermissionCode[] | null;

/** Evaluated against usePermissions(). `null`/absent = always visible. */
export interface NavGate {
  hasPermission: (code: PermissionCode) => boolean;
  hasAnyPermission: (...codes: PermissionCode[]) => boolean;
  hasAllPermissions: (...codes: PermissionCode[]) => boolean;
  hasModuleAccess: (...prefixes: string[]) => boolean;
}

export interface MainNavChild {
  title: string;
  url: string;
  /** Highlight rule. Defaults to a prefix match on `url`. */
  match?: (location: string) => boolean;
  permission?: NavPermission;
  permissionMode?: "any" | "all";
}

export interface MainNavEntry {
  title: string;
  url: string;
  icon: ElementType;
  /** Highlight rule - becomes `isActive` on a leaf, `childActive` on a group. */
  match: (location: string) => boolean;
  permission?: NavPermission;
  permissionMode?: "any" | "all";
  /** Whole-console visibility by raw backend key prefix. */
  modulePrefixes?: string[];
  /** Leaf items that open a separate console show a trailing chevron. */
  affordance?: boolean;
  items?: MainNavChild[];
  /**
   * Renders as a collapsible group only when this gate passes; otherwise it is a
   * leaf pointing at its own url. Notifications alone needs this: everyone gets
   * the inbox as a plain entry, and only a communication admin gets Inbox +
   * Administration as a group. Note this is NOT "collapse when there is one
   * child" - Data Imports legitimately renders as a group with a single child.
   */
  groupWhen?: NavPermission;
}

/** The shape NavMain consumes. */
export interface BuiltNavItem {
  title: string;
  url: string;
  icon?: ElementType;
  isActive: boolean;
  childActive: boolean;
  affordance?: boolean;
  items?: { title: string; url: string; isActive: boolean }[];
}

export const MAIN_NAV: MainNavEntry[] = [
  {
    title: "Home",
    url: R.OVERVIEW.INDEX,
    icon: HomeIcon,
    match: (l) => l.startsWith(R.OVERVIEW.INDEX),
  },
  {
    title: "School Management",
    url: R.SCHOOL_MGT.INDEX,
    icon: SchoolIcon,
    match: (l) => l.startsWith(R.SCHOOL_MGT.INDEX),
    permission: P.BROWSE_SCHOOLS,
    items: [
      { title: "School Onboarding", url: R.SCHOOL_MGT.INDEX },
      { title: "Go-Live Requests", url: R.SCHOOL_MGT.GO_LIVE, permission: P.VIEW_GO_LIVE },
    ],
  },
  {
    title: "Users",
    url: R.TEAM_MGT.INDEX,
    icon: TeamMgtIcon,
    match: (l) =>
      l.startsWith(R.TEAM_MGT.CX) ||
      l.startsWith(R.TEAM_MGT.SCHOOL) ||
      l === R.TEAM_MGT.LEGACY,
    permission: P.ACCESS_TEAM_PANEL,
    items: [
      { title: "CX Users", url: R.TEAM_MGT.CX },
      { title: "School Users", url: R.TEAM_MGT.SCHOOL },
    ],
  },
  {
    title: "Organogram",
    url: R.ORGANOGRAM.INDEX,
    icon: Network,
    match: (l) => l.startsWith(R.ORGANOGRAM.INDEX),
    items: [
      // Staff Directory retired - profiles are reached from Team Management
      // (View Details) or by clicking a person in the org chart.
      { title: "Org Chart", url: R.ORGANOGRAM.INDEX, match: (l) => l === R.ORGANOGRAM.INDEX },
      // Manage - structural CRUD, gated by its own manage permission.
      { title: "Manage", url: R.ORGANOGRAM.MANAGE, permission: P.MANAGE_ORGANOGRAM },
    ],
  },
  {
    // Tasks - Org Accountability. Gated to CX staff (every console user) at the
    // API layer; what each person sees is bounded by the organogram server-side,
    // so the nav item itself carries no extra RBAC gate.
    title: "Tasks",
    url: R.TODO.INDEX,
    icon: ClipboardCheck,
    match: (l) => l.startsWith(R.TODO.INDEX),
  },
  {
    title: "Roles",
    url: R.ROLES.INDEX,
    icon: RolesIcon,
    match: (l) => l.startsWith(R.ROLES.INDEX) && !l.startsWith(R.ROLES.GROUPS.INDEX),
    permission: P.VIEW_ROLES,
    items: [
      {
        title: "Platform Roles",
        url: R.ROLES.INDEX,
        match: (l) =>
          l === R.ROLES.INDEX ||
          (l.startsWith(R.ROLES.INDEX + "/") &&
            !l.startsWith(R.ROLES.GROUPS.INDEX) &&
            !l.startsWith(R.ROLES.USER_ASSIGNMENTS) &&
            !l.startsWith(R.ROLES.CHANGE_REQUESTS) &&
            !l.startsWith(R.ROLES.TRANSFER_SUPER_ADMIN)),
      },
      { title: "Platform User Assignments", url: R.ROLES.USER_ASSIGNMENTS },
      // Change Requests - only shown to users who can act on role change
      // proposals (the backend list endpoint enforces the same).
      { title: "Change Requests", url: R.ROLES.CHANGE_REQUESTS, permission: P.MODIFY_ROLE },
      // Transfer Super Admin - only shown to users who hold the
      // platform.roles.transfer permission. The backend further restricts
      // execution to the active super admin.
      { title: "Transfer Super Admin", url: R.ROLES.TRANSFER_SUPER_ADMIN, permission: P.TRANSFER_SUPER_ADMIN },
    ],
  },
  {
    title: "Permissions",
    url: R.PERMISSIONS.INDEX,
    icon: PermissionsIcon,
    match: (l) => l.startsWith(R.PERMISSIONS.INDEX) || l.startsWith(R.ROLES.GROUPS.INDEX),
    permission: P.VIEW_PERMISSIONS,
    items: [
      {
        title: "All Permissions",
        url: R.PERMISSIONS.INDEX,
        match: (l) =>
          l === R.PERMISSIONS.INDEX ||
          (l.startsWith(R.PERMISSIONS.INDEX + "/") &&
            !l.startsWith(R.PERMISSIONS.MODULES.INDEX) &&
            !l.startsWith(R.PERMISSIONS.RESOURCES.INDEX) &&
            !l.startsWith(R.PERMISSIONS.ACTIONS.INDEX) &&
            !l.startsWith(R.PERMISSIONS.DEPENDENCIES.INDEX)),
      },
      { title: "Modules", url: R.PERMISSIONS.MODULES.INDEX },
      { title: "Resources", url: R.PERMISSIONS.RESOURCES.INDEX },
      { title: "Actions", url: R.PERMISSIONS.ACTIONS.INDEX },
      { title: "Dependencies", url: R.PERMISSIONS.DEPENDENCIES.INDEX },
      { title: "Permission Groups", url: R.ROLES.GROUPS.INDEX },
    ],
  },
  {
    title: "Data Imports",
    url: R.DATA_IMPORTS.BATCHES.INDEX,
    icon: DataImportsIcon,
    match: (l) => l.startsWith(moduleRoot(R.DATA_IMPORTS.BATCHES.INDEX)),
    permission: [P.VIEW_IMPORT_BATCHES, P.VIEW_IMPORT_TEMPLATES],
    items: [
      { title: "Import Batches", url: R.DATA_IMPORTS.BATCHES.INDEX, permission: P.VIEW_IMPORT_BATCHES },
      { title: "Import Templates", url: R.DATA_IMPORTS.TEMPLATES.INDEX, permission: P.VIEW_IMPORT_TEMPLATES },
    ],
  },
  {
    // Export Centre. Anyone can see their own queues (the backend gates at
    // IsAuthenticatedAndActive), so the group itself is ungated; Exports and
    // Files carry their own keys.
    title: "Data Exports",
    url: R.EXPORT.QUEUES,
    icon: FileOutput,
    match: (l) => l.startsWith(moduleRoot(R.EXPORT.QUEUES)),
    items: [
      {
        title: "Exports",
        url: R.EXPORT.SAVED,
        permission: P.VIEW_SAVED_EXPORTS,
        // The builder lives under its own paths, but belongs to this entry.
        match: (l) =>
          l.startsWith(R.EXPORT.SAVED) ||
          l.startsWith(R.EXPORT.NEW) ||
          /^\/export\/\d+\/edit/.test(l),
      },
      {
        title: "Files",
        url: R.EXPORT.FILES,
        permission: P.VIEW_EXPORT_RUNS,
        match: (l) => l.startsWith(R.EXPORT.FILES) || l.startsWith("/export/runs"),
      },
      { title: "View Queues", url: R.EXPORT.QUEUES },
    ],
  },
  // Finance & Operations: two separate consoles, each opening its own
  // sub-navigated console (see ConsoleShell). Top-level leaves, matching the
  // app's flat sidebar (no group headers). Each navigates away, so it carries an
  // open-affordance chevron.
  {
    title: "Finance",
    url: R.FINANCE.INDEX,
    icon: Landmark,
    match: (l) => l.startsWith(moduleRoot(R.FINANCE.INDEX)),
    modulePrefixes: ["finance.", "payments."],
    affordance: true,
  },
  {
    title: "Procurement",
    url: R.PROCUREMENT.INDEX,
    icon: ShoppingCart,
    match: (l) => l.startsWith(moduleRoot(R.PROCUREMENT.INDEX)),
    modulePrefixes: ["procurement."],
    affordance: true,
  },
  {
    // Approvals, submissions and delegations are open to any authenticated user
    // (the backend gates them at IsAuthenticatedAndActive), so the group itself
    // is always visible. Admin-only children carry their own keys.
    title: "Workflow",
    url: R.WORKFLOW.APPROVALS,
    icon: Workflow,
    match: (l) => l.startsWith(moduleRoot(R.WORKFLOW.APPROVALS)),
    items: [
      { title: "Approvals", url: R.WORKFLOW.APPROVALS },
      { title: "My Submissions", url: R.WORKFLOW.MY_SUBMISSIONS },
      { title: "Delegations", url: R.WORKFLOW.DELEGATIONS },
      // All Instances + Team Load - admin monitoring, gated by view permission.
      { title: "All Instances", url: R.WORKFLOW.INSTANCES, permission: P.VIEW_WORKFLOW_INSTANCES },
      { title: "Team Load", url: R.WORKFLOW.TEAM_LOAD, permission: P.VIEW_WORKFLOW_INSTANCES },
      // Approver groups - the named pools stages route to.
      { title: "Approver Groups", url: R.WORKFLOW.APPROVER_GROUPS, permission: P.VIEW_APPROVER_GROUPS },
      { title: "Templates", url: R.WORKFLOW.TEMPLATES, permission: P.VIEW_WORKFLOW_TEMPLATES },
    ],
  },
  {
    title: "Audit & Security",
    url: R.AUDIT.DASHBOARD,
    icon: Shield,
    match: (l) => l.startsWith(R.AUDIT.DASHBOARD),
    permission: P.VIEW_AUDIT,
    items: [
      { title: "Security Dashboard", url: R.AUDIT.DASHBOARD, match: (l) => l === R.AUDIT.DASHBOARD },
      { title: "Events Explorer", url: R.AUDIT.EVENTS },
      { title: "Entity Trails", url: R.AUDIT.ENTITY_TRAILS },
      { title: "Live Sessions", url: R.AUDIT.SESSIONS },
      { title: "Login Attempts", url: R.AUDIT.LOGIN_ATTEMPTS },
      { title: "Account Lockouts", url: R.AUDIT.LOCKOUTS },
      { title: "Password Activity", url: R.AUDIT.PASSWORD_ACTIVITY },
      { title: "Proxy Sessions", url: R.AUDIT.IMPERSONATIONS },
      // Audit Exports - the backend requires platform.audit.export to list jobs.
      { title: "Audit Exports", url: R.AUDIT.EXPORTS, permission: P.EXPORT_AUDIT },
      // Compliance Rules - the backend requires platform.audit.manage to list.
      { title: "Compliance Rules", url: R.AUDIT.COMPLIANCE_RULES, permission: P.MANAGE_AUDIT },
    ],
  },
  {
    // Two independent keys open this group: the vs_health telemetry screens
    // (platform.health.view) and the payments operations screen (its own key).
    // Either alone must reveal the group, and only the children it covers -
    // gating the group on one key would hide the other holder's only screen.
    title: "Health",
    url: R.HEALTH.INDEX,
    icon: HeartPulse,
    match: (l) => l.startsWith(R.HEALTH.INDEX),
    permission: [P.VIEW_HEALTH, P.PAY_VIEW_UNATTRIBUTED_WEBHOOKS],
    items: [
      { title: "Command Center", url: R.HEALTH.INDEX, permission: P.VIEW_HEALTH, match: (l) => l === R.HEALTH.INDEX },
      { title: "Uptime", url: R.HEALTH.UPTIME, permission: P.VIEW_HEALTH },
      { title: "API & Endpoints", url: R.HEALTH.API, permission: P.VIEW_HEALTH },
      { title: "Jobs & Queues", url: R.HEALTH.JOBS, permission: P.VIEW_HEALTH },
      { title: "Incidents & Alerts", url: R.HEALTH.INCIDENTS, permission: P.VIEW_HEALTH },
      { title: "Tenant Health", url: R.HEALTH.TENANTS, permission: P.VIEW_HEALTH },
      { title: "SLOs", url: R.HEALTH.SLOS, permission: P.VIEW_HEALTH },
      // Platform-scope payments operations: inbound provider events that matched
      // no collection and no payout, so no entity-scoped screen can show them.
      { title: "Provider Webhooks", url: R.HEALTH.PROVIDER_WEBHOOKS, permission: P.PAY_VIEW_UNATTRIBUTED_WEBHOOKS },
    ],
  },
  {
    // Everyone gets the inbox; holders of a communication.* admin key get a
    // collapsible group with the Administration page as a second child.
    title: "Notifications",
    url: R.NOTIFICATIONS,
    icon: Bell,
    match: (l) => l.startsWith(R.NOTIFICATIONS),
    groupWhen: [
      P.AUDIT_NOTIFICATION_ACTIVITY,
      P.ENFORCE_NOTIFICATION_SETTINGS,
      P.CONFIGURE_NOTIFICATION_TEMPLATES,
    ],
    items: [
      {
        title: "Inbox",
        url: R.NOTIFICATIONS,
        match: (l) => l.startsWith(R.NOTIFICATIONS) && !l.startsWith(R.NOTIFICATIONS_ADMIN),
      },
      { title: "Administration", url: R.NOTIFICATIONS_ADMIN },
    ],
  },
  {
    // Visible with any config.* view key; the page itself shows only the tabs the
    // user can read and falls back to PageAccessDenied without any. Keep this a
    // superset of the page's own hasAnyPermission check in
    // src/pages/protected/settings/index.tsx - a key the page admits but the nav
    // omits leaves the holder able to reach Settings only by URL.
    title: "Settings",
    url: R.SETTINGS.INDEX,
    icon: Settings,
    match: (l) => l.startsWith(R.SETTINGS.INDEX),
    permission: [
      P.VIEW_CONFIG_VALUES,
      P.VIEW_CONFIG_DEFINITIONS,
      P.VIEW_CAPABILITIES,
      P.VIEW_ENTITLEMENTS,
      P.VIEW_CONFIG_OVERRIDES,
      P.VIEW_CONFIG_AUDIT,
      P.VIEW_SECURITY_SETTINGS,
      P.VIEW_INTEGRATION_SETTINGS,
    ],
  },
  {
    // The requirements library. A leaf, not a group: it is one screen, and the
    // per-document version history lives in its drawer rather than in the nav.
    // The key alone is enough here - the backend additionally refuses any caller
    // whose home tenant is not the platform one, so a school-tenant role carrying
    // this key still gets a 403 rather than a broken screen.
    title: "Documents",
    url: R.DOCUMENTS.INDEX,
    icon: Library,
    match: (l) => l.startsWith(R.DOCUMENTS.INDEX),
    permission: P.VIEW_REQUIREMENTS_DOCS,
  },
  {
    title: "Support",
    url: R.SUPPORT.INDEX,
    icon: Headset,
    match: (l) => l.startsWith(R.SUPPORT.INDEX) || l === R.SUPPORT.GUIDE_ALIAS,
    items: [
      {
        title: "Support Centre",
        url: R.SUPPORT.INDEX,
        match: (l) => l.startsWith(R.SUPPORT.INDEX) && !l.startsWith(R.SUPPORT.GUIDES),
      },
      {
        title: "How-to Guides",
        url: R.SUPPORT.GUIDES,
        match: (l) => l.startsWith(R.SUPPORT.GUIDES) || l === R.SUPPORT.GUIDE_ALIAS,
      },
    ],
  },
];

/**
 * `null`/absent passes. A single code goes through hasPermission; several go
 * through any/all - the same evaluation the sidebar has always used.
 */
function passesGate(gate: NavGate, permission: NavPermission | undefined, mode: "any" | "all" = "any"): boolean {
  if (permission === null || permission === undefined) return true;
  const codes = Array.isArray(permission) ? permission : [permission];
  if (codes.length === 1) return gate.hasPermission(codes[0]);
  return mode === "all" ? gate.hasAllPermissions(...codes) : gate.hasAnyPermission(...codes);
}

/** Resolve the declaration against a viewer's permissions and current route. */
export function buildMainNav(gate: NavGate, location: string): BuiltNavItem[] {
  const built: BuiltNavItem[] = [];

  for (const entry of MAIN_NAV) {
    if (!passesGate(gate, entry.permission, entry.permissionMode)) continue;
    if (entry.modulePrefixes && !gate.hasModuleAccess(...entry.modulePrefixes)) continue;

    const wantsGroup = !!entry.items && passesGate(gate, entry.groupWhen);
    const children = wantsGroup
      ? entry.items!
          .filter((child) => passesGate(gate, child.permission, child.permissionMode))
          .map((child) => ({
            title: child.title,
            url: child.url,
            isActive: child.match ? child.match(location) : location.startsWith(child.url),
          }))
      : [];

    // An entry with no visible children is a leaf, matching how NavMain renders.
    const isGroup = children.length > 0;
    const matches = entry.match(location);

    built.push({
      title: entry.title,
      url: entry.url,
      icon: entry.icon,
      isActive: isGroup ? false : matches,
      childActive: isGroup ? matches : false,
      ...(entry.affordance ? { affordance: true } : {}),
      ...(isGroup ? { items: children } : {}),
    });
  }

  return built;
}
