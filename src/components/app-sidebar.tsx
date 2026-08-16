import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { routesPath } from "@/routes/routes-path";
import { Link, useLocation } from "react-router";
import { usePermissions } from "@/hooks/use-permissions";
import { buildMainNav } from "./main-nav";
import { revealActiveSidebarItem } from "./sidebar-navigation";

// The app shell can remount as protected routes change. Keep the main menu at
// the exact offset the user left it instead of jumping back to the first item.
let rememberedMainSidebarScroll: number | null = null;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation().pathname;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const gate = usePermissions();

  // The menu itself is declared as data in ./main-nav.ts - this only resolves it
  // against the viewer's permissions and the current route.
  const navMain = buildMainNav(gate, location);

  React.useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    revealActiveSidebarItem(element, rememberedMainSidebarScroll);
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
          <NavMain items={navMain} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
