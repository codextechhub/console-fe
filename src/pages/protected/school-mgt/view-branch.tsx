import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  useGetBranchDetailQuery,
  useGetSchoolDetailQuery,
} from "@/redux/services/dashboard/schoolMgtApi";
import { routesPath } from "@/routes/routesPath";
import { Building2, GraduationCap, LayoutGrid, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

const CLASS_TABLE_HEADERS = ["S/N", "Branch Name", "Branch Code", "School Type", "School Location", "School Address", "Action"];

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start gap-6">
      <p className="text-sm text-gray-01 font-mont w-44 shrink-0">{label}</p>
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

export default function ViewBranch() {
  const { slug, code } = useParams<{ slug: string; code: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: schoolData, isLoading: schoolLoading } = useGetSchoolDetailQuery(slug ?? "", {
    skip: !slug,
  });
  const { data: branchData, isLoading: branchLoading } = useGetBranchDetailQuery(
    { slug: slug ?? "", code: Number(code) },
    { skip: !slug || !code }
  );

  const school = schoolData?.data;
  const branch = branchData?.data;
  const isLoading = schoolLoading || branchLoading;

  const initials = school?.name
    ?.split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase() ?? "";

  return (
    <DashboardLayout title="School Management" hasBack>
      <main className="px-4.5 py-6 space-y-6 text-black-01">
        {isLoading && (
          <div className="grid h-40 place-content-center">
            <div className="loader" />
          </div>
        )}

        {!isLoading && branch && (
          <>
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="w-24"
                onClick={() =>
                  navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH(slug ?? "", Number(code)))
                }
              >
                Edit
              </Button>
            </div>

            {/* Logo + School Name */}
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {school?.branding?.logo ? (
                  <img src={school.branding.logo} alt={school.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-gray-400">{initials}</span>
                )}
              </div>
              <h4 className="font-semibold text-2xl capitalize">{school?.name ?? "—"}</h4>
            </div>

            {/* Info Block */}
            <div className="bg-white rounded-md p-6 grid md:grid-cols-2 gap-x-16 gap-y-5">
              <div className="space-y-5">
                <InfoRow label="Branch Email" value={branch.email} />
                <InfoRow label="Branch Code" value={branch.code} />
                <InfoRow label="State" value={branch.state} />
                <InfoRow label="Head of Branch" value={branch.primary_admin?.contact.full_name} />
                <InfoRow label="Head of Branch Email" value={branch.primary_admin?.contact.email} />
              </div>
              <div className="space-y-5">
                <InfoRow label="Branch Address" value={branch.address} />
                <InfoRow label="Country" value={branch.country} />
                <InfoRow label="Email Address" value={branch.email} />
                <InfoRow label="Head of Branch Role" value={branch.primary_admin?.branch_role} />
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<Building2 size={22} />} label="Total Class" value="—" />
              <StatCard icon={<LayoutGrid size={22} />} label="Total Teachers" value="—" />
              <StatCard icon={<GraduationCap size={22} />} label="Total Student" value="—" />
              <StatCard icon={<Users size={22} />} label="Total Parents" value="—" />
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
                  <Plus /> Add Class
                </Button>
                <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont">
                  {svgIcons.exportIcon} Export
                </Button>
              </div>
            </div>

            {/* Classes Table — empty until backend supports classes */}
            <CustomTable
              tableHeaderList={CLASS_TABLE_HEADERS}
              tableBodyList={[]}
            />
          </>
        )}

        {!isLoading && !branch && (
          <p className="text-sm text-gray-01">Branch not found.</p>
        )}
      </main>
    </DashboardLayout>
  );
}
