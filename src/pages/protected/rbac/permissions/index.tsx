import { useState, useMemo } from "react";
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
import { routesPath } from "@/routes/routesPath";
import { useGetPermissionsQuery, useDeletePermissionMutation } from "@/redux/services/dashboard/rbacApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import type { Permission } from "@/redux/services/dashboard/rbacTypes";

const TABLE_HEADERS = ["Key", "Module", "Action", "Sensitivity", "Restricted", "Status", "Created", "Action"];

const SENSITIVITY_BADGE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  NORMAL: "active",
  SENSITIVE: "locked",
  CRITICAL: "suspended",
};

type CardFilter = "all" | "active" | "restricted" | "critical";

export default function PermissionsList() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  const params = useMemo(
    () => ({ ...query, ...(debouncedSearch && { search: debouncedSearch }) }),
    [query, debouncedSearch],
  );

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const [deletePermission] = useDeletePermissionMutation();

  const perms = data?.data ?? [];
  const totalPerms = data?.pagination?.totalItems ?? 0;

  const activeCount = perms.filter((p) => p.is_active).length;
  const restrictedCount = perms.filter((p) => p.is_restricted).length;
  const criticalCount = perms.filter((p) => p.sensitivity_level === "CRITICAL").length;

  const metricCards = [
    { title: "All Permissions", value: totalPerms, key: "all" as CardFilter, active: cardFilter === "all" },
    { title: "Active", value: activeCount, key: "active" as CardFilter, active: cardFilter === "active" },
    { title: "Restricted", value: restrictedCount, key: "restricted" as CardFilter, active: cardFilter === "restricted" },
    { title: "Critical", value: criticalCount, key: "critical" as CardFilter, active: cardFilter === "critical" },
  ];

  const filteredPerms = perms.filter((p) => {
    if (cardFilter === "active") return p.is_active;
    if (cardFilter === "restricted") return p.is_restricted;
    if (cardFilter === "critical") return p.sensitivity_level === "CRITICAL";
    return true;
  });

  const tableData = filteredPerms.map((perm: Permission) => ({
    key: <span className="font-mono text-xs font-medium text-black-01">{perm.key}</span>,
    module: <span className="capitalize text-xs">{perm.module_key}</span>,
    action: <span className="capitalize text-xs">{perm.action_key}</span>,
    sensitivity: (
      <Badge variant={(SENSITIVITY_BADGE[perm.sensitivity_level] ?? "inactive") as any} className="text-xs capitalize">
        {perm.sensitivity_level?.toLowerCase()}
      </Badge>
    ),
    restricted: perm.is_restricted ? (
      <Badge variant="suspended" className="text-xs">Yes</Badge>
    ) : (
      <span className="text-xs text-gray-01">No</span>
    ),
    status: (
      <Badge variant={perm.is_active ? "active" : "inactive"}>
        {perm.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
    created: formatRelativeDate(perm.created_at),
    _key: perm.key,
  }));

  return (
    <DashboardLayout title="Permissions">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Registry</p>
            <p className="text-xs text-gray-01 mt-0.5">All granular permissions available on the platform.</p>
          </div>
          <PermissionGate permission={P.CREATE_PERMISSION}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.CREATE)}>
              <Plus /> Add Permission
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
            id="search-permissions"
            canSearch
            placeholder="Search permissions..."
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
            <p className="text-sm font-medium text-destructive">Failed to load permissions.</p>
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
            dropDownList={(row: { _key: string }) => [
              ...(hasPermission(P.MODIFY_PERMISSION) ? [{
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.PERMISSIONS.EDIT(row._key)),
              }] : []),
              ...(hasPermission(P.DELETE_PERMISSION) ? [{
                label: "Delete",
                className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                onActionClick: () =>
                  deletePermission(row._key)
                    .unwrap()
                    .then(() => toast.success("Permission deleted."))
                    .catch(() => {}),
              }] : []),
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
