import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { cn } from "@/lib/utils";
import { useDebounce } from "react-haiku";
import {
  useGetPermissionResourcesQuery,
  useGetPermissionModulesQuery,
} from "@/redux/services/dashboard/rbac-api";
import type { PermissionResource } from "@/redux/services/dashboard/rbac-types";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["Resource", "Module", "Description", "Permissions", "Status"];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PermissionResources() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState({ page: 1 });

  const params = useMemo(() => ({
    ...query,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(moduleFilter !== "all" && { module: moduleFilter }),
    ...(statusFilter !== "all" && { is_active: statusFilter }),
  }), [query, debouncedSearch, moduleFilter, statusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionResourcesQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const { data: modulesData } = useGetPermissionModulesQuery({ page: 1, page_size: 200 });

  const resources = data?.data ?? [];
  const moduleOptions = [
    { value: "all", label: "All Modules" },
    ...(modulesData?.data ?? []).map((m) => ({ value: m.name, label: m.label || m.name })),
  ];
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const tableData = resources.map((r: PermissionResource) => ({
    resource: <span className="text-xs font-semibold text-black-01">{r.label || r.name}</span>,
    module: <Badge variant="default">{r.module_label}</Badge>,
    description: <span className="text-xs text-gray-01 max-w-64 truncate block">{r.description || "-"}</span>,
    permissions: r.permissions_count > 0
      ? <Badge variant="default">{r.permissions_count}</Badge>
      : <span className="text-xs text-gray-01">-</span>,
    status: <Badge variant={r.is_active ? "active" : "inactive"}>{r.is_active ? "Active" : "Inactive"}</Badge>,
  }));

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div>
            <p className="font-semibold font-mont text-gray-01">Permission Resources</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Backend-defined things people can access within each module.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CustomInput
            id="search-resources"
            canSearch
            placeholder="Search by name or description..."
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inline-flex items-center gap-3 shrink-0 flex-wrap">
            <SearchSelect
              id="filter-module"
              options={moduleOptions}
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setQuery({ page: 1 }); }}
              containerClass="w-40"
            />
            <SearchSelect
              id="filter-status"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setQuery({ page: 1 }); }}
              containerClass="w-32"
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
            <p className="text-sm font-medium text-destructive">Failed to load resources. Please try again.</p>
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
