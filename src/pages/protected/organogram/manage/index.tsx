// Organogram → Manage. Tabbed CRUD for Org Units / Positions / Matrix.
//
// Gated on P.MANAGE_ORGANOGRAM at the page itself, not only in the sidebar.
// Hiding the nav link left the route reachable by typing the URL, and this
// page is where establishment size lives: the position list shows headcount
// and how many seats of each are unfilled, which the org chart deliberately
// no longer reveals. The backend remains the authoritative gate for writes.

import { useState } from "react";
import { Building2, Briefcase, Spline } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import OrgNodeManager from "./org-node-manager";
import PositionManager from "./position-manager";
import MatrixManager from "./matrix-manager";
import { PageShell } from "@/components/layout/page-shell";

const TABS = [
  { id: "units", label: "Org Units", icon: Building2 },
  { id: "positions", label: "Positions", icon: Briefcase },
  { id: "matrix", label: "Matrix", icon: Spline },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function OrganogramManage() {
  const [tab, setTab] = useState<TabId>("units");
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  if (!hasPermission(P.MANAGE_ORGANOGRAM)) {
    return (
      <PageAccessDenied
        onBack={() => navigate(routesPath.PROTECTED.ORGANOGRAM.INDEX)}
        message="You don't have permission to manage the organogram."
      />
    );
  }

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div>
          <p className="font-semibold font-mont text-gray-01">Manage Organogram</p>
          <p className="text-xs text-gray-01 mt-0.5">Create and maintain the org structure - units (division/department/team), seats and dotted lines.</p>
        </div>

        <div className="flex items-center gap-1 border-b border-white-02">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-guide={`organogram-manage.tab.${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold transition-colors",
                tab === t.id ? "text-primary" : "text-gray-01 hover:text-black-01",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {tab === "units" && <OrgNodeManager />}
        {tab === "positions" && <PositionManager />}
        {tab === "matrix" && <MatrixManager />}
      </PageShell>
    </>
  );
}
