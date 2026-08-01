// Staff profile — brief for ordinary colleagues, full for authorised HR/admin
// viewers. Reached two ways:
//   /organogram/staff/:id/view            — by profile id (org chart drawer)
//   /organogram/staff/by-user/:userId/view — by USER id (Team Management's
//                                            "View Details" knows users only)
// Payroll uses real FLS: bank fields are absent unless the caller holds
// platform.staff_payroll.view (or is owner). The only account action here is
// Change Email (beside the email address) — everything else lives in Team
// Management's row actions.

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Banknote, Lock, LockOpen, Mail, Pencil, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PermissionGate from "@/components/custom/permission-gate";
import PermissionOverrides from "@/components/custom/permission-overrides";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAppSelector } from "@/redux/store";
import { selectTenant } from "@/redux/features/auth/auth-slice";
import { routesPath } from "@/routes/routes-path";
import {
  useGetAssignmentsQuery,
  useGetStaffProfileQuery,
  useGetStaffProfilesQuery,
} from "@/redux/services/dashboard/organogram-api";
import { useChangeUserEmailMutation } from "@/redux/services/dashboard/team-mgt-api";
import type { StaffProfile, StaffProfileBrief } from "@/redux/services/dashboard/organogram-types";
import { OrgAvatar, StatusPill, EmpBadge } from "../components/org-primitives";
import { fmtDate } from "../lib/org-helpers";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm text-black-01">{value || "—"}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold font-mont text-black-01">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Payroll({ profile }: { profile: StaffProfile }) {
  const unlocked = profile.bank_name !== undefined || profile.account_name !== undefined || profile.account_number !== undefined;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold font-mont text-black-01">
        <Banknote className="size-4 text-teal-600" /> Payroll
        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-500 ring-1 ring-rose-200">SENSITIVE</span>
      </h3>
      {unlocked ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3 mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-teal-700"><LockOpen className="size-3" /> Payroll access granted</div>
          <Row label="Bank" value={profile.bank_name} />
          <Row label="Account name" value={profile.account_name} />
          <Row label="Account number" value={<span className="font-mono">{profile.account_number}</span>} />
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-gray-01 ring-1 ring-slate-200">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <span className="flex items-center gap-1.5"><ShieldAlert className="size-3.5 text-amber-500" /> Restricted — requires <span className="font-mono font-semibold">platform.staff_payroll.view</span>.</span>
        </div>
      )}
    </section>
  );
}

function BriefProfile({ profile }: { profile: StaffProfileBrief }) {
  return (
    <>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-slate-600">
        This is the work information available to colleagues in your workspace.
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Work profile">
          <Row label="Employee ID" value={<span className="font-mono">{profile.employee_id}</span>} />
          <Row label="Seat" value={profile.position ? `${profile.position.title} · ${profile.position.code}` : "—"} />
          <Row label="Department" value={profile.department?.name} />
          <Row label="Division" value={profile.division?.name} />
          {profile.org_node?.kind === "TEAM" && <Row label="Team" value={profile.org_node.name} />}
          <Row label="Line manager" value={profile.current_line_manager?.full_name} />
          <Row label="Employment type" value={<EmpBadge type={profile.employment_type} />} />
        </Card>
        <Card title="Contact">
          <Row label="Work email" value={profile.user.email} />
        </Card>
      </div>
    </>
  );
}

export default function StaffDetail() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { id, userId } = useParams<{ id?: string; userId?: string }>();
  // CX staff live in the caller's own (platform) tenant, so the override
  // endpoint asserts that slug. See permission-overrides.tsx for the gate.
  const tenantSlug = useAppSelector(selectTenant)?.slug ?? "";

  // by-user entry: resolve the profile id from the owner's user id first.
  const { data: lookupRes, isLoading: lookingUp } = useGetStaffProfilesQuery(
    { user: userId as string, page_size: 1 },
    { skip: !userId },
  );
  const lookupRows = Array.isArray(lookupRes?.data) ? lookupRes!.data : [];
  const resolvedId = id ?? (lookupRows[0] ? String(lookupRows[0].id) : undefined);
  const lookupMiss = !!userId && !lookingUp && !!lookupRes && !lookupRows.length;

  const { data, isLoading, refetch } = useGetStaffProfileQuery(resolvedId as string, { skip: !resolvedId });
  const profile = data?.data;
  const fullProfile = profile?.profile_view === "full" ? profile : null;
  const { data: assignmentsRes } = useGetAssignmentsQuery(
    { user: fullProfile?.user.id ?? "", page_size: 50 },
    { skip: !fullProfile?.user.id },
  );
  const history = Array.isArray(assignmentsRes?.data) ? assignmentsRes!.data : [];

  // Change email — the one account action kept on this page.
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changeEmail, { isLoading: changingEmail }] = useChangeUserEmailMutation();
  const canChangeEmail = Boolean(fullProfile) && hasPermission(P.MODIFY_TEAM_MEMBER);

  const loading = lookingUp || isLoading || (!profile && !lookupMiss);

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        {lookupMiss ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-01">No staff profile is on record for this user yet.</p>
            <PermissionGate permission={P.CREATE_STAFF_PROFILE}>
              <Button variant="outline" className="mt-4" onClick={() => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_CREATE)}>
                Create staff profile
              </Button>
            </PermissionGate>
          </div>
        ) : loading || !profile ? (
          <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <OrgAvatar user={profile.user} size={60} status={profile.employment_status} />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-black-01">{profile.user.full_name}</div>
                <div className="text-sm text-gray-01">{profile.job_title || profile.position?.title || "—"}{profile.department?.name ? ` · ${profile.department.name}` : ""}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={profile.employment_status} />
                  <EmpBadge type={profile.employment_type} />
                </div>
              </div>
              {profile.profile_view === "full" && (
                <PermissionGate permission={P.MODIFY_STAFF_PROFILE}>
                  <Button variant="outline" onClick={() => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_EDIT(profile.id))}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                </PermissionGate>
              )}
            </div>

            {profile.profile_view === "brief" ? (
              <BriefProfile profile={profile} />
            ) : (
              <>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Employment">
                <Row label="Employee ID" value={<span className="font-mono">{profile.employee_id}</span>} />
                <Row label="Seat" value={profile.position ? `${profile.position.title} · ${profile.position.code}` : "—"} />
                <Row label="Department" value={profile.department?.name} />
                <Row label="Line manager" value={profile.current_line_manager?.full_name} />
                <Row label="Date joined" value={fmtDate(profile.date_joined)} />
                <Row label="Date exited" value={fmtDate(profile.date_exited)} />
              </Card>

              <Card title="Personal">
                <Row label="Date of birth" value={fmtDate(profile.date_of_birth)} />
                <Row label="Marital status" value={profile.marital_status} />
                <Row label="Nationality" value={profile.nationality} />
                <Row label="State of origin" value={profile.state_of_origin} />
                <div className="sm:col-span-2"><Row label="Bio" value={profile.bio} /></div>
              </Card>

              <Card title="Contact">
                <Row
                  label="Work email"
                  value={
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {profile.user.email}
                      {canChangeEmail && (
                        <button
                          onClick={() => setEmailModal(true)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-gray-06 transition-colors hover:border-primary/40 hover:text-primary"
                          title="Change email address"
                        >
                          <Mail className="size-3" /> Change
                        </button>
                      )}
                    </span>
                  }
                />
                <Row label="Personal email" value={profile.personal_email} />
                <Row label="Alternate phone" value={profile.alternate_phone} />
                <Row label="Location" value={[profile.city, profile.state].filter(Boolean).join(", ")} />
                <div className="sm:col-span-2"><Row label="Residential address" value={profile.residential_address} /></div>
              </Card>

              <Card title="Next of kin">
                <Row label="Name" value={profile.nok_name} />
                <Row label="Relationship" value={profile.nok_relationship} />
                <Row label="Phone" value={profile.nok_phone} />
                <div className="sm:col-span-2"><Row label="Address" value={profile.nok_address} /></div>
              </Card>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold font-mont text-black-01">Position history</h3>
              {history.length ? (
                <div className="flex flex-col gap-2">
                  {history.map((a) => {
                    const current = a.end_date === null;
                    return (
                      <div key={a.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${current ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white"}`}>
                        <span className={`h-2 w-2 shrink-0 rounded-full ${current ? "bg-indigo-500" : "bg-slate-300"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-medium text-slate-700">{a.position.title}</span>
                            {a.is_acting && <span className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-700">ACTING</span>}
                            {a.is_primary && <span className="rounded bg-slate-100 px-1 text-[9px] font-bold text-slate-500">PRIMARY</span>}
                          </div>
                          <div className="text-[11.5px] text-slate-400">{fmtDate(a.start_date)} – {current ? "Present" : fmtDate(a.end_date)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-01">No assignment history yet.</p>
              )}
            </section>

            <Payroll profile={profile} />

            <PermissionOverrides
              userId={profile.user.id}
              tenantSlug={tenantSlug}
              userName={profile.user.full_name}
              className="rounded-2xl border-slate-200 p-5"
            />

            {/* Change email modal */}
            <Dialog open={emailModal} onOpenChange={(open) => { setEmailModal(open); if (!open) setNewEmail(""); }}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Change email address</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-gray-01">
                    Changing the email for <span className="font-medium text-black-01">{profile.user.full_name}</span>.
                    Their sessions will be ended and they must sign in with the new address.
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-01">New email address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="white" size="sm" onClick={() => { setEmailModal(false); setNewEmail(""); }} disabled={changingEmail}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!newEmail.includes("@") || changingEmail}
                    loading={changingEmail}
                    onClick={() => {
                      changeEmail({ user_id: profile.user.id, email: newEmail })
                        .unwrap()
                        .then(() => {
                          toast.success("Email updated successfully.");
                          setEmailModal(false);
                          setNewEmail("");
                          refetch();
                        })
                        .catch(() => {});
                    }}
                  >
                    Update email
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
