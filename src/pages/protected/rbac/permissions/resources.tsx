import { useState, useMemo, useEffect } from "react";
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
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import {
  useGetPermissionResourcesQuery,
  useCreatePermissionResourceMutation,
  useUpdatePermissionResourceMutation,
  useDeletePermissionResourceMutation,
  useGetPermissionModulesQuery,
} from "@/redux/services/dashboard/rbacApi";
import type { PermissionResource } from "@/redux/services/dashboard/rbacTypes";

const TABLE_HEADERS = ["Key Segment", "Module", "Description", "Permissions", "Status", "Action"];

type DrawerMode = "create" | "edit";

// ── Resource Sheet ─────────────────────────────────────────────────────────────
function ResourceSheet({
  open,
  mode,
  item,
  onClose,
}: {
  open: boolean;
  mode: DrawerMode;
  item: PermissionResource | null;
  onClose: () => void;
}) {
  const [module, setModule] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createResource, { isLoading: creating }] = useCreatePermissionResourceMutation();
  const [updateResource, { isLoading: updating }] = useUpdatePermissionResourceMutation();
  const { data: modulesData } = useGetPermissionModulesQuery({ page: 1, page_size: 200 });
  const modules = (modulesData?.data ?? []).filter((m) => m.is_active);

  const isLoading = creating || updating;
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    if (isEdit && item) {
      setModule(item.module);
      setName(item.name);
      setDescription(item.description ?? "");
      setIsActive(item.is_active);
    } else {
      setModule("");
      setName("");
      setDescription("");
      setIsActive(true);
    }
    setErrors({});
  }, [open, item]);

  const canSubmit = isEdit
    ? description !== (item?.description ?? "") || isActive !== (item?.is_active ?? true)
    : module !== "" && name.trim() !== "" && description.trim() !== "";

  const combinedKey = module && name ? `${module}.${name}` : "";

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!isEdit) {
      if (!module) e.module = "Pick a module.";
      if (!name) e.name = "Required.";
      else if (!/^[a-z][a-z0-9_]*$/.test(name)) e.name = "Lowercase, underscores, must start with a letter.";
    }
    if (!description.trim()) e.description = "Add a short description.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const body = { module, name, description: description.trim(), is_active: isActive };

    if (isEdit && item) {
      updateResource({ id: item.id, body: { description: description.trim(), is_active: isActive } })
        .unwrap()
        .then(() => { toast.success("Resource updated."); onClose(); })
        .catch(() => {});
    } else {
      createResource(body)
        .unwrap()
        .then(() => { toast.success(`Resource ${module}.${name} created.`); onClose(); })
        .catch(() => {});
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">
            {isEdit ? "Edit Resource" : "New Resource"}
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            {isEdit ? `${item?.module}.${item?.name}` : "Add a resource under a module."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isEdit && (
            <div className="rounded-md bg-pry-01/30 border border-pry-01 px-4 py-3 flex items-start gap-2 text-xs text-gray-01">
              <Lock className="size-3.5 mt-0.5 shrink-0 text-primary" />
              <span>Module and name are immutable. Delete and recreate if you need to rekey.</span>
            </div>
          )}

          {combinedKey && (
            <div className="bg-gray-50 border border-white-02 rounded-md px-4 py-3">
              <p className="text-xs text-gray-01 mb-1 font-mont">Resource Key</p>
              <p className="font-mono text-sm font-semibold text-black-01">{combinedKey}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black-01">
                Module <span className="text-destructive">*</span>
              </label>
              {isEdit ? (
                <p className="font-mono text-sm text-black-01 h-10 flex items-center">{module}</p>
              ) : (
                <>
                  <CustomNativeSelect
                    id="res-module"
                    placeholder="Pick a module..."
                    options={modules.map((m) => ({ value: m.name, label: m.name }))}
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                  />
                  {errors.module && <p className="text-xs text-destructive">{errors.module}</p>}
                </>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black-01">
                Name (slug) <span className="text-destructive">*</span>
              </label>
              {isEdit ? (
                <p className="font-mono text-sm text-black-01 h-10 flex items-center">{name}</p>
              ) : (
                <>
                  <input
                    className={cn(
                      "w-full h-10 px-3 rounded-md border text-sm font-mono text-black-01 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                      errors.name ? "border-destructive" : "border-gray-200"
                    )}
                    placeholder="invoice"
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black-01">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="What does this resource represent?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-white-02 rounded-md px-4 py-3">
            <div>
              <p className="text-sm font-medium text-black-01">Active</p>
              <p className="text-xs text-gray-01">Available in resource dropdowns for new permissions</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button size="lg" onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            {isLoading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Resource")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState({ page: 1 });
  const [drawer, setDrawer] = useState<{ mode: DrawerMode; item: PermissionResource | null } | null>(null);
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
    description: <span className="text-xs text-gray-01 max-w-64 truncate block">{r.description || "—"}</span>,
    permissions: r.permissions_count > 0
      ? <Badge variant="default">{r.permissions_count}</Badge>
      : <span className="text-xs text-gray-01">—</span>,
    status: <Badge variant={r.is_active ? "active" : "inactive"}>{r.is_active ? "Active" : "Inactive"}</Badge>,
    _raw: r,
    _id: r.id,
  }));

  return (
    <DashboardLayout title="Permission Resources">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Resources</p>
            <p className="text-xs text-gray-01 mt-0.5">
              The middle segment of a permission key. Each resource is scoped to a module — finance.invoice is distinct from settings.invoice.
            </p>
          </div>
          <Button size="lg" onClick={() => setDrawer({ mode: "create", item: null })}>
            <Plus /> New Resource
          </Button>
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
            <CustomNativeSelect
              id="filter-module"
              options={moduleOptions}
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setQuery({ page: 1 }); }}
              containerClass="w-40"
            />
            <CustomNativeSelect
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
        <ResourceSheet
          open={!!drawer}
          mode={drawer.mode}
          item={drawer.item}
          onClose={() => setDrawer(null)}
        />
      )}

      <DeleteResourceDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
    </DashboardLayout>
  );
}
