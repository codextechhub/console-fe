import { useState, useMemo } from "react";
import { RefreshCw, ArrowRight, Link } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useDebounce } from "react-haiku";
import { useGetPermissionDependenciesQuery } from "@/redux/services/dashboard/rbac-api";
import type { PermissionDependency } from "@/redux/services/dashboard/rbac-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["Permission", "", "Depends On", "Action"];

// ── Dependency Chain Sheet ─────────────────────────────────────────────────────
function DependencyChainSheet({
  permissionKey,
  onClose,
}: {
  permissionKey: string | null;
  onClose: () => void;
}) {
  const graph = useGetPermissionDependenciesQuery(
    { graph_for: permissionKey ?? "", page_size: 100 },
    { skip: !permissionKey },
  );
  const allDeps = useMemo(() => graph.data?.data ?? [], [graph.data?.data]);
  const labels = useMemo(() => {
    const result = new Map<string, string>();
    for (const dependency of allDeps) {
      result.set(dependency.permission_key, dependency.permission_label);
      result.set(dependency.depends_on_key, dependency.depends_on_label);
    }
    return result;
  }, [allDeps]);
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
          <SheetDescription>{permissionKey ? labels.get(permissionKey) : ""}</SheetDescription>
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
                        <span className="text-xs font-medium text-black-01">{labels.get(k) || "Permission"}</span>
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
                        <span className="text-xs font-medium text-black-01">{labels.get(k) || "Permission"}</span>
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PermissionDependencies() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });
  const [chainKey, setChainKey] = useState<string | null>(null);

  const params = useMemo(() => ({
    ...query,
    search: debouncedSearch,
  }), [query, debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionDependenciesQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const deps = data?.data ?? [];

  const tableData = deps.map((d: PermissionDependency) => ({
    permission: <span className="text-xs font-semibold text-black-01">{d.permission_label}</span>,
    arrow: <ArrowRight className="size-3.5 text-gray-01" />,
    dependsOn: <span className="text-xs font-semibold text-black-01">{d.depends_on_label}</span>,
    _raw: d,
  }));

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div>
            <p className="font-semibold font-mont text-gray-01">Permission Dependencies</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Some permissions require other permissions to be present. Dependencies are validated when assigning roles.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CustomInput
            id="search-deps"
            canSearch
            placeholder="Search permission labels..."
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
        onClose={() => setChainKey(null)}
      />
    </>
  );
}
