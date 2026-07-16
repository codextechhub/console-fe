import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  HomeIcon,
  SchoolIcon,
  TeamMgtIcon,
  RolesIcon,
  PermissionsIcon,
  DataImportsIcon,
} from "@/assets/navbar-svg";
import { Bell, ClipboardCheck, FileOutput, Headset, HeartPulse, Landmark, Network, Settings, Shield, ShoppingCart, Workflow } from "lucide-react";
import { NavMain } from "./nav-main";
import { routesPath } from "@/routes/routes-path";
import { Link, useLocation } from "react-router";
import { usePermissions } from "@/hooks/use-permissions";
import { P, type PermissionCode } from "@/permissions";

type NavPermission = PermissionCode | PermissionCode[] | null;

const R = routesPath.PROTECTED;

// The app shell can remount as protected routes change. Keep the main menu at
// the exact offset the user left it instead of jumping back to the first item.
let rememberedMainSidebarScroll: number | null = null;

// First path segment of a route, e.g. "/workflow/approvals" → "/workflow".
// Group-level active-state matching derives its prefix from a real routesPath
// constant via this, so renaming a path in routesPath propagates here instead
// of silently breaking highlighting against a stale literal.
const moduleRoot = (path: string) => "/" + path.split("/")[1];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation().pathname;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess } = usePermissions();

  const checkPermission = (
    permission: NavPermission,
    mode: "any" | "all" = "any",
  ): boolean => {
    if (permission === null) return true;
    const codes = Array.isArray(permission) ? permission : [permission];
    if (codes.length === 1) return hasPermission(codes[0]);
    return mode === "all" ? hasAllPermissions(...codes) : hasAnyPermission(...codes);
  };

  // Any communication.* admin key turns the Notifications nav item into a
  // collapsible group (Inbox + Administration).
  const canAdminNotifications = hasAnyPermission(
    P.AUDIT_NOTIFICATION_ACTIVITY,
    P.ENFORCE_NOTIFICATION_SETTINGS,
    P.CONFIGURE_NOTIFICATION_TEMPLATES,
  );

  const allNavItems = [
    {
      title: "Home",
      url: routesPath.PROTECTED.OVERVIEW.INDEX,
      icon: HomeIcon,
      isActive: location.startsWith(routesPath.PROTECTED.OVERVIEW.INDEX),
      childActive: false,
      permission: null,
      permissionMode: "any" as const,
    },
    {
      title: "School Management",
      url: routesPath.PROTECTED.SCHOOL_MGT.INDEX,
      icon: SchoolIcon,
      isActive: location.startsWith(routesPath.PROTECTED.SCHOOL_MGT.INDEX),
      childActive: false,
      permission: P.BROWSE_SCHOOLS,
      permissionMode: "any" as const,
    },
    {
      title: "Users",
      url: routesPath.PROTECTED.TEAM_MGT.INDEX,
      icon: TeamMgtIcon,
      isActive: false,
      childActive:
        location.startsWith(routesPath.PROTECTED.TEAM_MGT.CX) ||
        location.startsWith(routesPath.PROTECTED.TEAM_MGT.SCHOOL) ||
        location === routesPath.PROTECTED.TEAM_MGT.LEGACY,
      permission: P.ACCESS_TEAM_PANEL,
      permissionMode: "any" as const,
      items: [
        {
          title: "CX Users",
          url: routesPath.PROTECTED.TEAM_MGT.CX,
          isActive: location.startsWith(routesPath.PROTECTED.TEAM_MGT.CX),
        },
        {
          title: "School Users",
          url: routesPath.PROTECTED.TEAM_MGT.SCHOOL,
          isActive: location.startsWith(routesPath.PROTECTED.TEAM_MGT.SCHOOL),
        },
      ],
    },
    {
      title: "Organogram",
      url: routesPath.PROTECTED.ORGANOGRAM.INDEX,
      icon: Network,
      isActive: false,
      childActive: location.startsWith(R.ORGANOGRAM.INDEX),
      permission: P.VIEW_ORGANOGRAM,
      permissionMode: "any" as const,
      items: [
        {
          title: "Org Chart",
          url: routesPath.PROTECTED.ORGANOGRAM.INDEX,
          isActive: location === routesPath.PROTECTED.ORGANOGRAM.INDEX,
        },
        // Staff Directory retired — profiles are reached from Team Management
        // (View Details) or by clicking a person in the org chart.
        // Manage — structural CRUD, gated by its own manage permission.
        ...(hasPermission(P.MANAGE_ORGANOGRAM)
          ? [{
              title: "Manage",
              url: routesPath.PROTECTED.ORGANOGRAM.MANAGE,
              isActive: location.startsWith(routesPath.PROTECTED.ORGANOGRAM.MANAGE),
            }]
          : []),
      ],
    },
    {
      // Tasks — Org Accountability. Gated to CX staff (every console user) at the
      // API layer; what each person sees is bounded by the organogram server-side,
      // so the nav item itself carries no extra RBAC gate.
      title: "Tasks",
      url: routesPath.PROTECTED.TODO.INDEX,
      icon: ClipboardCheck,
      isActive: location.startsWith(routesPath.PROTECTED.TODO.INDEX),
      childActive: false,
      permission: null,
      permissionMode: "any" as const,
    },
    {
      title: "Roles",
      url: routesPath.PROTECTED.ROLES.INDEX,
      icon: RolesIcon,
      isActive: false,
      childActive: location.startsWith(routesPath.PROTECTED.ROLES.INDEX) && !location.startsWith(routesPath.PROTECTED.ROLES.GROUPS.INDEX),
      permission: P.VIEW_ROLES,
      permissionMode: "any" as const,
      items: [
        {
          title: "Platform Roles",
          url: routesPath.PROTECTED.ROLES.INDEX,
          isActive:
            location === R.ROLES.INDEX ||
            (location.startsWith(R.ROLES.INDEX + "/") &&
              !location.startsWith(R.ROLES.GROUPS.INDEX) &&
              !location.startsWith(R.ROLES.USER_ASSIGNMENTS) &&
              !location.startsWith(R.ROLES.CHANGE_REQUESTS) &&
              !location.startsWith(R.ROLES.TRANSFER_SUPER_ADMIN)),
        },
        {
          title: "Platform User Assignments",
          url: routesPath.PROTECTED.ROLES.USER_ASSIGNMENTS,
          isActive: location.startsWith(routesPath.PROTECTED.ROLES.USER_ASSIGNMENTS),
        },
        // Change Requests — only shown to users who can act on role
        // change proposals (the backend list endpoint enforces the same).
        ...(hasPermission(P.MODIFY_ROLE)
          ? [{
              title: "Change Requests",
              url: routesPath.PROTECTED.ROLES.CHANGE_REQUESTS,
              isActive: location.startsWith(routesPath.PROTECTED.ROLES.CHANGE_REQUESTS),
            }]
          : []),
        // Transfer Super Admin — only shown to users who hold the
        // platform.roles.transfer permission. The backend further restricts
        // execution to the active super admin.
        ...(hasPermission(P.TRANSFER_SUPER_ADMIN)
          ? [{
              title: "Transfer Super Admin",
              url: routesPath.PROTECTED.ROLES.TRANSFER_SUPER_ADMIN,
              isActive: location.startsWith(routesPath.PROTECTED.ROLES.TRANSFER_SUPER_ADMIN),
            }]
          : []),
      ],
    },
    {
      title: "Permissions",
      url: routesPath.PROTECTED.PERMISSIONS.INDEX,
      icon: PermissionsIcon,
      isActive: false,
      childActive: location.startsWith(routesPath.PROTECTED.PERMISSIONS.INDEX) || location.startsWith(routesPath.PROTECTED.ROLES.GROUPS.INDEX),
      permission: P.VIEW_PERMISSIONS,
      permissionMode: "any" as const,
      items: [
        {
          title: "All Permissions",
          url: routesPath.PROTECTED.PERMISSIONS.INDEX,
          isActive: location === R.PERMISSIONS.INDEX || (location.startsWith(R.PERMISSIONS.INDEX + "/") && !location.startsWith(R.PERMISSIONS.MODULES.INDEX) && !location.startsWith(R.PERMISSIONS.RESOURCES.INDEX) && !location.startsWith(R.PERMISSIONS.ACTIONS.INDEX) && !location.startsWith(R.PERMISSIONS.DEPENDENCIES.INDEX)),
        },
        {
          title: "Modules",
          url: routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX,
          isActive: location.startsWith(routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX),
        },
        {
          title: "Resources",
          url: routesPath.PROTECTED.PERMISSIONS.RESOURCES.INDEX,
          isActive: location.startsWith(routesPath.PROTECTED.PERMISSIONS.RESOURCES.INDEX),
        },
        {
          title: "Actions",
          url: routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX,
          isActive: location.startsWith(routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX),
        },
        {
          title: "Dependencies",
          url: routesPath.PROTECTED.PERMISSIONS.DEPENDENCIES.INDEX,
          isActive: location.startsWith(routesPath.PROTECTED.PERMISSIONS.DEPENDENCIES.INDEX),
        },
        {
          title: "Permission Groups",
          url: routesPath.PROTECTED.ROLES.GROUPS.INDEX,
          isActive: location.startsWith(routesPath.PROTECTED.ROLES.GROUPS.INDEX),
        },
      ],
    },
    {
      title: "Data Imports",
      url: routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX,
      icon: DataImportsIcon,
      isActive: false,
      childActive: location.startsWith(moduleRoot(R.DATA_IMPORTS.BATCHES.INDEX)),
      permission: [P.VIEW_IMPORT_BATCHES, P.VIEW_IMPORT_TEMPLATES] as PermissionCode[],
      permissionMode: "any" as const,
      items: [
        ...(hasPermission(P.VIEW_IMPORT_BATCHES)
          ? [{
              title: "Import Batches",
              url: routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX,
              isActive: location.startsWith(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX),
            }]
          : []),
        ...(hasPermission(P.VIEW_IMPORT_TEMPLATES)
          ? [{
              title: "Import Templates",
              url: routesPath.PROTECTED.DATA_IMPORTS.TEMPLATES.INDEX,
              isActive: location.startsWith(routesPath.PROTECTED.DATA_IMPORTS.TEMPLATES.INDEX),
            }]
          : []),
      ],
    },
    {
      // Export — submenu grows as export features ship; View Queues is first.
      // Anyone can see their own queues (backend gates at IsAuthenticatedAndActive);
      // the all-queues scope is gated server-side and by can_view_all in the page.
      title: "Export",
      url: routesPath.PROTECTED.EXPORT.QUEUES,
      icon: FileOutput,
      isActive: false,
      childActive: location.startsWith(moduleRoot(R.EXPORT.QUEUES)),
      permission: null,
      permissionMode: "any" as const,
      items: [
        {
          title: "View Queues",
          url: routesPath.PROTECTED.EXPORT.QUEUES,
          isActive: location.startsWith(routesPath.PROTECTED.EXPORT.QUEUES),
        },
      ],
    },
    // ── Finance & Operations: two separate consoles, each opening its own
    // sub-navigated console (see ConsoleShell). Top-level items, matching the
    // app's flat sidebar (no group headers). Finance shows for any
    // finance.*/payments.* key; Procurement for any procurement.* key. Each is
    // a leaf that navigates away, so it carries an open-affordance chevron.
    ...(hasModuleAccess("finance.", "payments.")
      ? [{
          title: "Finance",
          url: R.FINANCE.INDEX,
          icon: Landmark,
          isActive: location.startsWith(moduleRoot(R.FINANCE.INDEX)),
          childActive: false,
          affordance: true,
          permission: null,
          permissionMode: "any" as const,
        }]
      : []),
    ...(hasModuleAccess("procurement.")
      ? [{
          title: "Procurement",
          url: R.PROCUREMENT.INDEX,
          icon: ShoppingCart,
          isActive: location.startsWith(moduleRoot(R.PROCUREMENT.INDEX)),
          childActive: false,
          affordance: true,
          permission: null,
          permissionMode: "any" as const,
        }]
      : []),
    {
      title: "Workflow",
      url: routesPath.PROTECTED.WORKFLOW.APPROVALS,
      icon: Workflow,
      isActive: false,
      childActive: location.startsWith(moduleRoot(R.WORKFLOW.APPROVALS)),
      // Approvals, submissions and delegations are open to any authenticated
      // user (backend gates them at IsAuthenticatedAndActive), so the group
      // itself is always visible. Admin-only children are spread in by permission.
      permission: null,
      permissionMode: "any" as const,
      items: [
        {
          title: "Approvals",
          url: routesPath.PROTECTED.WORKFLOW.APPROVALS,
          isActive:
            location.startsWith(routesPath.PROTECTED.WORKFLOW.APPROVALS),
        },
        {
          title: "My Submissions",
          url: routesPath.PROTECTED.WORKFLOW.MY_SUBMISSIONS,
          isActive: location.startsWith(routesPath.PROTECTED.WORKFLOW.MY_SUBMISSIONS),
        },
        {
          title: "Delegations",
          url: routesPath.PROTECTED.WORKFLOW.DELEGATIONS,
          isActive: location.startsWith(routesPath.PROTECTED.WORKFLOW.DELEGATIONS),
        },
        // All Instances + Team Load — admin monitoring, gated by view permission.
        ...(hasPermission(P.VIEW_WORKFLOW_INSTANCES)
          ? [
              {
                title: "All Instances",
                url: routesPath.PROTECTED.WORKFLOW.INSTANCES,
                isActive:
                  location.startsWith(routesPath.PROTECTED.WORKFLOW.INSTANCES),
              },
              {
                title: "Team Load",
                url: routesPath.PROTECTED.WORKFLOW.TEAM_LOAD,
                isActive: location.startsWith(routesPath.PROTECTED.WORKFLOW.TEAM_LOAD),
              },
            ]
          : []),
        // Templates — gated by template view permission.
        ...(hasPermission(P.VIEW_WORKFLOW_TEMPLATES)
          ? [{
              title: "Templates",
              url: routesPath.PROTECTED.WORKFLOW.TEMPLATES,
              isActive: location.startsWith(routesPath.PROTECTED.WORKFLOW.TEMPLATES),
            }]
          : []),
      ],
    },
    {
      title: "Audit & Security",
      url: routesPath.PROTECTED.AUDIT.DASHBOARD,
      icon: Shield,
      isActive: false,
      childActive: location.startsWith(R.AUDIT.DASHBOARD),
      permission: P.VIEW_AUDIT,
      permissionMode: "any" as const,
      items: [
        {
          title: "Security Dashboard",
          url: routesPath.PROTECTED.AUDIT.DASHBOARD,
          isActive: location === routesPath.PROTECTED.AUDIT.DASHBOARD,
        },
        {
          title: "Events Explorer",
          url: routesPath.PROTECTED.AUDIT.EVENTS,
          isActive: location.startsWith(routesPath.PROTECTED.AUDIT.EVENTS),
        },
        {
          title: "Entity Trails",
          url: routesPath.PROTECTED.AUDIT.ENTITY_TRAILS,
          isActive: location.startsWith(routesPath.PROTECTED.AUDIT.ENTITY_TRAILS),
        },
        {
          title: "Live Sessions",
          url: routesPath.PROTECTED.AUDIT.SESSIONS,
          isActive: location.startsWith(routesPath.PROTECTED.AUDIT.SESSIONS),
        },
        {
          title: "Login Attempts",
          url: routesPath.PROTECTED.AUDIT.LOGIN_ATTEMPTS,
          isActive: location.startsWith(routesPath.PROTECTED.AUDIT.LOGIN_ATTEMPTS),
        },
        {
          title: "Account Lockouts",
          url: routesPath.PROTECTED.AUDIT.LOCKOUTS,
          isActive: location.startsWith(routesPath.PROTECTED.AUDIT.LOCKOUTS),
        },
        {
          title: "Password Activity",
          url: routesPath.PROTECTED.AUDIT.PASSWORD_ACTIVITY,
          isActive: location.startsWith(routesPath.PROTECTED.AUDIT.PASSWORD_ACTIVITY),
        },
        {
          title: "Proxy Sessions",
          url: routesPath.PROTECTED.AUDIT.IMPERSONATIONS,
          isActive: location.startsWith(routesPath.PROTECTED.AUDIT.IMPERSONATIONS),
        },
        // Audit Exports — backend requires platform.audit.export to list jobs
        ...(hasPermission(P.EXPORT_AUDIT)
          ? [{
              title: "Audit Exports",
              url: routesPath.PROTECTED.AUDIT.EXPORTS,
              isActive: location.startsWith(routesPath.PROTECTED.AUDIT.EXPORTS),
            }]
          : []),
        // Compliance Rules — backend requires platform.audit.manage to list
        ...(hasPermission(P.MANAGE_AUDIT)
          ? [{
              title: "Compliance Rules",
              url: routesPath.PROTECTED.AUDIT.COMPLIANCE_RULES,
              isActive: location.startsWith(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULES),
            }]
          : []),
      ],
    },
    {
      title: "Health",
      url: R.HEALTH.INDEX,
      icon: HeartPulse,
      isActive: false,
      childActive: location.startsWith(R.HEALTH.INDEX),
      permission: P.VIEW_HEALTH,
      permissionMode: "any" as const,
      items: [
        { title: "Command Center", url: R.HEALTH.INDEX, isActive: location === R.HEALTH.INDEX },
        { title: "Uptime", url: R.HEALTH.UPTIME, isActive: location.startsWith(R.HEALTH.UPTIME) },
        { title: "API & Endpoints", url: R.HEALTH.API, isActive: location.startsWith(R.HEALTH.API) },
        { title: "Jobs & Queues", url: R.HEALTH.JOBS, isActive: location.startsWith(R.HEALTH.JOBS) },
        { title: "Incidents & Alerts", url: R.HEALTH.INCIDENTS, isActive: location.startsWith(R.HEALTH.INCIDENTS) },
        { title: "Tenant Health", url: R.HEALTH.TENANTS, isActive: location.startsWith(R.HEALTH.TENANTS) },
        { title: "SLOs", url: R.HEALTH.SLOS, isActive: location.startsWith(R.HEALTH.SLOS) },
      ],
    },
    {
      // Everyone gets the inbox; holders of a communication.* admin key get a
      // collapsible group with the Administration page as a second child.
      title: "Notifications",
      url: R.NOTIFICATIONS,
      icon: Bell,
      isActive: canAdminNotifications ? false : location.startsWith(R.NOTIFICATIONS),
      childActive: canAdminNotifications ? location.startsWith(R.NOTIFICATIONS) : false,
      permission: null,
      permissionMode: "any" as const,
      ...(canAdminNotifications
        ? {
            items: [
              {
                title: "Inbox",
                url: R.NOTIFICATIONS,
                isActive:
                  location.startsWith(R.NOTIFICATIONS) &&
                  !location.startsWith(R.NOTIFICATIONS_ADMIN),
              },
              {
                title: "Administration",
                url: R.NOTIFICATIONS_ADMIN,
                isActive: location.startsWith(R.NOTIFICATIONS_ADMIN),
              },
            ],
          }
        : {}),
    },
    {
      title: "Settings",
      url: R.SETTINGS.INDEX,
      icon: Settings,
      isActive: location.startsWith(R.SETTINGS.INDEX),
      childActive: false,
      // Visible with any config.* view key; the page itself shows only the
      // tabs the user can read and falls back to PageAccessDenied without any.
      permission: [
        P.VIEW_CONFIG_VALUES,
        P.VIEW_CONFIG_DEFINITIONS,
        P.VIEW_CAPABILITIES,
        P.VIEW_ENTITLEMENTS,
        P.VIEW_CONFIG_OVERRIDES,
        P.VIEW_CONFIG_AUDIT,
      ] as PermissionCode[],
      permissionMode: "any" as const,
    },
    {
      title: "Support",
      url: R.SUPPORT.INDEX,
      icon: Headset,
      isActive: location.startsWith(R.SUPPORT.INDEX),
      childActive: false,
      permission: null,
      permissionMode: "any" as const,
    },
  ];

  const data = {
    navMain: allNavItems.filter((item) =>
      checkPermission(item.permission, item.permissionMode)
    ),
  };

  React.useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (rememberedMainSidebarScroll !== null) {
      element.scrollTop = rememberedMainSidebarScroll;
      return;
    }
    const active = element.querySelector<HTMLElement>('[data-active="true"]');
    if (active) {
      const containerRect = element.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      element.scrollTop +=
        activeRect.top - containerRect.top -
        (element.clientHeight - activeRect.height) / 2;
    }
  }, [location]);

  return (
    <>
      <Sidebar className="bg-white" collapsible="icon" {...props}>
        <SidebarHeader className="bg-white">
          <SidebarMenu>
            <SidebarMenuItem className="mt-2">
              <Link
                to={routesPath.PROTECTED.OVERVIEW.INDEX}
                aria-label="Go to dashboard"
                className="flex items-center justify-center"
              >
                <img
                  src="/image/logo.png"
                  alt="XVS logo"
                  className="h-10 w-auto"
                />
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent
          ref={scrollRef}
          onScroll={(event) => {
            rememberedMainSidebarScroll = event.currentTarget.scrollTop;
          }}
          className="bg-white pt-3 pb-6"
        >
          <NavMain items={data.navMain} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
