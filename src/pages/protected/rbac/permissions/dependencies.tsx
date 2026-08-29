import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw, ArrowRight, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useDeletePermissionDependencyMutation,
} from "@/redux/services/dashboard/rbac-api";
import type { PermissionDependency } from "@/redux/services/dashboard/rbac-types";
import { routesPath } from "@/routes/routes-path";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["Permission", "", "Depends On", "Action"];

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
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">Dependency Chain</SheetTitle>
          <SheetDescription className="font-mono text-xs text-gray-01">{permissionKey}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            <div className="space-y-6">
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
        </ScrollArea>

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
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });
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
    <>
      <PageShell className="space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Dependencies</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Some permissions require other permissions to be present. Dependencies are validated when assigning roles.
            </p>
          </div>
          <PermissionGate permission={P.MANAGE_PERMISSIONS}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.DEPENDENCIES.CREATE)}>
              <Plus /> Add Dependency
            </Button>
          </PermissionGate>
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
              ...(hasPermission(P.MANAGE_PERMISSIONS) ? [{
                label: "Remove",
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

      <DependencyChainSheet
        permissionKey={chainKey}
        allDeps={deps}
        onClose={() => setChainKey(null)}
      />

      <DeleteDependencyDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
    </>
  );
}
