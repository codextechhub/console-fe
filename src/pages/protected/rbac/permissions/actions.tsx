import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
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
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionActionsQuery,
  useDeletePermissionActionMutation,
} from "@/redux/services/dashboard/rbac-api";
import type { PermissionAction } from "@/redux/services/dashboard/rbac-types";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const TABLE_HEADERS = ["Name", "Description", "Permissions", "Status", "Created", "Action"];

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteActionDialog({
  item,
  onClose,
}: {
  item: PermissionAction | null;
  onClose: () => void;
}) {
  const [deleteAction, { isLoading }] = useDeletePermissionActionMutation();
  const blocked = item && item.permissions_count > 0;

  const handleConfirm = () => {
    if (!item || blocked) { onClose(); return; }
    deleteAction(item.name)
      .unwrap()
      .then(() => { toast.success("Action deleted."); onClose(); })
      .catch(() => {});
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={blocked ? "" : "text-destructive"}>
            {blocked ? "Cannot delete this action" : "Delete this action?"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {blocked ? (
            <p className="text-sm text-gray-01">
              <span className="font-mono font-semibold text-black-01">{item?.name}</span> is referenced by{" "}
              <strong>{item?.permissions_count}</strong> permission(s). Delete or rekey those first, or deactivate this action.
            </p>
          ) : (
            <p className="text-sm text-gray-01">
              Delete <span className="font-mono font-semibold text-black-01">{item?.name}</span>? This cannot be undone.
            </p>
          )}
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button variant="destructive" size="lg" onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Action"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PermissionActions() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState({ page: 1 });
  const [deleteItem, setDeleteItem] = useState<PermissionAction | null>(null);

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
    name: <span className="font-mono text-xs font-semibold text-black-01">{a.name}</span>,
    description: <span className="text-xs text-gray-01 max-w-64 truncate block">{a.description || "—"}</span>,
    permissions: a.permissions_count > 0
      ? <Badge variant="default">{a.permissions_count}</Badge>
      : <span className="text-xs text-gray-01">—</span>,
    status: <Badge variant={a.is_active ? "active" : "inactive"}>{a.is_active ? "Active" : "Inactive"}</Badge>,
    created: <span className="text-xs text-gray-01">{formatRelativeDate(a.created_at)}</span>,
    _raw: a,
  }));

  return (
    <DashboardLayout title="Permission Actions">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Actions</p>
            <p className="text-xs text-gray-01 mt-0.5">
              The final segment of a permission key. Verbs that an actor performs on a resource — view, create, approve, refund.
            </p>
          </div>
          <PermissionGate permission={P.CREATE_PERMISSION}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.ACTIONS.CREATE)}>
              <Plus /> New Action
            </Button>
          </PermissionGate>
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
            dropDown
            dropDownList={(row: { _raw: PermissionAction }) => [
              ...(hasPermission(P.MODIFY_PERMISSION) ? [{
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.PERMISSIONS.ACTIONS.EDIT(row._raw.name)),
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
      </main>

      <DeleteActionDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
    </DashboardLayout>
  );
}
