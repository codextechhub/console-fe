import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { useGetAuditEventsQuery } from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { ActorCell, EntityCell } from "./components/audit-cells";

const TABLE_HEADERS = ["When", "Action", "Actor", "Entity", "Status", "Module"];

// Identity / password-related action types tracked in the audit log.
const PASSWORD_ACTIONS = [
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET",
  "PASSWORD_CHANGED",
  "EMAIL_CHANGED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_REACTIVATED",
  "ACCOUNT_ACTIVATED",
  "FORCE_LOGOUT",
];

export default function PasswordActivity() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, module_key: "IDENTITY" };
    if (debouncedSearch) p.search = debouncedSearch;
    if (actionFilter) p.action_type = actionFilter;
    return p;
  }, [page, debouncedSearch, actionFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditEventsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const events = data?.data ?? [];

  const tableData = events.map((e) => ({
    when: <span className="text-xs">{formatRelativeDate(e.event_at)}</span>,
    action: <span className="font-mono text-xs">{e.action_type}</span>,
    actor: (
      <ActorCell
        label={e.actor_user?.full_name || e.actor_user?.email || e.actor_label || "System"}
        email={e.actor_user?.email}
      />
    ),
    entity: <EntityCell label={e.entity_label} type={e.entity_type} />,
    status: (
      <Badge variant={e.status === "SUCCESS" ? "active" : "suspended"} className="text-[10px] uppercase">
        {e.status}
      </Badge>
    ),
    module: <span className="text-xs uppercase">{e.module_key}</span>,
  }));

  return (
    <DashboardLayout title="Password Activity">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Password & Account Activity</p>
            <p className="text-xs text-gray-01 mt-0.5">Identity-related events across all schools.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <CustomInput
            id="search-password"
            canSearch
            placeholder="Search by actor, entity..."
            className="h-10"
            containerClass="w-full sm:max-w-[320px]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="h-10 text-sm border border-gray-300 rounded px-3 bg-white"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">All actions</option>
            {PASSWORD_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load events.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            dropDown={false}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(p) => setPage(p as number)}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
