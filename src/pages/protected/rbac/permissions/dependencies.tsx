import { useState, useMemo } from "react";
import { Plus, RefreshCw, ArrowRight, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
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
import { cn } from "@/lib/utils";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import {
  useGetPermissionDependenciesQuery,
  useCreatePermissionDependencyMutation,
  useDeletePermissionDependencyMutation,
  useGetPermissionsQuery,
} from "@/redux/services/dashboard/rbacApi";
import type { PermissionDependency } from "@/redux/services/dashboard/rbacTypes";

const TABLE_HEADERS = ["Permission", "", "Depends On", "Action"];

// ── Add Dependency Sheet ───────────────────────────────────────────────────────
function AddDependencySheet({
  open,
  onClose,
  existingDeps,
}: {
  open: boolean;
  onClose: () => void;
  existingDeps: PermissionDependency[];
}) {
  const [permKey, setPermKey] = useState("");
  const [depsOnKey, setDepsOnKey] = useState("");
  const [error, setError] = useState("");
  const [createDep, { isLoading }] = useCreatePermissionDependencyMutation();
  const { data: permsData } = useGetPermissionsQuery({ page: 1, page_size: 500 });
  const perms = permsData?.data ?? [];
  const permOptions = perms.map((p) => ({ value: p.key, label: p.key }));

  const handleSubmit = () => {
    setError("");
    if (!permKey || !depsOnKey) { setError("Pick exactly one permission and one dependency."); return; }
    if (permKey === depsOnKey) { setError("A permission cannot depend on itself."); return; }
    if (existingDeps.some((d) => d.permission_key === permKey && d.depends_on_key === depsOnKey)) {
      setError("This dependency already exists.");
      return;
    }
    createDep({ permission_key: permKey, depends_on_key: depsOnKey })
      .unwrap()
      .then(() => {
        toast.success(`Dependency added: ${permKey} → ${depsOnKey}`);
        setPermKey("");
        setDepsOnKey("");
        onClose();
      })
      .catch((err) => {
        setError(err?.data?.detail || "Failed to add dependency.");
      });
  };

  const canPreview = permKey && depsOnKey;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-none flex flex-col gap-0 p-0" side="right">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">Add Dependency</SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            Define that a permission requires another permission to be granted alongside it.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Two-column picker */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black-01">
                Permission <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-gray-01">The permission that has a dependency.</p>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm font-mono text-black-01 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={permKey}
                onChange={(e) => { setError(""); setPermKey(e.target.value); }}
              >
                <option value="">Select a permission...</option>
                {permOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center gap-1 pb-1.5">
              <ArrowRight className="size-5 text-gray-01" />
              <span className="text-[10px] text-gray-01 font-medium uppercase tracking-wide">requires</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black-01">
                Depends On <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-gray-01">The permission that must also be granted.</p>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm font-mono text-black-01 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={depsOnKey}
                onChange={(e) => { setError(""); setDepsOnKey(e.target.value); }}
              >
                <option value="">Select the required permission...</option>
                {permOptions.filter((p) => p.value !== permKey).map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-md border border-white-02 bg-white p-5 space-y-3">
            <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">Preview</p>
            {canPreview ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm font-semibold text-black-01 bg-gray-50 border border-white-02 rounded px-3 py-1.5">
                  {permKey}
                </span>
                <div className="flex items-center gap-1.5 text-gray-01">
                  <ArrowRight className="size-4" />
                  <span className="text-xs font-medium">requires</span>
                </div>
                <span className="font-mono text-sm font-semibold text-primary bg-pry-01/30 border border-pry-01 rounded px-3 py-1.5">
                  {depsOnKey}
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-01">
                Select both permissions above to preview the dependency.
              </p>
            )}
          </div>

          {/* Info note */}
          <div className="rounded-md bg-pry-01/30 border border-pry-01 px-4 py-3 space-y-1.5 text-xs text-gray-01">
            <p className="font-semibold text-black-01">How dependencies work</p>
            <ul className="list-disc list-inside space-y-1">
              <li>When a role grants the left permission, the right permission must also be granted.</li>
              <li>Dependencies are validated when roles are assigned to users.</li>
              <li>Circular dependencies are not allowed.</li>
            </ul>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/5 border border-destructive/20 px-4 py-3 text-xs text-destructive">
              <p className="font-semibold">Cannot add dependency</p>
              <p className="mt-0.5">{error}</p>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button size="lg" onClick={handleSubmit} disabled={isLoading || !canPreview}>
            {isLoading ? "Adding..." : "Add Dependency"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Dependency Chain Sheet ─────────────────────────────────────────────────────
function DependencyChainSheet({
  permissionKey,
  allDeps,
  onClose,
}: {
  permissionKey: string | null;
  allDeps: PermissionDependency[];
  onClose: () => void;
}) {
  const requires = useMemo(() => {
    if (!permissionKey) return [];
    const out = new Set<string>();
    const walk = (k: string) => {
      for (const d of allDeps.filter((x) => x.permission_key === k)) {
        if (!out.has(d.depends_on_key)) { out.add(d.depends_on_key); walk(d.depends_on_key); }
      }
    };
    walk(permissionKey);
    return [...out];
  }, [permissionKey, allDeps]);

  const requiredBy = useMemo(() => {
    if (!permissionKey) return [];
    const out = new Set<string>();
    const walk = (k: string) => {
      for (const d of allDeps.filter((x) => x.depends_on_key === k)) {
        if (!out.has(d.permission_key)) { out.add(d.permission_key); walk(d.permission_key); }
      }
    };
    walk(permissionKey);
    return [...out];
  }, [permissionKey, allDeps]);

  return (
    <Sheet open={!!permissionKey} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-none flex flex-col gap-0 p-0" side="right">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">Dependency Chain</SheetTitle>
          <SheetDescription className="font-mono text-xs text-gray-01">{permissionKey}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">This permission requires</p>
              {requires.length === 0 ? (
                <p className="text-xs text-gray-01">No upstream dependencies.</p>
              ) : (
                <div className="space-y-2">
                  {requires.map((k) => (
                    <div key={k} className="flex items-center gap-2 bg-white border border-white-02 rounded-md px-3 py-2">
                      <Link className="size-3.5 text-gray-01 shrink-0" />
                      <span className="font-mono text-xs text-black-01">{k}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">Required by</p>
              {requiredBy.length === 0 ? (
                <p className="text-xs text-gray-01">Nothing depends on this permission.</p>
              ) : (
                <div className="space-y-2">
                  {requiredBy.map((k) => (
                    <div key={k} className="flex items-center gap-2 bg-white border border-white-02 rounded-md px-3 py-2">
                      <Link className="size-3.5 text-gray-01 shrink-0" />
                      <span className="font-mono text-xs text-black-01">{k}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end">
          <Button variant="outline" size="lg" onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteDependencyDialog({
  item,
  onClose,
}: {
  item: PermissionDependency | null;
  onClose: () => void;
}) {
  const [deleteDep, { isLoading }] = useDeletePermissionDependencyMutation();

  const handleConfirm = () => {
    if (!item) return;
    deleteDep(item.id)
      .unwrap()
      .then(() => { toast.success("Dependency removed."); onClose(); })
      .catch(() => {});
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Remove this dependency?</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          {item && (
            <div className="flex items-center gap-2 bg-gray-50 border border-white-02 rounded-md px-4 py-3">
              <span className="font-mono text-xs font-semibold text-black-01">{item.permission_key}</span>
              <ArrowRight className="size-3.5 text-gray-01 shrink-0" />
              <span className="font-mono text-xs font-semibold text-black-01">{item.depends_on_key}</span>
            </div>
          )}
          <p className="text-sm text-gray-01">
            Roles using <span className="font-mono font-semibold text-black-01">{item?.permission_key}</span> will no longer require{" "}
            <span className="font-mono font-semibold text-black-01">{item?.depends_on_key}</span>.
          </p>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="destructive" size="lg" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PermissionDependencies() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });
  const [addOpen, setAddOpen] = useState(false);
  const [chainKey, setChainKey] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<PermissionDependency | null>(null);

  const params = useMemo(() => ({
    ...query,
    search: debouncedSearch,
  }), [query, debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionDependenciesQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const deps = data?.data ?? [];

  const tableData = deps.map((d: PermissionDependency) => ({
    permission: <span className="font-mono text-xs font-semibold text-black-01">{d.permission_key}</span>,
    arrow: <ArrowRight className="size-3.5 text-gray-01" />,
    dependsOn: <span className="font-mono text-xs font-semibold text-black-01">{d.depends_on_key}</span>,
    _raw: d,
    _id: d.id,
  }));

  return (
    <DashboardLayout title="Permission Dependencies">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Dependencies</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Some permissions require other permissions to be present. Dependencies are validated when assigning roles.
            </p>
          </div>
          <Button size="lg" onClick={() => setAddOpen(true)}>
            <Plus /> Add Dependency
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CustomInput
            id="search-deps"
            canSearch
            placeholder="Search permission or depends_on key..."
            className="h-10"
            containerClass="w-full sm:max-w-[320px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="white" size="lg"
            className="[&_svg]:size-5 font-medium font-mont shrink-0"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn(isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-destructive">Failed to load dependencies. Please try again.</p>
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
            dropDownList={(row: { _raw: PermissionDependency }) => [
              {
                label: "View Chain",
                className: "",
                onActionClick: () => setChainKey(row._raw.permission_key),
              },
              {
                label: "Remove",
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

      <AddDependencySheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingDeps={deps}
      />

      <DependencyChainSheet
        permissionKey={chainKey}
        allDeps={deps}
        onClose={() => setChainKey(null)}
      />

      <DeleteDependencyDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
    </DashboardLayout>
  );
}
