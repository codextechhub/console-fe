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
    <section aria-label="Recently opened">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Pick up where you left off</h2>
        <p className="mt-0.5 text-xs text-gray-400">The last few things you opened.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(({ kind, id, label, to, last }) => {
          const Icon = KIND_ICONS[kind];
          return (
            <Link
              key={`${kind}:${id}`}
              to={to}
              className="group flex min-w-0 items-center gap-2.5 rounded-lg border border-white-02 bg-white py-2 pl-2.5 pr-3.5 transition hover:border-primary/25 hover:bg-primary/[0.03]"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-gray-50 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary">
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
