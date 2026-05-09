import DashboardLayout from "@/components/layout/dashboard-layout";
import Tabs from "@/components/custom/tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetSchoolDetailQuery } from "@/redux/services/dashboard/schoolMgtApi";
import type { BranchDetail } from "@/redux/services/dashboard/schoolType";
import { routesPath } from "@/routes/routesPath";
import { formatDate } from "@/utils/helpers";
import { useNavigate, useParams, useSearchParams } from "react-router";

const TABS = [
  { label: "Overview", value: "overview" },
  { label: "Branches", value: "branches" },
];

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-01 font-mont">{label}</p>
      <p className="text-sm font-medium text-black-01">{value ?? "—"}</p>
    </div>
  );
}

function BranchCard({ branch }: { branch: BranchDetail }) {
  return (
    <div className="bg-white rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-black-01">{branch.name}</p>
          {branch.is_main && (
            <span className="text-xs bg-pry-01 text-primary px-2 py-0.5 rounded-full font-mont">Main</span>
          )}
        </div>
        <Badge variant={branch.status?.toLowerCase() as "active" | "pending" | "inactive" | "default"}>
          {branch.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <DetailRow label="Type" value={branch._type} />
        <DetailRow label="Country" value={branch.country} />
        <DetailRow label="State" value={branch.state} />
        <DetailRow label="Address" value={branch.address} />
        <DetailRow label="Email" value={branch.email} />
        {branch.opened_at && (
          <DetailRow label="Opened" value={formatDate(new Date(branch.opened_at))} />
        )}
      </div>

      {branch.primary_admin && (
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-05 font-medium mb-2">Branch Admin</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailRow label="Name" value={branch.primary_admin.contact.full_name} />
            <DetailRow label="Email" value={branch.primary_admin.contact.email} />
            <DetailRow label="Phone" value={branch.primary_admin.contact.phone} />
            <DetailRow label="Role" value={branch.primary_admin.branch_role} />
            <DetailRow label="Invite Status" value={branch.primary_admin.invite_status} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewSchool() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const { data, isLoading } = useGetSchoolDetailQuery(slug ?? "", { skip: !slug });
  const school = data?.data;

  return (
    <DashboardLayout title="School Management" hasBack>
      <main className="px-4.5 py-6 space-y-6 text-black-01">
        {isLoading && (
          <div className="grid h-40 place-content-center">
            <div className="loader" />
          </div>
        )}

        {!isLoading && school && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-xl capitalize">{school.name}</h4>
                  <Badge variant={school.status?.toLowerCase() as "active" | "pending" | "inactive" | "default"}>
                    {school.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-01 font-mont">
                  Code: {school.code || "—"} &nbsp;·&nbsp;{" "}
                  {school.ownership_type?.charAt(0) + school.ownership_type?.slice(1).toLowerCase().replace("_", " ")}
                </p>
              </div>
              <Button onClick={() => navigate(routesPath.PROTECTED.SCHOOL_MGT.EDIT(slug ?? ""))}>
                Edit School
              </Button>
            </div>

            <Tabs tabs={TABS} tabKey="tab" />

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* School Info */}
                <div className="bg-white rounded-md p-5 space-y-4">
                  <p className="font-medium text-sm text-gray-05">School Information</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                    <DetailRow label="School Name" value={school.name} />
                    <DetailRow label="Address" value={school.address} />
                    <DetailRow label="Ownership Type" value={school.ownership_type} />
                    <DetailRow label="Term Structure" value={school.term_structure} />
                    <DetailRow label="Currency" value={school.currency} />
                    <DetailRow label="Registration ID" value={school.registration_id} />
                    <DetailRow label="Website" value={school.website} />
                    <DetailRow label="Motto" value={school.motto} />
                    {school.activated_at && (
                      <DetailRow label="Activated" value={formatDate(new Date(school.activated_at))} />
                    )}
                  </div>
                </div>

                {/* Primary Admin */}
                {school.primary_admin && (
                  <div className="bg-white rounded-md p-5 space-y-4">
                    <p className="font-medium text-sm text-gray-05">Primary Admin</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                      <DetailRow label="Name" value={school.primary_admin.contact.full_name} />
                      <DetailRow label="Email" value={school.primary_admin.contact.email} />
                      <DetailRow label="Phone" value={school.primary_admin.contact.phone} />
                      <DetailRow label="Role" value={school.primary_admin.school_role} />
                      <DetailRow label="Invite Status" value={school.primary_admin.invite_status} />
                    </div>
                  </div>
                )}

                {/* Package Setup */}
                {school.package_setup && (
                  <div className="bg-white rounded-md p-5 space-y-4">
                    <p className="font-medium text-sm text-gray-05">Package Setup</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                      <DetailRow label="Plan" value={school.package_setup.package_plan.name} />
                      <DetailRow label="Billing Cycle" value={school.package_setup.package_plan.billing_cycle} />
                      <DetailRow label="Student Capacity" value={school.package_setup.student_capacity} />
                      <DetailRow label="Teacher Capacity" value={school.package_setup.teacher_capacity} />
                      <DetailRow label="Admin Capacity" value={school.package_setup.admin_capacity} />
                      <DetailRow
                        label="Subscription Expires"
                        value={
                          school.package_setup.subscription_expires_at
                            ? formatDate(new Date(school.package_setup.subscription_expires_at))
                            : "—"
                        }
                      />
                      <div className="col-span-full space-y-1">
                        <p className="text-xs text-gray-01 font-mont">Enabled Modules</p>
                        <div className="flex flex-wrap gap-2">
                          {school.package_setup.enabled_modules.map((m) => (
                            <span key={m.key} className="text-xs bg-pry-01 text-primary px-2.5 py-1 rounded-full font-mont">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Branches Tab */}
            {activeTab === "branches" && (
              <div className="space-y-4">
                {school.branches.length === 0 && (
                  <p className="text-sm text-gray-01">No branches found.</p>
                )}
                {school.branches.map((branch) => (
                  <BranchCard key={branch.code} branch={branch} />
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && !school && (
          <p className="text-sm text-gray-01">School not found.</p>
        )}
      </main>
    </DashboardLayout>
  );
}
