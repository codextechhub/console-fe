import Tabs from "@/components/custom/tab";
import { useLocation, useSearchParams } from "react-router";
import InvitesTab from "./tabs/invites";
import MembersTab from "./tabs/members";
import { routesPath } from "@/routes/routes-path";

export default function TeamManagement() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const activeTab = searchParams.get("tab");
  const scope = location.pathname.startsWith(routesPath.PROTECTED.TEAM_MGT.SCHOOL)
    ? "school"
    : "cx";

  const tabList = [
    { label: "Members", value: "members" },
    { label: "Invites", value: "invites" },
    // Drafts are parked (individual) CX hires awaiting completion - CX only.
    ...(scope === "cx" ? [{ label: "Drafts", value: "drafts" }] : []),
  ];

  return (
    <>
      {/* `grid` without `grid-cols-1 min-w-0` is what pushed this page off the
          right of the screen. An implicit grid column is sized to its
          min-content, and the widest thing here is a nowrap table, so the
          column grew to the table's natural width and the whole page scrolled
          sideways with it - 133px over at 1200 and 507px over at 820.
          `grid-cols-1` is `minmax(0, 1fr)`, which removes that floor and makes
          the table scroll inside its own box instead. Every other grid main in
          the app already carries both; this one had the grid and neither. */}
      <main className="grid min-w-0 grid-cols-1 px-4.5 py-6 space-y-5 text-black-01">
        <Tabs tabs={tabList} tabKey="tab" />

        {/* Distinct keys so switching Members↔Drafts remounts MembersTab - its
            query state is variant-specific and must not carry over. */}
        {activeTab === "drafts" && scope === "cx" ? (
          <MembersTab key="drafts" scope={scope} variant="drafts" />
        ) : activeTab === "invites" ? (
          <InvitesTab scope={scope} />
        ) : (
          <MembersTab key="members" scope={scope} />
        )}
      </main>
    </>
  );
}
