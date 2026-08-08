import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routes-path";
import { useGetEntityTrailsQuery } from "@/redux/services/dashboard/audit-api";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import type { EntityTrail } from "@/redux/services/dashboard/audit-types";
import { EntityCell } from "./components/audit-cells";

const TABLE_HEADERS = ["Entity", "ID", "Events", "First seen", "Last seen", "Action"];

const ENTITY_TYPES = [
  "User", "School", "Branch", "Role", "Permission",
  "PermissionGroup", "Invitation", "ImportBatch", "ImportTemplate",
];

export default function EntityTrailsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.search = debouncedSearch;
    if (entityType) p.entity_type = entityType;
    return p;
  }, [page, debouncedSearch, entityType]);

  const { data, isLoading, isError, refetch, isFetching } = useGetEntityTrailsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const trails = data?.data ?? [];

  const tableData = trails.map((t: EntityTrail) => ({
    entity: <EntityCell label={t.entity_label} type={t.entity_type} />,
    id: <span className="font-mono text-xs break-all text-gray-01">{t.entity_id}</span>,
    events: <span className="font-semibold">{t.event_count}</span>,
    first: t.first_event_at ? formatRelativeDate(t.first_event_at) : "-",
    last: t.last_event_at ? formatRelativeDate(t.last_event_at) : "-",
    _type: t.entity_type,
    _id: t.entity_id,
  }));

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Entity Trails</p>
            <p className="text-xs text-gray-01 mt-0.5">Every audited entity with its full lifecycle.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CustomInput
            id="search-trails"
            canSearch
            placeholder="Search by entity id or label..."
            className="h-10"
            containerClass="w-full sm:max-w-[320px]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="h-10 text-sm border border-gray-300 rounded px-3 sm:max-w-[200px] bg-white"
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          >
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load entity trails.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            onRowClick={(row: { _type: string; _id: string }) =>
              navigate(routesPath.PROTECTED.AUDIT.ENTITY_TRAIL_DETAIL(row._type, row._id))
            }
            dropDown
            actionButton="View"
            actionButtonOnClick={(row) =>
              navigate(routesPath.PROTECTED.AUDIT.ENTITY_TRAIL_DETAIL(
                (row as { _type: string; _id: string })._type,
                (row as { _type: string; _id: string })._id,
              ))
            }
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(p) => setPage(p as number)}
          />
        )}
      </main>
    </>
  );
}
