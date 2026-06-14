import TableToolbar from "@/components/custom/table-toolbar";
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
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { useGetSchoolDetailQuery } from "@/redux/services/dashboard/school-mgt-api";
import type { BranchDetail } from "@/redux/services/dashboard/school-types";
import { routesPath } from "@/routes/routes-path";
import { formatEnum, returnInitial } from "@/utils/helpers";
import { Building2, GraduationCap, LayoutGrid, Plus, Users } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { useDebounce } from "react-haiku";
import { useNavigate, useParams } from "react-router";
import { SortBar, handleSortToggle } from "@/components/custom/sort-bar";

const BRANCH_TABLE_HEADERS = ["S/N", "Branch Name", "Total Students", "School Type", "School Location", "School Address", "Status", "Action"];

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start gap-6">
      <p className="text-sm text-gray-01 font-mont w-36 shrink-0">{label}</p>
      <p className="text-sm font-semibold text-black-01">{value ?? "—"}</p>
    </div>
  );
}

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

export default function ViewSchool() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);

  // ── Single API: GET /i/{slug}/ ────────────────────────────────────────────
  const { data, isLoading, isError } = useGetSchoolDetailQuery(slug ?? "", { skip: !slug });
  const school = data?.data;

  const initials = returnInitial(school?.name ?? "");

  const filteredBranches = (school?.branches ?? [])
    .filter((b: BranchDetail) =>
      !debouncedSearch || b.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    .sort((a: BranchDetail, b: BranchDetail) => {
      if (!sort.sortColumn) return 0;
      const key = sort.sortColumn as keyof BranchDetail;
      const av = (a[key] ?? "") as string;
      const bv = (b[key] ?? "") as string;
      const cmp = av.localeCompare(bv);
      return sort.sortOrder === "desc" ? -cmp : cmp;
    });
  const totalBranchPages = Math.ceil(filteredBranches.length / PAGE_SIZE);
  const pagedBranches = filteredBranches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tableData = pagedBranches.map((branch: BranchDetail, idx: number) => ({
    sn: (page - 1) * PAGE_SIZE + idx + 1,
    name: <p className="font-medium capitalize">{branch.name}</p>,
    totalStudents: "—",
    type: branch._type || "—",
    location: [branch.state, branch.country].filter(Boolean).join(", ") || "—",
    address: branch.address || "—",
    status: (
      <Badge variant={branch.status?.toLowerCase() as ComponentProps<typeof Badge>["variant"]}>
        {formatEnum(branch.status)}
      </Badge>
    ),
    _slug: slug,
    _code: branch.code,
  }));

  return (
    <DashboardLayout title="School Management" hasBack>
      <main className="px-4.5 py-6 space-y-6 text-black-01 min-w-0">

        {isLoading && (
          <div className="grid h-40 place-content-center">
            <div className="loader" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="grid h-40 place-content-center text-center space-y-3">
            <p className="text-sm text-red-500 font-medium">Failed to load school details.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {!isLoading && !isError && school && (
          <>
            {/* Logo + Name + Edit on same row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {school.branding?.logo ? (
                    <img src={school.branding.logo} alt={school.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">{initials}</span>
                  )}
                </div>
                <h4 className="font-semibold text-2xl capitalize">{school.name}</h4>
              </div>
              <Button
                variant="outline"
                className="w-24"
                onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(slug ?? ""))}
              >
                Edit
              </Button>
            </div>

            {/* Info Block — all from GET /i/{slug}/ */}
            <div className="bg-white rounded-md p-6 grid md:grid-cols-2 gap-x-16 gap-y-5">
              <div className="space-y-5">
                <InfoRow label="School Type"     value={formatEnum(school.ownership_type)} />
                <InfoRow label="Website"         value={school.website} />
                <InfoRow label="State"           value={school.main_branch?.state} />
              </div>
              <div className="space-y-5">
                <InfoRow label="School Address"  value={school.address} />
                <InfoRow label="School Category" value={formatEnum(school.term_structure)} />
                <InfoRow label="Country"         value={school.main_branch?.country} />
              </div>
            </div>

            {/* School Admin Block */}
            <div className="bg-white rounded-md p-6 space-y-4">
              <p className="text-sm font-semibold text-gray-05">School Admin</p>
              {school.primary_admin ? (
                <div className="grid md:grid-cols-2 gap-x-16 gap-y-5">
                  <div className="space-y-5">
                    <InfoRow label="Admin Name"   value={school.primary_admin.contact.full_name} />
                    <InfoRow label="Admin Email"  value={school.primary_admin.contact.email} />
                    <InfoRow label="Phone Number" value={school.primary_admin.contact.phone} />
                  </div>
                  <div className="space-y-5">
                    <InfoRow label="Admin Role"   value={formatEnum(school.primary_admin.role_label)} />
                    <div className="flex items-start gap-6">
                      <p className="text-sm text-gray-01 font-mont w-36 shrink-0">Invite Status</p>
                      <Badge
                        variant={
                          school.primary_admin.invite_status === "SENT" ? "active"
                          : school.primary_admin.invite_status === "FAILED" ? "rejected"
                          : "pending"
                        }
                      >
                        {formatEnum(school.primary_admin.invite_status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-01">No admin assigned.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(slug ?? ""))}
                  >
                    Assign Admin
                  </Button>
                </div>
              )}
            </div>

            {/* Stat Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* ✅ branches.length from school detail */}
              <StatCard icon={<Building2 size={22} />}    label="Total Branches" value={school.branches?.length ?? 0} />
              {/* ❌ no teacher count in backend yet */}
              <StatCard icon={<LayoutGrid size={22} />}   label="Total Teachers" value="—" />
              {/* ✅ total_students from school detail */}
              <StatCard icon={<GraduationCap size={22} />} label="Total Student" value={school.total_students ?? 0} />
              {/* ❌ no parent count in backend yet */}
              <StatCard icon={<Users size={22} />}        label="Total Parents"  value="—" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <TableToolbar
                search={search}
                onSearchChange={(v) => { setPage(1); setSearch(v); }}
                placeholder="Search branches..."
              />
              <PermissionGate permission={P.ADD_BRANCH}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="lg">
                      <Plus className="size-4" /> Add Branch
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border rounded-sm">
                    <DropdownMenuItem
                      className="text-sm cursor-pointer text-custom-gray-scale-400"
                      onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.CREATE_BRANCH(slug ?? ""))}
                    >
                      Add Manual
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-sm cursor-pointer text-custom-gray-scale-400"
                      onClick={() =>
                        navigate(
                          `${routesPath.PROTECTED.DATA_IMPORTS.BATCHES.NEW}?dataset_type=branches&lock_template=true&return_to=${encodeURIComponent(routesPath.PROTECTED.SCHOOL_MGT.VIEW(slug ?? ""))}&return_label=${encodeURIComponent("School Details")}`
                        )
                      }
                    >
                      Bulk Upload
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGate>
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
              tableHeaderList={BRANCH_TABLE_HEADERS}
              tableBodyList={tableData}
              currentPage={page}
              totalPage={totalBranchPages}
              onPageChange={(p) => setPage(p as number)}
              dropDown
              dropDownList={(row: { _slug: string; _code: number }) => [
                {
                  label: "View Details",
                  onActionClick: () =>
                    navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH(row._slug, row._code)),
                },
                {
                  label: "Edit Branch",
                  onActionClick: () =>
                    navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH(row._slug, row._code)),
                },
              ]}
            />
          </>
        )}

        {!isLoading && !isError && !school && (
          <p className="text-sm text-gray-01">School not found.</p>
        )}
      </main>
    </DashboardLayout>
  );
}
