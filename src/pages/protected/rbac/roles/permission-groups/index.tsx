import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { cn } from "@/lib/utils";
import { svgIcons } from "@/assets/svg";
import { routesPath } from "@/routes/routesPath";
import { useGetPermissionGroupsQuery, useDeletePermissionGroupMutation } from "@/redux/services/dashboard/rbacApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import type { PermissionGroupList } from "@/redux/services/dashboard/rbacTypes";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const TABLE_HEADERS = ["Group Name", "System", "Status", "Permissions", "Created", "Action"];

type CardFilter = "all" | "active" | "system" | "custom";

export default function PermissionGroupsList() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  const params = useMemo(() => ({ ...query, search: debouncedSearch }), [query, debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionGroupsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteGroup] = useDeletePermissionGroupMutation();

  const groups = data?.data ?? [];
  const totalGroups = data?.pagination?.totalItems ?? 0;
  const activeCount = groups.filter((g) => g.is_active).length;
  const systemCount = groups.filter((g) => g.is_system).length;
  const customCount = groups.filter((g) => !g.is_system).length;

  const metricCards = [
    { title: "All Groups", value: totalGroups, key: "all" as CardFilter, active: cardFilter === "all" },
    { title: "Active", value: activeCount, key: "active" as CardFilter, active: cardFilter === "active" },
    { title: "System Groups", value: systemCount, key: "system" as CardFilter, active: cardFilter === "system" },
    { title: "Custom Groups", value: customCount, key: "custom" as CardFilter, active: cardFilter === "custom" },
  ];

  const filteredGroups = groups.filter((g) => {
    if (cardFilter === "active") return g.is_active;
    if (cardFilter === "system") return g.is_system;
    if (cardFilter === "custom") return !g.is_system;
    return true;
  });

  const tableData = filteredGroups.map((group: PermissionGroupList) => ({
    name: (
      <div>
        <p className="font-medium text-black-01">{group.name}</p>
        {group.description && (
          <p className="text-xs text-gray-01 mt-0.5 truncate max-w-56">{group.description}</p>
        )}
      </div>
    ),
    system: group.is_system ? (
      <Badge variant="active" className="text-xs">System</Badge>
    ) : (
      <span className="text-xs text-gray-01">Custom</span>
    ),
    status: (
      <Badge variant={group.is_active ? "active" : "inactive"}>
        {group.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
    permissions: <span className="font-medium">{group.permissions_count}</span>,
    created: formatRelativeDate(group.created_at),
    _id: group.id,
    _system: group.is_system,
  }));

  return (
    <DashboardLayout title="Permission Groups">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Groups</p>
            <p className="text-xs text-gray-01 mt-0.5">Bundles of permissions that can be assigned to roles.</p>
          </div>
          <PermissionGate permission={P.MANAGE_PERMISSIONS}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.ROLES.GROUPS.CREATE)}>
              <Plus /> Add New Group
            </Button>
          </PermissionGate>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card, idx) => (
            <div
              key={idx}
              className={cn(
                "bg-white rounded-md h-26 w-full px-5.5 pt-5 space-y-2.5 cursor-pointer",
                card.active && "bg-pry-01",
              )}
              onClick={() => setCardFilter(card.key)}
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
            <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont">
              {svgIcons.exportIcon} Export
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
            dropDown
            dropDownList={(row: { _id: string; _system: boolean }) => [
              ...(hasPermission(P.MANAGE_PERMISSIONS) ? [{
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.ROLES.GROUPS.EDIT(row._id)),
              }] : []),
              ...(hasPermission(P.MANAGE_PERMISSIONS) && !row._system
                ? [{
                    label: "Delete",
                    className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                    onActionClick: () =>
                      deleteGroup(row._id)
                        .unwrap()
                        .then(() => toast.success("Group deleted."))
                        .catch(() => {}),
                  }]
                : []),
            ]}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page: page as number }))}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
