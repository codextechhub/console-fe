import Tabs from "@/components/custom/tab";
import { useLocation, useSearchParams } from "react-router";
import InvitesTab from "./tabs/invites";
import MembersTab from "./tabs/members";
import { routesPath } from "@/routes/routes-path";
import { PageShell } from "@/components/layout/page-shell";

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
      {/* This page is where the missing guard was found: it had a bare `grid`,
          whose implicit column is sized to its min-content, so a nowrap table
          grew the column past the viewport and the whole page scrolled
          sideways. PageShell's `grid` prop cannot be asked for without
          `grid-cols-1 min-w-0`, so the shape is now unreachable rather than
          merely corrected here. */}
      <PageShell className="space-y-5 text-black-01" grid>
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
      </PageShell>
    </>
  );
}
