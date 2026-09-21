import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import { useGetPermissionGroupsQuery } from "@/redux/services/dashboard/rbac-api";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import type { PermissionGroupList } from "@/redux/services/dashboard/rbac-types";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["Group Name", "Status", "Permissions", "Created"];

type CardFilter = "all" | "active";

export default function PermissionGroupsList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  const params = useMemo(() => {
    const p: Record<string, string | number> = { ...query };
    if (debouncedSearch) p.search = debouncedSearch;
    if (cardFilter === "active") p.is_active = "true";
    return p;
  }, [query, debouncedSearch, cardFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionGroupsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const { data: activeData } = useGetPermissionGroupsQuery({ page: 1, page_size: 1, is_active: "true" });
  const groups = data?.data ?? [];
  const totalGroups = data?.pagination?.totalItems ?? 0;
  const activeCount = activeData?.pagination?.totalItems ?? 0;

  const metricCards = [
    { title: "All Groups", value: totalGroups, key: "all" as CardFilter, active: cardFilter === "all" },
    { title: "Active", value: activeCount, key: "active" as CardFilter, active: cardFilter === "active" },
  ];

  const tableData = groups.map((group: PermissionGroupList) => ({
    name: (
      <div>
        <p className="font-medium text-black-01">{group.name}</p>
        {group.description && (
          <p className="text-xs text-gray-01 mt-0.5 truncate max-w-56">{group.description}</p>
        )}
      </div>
    ),
    status: (
      <Badge variant={group.is_active ? "active" : "inactive"}>
        {group.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
    permissions: <span className="font-medium">{group.permissions_count}</span>,
    created: formatRelativeDate(group.created_at),
  }));

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div>
            <p className="font-semibold font-mont text-gray-01">Permission Groups</p>
            <p className="text-xs text-gray-01 mt-0.5">Backend-defined bundles that can be assigned to custom roles.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5">
          {metricCards.map((card, idx) => (
            <div
              key={idx}
              className={cn(
                INFORMATION_CARD_SURFACE,
                "rounded-md min-h-26 w-full px-4 sm:px-5.5 pt-5 pb-4 space-y-2.5 cursor-pointer",
                card.active && "border-primary/30 bg-pry-01",
              )}
              onClick={() => { setCardFilter(card.key); setQuery({ page: 1 }); }}
            >
              <h5 className="font-mont text-sm font-medium text-gray-01">{card.title}</h5>
              <p className="font-semibold text-2xl text-[#221122]">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <CustomInput
            id="search-groups"
            canSearch
            placeholder="Search groups..."
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inline-flex items-center gap-3.5 shrink-0">
            <Button
              variant="white" size="lg"
              className="[&_svg]:size-5 font-medium font-mont"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-destructive">Failed to load groups. Please try again.</p>
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
