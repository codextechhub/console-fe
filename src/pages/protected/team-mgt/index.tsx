import Tabs from "@/components/custom/tab";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useLocation, useSearchParams } from "react-router";
import InvitesTab from "./tabs/invites";
import MembersTab from "./tabs/members";
import BulkUploadTab from "./tabs/bulk-upload";
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
    // Bulk upload is CX-only for now (schools have their own import entry).
    ...(scope === "cx" ? [{ label: "Bulk upload", value: "bulk" }] : []),
  ];

  return (
    <DashboardLayout title={scope === "cx" ? "CX Users" : "School Users"}>
      <main className="px-4.5 py-6 space-y-5 text-black-01 grid ">
        <Tabs tabs={tabList} tabKey="tab" />

        {activeTab === "bulk" && scope === "cx" ? (
          <BulkUploadTab />
        ) : activeTab === "invites" ? (
          <InvitesTab scope={scope} />
        ) : (
          <MembersTab scope={scope} />
        )}
      </main>
    </DashboardLayout>
  );
}
