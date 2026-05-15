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
} from "@/assets/navbar-svg";
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
  const { isOpen: openLogout, toggleClick: toggleLogout } =
    useToggleModal(false); // logout modal

  const checkPermission = (
    permission: PermissionCode | PermissionCode[] | null,
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
