// Staff profile — full read view (admin). Payroll uses real FLS: bank fields
// are absent unless the caller holds platform.staff_payroll.view (or is owner).

import { useNavigate, useParams } from "react-router";
import { Banknote, Lock, LockOpen, Pencil, ShieldAlert } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import { useGetAssignmentsQuery, useGetStaffProfileQuery } from "@/redux/services/dashboard/organogramApi";
import type { StaffProfile } from "@/redux/services/dashboard/organogramTypes";
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

export default function StaffDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetStaffProfileQuery(id as string, { skip: !id });
  const profile = data?.data;
  const { data: assignmentsRes } = useGetAssignmentsQuery(
    { user: profile?.user.id ?? "", page_size: 50 },
    { skip: !profile?.user.id },
  );
  const history = Array.isArray(assignmentsRes?.data) ? assignmentsRes!.data : [];

  return (
    <DashboardLayout title="Staff Profile" hasBack onBack={() => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF)}>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        {isLoading || !profile ? (
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
              <PermissionGate permission={P.MODIFY_STAFF_PROFILE}>
                <Button variant="outline" onClick={() => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_EDIT(profile.id))}>
                  <Pencil className="size-4" /> Edit
                </Button>
              </PermissionGate>
            </div>

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
                <Row label="Work email" value={profile.user.email} />
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
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
