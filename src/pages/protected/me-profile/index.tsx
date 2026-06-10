// My Profile — self-service CX staff profile (platform-staff-profiles/me).
// Owner can always read & write their own payroll fields (backend FLS owner
// exception), so payroll is editable here.

import { useNavigate } from "react-router";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { routesPath } from "@/routes/routesPath";
import {
  useGetMyStaffProfileQuery,
  useUpdateMyStaffProfileMutation,
} from "@/redux/services/dashboard/organogramApi";
import { StaffProfileForm } from "../organogram/staff/profile-form";
import { OrgAvatar, StatusPill } from "../organogram/components/org-primitives";
import { fmtDate } from "../organogram/lib/org-helpers";

export default function MyProfile() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMyStaffProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateMyStaffProfileMutation();
  const profile = data?.data ?? null;

  return (
    <DashboardLayout title="My Profile">
      <main className="px-4.5 py-6 text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">My Profile</h1>
          <p className="text-sm text-gray-01 mt-1">Your personal, contact, next-of-kin and payroll details.</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : !profile ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-gray-01">
            No staff profile is on record for your account yet.
          </div>
        ) : (
          <>
            {/* read-only employment summary */}
            <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <OrgAvatar user={profile.user} size={56} status={profile.employment_status} />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-black-01">{profile.user.full_name}</div>
                <div className="text-sm text-gray-01">{profile.job_title || profile.position?.title || "—"}{profile.department?.name ? ` · ${profile.department.name}` : ""}</div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-01">
                <div><div className="uppercase tracking-wide text-[10px] text-slate-400">Employee ID</div><div className="font-mono text-black-01">{profile.employee_id || "—"}</div></div>
                <div><div className="uppercase tracking-wide text-[10px] text-slate-400">Joined</div><div className="text-black-01">{fmtDate(profile.date_joined)}</div></div>
                <div><div className="uppercase tracking-wide text-[10px] text-slate-400">Manager</div><div className="text-black-01">{profile.current_line_manager?.full_name || "—"}</div></div>
                <StatusPill status={profile.employment_status} />
              </div>
            </div>

            <StaffProfileForm
              mode="me"
              initial={profile}
              payrollEditable
              submitting={saving}
              onCancel={() => navigate(routesPath.PROTECTED.OVERVIEW.INDEX)}
              onSubmit={(payload) => {
                updateProfile(payload)
                  .unwrap()
                  .then(() => toast.success("Profile updated."))
                  .catch(() => {});
              }}
            />
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
