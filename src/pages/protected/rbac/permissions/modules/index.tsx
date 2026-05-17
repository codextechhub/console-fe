import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routesPath";
import {
  useGetPermissionModulesQuery,
  useDeletePermissionModuleMutation,
} from "@/redux/services/dashboard/rbacApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import type { PermissionModule } from "@/redux/services/dashboard/rbacTypes";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const TABLE_HEADERS = ["Module Name", "Description", "Status", "Created", "Action"];

type CardFilter = "all" | "active" | "inactive";

export default function PermissionModulesList() {
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

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionModulesQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteModule] = useDeletePermissionModuleMutation();

  const modules = data?.data ?? [];
  const totalModules = data?.pagination?.totalItems ?? 0;

  const activeCount = modules.filter((m) => m.is_active).length;
  const inactiveCount = modules.filter((m) => !m.is_active).length;

  const metricCards = [
    { title: "Total Modules", value: totalModules, key: "all" as CardFilter, active: cardFilter === "all" },
    { title: "Active", value: activeCount, key: "active" as CardFilter, active: cardFilter === "active" },
    { title: "Inactive", value: inactiveCount, key: "inactive" as CardFilter, active: cardFilter === "inactive" },
  ];

  const filteredModules = modules.filter((m) => {
    if (cardFilter === "active") return m.is_active;
    if (cardFilter === "inactive") return !m.is_active;
    return true;
  });

  const tableData = filteredModules.map((mod: PermissionModule) => ({
    name: <span className="font-mono font-medium text-sm text-black-01">{mod.name}</span>,
    description: <span className="text-xs text-gray-01">{mod.description || "—"}</span>,
    status: (
      <Badge variant={mod.is_active ? "active" : "inactive"}>
        {mod.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
    created: formatRelativeDate(mod.created_at),
    _name: mod.name,
  }));

  return (
    <DashboardLayout title="Permission Modules">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Permission Modules</p>
            <p className="text-xs text-gray-01 mt-0.5">Top-level categories that group permission resources.</p>
          </div>
          <PermissionGate permission={P.CREATE_PERMISSION}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.CREATE)}>
              <Plus /> Add Module
            </Button>
          </PermissionGate>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
            id="search-modules"
            canSearch
            placeholder="Search modules..."
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
            <p className="text-sm font-medium text-destructive">Failed to load modules.</p>
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
            dropDownList={(row: { _name: string }) => [
              ...(hasPermission(P.MODIFY_PERMISSION) ? [{
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.EDIT(row._name)),
              }] : []),
              ...(hasPermission(P.DELETE_PERMISSION) ? [{
                label: "Delete",
                className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                onActionClick: () =>
                  deleteModule(row._name)
                    .unwrap()
                    .then(() => toast.success("Module deleted."))
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
