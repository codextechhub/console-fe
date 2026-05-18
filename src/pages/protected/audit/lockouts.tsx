import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import PromptModal from "@/components/modal/prompt-modal";
import { useGetAccountLockoutsQuery, useUnlockAccountMutation } from "@/redux/services/dashboard/securityApi";
import { formatRelativeDate } from "@/utils/helpers";
import { usePermissions } from "@/hooks/use-permissions";
import { ActorCell } from "./components/audit-cells";
import { P } from "@/permissions";
import type { AccountLockout } from "@/redux/services/dashboard/securityTypes";
import { toast } from "sonner";

const TABLE_HEADERS = ["User", "Locked until", "Reason", "Failure count", "Last failure IP", "Last failure", "Status", "Action"];

export default function AccountLockouts() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"true" | "">("true");
  const [confirmUnlock, setConfirmUnlock] = useState<AccountLockout | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (filter === "true") p.is_locked = "true";
    return p;
  }, [page, filter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAccountLockoutsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const [unlock, { isLoading: unlocking }] = useUnlockAccountMutation();

  const lockouts = data?.data ?? [];

  const tableData = lockouts.map((l) => ({
    user: (
      <ActorCell
        label={
          [l.user.first_name, l.user.last_name].filter(Boolean).join(" ") || l.user.email
        }
        email={l.user.email}
      />
    ),
    locked_until: <span className="text-xs">{l.locked_until ? formatRelativeDate(l.locked_until) : "—"}</span>,
    reason: <span className="font-mono text-xs">{l.locked_reason || "—"}</span>,
    failure_count: <span className="font-semibold text-xs">{l.failure_count}</span>,
    last_ip: <span className="font-mono text-xs">{l.last_failure_ip ?? "—"}</span>,
    last_at: <span className="text-xs">{l.last_failure_at ? formatRelativeDate(l.last_failure_at) : "—"}</span>,
    status: l.is_locked ? (
      <Badge variant="suspended" className="text-[10px] uppercase">Locked</Badge>
    ) : (
      <Badge variant="active" className="text-[10px] uppercase">Cleared</Badge>
    ),
    _lockout: l,
  }));

  const handleUnlock = () => {
    if (!confirmUnlock) return;
    unlock({ user_id: confirmUnlock.user.id, send_reset: true })
      .unwrap()
      .then(() => {
        toast.success("Account unlocked.");
        setConfirmUnlock(null);
      })
      .catch(() => {});
  };

  return (
    <DashboardLayout title="Account Lockouts">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Account Lockouts</p>
            <p className="text-xs text-gray-01 mt-0.5">Locked accounts and their lockout history.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="inline-flex bg-white rounded-md p-1 border border-gray-200">
          {[
            { v: "true" as const, l: "Currently locked" },
            { v: "" as const, l: "All history" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => { setFilter(o.v); setPage(1); }}
              className={`px-3 py-1 text-xs rounded ${
                filter === o.v ? "bg-blue-600 text-white" : "text-gray-01"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load lockouts.</p>
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
            dropDownList={(row: { _lockout: AccountLockout }) =>
              hasPermission(P.REACTIVATE_TEAM_MEMBER) && row._lockout.is_locked
                ? [
                    {
                      label: "Unlock account",
                      className: "",
                      onActionClick: () => setConfirmUnlock(row._lockout),
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
          isOpen={!!confirmUnlock}
          onClose={() => setConfirmUnlock(null)}
          onConfirm={handleUnlock}
          title="Unlock account?"
          description={`Reset the lockout state for ${confirmUnlock?.user.email}. A password reset email will be sent.`}
          onConfirmText="Unlock"
          canCancel
          loading={unlocking}
        />
      </main>
    </DashboardLayout>
  );
}
