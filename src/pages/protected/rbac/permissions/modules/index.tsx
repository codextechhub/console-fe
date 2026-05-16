import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw, Box, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routesPath";
import {
  useGetPermissionModulesQuery,
  useDeletePermissionModuleMutation,
} from "@/redux/services/dashboard/rbacApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import type { PermissionModule } from "@/redux/services/dashboard/rbacTypes";

const TABLE_HEADERS = ["Module Name", "Description", "Status", "Created", "Action"];

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

export default function PermissionModulesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [query, setQuery] = useState({ page: 1 });

  const params = useMemo(() => ({ ...query, search: debouncedSearch }), [query, debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useGetPermissionModulesQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteModule] = useDeletePermissionModuleMutation();

  const modules = data?.data ?? [];
  const totalModules = data?.pagination?.totalCount ?? 0;
  const activeModules = modules.filter((m) => m.is_active).length;

  const tableData = modules.map((mod: PermissionModule) => ({
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
          <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.CREATE)}>
            <Plus /> Add Module
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard icon={<Box size={22} />} label="Total Modules" value={totalModules} />
          <StatCard icon={<CheckCircle2 size={22} />} label="Active" value={activeModules} />
          <StatCard icon={<Box size={22} />} label="Inactive" value={totalModules - activeModules} />
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
              {
                label: "Edit",
                className: "",
                onActionClick: () => navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.EDIT(row._name)),
              },
              {
                label: "Delete",
                className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                onActionClick: () =>
                  deleteModule(row._name)
                    .unwrap()
                    .then(() => toast.success("Module deleted."))
                    .catch(() => {}),
              },
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
