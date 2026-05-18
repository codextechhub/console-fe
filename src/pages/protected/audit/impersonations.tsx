import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import PromptModal from "@/components/modal/prompt-modal";
import { useGetImpersonationsQuery, useEndImpersonationMutation } from "@/redux/services/dashboard/securityApi";
import { formatRelativeDate } from "@/utils/helpers";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import type { ImpersonationSession } from "@/redux/services/dashboard/securityTypes";
import { toast } from "sonner";

const TABLE_HEADERS = ["Staff (impersonator)", "Target user", "School", "Justification", "Status", "Started", "Ends / Ended", "Action"];

export default function Impersonations() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "ENDED">("");
  const [confirmEnd, setConfirmEnd] = useState<ImpersonationSession | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [page, statusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetImpersonationsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const [endImpersonation, { isLoading: ending }] = useEndImpersonationMutation();

  const list = data?.data ?? [];

  const tableData = list.map((i) => ({
    staff: <span className="text-xs font-medium">{i.staff_email}</span>,
    target: <span className="text-xs">{i.target_email}</span>,
    school: <span className="text-xs">#{i.school}</span>,
    justification: <span className="text-xs text-gray-01 line-clamp-1 max-w-[260px]">{i.justification}</span>,
    status: i.status === "ACTIVE" ? (
      <Badge variant="suspended" className="text-[10px] uppercase">Active</Badge>
    ) : (
      <Badge variant="inactive" className="text-[10px] uppercase">Ended</Badge>
    ),
    started: <span className="text-xs">{formatRelativeDate(i.started_at)}</span>,
    ends: (
      <span className="text-xs">
        {i.status === "ACTIVE" ? formatRelativeDate(i.ends_at) : i.ended_at ? formatRelativeDate(i.ended_at) : "—"}
      </span>
    ),
    _imp: i,
  }));

  const handleEnd = () => {
    if (!confirmEnd) return;
    endImpersonation({ session_id: confirmEnd.id })
      .unwrap()
      .then(() => {
        toast.success("Impersonation ended.");
        setConfirmEnd(null);
      })
      .catch(() => {});
  };

  return (
    <DashboardLayout title="Impersonations">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Impersonation Sessions</p>
            <p className="text-xs text-gray-01 mt-0.5">Vision staff acting on behalf of school users.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="inline-flex bg-white rounded-md p-1 border border-gray-200">
          {[
            { v: "" as const, l: "All" },
            { v: "ACTIVE" as const, l: "Active" },
            { v: "ENDED" as const, l: "Ended" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => { setStatusFilter(o.v); setPage(1); }}
              className={`px-3 py-1 text-xs rounded ${
                statusFilter === o.v ? "bg-blue-600 text-white" : "text-gray-01"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load impersonations.</p>
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
            dropDownList={(row: { _imp: ImpersonationSession }) =>
              hasPermission(P.END_IMPERSONATION) && row._imp.status === "ACTIVE"
                ? [
                    {
                      label: "End impersonation",
                      className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                      onActionClick: () => setConfirmEnd(row._imp),
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
          title="End impersonation?"
          description={`This will immediately end ${confirmEnd?.staff_email}'s session as ${confirmEnd?.target_email}. The action is logged.`}
          onConfirmText="End impersonation"
          onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
          canCancel
          loading={ending}
        />
      </main>
    </DashboardLayout>
  );
}
