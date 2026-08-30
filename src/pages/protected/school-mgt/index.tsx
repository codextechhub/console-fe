import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickExportButton } from "@/components/custom/quick-export-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import { routesPath } from "@/routes/routes-path";
import {
  useGetSchoolsQuery,
  useGetSchoolStatsQuery,
} from "@/redux/services/dashboard/school-mgt-api";
import type { School } from "@/redux/services/dashboard/school-types";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { formatEnum } from "@/utils/helpers";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "react-haiku";
import { Link, useNavigate, useSearchParams } from "react-router";
import { SortBar, buildOrdering, handleSortToggle } from "@/components/custom/sort-bar";
import BulkImportDrawer from "@/components/custom/bulk-import-drawer";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["S/N", "School Name", "Location", "Total Students", "Type", "Status", "Action"];

const VALID_STATUSES = new Set(["active", "pending", "inactive", "suspended"]);

const STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  pending: "PENDING",
  inactive: "INACTIVE",
  suspended: "SUSPENDED",
};

export default function SchoolManagement() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("status") ?? "";
  const filter_status = VALID_STATUSES.has(rawStatus) ? rawStatus : null;
  const [search, setSearch] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 600);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);

  const queryParams: Record<string, string | number> = { page };
  if (filter_status) {
    queryParams.status = STATUS_MAP[filter_status];
  }
  if (debouncedSearch) queryParams.q = debouncedSearch;
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
    { title: "Suspended Schools", value: stats?.suspended ?? 0, query: "suspended", active: filter_status === "suspended" },
  ];

  const tableData = schoolsRes?.data?.map((item: School, idx: number) => ({
    sn: <p>{idx + 1}</p>,
    name: (
      <Link
        to={routesPath.PROTECTED.SCHOOL_MGT.VIEW(item.slug)}
        onClick={(event) => event.stopPropagation()}
        className="font-medium capitalize text-black-01 underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {item.name || "-"}
      </Link>
    ),
    location: item.main_branch
      ? [item.main_branch.state, item.main_branch.country].filter(Boolean).join(", ") || "-"
      : "-",
    totalStudents: item.total_students ?? "-",
    type: formatEnum(item.ownership_type),
    status: (
      <Badge variant={item.status?.toLowerCase() as "active" | "pending" | "inactive" | "suspended" | "default"}>
        {formatEnum(item.status)}
      </Badge>
    ),
    _slug: item.slug,
  }));

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h4 className="font-medium text-xl">School Onboarding</h4>

          <PermissionGate permission={P.ONBOARD_SCHOOL}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg">
                  <span data-guide="school-management.add-school" className="inline-flex items-center gap-2"><Plus /> Add New School</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border rounded-sm">
                <DropdownMenuItem
                  onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.CREATE)}
                  className="text-sm cursor-pointer text-custom-gray-scale-400"
                >
                  Add Manual
                </DropdownMenuItem>
                {hasPermission(P.UPLOAD_IMPORT_BATCH) ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setBulkImportOpen(true)}
                      className="text-sm cursor-pointer text-custom-gray-scale-400"
                    >
                      Bulk Upload
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
          {metricCards.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                INFORMATION_CARD_SURFACE,
                "rounded-md min-h-26 w-full px-4 sm:px-5.5 pt-5 pb-4 space-y-2.5 cursor-pointer",
                item.active && "border-primary/30 bg-pry-01",
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
            <Button
              variant="white"
              size="lg"
              className="[&_svg]:size-5 font-medium font-mont"
              onClick={() => { refetch(); refetchStats(); }}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
            {/* Forwards the same params the list query ran, so the file matches
                the status tab that is open. This export covers every school on
                the platform - the same register the screen shows. */}
            <QuickExportButton
              screen="platform.schools"
              params={queryParams}
              defaultName="Schools"
              className="h-11 px-6 [&_svg]:size-5"
            />
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
          onRowClick={(row: { _slug: string }) =>
            navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(row._slug))
          }
          dropDownList={(row: { _slug: string }) => [
            {
              label: "View Details",
              onActionClick: () => navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(row._slug)),
            },
            ...(hasPermission(P.MODIFY_SCHOOL) ? [{
              label: "Edit School",
              onActionClick: () => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(row._slug)),
            }] : []),
          ]}
        />
      </PageShell>

      <BulkImportDrawer
        open={bulkImportOpen}
        datasetType="schools"
        title="Bulk upload schools"
        description="Upload, validate and publish schools without leaving School Management."
        returnLabel="School Management"
        onClose={() => setBulkImportOpen(false)}
        onFinished={() => {
          void refetch();
          void refetchStats();
        }}
      />
    </>
  );
}
