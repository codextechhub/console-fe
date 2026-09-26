/**
 * Staff profile: brief for ordinary colleagues, full for authorised HR and
 * admin viewers. Reached two ways:
 *   /organogram/staff/:id/view             by profile id (org chart drawer)
 *   /organogram/staff/by-user/:userId/view by user id (Team Management's
 *                                          "View Details" knows users only)
 *
 * Every field follows Field Access on this record (`platform.staff_profile`):
 * one the viewer may not read is not drawn, and the Payroll card goes when none
 * is left (see `lib/staff-payroll`). The only account action here is Change
 * Email, beside the address; everything else lives in Team Management's row
 * actions.
 *
 * The "As at" control reads the profile as it stood at the end of an earlier
 * day (`?as_at=`, see `lib/as-at.ts`). The position history is cut at that day
 * from its own effective dates, and nothing that changes the record is offered.
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Banknote, Mail, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PermissionGate from "@/components/custom/permission-gate";
import { AsAtBanner, AsAtControl, LiveOnly } from "@/components/custom/as-at-control";
import { useFieldAccess } from "@/components/finance-ui/field-access";
import { AsAtContext, type AsAtMeta, useAsAtParam } from "@/lib/as-at";
import PermissionOverrides from "@/components/custom/permission-overrides";
import FieldAccessOverrides from "@/components/custom/field-access-overrides";
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
import { STAFF_PROFILE_RESOURCE, useVisiblePayrollFields } from "../lib/staff-payroll";
import { PageShell } from "@/components/layout/page-shell";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm text-black-01">{value || "-"}</span>
    </div>
  );
}

/**
 * The rows of a card this viewer may read, dropping the rest.
 *
 * A row names the registered field it shows; a field the record does not carry
 * for this viewer is hidden rather than drawn as "-", which would read as
 * "nothing recorded".
 */
function useShownRows(record: object) {
  const access = useFieldAccess(STAFF_PROFILE_RESOURCE, record);
  return (rows: { field?: string; label: string; value?: React.ReactNode; wide?: boolean }[]) =>
    rows
      .filter((row) => !row.field || !access.isHidden(row.field))
      .map((row) =>
        row.wide ? (
          <div key={row.label} className="sm:col-span-2"><Row label={row.label} value={row.value} /></div>
        ) : (
          <Row key={row.label} label={row.label} value={row.value} />
        ),
      );
}

/**
 * A row explaining empty organisation fields on a past view.
 *
 * Seats and units keep history from the day tracking reached them. On an
 * earlier day the API leaves the unit, department, division and line manager
 * empty rather than showing today's, and this row says why.
 */
function organisationRow(profile: { as_at?: AsAtMeta }) {
  const meta = profile.as_at;
  if (!meta) return [];
  const starts = meta.organisation_history_starts;
  if (starts && meta.date >= starts) return [];
  return [{
    label: "Department and line manager",
    value: starts
      ? `Recorded from ${fmtDate(starts)}. Earlier days are not known.`
      : "Not recorded for this day.",
    wide: true,
  }];
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
  const fields = useVisiblePayrollFields(profile);
  if (!fields.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold font-mont text-black-01">
        <Banknote className="size-4 text-teal-600" /> Payroll
        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-500 ring-1 ring-rose-200">SENSITIVE</span>
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <Row
            key={field.name}
            label={field.label}
            value={field.value && field.name === "account_number" ? <span className="font-mono">{field.value}</span> : field.value}
          />
        ))}
      </div>
    </section>
  );
}

function BriefProfile({ profile }: { profile: StaffProfileBrief }) {
  const rows = useShownRows(profile);
  return (
    <>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-slate-600">
        This is the work information available to colleagues in your workspace.
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Work profile">
          {rows([
            { field: "employee_id", label: "Employee ID", value: <span className="font-mono">{profile.employee_id}</span> },
            { label: "Seat", value: profile.position ? `${profile.position.title} · ${profile.position.code}` : "-" },
            { label: "Department", value: profile.department?.name },
            { label: "Division", value: profile.division?.name },
            ...(profile.org_node?.kind === "TEAM" ? [{ label: "Team", value: profile.org_node.name }] : []),
            { label: "Line manager", value: profile.current_line_manager?.full_name },
            ...organisationRow(profile),
            { field: "employment_type", label: "Employment type", value: <EmpBadge type={profile.employment_type} /> },
          ])}
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

  const [asAt, setAsAt] = useAsAtParam();
  // `currentData`, so another day's answer is never shown under this one.
  const { currentData: data, isLoading, isError, refetch } = useGetStaffProfileQuery(
    { id: resolvedId as string, asAt },
    { skip: !resolvedId },
  );
  const profile = data?.data;
  const fullProfile = profile?.profile_view === "full" ? profile : null;
  const { data: assignmentsRes } = useGetAssignmentsQuery(
    { user: fullProfile?.user.id ?? "", page_size: 50 },
    { skip: !fullProfile?.user.id },
  );
  const allAssignments = Array.isArray(assignmentsRes?.data) ? assignmentsRes!.data : [];
  // Cut at the chosen day from the assignments' own effective dates: a seat
  // that started later did not exist yet, and one that ended later was current.
  const history = asAt
    ? allAssignments
        .filter((a) => !a.start_date || a.start_date <= asAt)
        .map((a) => (a.end_date && a.end_date > asAt ? { ...a, end_date: null } : a))
    : allAssignments;

  // Change email - the one account action kept on this page.
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changeEmail, { isLoading: changingEmail }] = useChangeUserEmailMutation();
  const canChangeEmail = Boolean(fullProfile) && !asAt && hasPermission(P.MODIFY_TEAM_MEMBER);
  const rows = useShownRows(fullProfile ?? {});

  const loading = lookingUp || isLoading || (!profile && !lookupMiss && !isError);

  return (
    <AsAtContext.Provider value={asAt}>
      <PageShell className="space-y-5 text-black-01">
        {asAt && <AsAtBanner asAt={asAt} onReturn={() => setAsAt(undefined)} />}
        {isError && asAt ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-01">This profile has no history for that day.</p>
            <Button variant="outline" className="mt-4" onClick={() => setAsAt(undefined)}>
              Back to today
            </Button>
          </div>
        ) : lookupMiss ? (
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
                <div className="text-sm text-gray-01">{profile.job_title || profile.position?.title || "-"}{profile.department?.name ? ` · ${profile.department.name}` : ""}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={profile.employment_status} />
                  <EmpBadge type={profile.employment_type} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {profile.profile_view === "full" && (
                  <LiveOnly>
                    <PermissionGate permission={P.MODIFY_STAFF_PROFILE}>
                      <Button variant="outline" onClick={() => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_EDIT(profile.id))}>
                        <Pencil className="size-4" /> Edit
                      </Button>
                    </PermissionGate>
                  </LiveOnly>
                )}
                <AsAtControl historyStarts={profile.history_starts} value={asAt} onChange={setAsAt} />
              </div>
            </div>

            {profile.profile_view === "brief" ? (
              <BriefProfile profile={profile} />
            ) : (
              <>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Employment">
                {rows([
                  { field: "employee_id", label: "Employee ID", value: <span className="font-mono">{profile.employee_id}</span> },
                  { field: "job_title", label: "Job title", value: profile.job_title },
                  { label: "Seat", value: profile.position ? `${profile.position.title} · ${profile.position.code}` : "-" },
                  { label: "Department", value: profile.department?.name },
                  { label: "Line manager", value: profile.current_line_manager?.full_name },
                  ...organisationRow(profile),
                  { field: "date_joined", label: "Date joined", value: fmtDate(profile.date_joined ?? null) },
                  { field: "date_exited", label: "Date exited", value: fmtDate(profile.date_exited ?? null) },
                ])}
              </Card>

              <Card title="Personal">
                {rows([
                  { field: "date_of_birth", label: "Date of birth", value: fmtDate(profile.date_of_birth ?? null) },
                  { field: "marital_status", label: "Marital status", value: profile.marital_status },
                  { field: "nationality", label: "Nationality", value: profile.nationality },
                  { field: "state_of_origin", label: "State of origin", value: profile.state_of_origin },
                  { label: "Bio", value: profile.bio, wide: true },
                ])}
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
                {rows([
                  { field: "personal_email", label: "Personal email", value: profile.personal_email },
                  { field: "alternate_phone", label: "Alternate phone", value: profile.alternate_phone },
                  { field: "city", label: "City", value: profile.city },
                  { field: "state", label: "State", value: profile.state },
                  { field: "residential_address", label: "Residential address", value: profile.residential_address, wide: true },
                ])}
              </Card>

              <Card title="Next of kin">
                {rows([
                  { field: "nok_name", label: "Name", value: profile.nok_name },
                  { field: "nok_relationship", label: "Relationship", value: profile.nok_relationship },
                  { field: "nok_phone", label: "Phone", value: profile.nok_phone },
                  { field: "nok_address", label: "Address", value: profile.nok_address, wide: true },
                ])}
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
            <FieldAccessOverrides
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
      </PageShell>
    </AsAtContext.Provider>
  );
}
