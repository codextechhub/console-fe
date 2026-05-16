import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw, Layers, CheckCircle2, Lock, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { svgIcons } from "@/assets/svg";
import { routesPath } from "@/routes/routesPath";
import { useGetPermissionGroupsQuery, useDeletePermissionGroupMutation } from "@/redux/services/dashboard/rbacApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import type { PermissionGroupList } from "@/redux/services/dashboard/rbacTypes";

const TABLE_HEADERS = ["Group Name", "System", "Status", "Permissions", "Created", "Action"];

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-md px-5 py-4 flex items-center gap-4">
      <div className="size-12 rounded-lg bg-gray-100 grid place-content-center text-gray-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-01 font-mont">{label}</p>
        <p className="text-2xl font-semibold text-black-01">{value}</p>
      </div>
    </div>
  );
}

export default function PermissionGroupsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });

  const params = useMemo(() => ({ ...query, search: debouncedSearch }), [query, debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionGroupsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteGroup] = useDeletePermissionGroupMutation();

  const groups = data?.data ?? [];
  const totalGroups = data?.pagination?.totalCount ?? 0;
  const activeGroups = groups.filter((g) => g.is_active).length;
  const systemGroups = groups.filter((g) => g.is_system).length;
  const customGroups = groups.filter((g) => !g.is_system).length;

  const tableData = groups.map((group: PermissionGroupList) => ({
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
          <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.ROLES.GROUPS.CREATE)}>
            <Plus /> Add New Group
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Layers size={22} />} label="Total Groups" value={totalGroups} />
          <StatCard icon={<CheckCircle2 size={22} />} label="Active" value={activeGroups} />
          <StatCard icon={<Lock size={22} />} label="System Groups" value={systemGroups} />
          <StatCard icon={<Settings2 size={22} />} label="Custom Groups" value={customGroups} />
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
              {
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.ROLES.GROUPS.EDIT(row._id)),
              },
              ...(!row._system
                ? [
                    {
                      label: "Delete",
                      className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                      onActionClick: () =>
                        deleteGroup(row._id)
                          .unwrap()
                          .then(() => toast.success("Group deleted."))
                          .catch(() => {}),
                    },
                  ]
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
