// Small presentational primitives shared across the organogram views.
// Ported from the prototype, adapted to lucide-react + the API data shapes.

import { Sparkles, Users } from "lucide-react";
import type { EmploymentStatus, EmploymentType, UserInline } from "@/redux/services/dashboard/organogramTypes";
import { avatarColor, EMP_TYPE_META, initialsOf, STATUS_META } from "../lib/org-helpers";
import { cn } from "@/lib/utils";

export function OrgAvatar({
  user,
  size = 36,
  ring = false,
  status,
}: {
  user?: Pick<UserInline, "id" | "full_name"> | null;
  size?: number;
  ring?: boolean;
  status?: EmploymentStatus | null;
}) {
  const initials = user ? initialsOf(user.full_name) || "—" : "—";
  const color = user ? avatarColor(user.id) : "bg-slate-100 text-slate-400";
  const st = status ? STATUS_META[status] : null;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold",
          color,
          ring && "ring-2 ring-white",
        )}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {initials}
      </span>
      {st && size >= 28 && (
        <span
          className={cn("absolute -bottom-0 -right-0 rounded-full ring-2 ring-white", st.dot)}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </span>
  );
}

export function StatusPill({ status }: { status: EmploymentStatus }) {
  const s = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", s.soft, s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function EmpBadge({ type }: { type: EmploymentType | "" }) {
  if (!type) return null;
  const e = EMP_TYPE_META[type];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", e.cls)}>{e.label}</span>;
}

export function ActingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
      <Sparkles className="size-2.5" />
      Acting
    </span>
  );
}

export function VacantBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
      VACANT
    </span>
  );
}

export function DeptChip({ name, onClick }: { name?: string | null; onClick?: (e: React.MouseEvent) => void }) {
  if (!name) return null;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
    >
      <span className="h-1.5 w-1.5 rounded-sm bg-indigo-400" />
      {name}
    </button>
  );
}

export function ReportsBadge({ direct, total }: { direct: number; total?: number }) {
  if (!direct) return null;
  const showTotal = total !== undefined && total > direct;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 ring-1 ring-indigo-100"
      title={showTotal ? `${direct} | ${total} (incl. indirect) reports` : `${direct} direct report${direct === 1 ? "" : "s"}`}
    >
      <Users className="size-2.5" />
      {showTotal ? (
        <span>{direct}<span className="text-indigo-300"> | </span>{total}</span>
      ) : (
        direct
      )}
    </span>
  );
}

export function HeadcountMeter({ filled, total }: { filled: number; total: number }) {
  const pct = total ? Math.min(100, (filled / total) * 100) : 0;
  const full = filled >= total;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-1.5 py-0.5">
        <span className={cn("text-[12px] font-bold", full ? "text-slate-700" : "text-amber-600")}>{filled}</span>
        <span className="text-[12px] text-slate-400">/ {total}</span>
      </div>
      <div className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-200 md:block">
        <div className={cn("h-full rounded-full", full ? "bg-emerald-400" : "bg-amber-400")} style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

export function HolderStack({ users, onPick }: { users: UserInline[]; onPick: (u: UserInline) => void }) {
  const shown = users.slice(0, 4);
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((u) => (
          <button
            key={u.id}
            onClick={(e) => {
              e.stopPropagation();
              onPick(u);
            }}
            title={u.full_name}
            className="transform rounded-full transition-transform hover:z-10 hover:-translate-y-0.5"
          >
            <OrgAvatar user={u} size={28} ring />
          </button>
        ))}
      </div>
      {users.length > shown.length && <span className="ml-1.5 text-xs font-medium text-slate-400">+{users.length - shown.length}</span>}
    </div>
  );
}

export function MatrixIndicator({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-teal-200"
      title="Dotted-line (matrix) relationships"
    >
      <span className="inline-block h-0 w-3 border-t-2 border-dotted border-teal-500" />
      {count}
    </span>
  );
}
