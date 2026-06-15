// <ConsoleShell> — the dedicated layout for the Finance and Procurement
// consoles. Renders the app's DashboardLayout chrome (logo, header, session
// machinery) but swaps the global sidebar for the console's own menu
// (ConsoleSidebar) and adds the global entity picker in a slim toolbar. You're
// "in" a separate console with a Back-to-main link in its sidebar (spec §3).

import DashboardLayout from "@/components/layout/dashboard-layout";
import { EntitySelect } from "./entity-select";
import { ConsoleSidebar } from "./console-sidebar";
import type { ConsoleNavItem } from "./console-nav";

interface ConsoleShellProps {
  /** Console name (header title + sidebar heading). */
  title: string;
  /** This console's hierarchical menu. */
  nav: ConsoleNavItem[];
  children: React.ReactNode;
}

export function ConsoleShell({ title, nav, children }: ConsoleShellProps) {
  return (
    <DashboardLayout title={title} sidebar={<ConsoleSidebar title={title} nav={nav} />}>
      <div className="flex items-center justify-end border-b border-white-02 bg-white px-4.5 py-2.5">
        <EntitySelect />
      </div>
      <div className="min-w-0">{children}</div>
    </DashboardLayout>
  );
}
