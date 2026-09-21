import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { useGetPermissionActionsQuery } from "@/redux/services/dashboard/rbac-api";
import type { PermissionAction } from "@/redux/services/dashboard/rbac-types";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["Action", "Description", "Permissions", "Status", "Created"];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PermissionActions() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState({ page: 1 });

  const params = useMemo(() => ({
    ...query,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { is_active: statusFilter }),
  }), [query, debouncedSearch, statusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionActionsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const actions = data?.data ?? [];

  const tableData = actions.map((a: PermissionAction) => ({
    name: <span className="text-xs font-semibold text-black-01 capitalize">{a.name.replaceAll("_", " ")}</span>,
    description: <span className="text-xs text-gray-01 max-w-64 truncate block">{a.description || "-"}</span>,
    permissions: a.permissions_count > 0
      ? <Badge variant="default">{a.permissions_count}</Badge>
      : <span className="text-xs text-gray-01">-</span>,
    status: <Badge variant={a.is_active ? "active" : "inactive"}>{a.is_active ? "Active" : "Inactive"}</Badge>,
    created: <span className="text-xs text-gray-01">{formatRelativeDate(a.created_at)}</span>,
  }));

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div>
            <p className="font-semibold font-mont text-gray-01">Permission Actions</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Backend-defined actions people can perform on a resource.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CustomInput
            id="search-actions"
            canSearch
            placeholder="Search by name or description..."
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inline-flex items-center gap-3 shrink-0">
            <SearchSelect
              id="filter-status"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setQuery({ page: 1 }); }}
              containerClass="w-36"
            />
            <Button
              variant="white" size="lg"
              className="[&_svg]:size-5 font-medium font-mont"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-destructive">Failed to load actions. Please try again.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page: page as number }))}
          />
        )}
      </PageShell>
    </>
  );
}
