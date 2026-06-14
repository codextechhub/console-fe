import { useState, useMemo, type ComponentProps } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { cn } from "@/lib/utils";
import { svgIcons } from "@/assets/svg";
import { routesPath } from "@/routes/routes-path";
import { useGetPlatformRolesQuery, useDeletePlatformRoleMutation } from "@/redux/services/dashboard/rbac-api";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import type { PlatformRole } from "@/redux/services/dashboard/rbac-types";

const TABLE_HEADERS = ["Role Name", "Status", "System", "Locked", "Users", "Permissions", "Created", "Action"];

type CardFilter = "all" | "active" | "system" | "locked";

export default function RolesList() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  const params = useMemo(() => {
    const p: Record<string, string | number> = { ...query };
    if (debouncedSearch) p.search = debouncedSearch;
    if (cardFilter === "active") p.status = "ACTIVE";
    if (cardFilter === "system") p.is_system_role = "true";
    if (cardFilter === "locked") p.is_locked = "true";
    return p;
  }, [query, debouncedSearch, cardFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPlatformRolesQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const { data: activeData } = useGetPlatformRolesQuery({ page: 1, page_size: 1, status: "ACTIVE" });
  const { data: systemData } = useGetPlatformRolesQuery({ page: 1, page_size: 1, is_system_role: "true" });
  const { data: lockedData } = useGetPlatformRolesQuery({ page: 1, page_size: 1, is_locked: "true" });

  const [deleteRole] = useDeletePlatformRoleMutation();

  const roles = data?.data ?? [];
  const totalRoles = data?.pagination?.totalItems ?? 0;

  const activeCount = activeData?.pagination?.totalItems ?? 0;
  const systemCount = systemData?.pagination?.totalItems ?? 0;
  const lockedCount = lockedData?.pagination?.totalItems ?? 0;

  const metricCards = [
    { title: "All Roles", value: totalRoles, key: "all" as CardFilter, active: cardFilter === "all" },
    { title: "Active Roles", value: activeCount, key: "active" as CardFilter, active: cardFilter === "active" },
    { title: "System Roles", value: systemCount, key: "system" as CardFilter, active: cardFilter === "system" },
    { title: "Locked Roles", value: lockedCount, key: "locked" as CardFilter, active: cardFilter === "locked" },
  ];

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
      <Badge variant={(role.status?.toLowerCase() ?? "inactive") as ComponentProps<typeof Badge>["variant"]}>
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
          <PermissionGate permission={P.DEFINE_ROLE}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.ROLES.CREATE)}>
              <Plus /> Add New Role
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
              onClick={() => { setCardFilter(card.key); setQuery({ page: 1 }); }}
            >
              <h5 className="font-mont text-sm font-medium text-gray-01">{card.title}</h5>
              <p className="font-semibold text-2xl text-[#221122]">{card.value}</p>
            </div>
          ))}
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
              ...(hasPermission(P.MODIFY_ROLE) ? [{
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.ROLES.EDIT(row._id)),
              }] : []),
              ...(hasPermission(P.REVOKE_ROLE) && !row._system && !row._locked
                ? [{
                    label: "Delete",
                    className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                    onActionClick: () =>
                      deleteRole(row._id)
                        .unwrap()
                        .then(() => toast.success("Role deleted."))
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
