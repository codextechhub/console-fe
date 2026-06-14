// <ConsoleShell> — the dedicated layout for the Finance and Procurement
// consoles. It renders inside the app's DashboardLayout (so the main sidebar,
// header and session machinery stay intact) and adds the console's OWN left
// sub-navigation plus the global entity picker in a console header bar (spec
// §3). Each console passes its own nav sections; areas the user lacks any key
// for are hidden.

import { Link, useLocation } from "react-router";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { EntitySelect } from "./entity-select";

export interface ConsoleNavItem {
  title: string;
  url: string;
  /** Backend key prefixes; the item shows if the user holds ANY key under one.
   *  Empty/omitted → always visible (e.g. the dashboard landing). */
  prefixes?: string[];
}

interface ConsoleShellProps {
  /** Console name shown in the app header + sub-nav heading. */
  title: string;
  /** Sub-navigation items for this console's areas. */
  nav: ConsoleNavItem[];
  children: React.ReactNode;
}

export function ConsoleShell({ title, nav, children }: ConsoleShellProps) {
  const location = useLocation().pathname;
  const { hasModuleAccess } = usePermissions();

  const visible = nav.filter((item) => !item.prefixes?.length || hasModuleAccess(...item.prefixes));

  // Longest-match wins so e.g. /finance/receivables doesn't also light up the
  // /finance dashboard entry.
  const activeUrl = visible
    .filter((i) => location === i.url || location.startsWith(i.url + "/"))
    .sort((a, b) => b.url.length - a.url.length)[0]?.url;

  return (
    <DashboardLayout title={title}>
      <div className="flex min-h-[calc(100dvh-3.75rem)] min-w-0">
        {/* Console sub-navigation */}
        <aside className="hidden w-56 shrink-0 border-r border-white-02 bg-white px-3 py-5 md:block">
          <p className="px-2 pb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">
            {title}
          </p>
          <nav className="space-y-0.5">
            {visible.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "block rounded-md px-3 py-2 font-mont text-sm transition-colors",
                  item.url === activeUrl
                    ? "bg-pry-01 font-semibold text-primary"
                    : "text-gray-01 hover:bg-white-02/60",
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Console body: header bar (entity picker) + page content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white-02 bg-white px-4.5 py-2.5">
            {/* Mobile area selector falls back to the same links inline */}
            <div className="flex items-center gap-1.5 overflow-x-auto md:hidden">
              {visible.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "whitespace-nowrap rounded-md px-2.5 py-1.5 font-mont text-xs transition-colors",
                    item.url === activeUrl ? "bg-pry-01 font-semibold text-primary" : "text-gray-01",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
            <div className="ml-auto">
              <EntitySelect />
            </div>
          </div>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
