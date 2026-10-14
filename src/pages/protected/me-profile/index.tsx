/**
 * My Profile - self-service CX staff profile (platform-staff-profiles/me).
 * Opens as a READ view: grouped cards (organisation, personal, contact, next of
 * kin, position history, payroll). Editing is an explicit mode behind the
 * "Edit Profile" button; Save stays disabled until something actually changes
 * (Formik dirty). A staff member always reads and writes their own payroll
 * bank details, whatever their roles say, so the payroll fields come from this
 * record rather than from the signed-in user's Field Access map.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Banknote, Briefcase, Building2, ChevronRight, Clock3, Contact, Pencil, ShieldCheck, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetMyAssignmentsQuery,
  useGetMyStaffProfileQuery,
  useUpdateMyStaffProfileMutation,
} from "@/redux/services/dashboard/organogram-api";
import type { StaffProfile } from "@/redux/services/dashboard/organogram-types";
import { StaffProfileForm } from "../organogram/staff/profile-form";
import { OrgAvatar, StatusPill, EmpBadge } from "../organogram/components/org-primitives";
import { fmtDate } from "../organogram/lib/org-helpers";
import { useVisiblePayrollFields } from "../organogram/lib/staff-payroll";
import { fieldWriteErrors, type FieldErrors } from "@/components/finance-ui/field-access";
import { PageShell } from "@/components/layout/page-shell";
import { routesPath } from "@/routes/routes-path";
import { useNavigate } from "react-router";
import {
  ProfileCard,
  ProfileField,
  ProfileFields,
  ProfileHero,
  ProfilePanel,
  ProfileTabs,
  ProfileTimeline,
  type ProfileTab,
  type ProfileTabId,
} from "@/components/profile/profile-system";

const PROFILE_TABS: ProfileTab[] = [
  { id: "overview", label: "Overview" },
  { id: "access", label: "Access" },
  { id: "activity", label: "Activity" },
  { id: "history", label: "History" },
];

// ── Read-view primitives (same family as staff-detail) ───────────────────────
function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return <ProfileField label={label} value={value} />;
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
          <span className="inline-flex flex-col rounded-lg bg-slate-50 px-2.5 py-1.5 ring-1 ring-white-02">
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{t.tier}</span>
            <span className="text-[13px] font-semibold text-black-01">{t.name}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

// ── Payroll: the fields this profile carries (see lib/staff-payroll) ─────────
function PayrollCard({ profile }: { profile: StaffProfile }) {
  const fields = useVisiblePayrollFields(profile);
  if (!fields.length) return null;
  return (
    <ProfileCard
      title="Payroll"
      icon={Banknote}
      badge={<span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-500 ring-1 ring-rose-200">SENSITIVE</span>}
    >
      <ProfileFields columns={3}>
        {fields.map((field) => (
          <Row
            key={field.name}
            label={field.label}
            value={field.value && field.name === "account_number" ? <span className="font-mono">{field.value}</span> : field.value}
          />
        ))}
      </ProfileFields>
    </ProfileCard>
  );
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMyStaffProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateMyStaffProfileMutation();
  const profile = data?.data ?? null;
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const { data: assignmentsRes } = useGetMyAssignmentsQuery(undefined, {
    skip: !profile?.user.id,
  });
  const history = Array.isArray(assignmentsRes?.data) ? assignmentsRes!.data : [];

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
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
            <ProfileHero
              avatar={<OrgAvatar user={profile.user} size={72} status={profile.employment_status} />}
              name={profile.user.full_name}
              title={profile.job_title || profile.position?.title || "CX staff"}
              email={profile.user.email}
              badges={(
                <>
                  <StatusPill status={profile.employment_status} />
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">CX Staff</span>
                  <EmpBadge type={profile.employment_type} />
                  {profile.employee_id ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">{profile.employee_id}</span>
                  ) : null}
                </>
              )}
              facts={[
                { label: "Department", value: profile.department?.name || "-", icon: Building2 },
                { label: "Last updated", value: fmtDate(profile.updated_at), icon: Clock3 },
              ]}
              actions={!editing ? (
                <Button onClick={() => setEditing(true)}>
                  <Pencil className="size-4" /> Edit profile
                </Button>
              ) : undefined}
            />

            {editing ? (
              <StaffProfileForm
                mode="me"
                initial={profile}
                submitting={saving}
                fieldErrors={fieldErrors}
                onCancel={() => { setFieldErrors(null); setEditing(false); }}
                onSubmit={(payload) => {
                  setFieldErrors(null);
                  updateProfile(payload)
                    .unwrap()
                    .then(() => {
                      toast.success("Profile updated.");
                      setEditing(false);
                    })
                    .catch((error: unknown) => setFieldErrors(fieldWriteErrors(error)));
                }}
              />
            ) : (
              <>
                <ProfileTabs tabs={PROFILE_TABS} active={activeTab} onChange={setActiveTab} />

                {activeTab === "overview" ? (
                  <ProfilePanel id="overview" className="space-y-5">
                    <ProfileCard title="Organisation" icon={Building2}>
                      <OrgChain profile={profile} />
                      <div className="mt-5">
                        <ProfileFields columns={3}>
                          <Row label="Seat" value={profile.position ? `${profile.position.title} · ${profile.position.code}` : undefined} />
                          <Row label="Job title" value={profile.job_title} />
                          <Row
                            label="Line manager"
                            value={profile.current_line_manager ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="size-3.5 text-slate-400" />
                                {profile.current_line_manager.full_name}
                              </span>
                            ) : undefined}
                          />
                          <Row label="Employment type" value={<EmpBadge type={profile.employment_type} />} />
                          <Row label="Date joined" value={fmtDate(profile.date_joined)} />
                          {profile.date_exited ? <Row label="Date exited" value={fmtDate(profile.date_exited)} /> : null}
                        </ProfileFields>
                      </div>
                    </ProfileCard>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <ProfileCard title="Personal" icon={UserRound}>
                        <ProfileFields>
                          <Row label="Date of birth" value={fmtDate(profile.date_of_birth)} />
                          <Row label="Marital status" value={profile.marital_status} />
                          <Row label="Nationality" value={profile.nationality} />
                          <Row label="State of origin" value={profile.state_of_origin} />
                          <ProfileField label="Bio" value={profile.bio} wide />
                        </ProfileFields>
                      </ProfileCard>

                      <ProfileCard title="Contact" icon={Contact}>
                        <ProfileFields>
                          <Row label="Work email" value={profile.user.email} />
                          <Row label="Personal email" value={profile.personal_email} />
                          <Row label="Alternate phone" value={profile.alternate_phone} />
                          <Row label="City and state" value={[profile.city, profile.state].filter(Boolean).join(", ")} />
                          <ProfileField label="Residential address" value={profile.residential_address} wide />
                        </ProfileFields>
                      </ProfileCard>

                      <ProfileCard title="Next of kin" icon={UserRound}>
                        <ProfileFields>
                          <Row label="Name" value={profile.nok_name} />
                          <Row label="Relationship" value={profile.nok_relationship} />
                          <Row label="Phone" value={profile.nok_phone} />
                          <ProfileField label="Address" value={profile.nok_address} wide />
                        </ProfileFields>
                      </ProfileCard>

                      <PayrollCard profile={profile} />
                    </div>
                  </ProfilePanel>
                ) : null}

                {activeTab === "access" ? (
                  <ProfilePanel id="access" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <ProfileCard title="Your access context" icon={ShieldCheck}>
                      <ProfileFields>
                        <ProfileField label="Account type" value="CX Staff" />
                        <ProfileField label="Department" value={profile.department?.name} />
                        <ProfileField label="Position" value={profile.position?.title} />
                        <ProfileField label="Employment status" value={profile.employment_status} />
                      </ProfileFields>
                    </ProfileCard>
                    <ProfileCard title="Security and privacy" icon={ShieldCheck}>
                      <p className="text-sm leading-6 text-gray-01">Passwords, sessions, login history, and personal-data controls are kept in My Security.</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.OVERVIEW)}>
                        Open My Security
                      </Button>
                    </ProfileCard>
                  </ProfilePanel>
                ) : null}

                {activeTab === "activity" ? (
                  <ProfilePanel id="activity" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <ProfileCard title="Profile activity" icon={Clock3}>
                      <ProfileTimeline items={[
                        { id: "updated", title: "Profile updated", detail: fmtDate(profile.updated_at), current: true },
                        { id: "created", title: "Profile created", detail: fmtDate(profile.created_at) },
                      ]} />
                    </ProfileCard>
                    <ProfileCard title="Current work state" icon={Briefcase}>
                      <ProfileFields>
                        <ProfileField label="Employment status" value={profile.employment_status} />
                        <ProfileField label="Employment type" value={profile.employment_type} />
                        <ProfileField label="Work email" value={profile.user.email} />
                        <ProfileField label="Line manager" value={profile.current_line_manager?.full_name} />
                      </ProfileFields>
                    </ProfileCard>
                  </ProfilePanel>
                ) : null}

                {activeTab === "history" ? (
                  <ProfilePanel id="history">
                    <ProfileCard title="Position history" icon={Briefcase} className="max-w-3xl">
                      {history.length ? (
                        <ProfileTimeline items={history.map((assignment) => {
                          const current = assignment.end_date === null;
                          return {
                            id: assignment.id,
                            title: assignment.position.title,
                            detail: `${fmtDate(assignment.start_date)} – ${current ? "Present" : fmtDate(assignment.end_date)}`,
                            current,
                            badge: (
                              <>
                                {assignment.is_acting ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">ACTING</span> : null}
                                {assignment.is_primary ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">PRIMARY</span> : null}
                              </>
                            ),
                          };
                        })} />
                      ) : <p className="text-sm text-gray-01">No assignment history yet.</p>}
                    </ProfileCard>
                  </ProfilePanel>
                ) : null}
              </>
            )}
          </>
        )}
      </PageShell>
    </>
  );
}
