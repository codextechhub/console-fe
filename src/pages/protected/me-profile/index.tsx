// My Profile — self-service CX staff profile (platform-staff-profiles/me).
// Opens as a READ view: grouped cards (organisation, personal, contact, next of
// kin, position history, payroll). Editing is an explicit mode behind the
// "Edit Profile" button; Save stays disabled until something actually changes
// (Formik dirty). Owner can always read & write their own payroll fields
// (backend FLS owner exception).

import { useState } from "react";
import { toast } from "sonner";
import { Banknote, Briefcase, Building2, ChevronRight, Lock, LockOpen, Pencil, ShieldAlert, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  useGetAssignmentsQuery,
  useGetMyStaffProfileQuery,
  useUpdateMyStaffProfileMutation,
} from "@/redux/services/dashboard/organogramApi";
import type { StaffProfile } from "@/redux/services/dashboard/organogramTypes";
import { StaffProfileForm } from "../organogram/staff/profile-form";
import { OrgAvatar, StatusPill, EmpBadge } from "../organogram/components/org-primitives";
import { fmtDate } from "../organogram/lib/org-helpers";

// ── Read-view primitives (same family as staff-detail) ───────────────────────
function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm text-black-01">{value || "—"}</span>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold font-mont text-black-01">
        {icon}
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

// ── Org structure chain: Division → Department → Team → Seat ─────────────────
function OrgChain({ profile }: { profile: StaffProfile }) {
  // De-dupe by node id: a seat that sits directly at department level has
  // org_node === department; show each tier once.
  const seen = new Set<number>();
  const tiers: { tier: string; name: string }[] = [];
  for (const [tier, node] of [
    ["Division", profile.division],
    ["Department", profile.department],
    ["Team", profile.org_node],
  ] as const) {
    if (node && !seen.has(node.id)) {
      seen.add(node.id);
      tiers.push({ tier, name: node.name });
    }
  }
  if (profile.position) tiers.push({ tier: "Position", name: profile.position.title });

  if (!tiers.length) {
    return <p className="text-sm text-gray-01">No seat in the organogram yet.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tiers.map((t, i) => (
        <span key={`${t.tier}-${t.name}`} className="inline-flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5 text-slate-300" />}
          <span className="inline-flex flex-col rounded-lg bg-slate-50 px-2.5 py-1.5 ring-1 ring-slate-100">
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{t.tier}</span>
            <span className="text-[13px] font-semibold text-black-01">{t.name}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

// ── Payroll (owner always unlocked via FLS owner exception; defensive lock) ──
function PayrollCard({ profile }: { profile: StaffProfile }) {
  const unlocked =
    profile.bank_name !== undefined || profile.account_name !== undefined || profile.account_number !== undefined;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold font-mont text-black-01">
        <Banknote className="size-4 text-teal-600" /> Payroll
        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-500 ring-1 ring-rose-200">
          SENSITIVE
        </span>
      </h3>
      {unlocked ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3 mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-teal-700">
            <LockOpen className="size-3" /> Visible to you only
          </div>
          <Row label="Bank" value={profile.bank_name} />
          <Row label="Account name" value={profile.account_name} />
          <Row label="Account number" value={<span className="font-mono">{profile.account_number}</span>} />
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-gray-01 ring-1 ring-slate-200">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-amber-500" /> Payroll details are not on record yet.
          </span>
        </div>
      )}
    </section>
  );
}

export default function MyProfile() {
  const { data, isLoading } = useGetMyStaffProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateMyStaffProfileMutation();
  const profile = data?.data ?? null;
  const [editing, setEditing] = useState(false);

  const { data: assignmentsRes } = useGetAssignmentsQuery(
    { user: profile?.user.id ?? "", page_size: 50 },
    { skip: !profile?.user.id },
  );
  const history = Array.isArray(assignmentsRes?.data) ? assignmentsRes!.data : [];

  return (
    <DashboardLayout title="My Profile">
      <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold font-mont text-gray-01">My Profile</p>
            <p className="text-xs text-gray-01 mt-0.5">
              {editing
                ? "Update your personal, contact, next-of-kin and payroll details."
                : "Your employment record — where you sit in the organisation and your personal details."}
            </p>
          </div>
          {!editing && profile && (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit Profile
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : !profile ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-gray-01">
            No staff profile is on record for your account yet.
          </div>
        ) : (
          <>
            {/* Identity header (both modes) */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <OrgAvatar user={profile.user} size={60} status={profile.employment_status} />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-black-01">{profile.user.full_name}</div>
                <div className="text-sm text-gray-01">
                  {profile.job_title || profile.position?.title || "—"}
                  {profile.department?.name ? ` · ${profile.department.name}` : ""}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={profile.employment_status} />
                  <EmpBadge type={profile.employment_type} />
                  {profile.employee_id && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                      {profile.employee_id}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-gray-01">
                <div className="uppercase tracking-wide text-[10px] text-slate-400">Last updated</div>
                <div className="text-black-01">{fmtDate(profile.updated_at)}</div>
              </div>
            </div>

            {editing ? (
              <StaffProfileForm
                mode="me"
                initial={profile}
                payrollEditable
                submitting={saving}
                onCancel={() => setEditing(false)}
                onSubmit={(payload) => {
                  updateProfile(payload)
                    .unwrap()
                    .then(() => {
                      toast.success("Profile updated.");
                      setEditing(false);
                    })
                    .catch(() => {});
                }}
              />
            ) : (
              <>
                {/* Organisation — where this person sits in the structure */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold font-mont text-black-01">
                    <Building2 className="size-4 text-indigo-500" /> Organisation
                  </h3>
                  <OrgChain profile={profile} />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Row
                      label="Seat"
                      value={profile.position ? `${profile.position.title} · ${profile.position.code}` : undefined}
                    />
                    <Row label="Job title" value={profile.job_title} />
                    <Row
                      label="Line manager"
                      value={
                        profile.current_line_manager ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-3.5 text-slate-400" />
                            {profile.current_line_manager.full_name}
                          </span>
                        ) : undefined
                      }
                    />
                    <Row label="Employment type" value={<EmpBadge type={profile.employment_type} />} />
                    <Row label="Date joined" value={fmtDate(profile.date_joined)} />
                    {profile.date_exited && <Row label="Date exited" value={fmtDate(profile.date_exited)} />}
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Card title="Personal">
                    <Row label="Date of birth" value={fmtDate(profile.date_of_birth)} />
                    <Row label="Marital status" value={profile.marital_status} />
                    <Row label="Nationality" value={profile.nationality} />
                    <Row label="State of origin" value={profile.state_of_origin} />
                    <div className="sm:col-span-2">
                      <Row label="Bio" value={profile.bio} />
                    </div>
                  </Card>

                  <Card title="Contact">
                    <Row label="Work email" value={profile.user.email} />
                    <Row label="Personal email" value={profile.personal_email} />
                    <Row label="Alternate phone" value={profile.alternate_phone} />
                    <Row label="Location" value={[profile.city, profile.state].filter(Boolean).join(", ")} />
                    <div className="sm:col-span-2">
                      <Row label="Residential address" value={profile.residential_address} />
                    </div>
                  </Card>

                  <Card title="Next of kin">
                    <Row label="Name" value={profile.nok_name} />
                    <Row label="Relationship" value={profile.nok_relationship} />
                    <Row label="Phone" value={profile.nok_phone} />
                    <div className="sm:col-span-2">
                      <Row label="Address" value={profile.nok_address} />
                    </div>
                  </Card>

                  <PayrollCard profile={profile} />
                </div>

                {/* Position history (effective-dated assignments) */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold font-mont text-black-01">
                    <Briefcase className="size-4 text-slate-500" /> Position history
                  </h3>
                  {history.length ? (
                    <div className="flex flex-col gap-2">
                      {history.map((a) => {
                        const current = a.end_date === null;
                        return (
                          <div
                            key={a.id}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${current ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white"}`}
                          >
                            <span className={`h-2 w-2 shrink-0 rounded-full ${current ? "bg-indigo-500" : "bg-slate-300"}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-[13px] font-medium text-slate-700">{a.position.title}</span>
                                {a.is_acting && (
                                  <span className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-700">ACTING</span>
                                )}
                                {a.is_primary && (
                                  <span className="rounded bg-slate-100 px-1 text-[9px] font-bold text-slate-500">PRIMARY</span>
                                )}
                              </div>
                              <div className="text-[11.5px] text-slate-400">
                                {fmtDate(a.start_date)} – {current ? "Present" : fmtDate(a.end_date)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-01">No assignment history yet.</p>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
