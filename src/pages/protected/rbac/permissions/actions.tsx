import { useState, useMemo } from "react";
import { Plus, RefreshCw, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import {
  useGetPermissionActionsQuery,
  useCreatePermissionActionMutation,
  useUpdatePermissionActionMutation,
  useDeletePermissionActionMutation,
} from "@/redux/services/dashboard/rbacApi";
import type { PermissionAction } from "@/redux/services/dashboard/rbacTypes";

const TABLE_HEADERS = ["Name", "Description", "Permissions", "Status", "Created", "Action"];

type DrawerMode = "create" | "edit";

// ── Action Sheet ───────────────────────────────────────────────────────────────
function ActionSheet({
  open,
  mode,
  item,
  existingNames,
  onClose,
}: {
  open: boolean;
  mode: DrawerMode;
  item: PermissionAction | null;
  existingNames: string[];
  onClose: () => void;
}) {
  const [name, setName] = useState(mode === "edit" && item ? item.name : "");
  const [description, setDescription] = useState(mode === "edit" && item ? (item.description ?? "") : "");
  const [isActive, setIsActive] = useState(mode === "edit" && item ? item.is_active : true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createAction, { isLoading: creating }] = useCreatePermissionActionMutation();
  const [updateAction, { isLoading: updating }] = useUpdatePermissionActionMutation();
  const isLoading = creating || updating;
  const isEdit = mode === "edit";

  const canSubmit = isEdit
    ? description !== (item?.description ?? "") || isActive !== (item?.is_active ?? true)
    : name.trim() !== "" && description.trim() !== "";

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!isEdit) {
      if (!name) e.name = "Required.";
      else if (!/^[a-z][a-z0-9_]*$/.test(name)) e.name = "Lowercase, underscores, must start with a letter.";
      else if (existingNames.includes(name)) e.name = "An action with this name already exists.";
    }
    if (!description.trim()) e.description = "Add a short description.";
    setErrors(e);
    if (Object.keys(e).length) return;

    if (isEdit && item) {
      updateAction({ name: item.name, body: { description: description.trim(), is_active: isActive } })
        .unwrap()
        .then(() => { toast.success("Action updated."); onClose(); })
        .catch(() => {});
    } else {
      createAction({ name, description: description.trim(), is_active: isActive })
        .unwrap()
        .then(() => { toast.success(`Action "${name}" created.`); onClose(); })
        .catch(() => {});
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">
            {isEdit ? "Edit Action" : "New Action"}
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            {isEdit ? item?.name : "Add an action verb to the global vocabulary."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isEdit && (
            <div className="rounded-md bg-pry-01/30 border border-pry-01 px-4 py-3 flex items-start gap-2 text-xs text-gray-01">
              <Lock className="size-3.5 mt-0.5 shrink-0 text-primary" />
              <span>Name is the primary key. Actions can't be renamed because every permission key ends with this slug.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black-01">
              Name (slug){!isEdit && <span className="text-destructive"> *</span>}
            </label>
            <p className="text-xs text-gray-01">Lowercase, underscores. e.g. view, create, approve.</p>
            {isEdit ? (
              <p className="font-mono text-sm font-semibold text-black-01">{name}</p>
            ) : (
              <>
                <input
                  className={cn(
                    "w-full h-10 px-3 rounded-md border text-sm font-mono text-black-01 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                    errors.name ? "border-destructive" : "border-gray-200"
                  )}
                  placeholder="view"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black-01">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="What does this action allow?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-white-02 rounded-md px-4 py-3">
            <div>
              <p className="text-sm font-medium text-black-01">Active</p>
              <p className="text-xs text-gray-01">Shown in the action dropdown for new permissions</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button size="lg" onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            {isLoading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Action")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState({ page: 1 });
  const [drawer, setDrawer] = useState<{ mode: DrawerMode; item: PermissionAction | null } | null>(null);
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
  const existingNames = actions.map((a) => a.name);

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
          <Button size="lg" onClick={() => setDrawer({ mode: "create", item: null })}>
            <Plus /> New Action
          </Button>
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
            <CustomNativeSelect
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
              {
                label: "Edit",
                className: "",
                onActionClick: () => setDrawer({ mode: "edit", item: row._raw }),
              },
              {
                label: "Delete",
                className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                onActionClick: () => setDeleteItem(row._raw),
              },
            ]}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page: page as number }))}
          />
        )}
      </main>

      {drawer && (
        <ActionSheet
          open={!!drawer}
          mode={drawer.mode}
          item={drawer.item}
          existingNames={existingNames}
          onClose={() => setDrawer(null)}
        />
      )}

      <DeleteActionDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
    </DashboardLayout>
  );
}
