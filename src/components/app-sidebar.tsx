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
import { Network, Shield, Workflow } from "lucide-react";
import { NavMain } from "./nav-main";
import { routesPath } from "@/routes/routesPath";
import { useLocation } from "react-router";
import { usePermissions } from "@/hooks/use-permissions";
import { P, type PermissionCode } from "@/permissions";

type NavPermission = PermissionCode | PermissionCode[] | null;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation().pathname;

  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const checkPermission = (
    permission: NavPermission,
    mode: "any" | "all" = "any",
  ): boolean => {
    if (permission === null) return true;
    const codes = Array.isArray(permission) ? permission : [permission];
    if (codes.length === 1) return hasPermission(codes[0]);
    return mode === "all" ? hasAllPermissions(...codes) : hasAnyPermission(...codes);
  };

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
      title: "Team Management",
      url: routesPath.PROTECTED.TEAM_MGT.INDEX,
      icon: TeamMgtIcon,
      isActive: location.startsWith(routesPath.PROTECTED.TEAM_MGT.INDEX),
      childActive: false,
      permission: P.ACCESS_TEAM_PANEL,
      permissionMode: "any" as const,
    },
    {
      title: "Organogram",
      url: routesPath.PROTECTED.ORGANOGRAM.INDEX,
      icon: Network,
      isActive: false,
      childActive: location.startsWith("/organogram"),
      permission: P.VIEW_ORGANOGRAM,
      permissionMode: "any" as const,
      items: [
        {
          title: "Org Chart",
          url: routesPath.PROTECTED.ORGANOGRAM.INDEX,
          isActive: location === routesPath.PROTECTED.ORGANOGRAM.INDEX,
        },
        {
          title: "Staff Directory",
          url: routesPath.PROTECTED.ORGANOGRAM.STAFF,
          isActive: location.startsWith(routesPath.PROTECTED.ORGANOGRAM.STAFF),
        },
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
            location === routesPath.PROTECTED.ROLES.INDEX ||
            (location.startsWith("/roles/") &&
              !location.startsWith("/roles/permission-groups") &&
              !location.startsWith("/roles/user-assignments") &&
              !location.startsWith("/roles/change-requests") &&
              !location.startsWith("/roles/transfer-super-admin")),
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
          isActive: location === routesPath.PROTECTED.PERMISSIONS.INDEX || (location.startsWith("/permissions/") && !location.startsWith("/permissions/modules") && !location.startsWith("/permissions/resources") && !location.startsWith("/permissions/actions") && !location.startsWith("/permissions/dependencies")),
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
      childActive: location.startsWith("/data-imports"),
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
      title: "Workflow",
      url: routesPath.PROTECTED.WORKFLOW.APPROVALS,
      icon: Workflow,
      isActive: false,
      childActive: location.startsWith("/workflow"),
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
      childActive: location.startsWith("/audit"),
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
          title: "Impersonations",
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
  ];

  const data = {
    navMain: allNavItems.filter((item) =>
      checkPermission(item.permission, item.permissionMode)
    ),
  };

  return (
    <>
      <Sidebar className="bg-white" collapsible="icon" {...props}>
        <SidebarHeader className="bg-white">
          <SidebarMenu>
            <SidebarMenuItem className="mt-2">
              <div className="flex items-center justify-center">
                <img
                  src="/image/logo.png"
                  alt="XVS logo"
                  className="h-10 w-auto"
                />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-white pt-3 pb-6">
          <NavMain items={data.navMain} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
