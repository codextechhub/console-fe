import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { useGetMyActivityQuery } from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { EntityCell } from "../audit/components/audit-cells";

const TABLE_HEADERS = ["When", "Action", "Entity", "Module", "Status"];

export default function MyActivity() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.search = debouncedSearch;
    return p;
  }, [page, debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useGetMyActivityQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const events = data?.data ?? [];

  const tableData = events.map((e) => ({
    when: <span className="text-xs">{formatRelativeDate(e.event_at)}</span>,
    action: <span className="font-mono text-xs">{e.action_type}</span>,
    entity: <EntityCell label={e.entity_label} type={e.entity_type} />,
    module: <span className="text-xs uppercase">{e.module_key}</span>,
    status: (
      <Badge variant={e.status === "SUCCESS" ? "active" : "suspended"} className="text-[10px] uppercase">
        {e.status}
      </Badge>
    ),
  }));

  return (
    <DashboardLayout title="My Activity">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Account activity</p>
            <p className="text-xs text-gray-01 mt-0.5">Audit trail of actions you performed on the platform.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <CustomInput
          id="search-activity"
          canSearch
          placeholder="Search your activity..."
          className="h-10"
          containerClass="w-full sm:max-w-[320px]"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load activity.</p>
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
