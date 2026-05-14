import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routesPath";
import {
  useGetSchoolsQuery,
  useGetSchoolStatsQuery,
} from "@/redux/services/dashboard/schoolMgtApi";
import type { School } from "@/redux/services/dashboard/schoolType";
import { formatEnum } from "@/utils/helpers";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { SortBar, buildOrdering, handleSortToggle } from "@/components/custom/sort-bar";

const TABLE_HEADERS = ["S/N", "School Name", "Location", "Total Students", "Type", "Status", "Action"];

const STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  pending: "PENDING",
  inactive: "INACTIVE",
};

export default function SchoolManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter_status = searchParams.get("status");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);

  const queryParams: Record<string, string | number> = { page };
  if (filter_status && STATUS_MAP[filter_status]) {
    queryParams.status = STATUS_MAP[filter_status];
  }
  if (search) queryParams.q = search;
  const ordering = buildOrdering(sort.sortColumn, sort.sortOrder);
  if (ordering) queryParams.ordering = ordering;

  const { data: schoolsRes, isLoading, refetch, isFetching } = useGetSchoolsQuery(queryParams);
  const { data: statsRes, refetch: refetchStats } = useGetSchoolStatsQuery();


  const stats = statsRes?.data;

  const metricCards = [
    { title: "All Schools", value: stats?.all ?? 0, query: "", active: !filter_status },
    { title: "Active Schools", value: stats?.active ?? 0, query: "active", active: filter_status === "active" },
    { title: "Pending Schools", value: stats?.pending ?? 0, query: "pending", active: filter_status === "pending" },
    { title: "Inactive Schools", value: stats?.inactive ?? 0, query: "inactive", active: filter_status === "inactive" },
  ];

  const tableData = schoolsRes?.data?.map((item: School, idx: number) => ({
    sn: <p>{idx + 1}</p>,
    name: <p className="capitalize font-medium">{item.name || "—"}</p>,
    location: item.main_branch
      ? [item.main_branch.state, item.main_branch.country].filter(Boolean).join(", ") || "—"
      : "—",
    totalStudents: item.total_students ?? "—",
    type: formatEnum(item.ownership_type),
    status: (
      <Badge variant={item.status?.toLowerCase() as "active" | "pending" | "inactive" | "default"}>
        {formatEnum(item.status)}
      </Badge>
    ),
    _slug: item.slug,
  }));

  return (
    <DashboardLayout title="School Management">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h4 className="font-medium text-xl">School Onboarding</h4>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg">
                <Plus /> Add New School
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border rounded-sm">
              <DropdownMenuItem
                onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.CREATE)}
                className="text-sm cursor-pointer text-custom-gray-scale-400"
              >
                Add Manual
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm cursor-pointer text-custom-gray-scale-400">
                Bulk Upload
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "bg-white rounded-md h-26 w-full px-5.5 pt-5 space-y-2.5 cursor-pointer",
                item.active && "bg-pry-01",
              )}
              onClick={() => { setPage(1); setSearchParams({ status: item.query }); }}
            >
              <h5 className="font-mont text-sm font-medium text-gray-01">{item.title}</h5>
              <p className="font-semibold text-2xl text-[#221122]">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-8 gap-3">
          <CustomInput
            id="search"
            canSearch
            placeholder="Search schools..."
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
          <div className="inline-flex items-center gap-3.5 shrink-0">
            <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont">
              {svgIcons.filterIcon} Filter
            </Button>
            <Button
              variant="white"
              size="lg"
              className="[&_svg]:size-5 font-medium font-mont"
              onClick={() => { refetch(); refetchStats(); }}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont">
              {svgIcons.exportIcon} Export
            </Button>
          </div>
        </div>

        <SortBar
          options={[
            { column: "name", label: "Name" },
            { column: "status", label: "Status" },
            { column: "created_at", label: "Date" },
          ]}
          sortColumn={sort.sortColumn}
          sortOrder={sort.sortOrder}
          onSort={onSort}
          className="mt-3"
        />

        <CustomTable
          tableHeaderList={TABLE_HEADERS}
          tableBodyList={tableData ?? []}
          loading={isLoading}
          currentPage={schoolsRes?.pagination?.currentPage}
          totalPage={schoolsRes?.pagination?.totalPages}
          perPage={schoolsRes?.pagination?.pageSize}
          onPageChange={(p) => setPage(p as number)}
          dropDown
          dropDownList={(row: { _slug: string }) => [
            {
              label: "View Details",
              onActionClick: () => navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(row._slug)),
            },
            {
              label: "Edit School",
              onActionClick: () => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(row._slug)),
            },
          ]}
        />
      </main>
    </DashboardLayout>
  );
}
