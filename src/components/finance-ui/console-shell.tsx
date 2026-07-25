// <ConsoleShell> — the in-page frame for the Finance and Procurement consoles:
// the global entity picker in a slim toolbar above the screen's content, plus
// the console's typography scope. You're "in" a separate console with a
// Back-to-main link in its sidebar (spec §3).
//
// The surrounding chrome (sidebar, header, session machinery) now comes from
// the DashboardLayout *route* above this. Two things still belong here, because
// only the console knows them:
//   - which sidebar renders is selected by the route's `handle.sidebar`
//     (finance-routes / procurement-routes), and
//   - the header title still derives from this console's nav config, pushed up
//     through the runtime override so the header reflects the current screen
//     rather than the console name.

import { useLocation } from "react-router";
import { useDashboardTitle } from "@/components/layout/dashboard-header";
import { EntitySelect } from "./entity-select";
import { activeNavTitle, type ConsoleNavGroup } from "./console-nav";

interface ConsoleShellProps {
  /** Console name (header fallback + sidebar heading). */
  title: string;
  /** This console's menu, grouped into labelled sections. */
  nav: ConsoleNavGroup[];
  children: React.ReactNode;
}

export function ConsoleShell({ title, nav, children }: ConsoleShellProps) {
  // Header reflects the current screen (like the home pages); the sidebar
  // heading keeps the console name.
  const pathname = useLocation().pathname;
  useDashboardTitle(activeNavTitle(nav, pathname) ?? title);
  return (
    <div className="console-geist min-w-0">
      <div className="flex items-center justify-end border-b border-white-02 bg-white px-4.5 py-2.5">
        <EntitySelect />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
