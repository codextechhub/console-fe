import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import PromptModal from "@/components/modal/prompt-modal";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { formatRelativeDate } from "@/utils/helpers";
import { useGetLoginSessionsQuery, useForceLogoutMutation } from "@/redux/services/dashboard/securityApi";
import type { LoginSession } from "@/redux/services/dashboard/securityTypes";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";

const TABLE_HEADERS = ["User", "School", "Device", "IP Address", "Last seen", "Status", "Action"];

export default function LiveSessions() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const [confirmEnd, setConfirmEnd] = useState<LoginSession | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter === "active") p.is_active = "true";
    return p;
  }, [page, debouncedSearch, statusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetLoginSessionsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const [forceLogout, { isLoading: ending }] = useForceLogoutMutation();

  const sessions = data?.data ?? [];

  const tableData = sessions.map((s) => ({
    user: (
      <div>
        <p className="text-xs font-medium">{s.user?.email ?? "—"}</p>
        {(s.user?.first_name || s.user?.last_name) && (
          <p className="text-[10px] text-gray-01">
            {[s.user.first_name, s.user.last_name].filter(Boolean).join(" ")}
          </p>
        )}
      </div>
    ),
    school: <span className="text-xs">{s.school?.name ?? "Platform"}</span>,
    device: <span className="text-xs">{s.device_label || s.user_agent?.slice(0, 40) || "—"}</span>,
    ip: <span className="font-mono text-xs">{s.ip_address ?? "—"}</span>,
    last_seen: <span className="text-xs">{formatRelativeDate(s.last_seen_at)}</span>,
    status: s.is_active ? (
      <Badge variant="active" className="text-[10px]">Active</Badge>
    ) : (
      <Badge variant="inactive" className="text-[10px]">Ended</Badge>
    ),
    _session: s,
  }));

  const handleEnd = () => {
    if (!confirmEnd) return;
    forceLogout({ session_id: confirmEnd.id, reason: "ADMIN_REVOKED" })
      .unwrap()
      .then(() => {
        toast.success("Session ended.");
        setConfirmEnd(null);
      })
      .catch(() => {});
  };

  return (
    <DashboardLayout title="Live Sessions">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Live Sessions</p>
            <p className="text-xs text-gray-01 mt-0.5">Real-time view of all authenticated user sessions.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <CustomInput
            id="search-sessions"
            canSearch
            placeholder="Search sessions..."
            className="h-10"
            containerClass="w-full sm:max-w-[320px]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <div className="inline-flex bg-white rounded-md p-1 border border-gray-200">
            {(["active", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1 text-xs rounded ${
                  statusFilter === s ? "bg-blue-600 text-white" : "text-gray-01"
                }`}
              >
                {s === "active" ? "Active only" : "All"}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load sessions.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            dropDown
            dropDownList={(row: { _session: LoginSession }) =>
              hasPermission(P.SUSPEND_TEAM_MEMBER) && row._session.is_active
                ? [
                    {
                      label: "End session",
                      className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                      onActionClick: () => setConfirmEnd(row._session),
                    },
                  ]
                : []
            }
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
          title="End session?"
          description={`This will sign out ${confirmEnd?.user?.email ?? "the user"} from this device. The action is logged.`}
          onConfirmText="End session"
          onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
          canCancel
          loading={ending}
        />
      </main>
    </DashboardLayout>
  );
}
