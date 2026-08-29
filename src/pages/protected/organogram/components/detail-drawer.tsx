// Right-side slide-over for People & Positions. Payroll uses REAL field-level
// security: the backend omits bank/account fields (and lists them in
// _stripped_fields) when the caller lacks platform.staff_payroll.view and is not
// the owner. So "restricted" keys off field absence - there is no masked value.

import { useMemo } from "react";
import {
  AtSign, Banknote, Briefcase, Building2, CalendarDays, Contact, CornerLeftUp,
  GitBranch, Hash, HeartHandshake, History, IdCard, Landmark, Lock, LockOpen,
  Mail, MapPin, Network, Pencil, Phone, ShieldAlert, ShieldCheck, Spline,
  UserCheck, Users, X,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  MatrixReport, Position, StaffProfile, UserInline,
} from "@/redux/services/dashboard/organogram-types";
import {
  useGetAssignmentsQuery, useGetStaffProfileQuery,
} from "@/redux/services/dashboard/organogram-api";
import { fmtDate, yearsSince, type ProfileMap } from "../lib/org-helpers";
import { ActingBadge, DeptChip, EmpBadge, OrgAvatar, StatusPill } from "./org-primitives";

export type DetailTarget =
  | { kind: "person"; user: UserInline }
  | { kind: "position"; id: number };

export interface DrawerCtx {
  profiles: ProfileMap;
  posMap: Map<number, Position>;
  matrixOut: Map<number, MatrixReport[]>;
  matrixIn: Map<number, MatrixReport[]>;
  openUser: (u: UserInline) => void;
  openPosition: (id: number) => void;
  onEditProfile?: (profileId: number) => void;
  canViewFullProfile: boolean;
  actingSet: Set<string>;
}

function Field({ icon: Icon, label, mono, children }: { icon?: React.ElementType; label: string; mono?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <span className="mt-0.5 text-slate-400"><Icon className="size-[15px]" /></span>}
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
        <div className={cn("text-[13.5px] text-slate-700", mono && "font-mono")}>{children}</div>
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, accent, children }: { icon: React.ElementType; accent?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-2 first:mt-0">
      <Icon className={cn("size-[15px]", accent || "text-indigo-500")} />
      <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">{children}</h4>
    </div>
  );
}

// ── Payroll (FLS) ─────────────────────────────────────────────────────────────

function PayrollSection({ profile }: { profile: StaffProfile }) {
  const stripped = profile._stripped_fields ?? [];
  // Authorised when the backend actually sent at least one payroll field.
  const unlocked =
    profile.bank_name !== undefined ||
    profile.account_name !== undefined ||
    profile.account_number !== undefined;

  return (
    <div>
      <SectionHead icon={Banknote} accent="text-teal-600">
        Payroll
        <span className="ml-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-500 ring-1 ring-rose-200">SENSITIVE</span>
      </SectionHead>
      {unlocked ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-teal-700">
            <LockOpen className="size-3" />
            Visible - payroll access granted
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Landmark} label="Bank">{profile.bank_name || "-"}</Field>
            <Field icon={Users} label="Account name">{profile.account_name || "-"}</Field>
            <Field icon={Hash} label="Account number" mono>{profile.account_number || "-"}</Field>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Lock className="size-3" />
            Restricted
          </div>
          <div className="grid grid-cols-2 gap-3 opacity-70">
            <Field icon={Landmark} label="Bank"><span className="select-none tracking-widest text-slate-400">••••••••</span></Field>
            <Field icon={Users} label="Account name"><span className="select-none tracking-widest text-slate-400">••••••••••</span></Field>
            <Field icon={Hash} label="Account number" mono><span className="select-none tracking-widest text-slate-400">••••••••</span></Field>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-white px-2.5 py-2 text-[11.5px] text-slate-500 ring-1 ring-slate-200">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            <span>
              Requires <span className="font-mono font-semibold text-slate-600">platform.staff_payroll.view</span>.
              {stripped.length > 0 && " These fields were withheld by the server."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Person ────────────────────────────────────────────────────────────────────

function PersonDetail({ user, ctx }: { user: UserInline; ctx: DrawerCtx }) {
  const listItem = ctx.profiles.get(user.id);
  const profileId = listItem?.id;

  const { data: profileRes, isLoading } = useGetStaffProfileQuery(profileId as number, {
    skip: profileId === undefined || !ctx.canViewFullProfile,
  });
  const { data: assignmentsRes } = useGetAssignmentsQuery(
    { user: user.id, page_size: 50 },
    { skip: !ctx.canViewFullProfile },
  );
  const profile = profileRes?.data?.profile_view === "full" ? profileRes.data : undefined;
  const history = Array.isArray(assignmentsRes?.data) ? assignmentsRes.data : [];

  const seatId = profile?.position?.id ?? listItem?.position?.id ?? null;
  const isActing = seatId !== null && ctx.actingSet.has(`${user.id}@${seatId}`);

  // Management chain: climb reports_to from the person's seat via posMap.
  const chain = useMemo(() => {
    const out: Position[] = [];
    if (seatId === null) return out;
    let cur = ctx.posMap.get(seatId)?.reports_to?.id ?? null;
    const seen = new Set<number>();
    while (cur !== null && !seen.has(cur)) {
      seen.add(cur);
      const p = ctx.posMap.get(cur);
      if (!p) break;
      out.push(p);
      cur = p.reports_to?.id ?? null;
    }
    return out.reverse();
  }, [seatId, ctx.posMap]);

  return (
    <div>
      <div className="flex items-start gap-4">
        <OrgAvatar user={user} size={60} status={profile?.employment_status ?? listItem?.employment_status ?? null} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">{user.full_name}</h3>
            {isActing && <ActingBadge />}
          </div>
          <p className="text-[13.5px] text-slate-500">{profile?.job_title || listItem?.job_title || profile?.position?.title || "-"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(profile?.employment_status ?? listItem?.employment_status) && <StatusPill status={(profile?.employment_status ?? listItem?.employment_status)!} />}
            <EmpBadge type={profile?.employment_type ?? listItem?.employment_type ?? ""} />
            <DeptChip name={profile?.department?.name ?? listItem?.department?.name} onClick={() => seatId && ctx.openPosition(seatId)} />
            {ctx.onEditProfile && profileId !== undefined && (
              <button
                onClick={() => ctx.onEditProfile?.(profileId)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="size-3" /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {!ctx.canViewFullProfile ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5">
            <Field icon={IdCard} label="Employee ID" mono>{listItem?.employee_id || "-"}</Field>
            <Field icon={Briefcase} label="Seat" mono>{listItem?.position?.code || "-"}</Field>
            <Field icon={Building2} label="Department">{listItem?.department?.name || "-"}</Field>
            {listItem?.division && <Field icon={Building2} label="Division">{listItem.division.name}</Field>}
            {listItem?.org_node?.kind === "TEAM" && <Field icon={Building2} label="Team">{listItem.org_node.name}</Field>}
          </div>

          <SectionHead icon={GitBranch}>Management chain</SectionHead>
          {chain.length ? (
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-[12.5px]">
              {chain.map((p, i) => {
                const holder = p.current_holders[0];
                const last = i === chain.length - 1;
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    {holder && (
                      <button onClick={() => ctx.openUser(holder)} className="rounded px-1 py-0.5 text-indigo-600 hover:bg-indigo-50">
                        {holder.full_name.split(" ")[0]} <span className="text-slate-400">· {p.code}</span>
                      </button>
                    )}
                    {!last && <CornerLeftUp className="size-3 rotate-90 text-slate-300" />}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-slate-400">Top of the reporting line.</p>
          )}

          <SectionHead icon={Contact}>Contact</SectionHead>
          <Field icon={Mail} label="Work email">{user.email}</Field>
        </>
      ) : profileId === undefined ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-[13px] text-slate-500">
          No staff profile on record for this user yet.
        </div>
      ) : isLoading || !profile ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5">
            <Field icon={IdCard} label="Employee ID" mono>{profile.employee_id || "-"}</Field>
            <Field icon={CalendarDays} label="Joined">
              {fmtDate(profile.date_joined)} {profile.date_joined && <span className="text-slate-400">· {yearsSince(profile.date_joined)}</span>}
            </Field>
            <Field icon={Briefcase} label="Seat" mono>{profile.position?.code || "-"}</Field>
            <Field icon={Building2} label="Department">{profile.department?.name || "-"}</Field>
            {profile.division && <Field icon={Building2} label="Division">{profile.division.name}</Field>}
            {profile.org_node && profile.org_node.kind === "TEAM" && <Field icon={Building2} label="Team">{profile.org_node.name}</Field>}
          </div>

          <SectionHead icon={GitBranch}>Management chain</SectionHead>
          {chain.length ? (
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-[12.5px]">
              {chain.map((p, i) => {
                const holder = p.current_holders[0];
                const last = i === chain.length - 1;
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    {holder && (
                      <button onClick={() => ctx.openUser(holder)} className="rounded px-1 py-0.5 text-indigo-600 hover:bg-indigo-50">
                        {holder.full_name.split(" ")[0]} <span className="text-slate-400">· {p.code}</span>
                      </button>
                    )}
                    {!last && <CornerLeftUp className="size-3 rotate-90 text-slate-300" />}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-slate-400">Top of the reporting line.</p>
          )}

          {profile.current_line_manager && (
            <div className="mt-2 text-[12px] text-slate-500">
              Direct manager:{" "}
              <button onClick={() => ctx.openUser(profile.current_line_manager!)} className="font-medium text-indigo-600 hover:underline">
                {profile.current_line_manager.full_name}
              </button>
            </div>
          )}

          <SectionHead icon={History}>Position history</SectionHead>
          <div className="flex flex-col gap-2">
            {history.length ? history.map((a) => {
              const current = a.end_date === null;
              return (
                <div key={a.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2", current ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white")}>
                  <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", current ? "bg-indigo-500" : "bg-slate-300")} />
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
            }) : <p className="text-[13px] text-slate-400">No assignment history.</p>}
          </div>

          <SectionHead icon={Contact}>Contact</SectionHead>
          <div className="grid grid-cols-1 gap-3">
            <Field icon={Mail} label="Work email">{profile.user.email}</Field>
            {profile.personal_email && <Field icon={AtSign} label="Personal email">{profile.personal_email}</Field>}
            {profile.alternate_phone && <Field icon={Phone} label="Phone">{profile.alternate_phone}</Field>}
            {(profile.city || profile.state) && <Field icon={MapPin} label="Location">{[profile.city, profile.state].filter(Boolean).join(", ")}</Field>}
          </div>

          {(profile.nok_name || profile.nok_phone) && (
            <>
              <SectionHead icon={HeartHandshake}>Next of kin</SectionHead>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Users} label="Name">{profile.nok_name || "-"}</Field>
                <Field icon={Users} label="Relationship">{profile.nok_relationship || "-"}</Field>
                <Field icon={Phone} label="Phone">{profile.nok_phone || "-"}</Field>
              </div>
            </>
          )}

          <div className="mt-2"><PayrollSection profile={profile} /></div>
        </>
      )}
    </div>
  );
}

// ── Position ──────────────────────────────────────────────────────────────────

function PositionDetail({ id, ctx }: { id: number; ctx: DrawerCtx }) {
  const pos = ctx.posMap.get(id);
  const out = ctx.matrixOut.get(id) ?? [];
  const inc = ctx.matrixIn.get(id) ?? [];
  const kids = useMemo(
    () => Array.from(ctx.posMap.values()).filter((p) => p.reports_to?.id === id && !p.is_vacant),
    [ctx.posMap, id],
  );

  if (!pos) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-[13px] text-slate-500">Position not found.</div>;
  }

  const parent = pos.reports_to ? ctx.posMap.get(pos.reports_to.id) : null;

  return (
    <div>
      <div className="flex items-start gap-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          <Briefcase className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-800">{pos.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">{pos.code}</span>
            <DeptChip name={pos.org_node?.name} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5">
        <Field icon={ShieldCheck} label="Status">{pos.is_active ? "Active" : "Inactive"}</Field>
        <Field icon={CornerLeftUp} label="Reports to (solid)">
          {parent ? <button onClick={() => ctx.openPosition(parent.id)} className="text-indigo-600 hover:underline">{parent.title}</button> : <span className="text-slate-400">- top of org</span>}
        </Field>
        <Field icon={Building2} label="Org unit">{pos.org_node ? `${pos.org_node.name} · ${pos.org_node.kind}` : "-"}</Field>
      </div>

      <SectionHead icon={UserCheck}>Current holders</SectionHead>
      {pos.current_holders.length ? (
        <div className="flex flex-col gap-1">
          {pos.current_holders.map((u) => (
            <button key={u.id} onClick={() => ctx.openUser(u)} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left hover:bg-slate-50">
              <OrgAvatar user={u} size={30} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-slate-700">{u.full_name}</div>
                <div className="truncate text-[11.5px] text-slate-400">{u.email}</div>
              </div>
              {ctx.actingSet.has(`${u.id}@${id}`) && <ActingBadge />}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-slate-400">Nobody to show here.</p>
      )}

      {(out.length > 0 || inc.length > 0) && (
        <>
          <SectionHead icon={Spline} accent="text-teal-600">Matrix (dotted) lines</SectionHead>
          <div className="flex flex-col gap-2">
            {out.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg bg-teal-50/60 px-2.5 py-2 text-[12.5px] text-teal-800 ring-1 ring-teal-100">
                <span className="inline-block h-0 w-5 border-t-2 border-dotted border-teal-500" />
                <span>dotted-reports to <button onClick={() => ctx.openPosition(m.reports_to.id)} className="font-semibold hover:underline">{m.reports_to.title}</button>{m.relationship_label && <span className="text-teal-600"> - {m.relationship_label}</span>}</span>
              </div>
            ))}
            {inc.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[12.5px] text-slate-600 ring-1 ring-slate-100">
                <span className="inline-block h-0 w-5 border-t-2 border-dotted border-slate-400" />
                <span><button onClick={() => ctx.openPosition(m.position.id)} className="font-semibold hover:underline">{m.position.title}</button> dotted-reports here</span>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionHead icon={Network}>Direct-report seats <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">{kids.length}</span></SectionHead>
      {kids.length ? (
        <div className="flex flex-col gap-1">
          {kids.map((k) => (
            <button key={k.id} onClick={() => ctx.openPosition(k.id)} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50">
              <div className="flex items-center gap-2"><Briefcase className="size-3.5 text-slate-400" /><span className="text-[13px] font-medium text-slate-700">{k.title}</span></div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-slate-400">No subordinate seats (leaf).</p>
      )}
    </div>
  );
}

export function DetailDrawer({ target, onClose, ctx }: { target: DetailTarget | null; onClose: () => void; ctx: DrawerCtx }) {
  const isPosition = target?.kind === "position";
  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[440px]" showCloseButton={false}>
        <SheetTitle className="sr-only">{isPosition ? "Seat detail" : "Person detail"}</SheetTitle>
        <SheetDescription className="sr-only">Organogram detail panel</SheetDescription>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
            {isPosition ? <Briefcase className="size-3.5" /> : <Users className="size-3.5" />}
            {isPosition ? "Seat detail" : "Person detail"}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="size-4.5" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-5 py-5">
            {target?.kind === "person" && <PersonDetail user={target.user} ctx={ctx} />}
            {target?.kind === "position" && <PositionDetail id={target.id} ctx={ctx} />}
        </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
