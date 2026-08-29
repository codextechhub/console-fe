import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionResourcesQuery,
  useDeletePermissionResourceMutation,
  useGetPermissionModulesQuery,
} from "@/redux/services/dashboard/rbac-api";
import type { PermissionResource } from "@/redux/services/dashboard/rbac-types";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["Key Segment", "Module", "Description", "Permissions", "Status", "Action"];

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteResourceDialog({
  item,
  onClose,
}: {
  item: PermissionResource | null;
  onClose: () => void;
}) {
  const [deleteResource, { isLoading }] = useDeletePermissionResourceMutation();
  const blocked = item && item.permissions_count > 0;

  const handleConfirm = () => {
    if (!item || blocked) { onClose(); return; }
    deleteResource(item.id)
      .unwrap()
      .then(() => { toast.success("Resource deleted."); onClose(); })
      .catch(() => {});
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={blocked ? "" : "text-destructive"}>
            {blocked ? "Cannot delete this resource" : "Delete this resource?"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          {blocked ? (
            <p className="text-sm text-gray-01">
              <span className="font-mono font-semibold text-black-01">{item?.module}.{item?.name}</span> is referenced by{" "}
              <strong>{item?.permissions_count}</strong> permission(s). Delete or rekey those first, or deactivate this resource.
            </p>
          ) : (
            <p className="text-sm text-gray-01">
              Delete <span className="font-mono font-semibold text-black-01">{item?.module}.{item?.name}</span>? This cannot be undone.
            </p>
          )}
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button variant="destructive" size="lg" onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Resource"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PermissionResources() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState({ page: 1 });
  const [deleteItem, setDeleteItem] = useState<PermissionResource | null>(null);

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
    ...(modulesData?.data ?? []).map((m) => ({ value: m.name, label: m.name })),
  ];
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const tableData = resources.map((r: PermissionResource) => ({
    keySegment: <span className="font-mono text-xs font-semibold text-black-01">{r.module}.{r.name}</span>,
    module: <Badge variant="default">{r.module}</Badge>,
    description: <span className="text-xs text-gray-01 max-w-64 truncate block">{r.description || "-"}</span>,
    permissions: r.permissions_count > 0
      ? <Badge variant="default">{r.permissions_count}</Badge>
      : <span className="text-xs text-gray-01">-</span>,
    status: <Badge variant={r.is_active ? "active" : "inactive"}>{r.is_active ? "Active" : "Inactive"}</Badge>,
    _raw: r,
  }));

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Resources</p>
            <p className="text-xs text-gray-01 mt-0.5">
              The middle segment of a permission key. Each resource is scoped to a module - finance.invoice is distinct from settings.invoice.
            </p>
          </div>
          <PermissionGate permission={P.CREATE_PERMISSION}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.RESOURCES.CREATE)}>
              <Plus /> New Resource
            </Button>
          </PermissionGate>
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
            dropDown
            dropDownList={(row: { _raw: PermissionResource }) => [
              ...(hasPermission(P.MODIFY_PERMISSION) ? [{
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.PERMISSIONS.RESOURCES.EDIT(row._raw.id)),
              }] : []),
              ...(hasPermission(P.DELETE_PERMISSION) ? [{
                label: "Delete",
                className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                onActionClick: () => setDeleteItem(row._raw),
              }] : []),
            ]}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page: page as number }))}
          />
        )}
      </PageShell>

      <DeleteResourceDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
    </>
  );
}
