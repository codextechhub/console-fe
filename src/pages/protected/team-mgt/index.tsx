import Tabs from "@/components/custom/tab";
import DashboardLayout from "@/components/layout/dashboard-layout";
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
    // Drafts are parked (individual) CX hires awaiting completion — CX only.
    ...(scope === "cx" ? [{ label: "Drafts", value: "drafts" }] : []),
  ];

  return (
    <DashboardLayout title={scope === "cx" ? "CX Users" : "School Users"}>
      <main className="px-4.5 py-6 space-y-5 text-black-01 grid ">
        <Tabs tabs={tabList} tabKey="tab" />

        {activeTab === "drafts" && scope === "cx" ? (
          <MembersTab scope={scope} variant="drafts" />
        ) : activeTab === "invites" ? (
          <InvitesTab scope={scope} />
        ) : (
          <MembersTab scope={scope} />
        )}
      </main>
    </DashboardLayout>
  );
}
