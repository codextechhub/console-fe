import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useGetSchoolDetailQuery } from "@/redux/services/dashboard/schoolMgtApi";
import type { BranchDetail } from "@/redux/services/dashboard/schoolType";
import { routesPath } from "@/routes/routesPath";
import { Building2, GraduationCap, LayoutGrid, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

const BRANCH_TABLE_HEADERS = ["S/N", "Branch Name", "Total Students", "School Type", "School Location", "School Address", "Action"];

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

  // ── Single API: GET /i/{slug}/ ────────────────────────────────────────────
  const { data, isLoading, isError } = useGetSchoolDetailQuery(slug ?? "", { skip: !slug });
  const school = data?.data;

  const initials = school?.name
    ?.split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase() ?? "";

  const filteredBranches = (school?.branches ?? []).filter((b: BranchDetail) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  const tableData = filteredBranches.map((branch: BranchDetail, idx: number) => ({
    sn: idx + 1,
    name: <p className="font-medium capitalize">{branch.name}</p>,
    totalStudents: "—",           // ❌ not on Branch model yet
    type: branch._type || "—",
    location: [branch.state, branch.country].filter(Boolean).join(", ") || "—",
    address: branch.address || "—",
    _slug: slug,
    _code: branch.code,
  }));

  return (
    <DashboardLayout title="School Management" hasBack>
      <main className="px-4.5 py-6 space-y-6 text-black-01">

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
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="w-24"
                onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(slug ?? ""))}
              >
                Edit
              </Button>
            </div>

            {/* Logo + Name */}
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {school.branding?.logo ? (
                  <img src={school.branding.logo} alt={school.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-gray-400">{initials}</span>
                )}
              </div>
              <h4 className="font-semibold text-2xl capitalize">{school.name}</h4>
            </div>

            {/* Info Block — all from GET /i/{slug}/ */}
            <div className="bg-white rounded-md p-6 grid md:grid-cols-2 gap-x-16 gap-y-5">
              <div className="space-y-5">
                <InfoRow label="School Type"     value={school.ownership_type} />
                <InfoRow label="Contact Number"  value={school.primary_admin?.contact.phone} />
                <InfoRow label="Website"         value={school.website} />
                <InfoRow label="State"           value={school.main_branch?.state} />
              </div>
              <div className="space-y-5">
                <InfoRow label="School Address"  value={school.address} />
                <InfoRow label="School Category" value={school.term_structure} />
                <InfoRow label="Email Address"   value={school.primary_admin?.contact.email} />
                <InfoRow label="Country"         value={school.main_branch?.country} />
              </div>
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

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-5">
              <CustomInput
                id="search"
                canSearch
                placeholder="Search"
                className="h-10"
                containerClass="max-w-[280px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="inline-flex items-center gap-3.5">
                <Button size="lg">
                  <Plus /> Add New Branch
                </Button>
                <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont">
                  {svgIcons.exportIcon} Export
                </Button>
              </div>
            </div>

            {/* Branches Table — rows come from school.branches[] in GET /i/{slug}/ */}
            <CustomTable
              tableHeaderList={BRANCH_TABLE_HEADERS}
              tableBodyList={tableData}
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
