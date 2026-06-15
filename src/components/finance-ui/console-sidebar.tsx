// The left sidebar for a dedicated console (Finance / Procurement). Mirrors the
// global AppSidebar's chrome but renders the console's own menu via the shared
// collapsible NavMain — expand-only parents + leaf links — with a "Back to main
// app" entry on top. Replaces the global nav while you're inside the console.

import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { usePermissions } from "@/hooks/use-permissions";
import { routesPath } from "@/routes/routes-path";
import type { ConsoleNavItem } from "./console-nav";

export function ConsoleSidebar({ title, nav }: { title: string; nav: ConsoleNavItem[] }) {
  const location = useLocation().pathname;
  const { hasModuleAccess } = usePermissions();

  const childVisible = (prefixes?: string[]) => !prefixes?.length || hasModuleAccess(...prefixes);

  const items = nav.flatMap((item) => {
    const kids = (item.children ?? []).filter((c) => childVisible(c.prefixes));
    // A parent shows if it has visible children, or (no children) its own keys pass.
    const visible = item.children?.length
      ? kids.length > 0
      : !item.prefixes?.length || hasModuleAccess(...item.prefixes);
    if (!visible) return [];

    if (kids.length) {
      return [{
        title: item.title,
        url: item.url,
        icon: item.icon,
        isActive: false,
        childActive: location === item.url || location.startsWith(item.url + "/"),
        items: kids.map((c) => ({
          title: c.title,
          url: c.url,
          isActive: location === c.url || location.startsWith(c.url + "/"),
        })),
      }];
    }
    // Leaf: dashboard (the console root) matches exactly; others by prefix.
    const isRoot = item.url === routesPath.PROTECTED.FINANCE.INDEX || item.url === routesPath.PROTECTED.PROCUREMENT.INDEX;
    return [{
      title: item.title,
      url: item.url,
      icon: item.icon,
      isActive: isRoot ? location === item.url : location === item.url || location.startsWith(item.url + "/"),
      childActive: false,
    }];
  });

  const backItem = {
    title: "Back to Home",
    url: routesPath.PROTECTED.OVERVIEW.INDEX,
    icon: ArrowLeft,
    isActive: false,
    childActive: false,
  };

  return (
    <Sidebar className="bg-white" collapsible="icon">
      <SidebarHeader className="bg-white">
        <SidebarMenu>
          <SidebarMenuItem className="mt-2">
            <div className="flex items-center justify-center">
              <img src="/image/logo.png" alt="XVS logo" className="h-10 w-auto" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white pt-3 pb-6">
        <NavMain items={[backItem]} />
        <p className="px-4 pb-1 pt-1 font-mont text-[10px] font-semibold uppercase tracking-wide text-gray-05 group-data-[collapsible=icon]:hidden">
          {title}
        </p>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
