import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppLogo } from "./app-logo";
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
  const isCollapsed = useSidebar().state === "collapsed";

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
        {/* The rule under the mark is the same rule that runs under the page
            title, so the two meet and the top of the app reads as one line
            rather than a step. The heights have to agree in BOTH states: the
            page header is `min-h-15` and drops to `min-h-12` on the icon rail,
            so this follows it. It also gives the sidebar a fixed edge for its
            content to scroll under, which is what school-fe has and this did
            not. */}
        <SidebarHeader className="h-15 justify-center border-b border-white-02 bg-white group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link
                to={routesPath.PROTECTED.OVERVIEW.INDEX}
                aria-label="Go to dashboard"
                className="flex items-center justify-center"
              >
                {/* Collapsed to the icon rail there is no width for the wordmark
                    to turn into, so it stays a plain shield there. */}
                <AppLogo animate={!isCollapsed} />
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
