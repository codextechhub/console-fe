import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw, Shield, Lock, Users, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { svgIcons } from "@/assets/svg";
import { routesPath } from "@/routes/routesPath";
import { useGetPlatformRolesQuery, useDeletePlatformRoleMutation } from "@/redux/services/dashboard/rbacApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import type { PlatformRole } from "@/redux/services/dashboard/rbacTypes";

const TABLE_HEADERS = ["Role Name", "Status", "System", "Locked", "Users", "Permissions", "Created", "Action"];

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

export default function RolesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });

  const params = useMemo(
    () => ({ ...query, search: debouncedSearch }),
    [query, debouncedSearch],
  );

  const { data, isLoading, isError, refetch, isFetching } = useGetPlatformRolesQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteRole] = useDeletePlatformRoleMutation();

  const roles = data?.data ?? [];
  const totalRoles = data?.pagination?.totalCount ?? 0;
  const activeRoles = roles.filter((r) => r.status === "ACTIVE").length;
  const systemRoles = roles.filter((r) => r.is_system_role).length;
  const lockedRoles = roles.filter((r) => r.is_locked).length;

  const tableData = roles.map((role: PlatformRole) => ({
    name: (
      <div>
        <p className="font-medium text-black-01 capitalize">{role.name}</p>
        {role.description && (
          <p className="text-xs text-gray-01 mt-0.5 truncate max-w-56">{role.description}</p>
        )}
      </div>
    ),
    status: (
      <Badge variant={(role.status?.toLowerCase() ?? "inactive") as any}>
        {role.status}
      </Badge>
    ),
    system: role.is_system_role ? (
      <Badge variant="active" className="text-xs">Yes</Badge>
    ) : (
      <span className="text-xs text-gray-01">No</span>
    ),
    locked: role.is_locked ? (
      <Badge variant="suspended" className="text-xs">Locked</Badge>
    ) : (
      <span className="text-xs text-gray-01">No</span>
    ),
    users: <span className="font-medium">{role.assigned_users_count}</span>,
    perms: <span className="font-medium">{role.permissions_count}</span>,
    created: formatRelativeDate(role.created_at),
    _id: role.id,
    _system: role.is_system_role,
    _locked: role.is_locked,
  }));

  return (
    <DashboardLayout title="Platform Roles">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Roles Management</p>
            <p className="text-xs text-gray-01 mt-0.5">Manage platform roles and their permission assignments.</p>
          </div>
          <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.ROLES.CREATE)}>
            <Plus /> Add New Role
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Shield size={22} />} label="Total Roles" value={totalRoles} />
          <StatCard icon={<ShieldCheck size={22} />} label="Active Roles" value={activeRoles} />
          <StatCard icon={<Shield size={22} />} label="System Roles" value={systemRoles} />
          <StatCard icon={<Lock size={22} />} label="Locked Roles" value={lockedRoles} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <CustomInput
            id="search-roles"
            canSearch
            placeholder="Search roles..."
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
            <p className="text-sm font-medium text-destructive">Failed to load roles. Please try again.</p>
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
            dropDownList={(row: { _id: string; _system: boolean; _locked: boolean }) => [
              {
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.ROLES.EDIT(row._id)),
              },
              ...(row._system || row._locked
                ? []
                : [
                    {
                      label: "Delete",
                      className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                      onActionClick: () =>
                        deleteRole(row._id)
                          .unwrap()
                          .then(() => toast.success("Role deleted."))
                          .catch(() => {}),
                    },
                  ]),
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
