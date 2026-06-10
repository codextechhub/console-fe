// Staff profile create/edit (admin). Create needs a CX-staff user + seat;
// edit patches the existing profile. Payroll editing is gated by
// platform.staff_payroll.manage.

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { routesPath } from "@/routes/routesPath";
import {
  useCreateAssignmentMutation,
  useCreateStaffProfileMutation,
  useGetPositionsQuery,
  useGetStaffProfileQuery,
  useUpdateStaffProfileMutation,
} from "@/redux/services/dashboard/organogramApi";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/teamMgtApi";
import { StaffProfileForm } from "./profile-form";

export default function StaffForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { hasPermission } = usePermissions();
  const payrollEditable = hasPermission(P.MANAGE_STAFF_PAYROLL);

  const { data: profileRes, isLoading: loadingProfile } = useGetStaffProfileQuery(id as string, { skip: !isEdit });
  const { data: positionsRes } = useGetPositionsQuery({ page_size: 100 });
  // CX staff users — only needed when creating a new profile.
  const { data: usersRes } = useGetTeamMembersQuery({ page_size: 100, user_type: "CX_STAFF" }, { skip: isEdit });

  const [createProfile, { isLoading: creating }] = useCreateStaffProfileMutation();
  const [updateProfile, { isLoading: updating }] = useUpdateStaffProfileMutation();
  const [assignPosition, { isLoading: assigning }] = useCreateAssignmentMutation();

  const profile = profileRes?.data ?? null;
  const currentPositionId = profile?.position?.id ? String(profile.position.id) : "";

  // Route a seat change through the assignments service so the effective-dated
  // PositionAssignment history is written (old primary closed, new one opened)
  // instead of silently overwriting profile.position.
  const syncPosition = async (userId: string, positionId: string) => {
    if (!positionId || positionId === currentPositionId) return;
    try {
      await assignPosition({ user_id: userId, position_id: Number(positionId), is_primary: true }).unwrap();
    } catch {
      toast.error("Profile saved, but the seat assignment failed. Set it again from Assignments.");
    }
  };

  const positionOptions = useMemo(
    () => (positionsRes?.data ?? []).map((p) => ({ value: String(p.id), label: `${p.title} · ${p.code}` })),
    [positionsRes],
  );
  const userOptions = useMemo(
    () => (usersRes?.data ?? []).map((u: { id: string; full_name: string; email: string }) => ({ value: u.id, label: `${u.full_name} · ${u.email}` })),
    [usersRes],
  );

  const back = () => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF);

  return (
    <DashboardLayout title={isEdit ? "Edit Profile" : "New Profile"} hasBack onBack={back}>
      <main className="px-4.5 py-6 text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">{isEdit ? "Edit Staff Profile" : "New Staff Profile"}</h1>
          <p className="text-sm text-gray-01 mt-1">{isEdit ? "Update this staff member's HR and employment record." : "Create an HR profile for a CX staff user."}</p>
        </div>

        {isEdit && loadingProfile ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : (
          <StaffProfileForm
            mode={isEdit ? "admin-edit" : "admin-create"}
            initial={profile}
            users={userOptions}
            positions={positionOptions}
            payrollEditable={payrollEditable}
            submitting={creating || updating || assigning}
            onCancel={back}
            onSubmit={(payload, positionId) => {
              if (isEdit) {
                updateProfile({ id: id as string, body: payload })
                  .unwrap()
                  .then(async () => {
                    if (profile) await syncPosition(profile.user.id, positionId);
                    toast.success("Profile updated.");
                    back();
                  })
                  .catch(() => {});
              } else {
                createProfile(payload)
                  .unwrap()
                  .then(async (res) => {
                    // Profile must exist before the assignment can sync its seat.
                    await syncPosition(res.data.user.id, positionId);
                    toast.success("Profile created.");
                    navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_VIEW(res.data.id));
                  })
                  .catch(() => {});
              }
            }}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
