import TableToolbar from "@/components/custom/table-toolbar";
import CustomTable from "@/components/custom/custom-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useGetBranchDetailQuery,
  useGetSchoolDetailQuery,
} from "@/redux/services/dashboard/schoolMgtApi";
import { routesPath } from "@/routes/routesPath";
import { formatEnum, formatStartedTime, returnInitial } from "@/utils/helpers";
import { Building2, GraduationCap, LayoutGrid, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

const CLASS_TABLE_HEADERS = ["S/N", "Class Name", "Level", "Total Students", "Class Teacher", "Action"];

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
  const parsedCode = Number(code);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: schoolData, isLoading: schoolLoading } = useGetSchoolDetailQuery(slug ?? "", {
    skip: !slug,
  });
  const { data: branchData, isLoading: branchLoading } = useGetBranchDetailQuery(
    { slug: slug ?? "", code: parsedCode },
    { skip: !slug || !code || isNaN(parsedCode) }
  );

  const school = schoolData?.data;
  const branch = branchData?.data;
  const isLoading = schoolLoading || branchLoading;


  const initials = returnInitial(school?.name ?? "");

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
            {/* Logo + School Name + Edit on same row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {school?.branding?.logo ? (
                    <img src={school.branding.logo} alt={school.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">{initials}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-semibold text-2xl capitalize">{branch.name}</h4>
                    <Badge variant={branch.status?.toLowerCase() as any}>
                      {formatEnum(branch.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-01 font-mont capitalize">{school?.name ?? "—"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-24"
                onClick={() =>
                  navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH(slug ?? "", parsedCode))
                }
              >
                Edit
              </Button>
            </div>

            {/* Info Block */}
            <div className="bg-white rounded-md p-6 grid md:grid-cols-2 gap-x-16 gap-y-5">
              <div className="space-y-5">
                <InfoRow label="Branch Email" value={branch.email} />
                <InfoRow label="Branch Code" value={branch.code} />
                <InfoRow label="State" value={branch.state} />
                <InfoRow
                  label="Activation Date"
                  value={branch.activated_at ? formatStartedTime(branch.activated_at) : "Not Activated"}
                />
              </div>
              <div className="space-y-5">
                <InfoRow label="Branch Address" value={branch.address} />
                <InfoRow label="Country" value={branch.country} />
                <InfoRow label="Branch Type" value={formatEnum(branch._type)} />
              </div>
            </div>

            {/* Branch Admin Block */}
            <div className="bg-white rounded-md p-6 space-y-4">
              <p className="text-sm font-semibold text-gray-05">Branch Admin</p>
              {branch.primary_admin ? (
                <div className="grid md:grid-cols-2 gap-x-16 gap-y-5">
                  <div className="space-y-5">
                    <InfoRow label="Admin Name"   value={branch.primary_admin.contact.full_name} />
                    <InfoRow label="Admin Email"  value={branch.primary_admin.contact.email} />
                    <InfoRow label="Phone Number" value={branch.primary_admin.contact.phone} />
                  </div>
                  <div className="space-y-5">
                    <InfoRow label="Admin Role" value={formatEnum(branch.primary_admin.branch_role)} />
                    <div className="flex items-start gap-6">
                      <p className="text-sm text-gray-01 font-mont w-44 shrink-0">Invite Status</p>
                      <Badge
                        variant={
                          branch.primary_admin.invite_status === "SENT" ? "active"
                          : branch.primary_admin.invite_status === "FAILED" ? "rejected"
                          : "pending"
                        }
                      >
                        {formatEnum(branch.primary_admin.invite_status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-01">No admin assigned.</p>
              )}
            </div>

            {/* Stat Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<Building2 size={22} />} label="Total Class" value="—" />
              <StatCard icon={<LayoutGrid size={22} />} label="Total Teachers" value="—" />
              <StatCard icon={<GraduationCap size={22} />} label="Total Student" value="—" />
              <StatCard icon={<Users size={22} />} label="Total Parents" value="—" />
            </div>

            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              placeholder="Search classes..."
            />

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
