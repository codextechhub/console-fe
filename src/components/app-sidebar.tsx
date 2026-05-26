"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { svgIcons } from "@/assets/svg";
import {
  HomeIcon,
  LogoutIcon,
  SchoolIcon,
  TeamMgtIcon,
  RolesIcon,
  PermissionsIcon,
  DataImportsIcon,
} from "@/assets/navbar-svg";
import { Shield, ShieldCheck } from "lucide-react";
import { NavMain } from "./nav-main";
import { routesPath } from "@/routes/routesPath";
import { useLocation, useNavigate } from "react-router";
import PromptModal from "./modal/prompt-modal";
import useToggleModal from "@/hooks/use-toggle";
import { useLogoutMutation } from "@/redux/services/auth/authApi";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/redux/store";
import { resetAuth } from "@/redux/features/auth/authSlice";
import { usePermissions } from "@/hooks/use-permissions";
import { P, type PermissionCode } from "@/permissions";

type NavPermission = PermissionCode | PermissionCode[] | null;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation().pathname;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const refresh = Cookies.get("refresh_token") || "";
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = () => {
    logout({ refresh: refresh })
      .unwrap()
      .then(() => {
        navigate(routesPath.AUTH.LOGIN, { replace: true });
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.error("Logout failed:", error);
      })
      .finally(() => {
        navigate(routesPath.AUTH.LOGIN, { replace: true });
        Cookies.remove("token");
        Cookies.remove("refresh_token");
        dispatch(resetAuth());
      });
  };

  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { isOpen: openLogout, toggleClick: toggleLogout } = useToggleModal(false);

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
              disabled: true,
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
          isActive: false,
          disabled: true,
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
      title: "My Security",
      url: routesPath.PROTECTED.ME_SECURITY.OVERVIEW,
      icon: ShieldCheck,
      isActive: false,
      childActive: location.startsWith("/me/security"),
      permission: null,
      permissionMode: "any" as const,
      items: [
        {
          title: "Overview",
          url: routesPath.PROTECTED.ME_SECURITY.OVERVIEW,
          isActive: location === routesPath.PROTECTED.ME_SECURITY.OVERVIEW,
        },
        {
          title: "Active Sessions",
          url: routesPath.PROTECTED.ME_SECURITY.SESSIONS,
          isActive: location.startsWith(routesPath.PROTECTED.ME_SECURITY.SESSIONS),
        },
        {
          title: "Login History",
          url: routesPath.PROTECTED.ME_SECURITY.LOGIN_HISTORY,
          isActive: location.startsWith(routesPath.PROTECTED.ME_SECURITY.LOGIN_HISTORY),
        },
        {
          title: "Password & Sign-in",
          url: routesPath.PROTECTED.ME_SECURITY.PASSWORD,
          isActive: location.startsWith(routesPath.PROTECTED.ME_SECURITY.PASSWORD),
        },
        {
          title: "Account Activity",
          url: routesPath.PROTECTED.ME_SECURITY.ACTIVITY,
          isActive: location.startsWith(routesPath.PROTECTED.ME_SECURITY.ACTIVITY),
        },
        {
          title: "Data & Privacy",
          url: routesPath.PROTECTED.ME_SECURITY.PRIVACY,
          isActive: location.startsWith(routesPath.PROTECTED.ME_SECURITY.PRIVACY),
        },
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
                <div className="size-fit">{svgIcons.logo}</div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-white pt-3">
          <NavMain items={data.navMain} />
        </SidebarContent>
        <SidebarFooter className="bg-white ">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-10 mx-auto mb-10 text-destructive hover:bg-destructive/5 hover:text-destructive"
                tooltip="Logout"
                onClick={toggleLogout}
              >
                <LogoutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <PromptModal
        isOpen={openLogout}
        onClose={toggleLogout}
        onConfirm={handleLogout}
        title="Log Out?"
        description="Are you sure you want to log out of your account?"
        containerClass="min-h-[320px] lg:w-[390px]"
        srcClass="size-25"
        src="/image/caution.png"
        onConfirmText="Log Out"
        canCancel
        loading={isLoggingOut}
        onConfirmClass="bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
      />
    </>
  );
}
