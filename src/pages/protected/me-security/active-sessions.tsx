import { useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import PromptModal from "@/components/modal/prompt-modal";
import {
  useGetLoginSessionsQuery,
  useForceLogoutMutation,
} from "@/redux/services/dashboard/securityApi";
import { formatRelativeDate } from "@/utils/helpers";
import type { LoginSession } from "@/redux/services/dashboard/securityTypes";
import { toast } from "sonner";

const TABLE_HEADERS = ["Device", "IP address", "Last seen", "Status", "Action"];

export default function MyActiveSessions() {
  const [page, setPage] = useState(1);
  const [confirmEnd, setConfirmEnd] = useState<LoginSession | null>(null);
  const { data, isLoading, isError, refetch, isFetching } = useGetLoginSessionsQuery(
    { page, is_active: "true" },
    { refetchOnMountOrArgChange: true },
  );
  const [forceLogout, { isLoading: ending }] = useForceLogoutMutation();

  const sessions = data?.data ?? [];

  const tableData = sessions.map((s) => ({
    device: <span className="text-xs">{s.device_label || s.user_agent?.slice(0, 50) || "Unknown device"}</span>,
    ip: <span className="font-mono text-xs">{s.ip_address ?? "—"}</span>,
    last_seen: <span className="text-xs">{formatRelativeDate(s.last_seen_at)}</span>,
    status: <Badge variant="active" className="text-[10px]">Active</Badge>,
    _session: s,
  }));

  const handleEnd = () => {
    if (!confirmEnd) return;
    forceLogout({ session_id: confirmEnd.id, reason: "SELF_SIGNOUT" })
      .unwrap()
      .then(() => {
        toast.success("Session ended.");
        setConfirmEnd(null);
      })
      .catch(() => {});
  };

  return (
    <DashboardLayout title="Active Sessions">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Active sessions</p>
            <p className="text-xs text-gray-01 mt-0.5">Devices currently signed in to your account.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load sessions.</p>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            dropDown
            dropDownList={(row: { _session: LoginSession }) => [
              {
                label: "Sign out of this device",
                className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                onActionClick: () => setConfirmEnd(row._session),
              },
            ]}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(p) => setPage(p as number)}
          />
        )}

        <PromptModal
          isOpen={!!confirmEnd}
          onClose={() => setConfirmEnd(null)}
          onConfirm={handleEnd}
          title="Sign out of this device?"
          description="You will be signed out of this session immediately."
          onConfirmText="Sign out"
          onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
          canCancel
          loading={ending}
        />
      </main>
    </DashboardLayout>
  );
}
