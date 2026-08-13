import { useState } from "react";
import { Link } from "react-router";
import { CircleDot, FileClock, LifeBuoy, School } from "lucide-react";
import { formatRelativeDate } from "@/utils/helpers";
import { useAppSelector } from "@/redux/store";
import { loadRecentOpens, type RecentKind } from "@/lib/recent-opens";

const KIND_ICONS: Record<RecentKind, typeof School> = {
  school: School,
  ticket: LifeBuoy,
  approval: FileClock,
  submission: CircleDot,
};

const SHOWN = 4;

/**
 * "Pick up where you left off" - the last few entities this user opened,
 * logged locally by the detail screens. Local-only and instant, so unlike the
 * data sections there is no loading state; absent history renders nothing.
 */
export function RecentOpensRow() {
  const userId = useAppSelector((state) => state.auth.user?.id);
  // Read once per mount: the list only changes by navigating away and back.
  const [items] = useState(() => loadRecentOpens(userId).slice(0, SHOWN));
  if (items.length === 0) return null;

  return (
    <section aria-label="Recently opened" className="rounded-2xl border border-primary/10 bg-primary/[0.025] p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">Continue</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Pick up where you left off</h2>
        <p className="mt-1 text-xs text-gray-400">Return to the last few records you opened.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ kind, id, label, to, last }) => {
          const Icon = KIND_ICONS[kind];
          return (
            <Link
              key={`${kind}:${id}`}
              to={to}
              className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-white bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-500 transition group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block max-w-48 truncate text-sm font-medium text-black-01">{label}</span>
                <span className="block text-[11px] text-gray-400">{formatRelativeDate(new Date(last).toISOString())}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
