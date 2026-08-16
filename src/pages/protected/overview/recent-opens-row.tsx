import { useState } from "react";
import { Link } from "react-router";
import { CircleDot, FileClock, LifeBuoy, School, X } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import {
  dismissRecentOpen,
  loadRecentOpens,
  type RecentKind,
} from "@/lib/recent-opens";

const KIND_ICONS: Record<RecentKind, typeof School> = {
  school: School,
  ticket: LifeBuoy,
  approval: FileClock,
  submission: CircleDot,
};

const SHOWN = 4;

/**
 * Nothing here is older than LIFESPAN_DAYS, so say the age in days rather than
 * falling back to a calendar date. The shared formatRelativeDate prints "14th
 * Aug 2026" past yesterday, which reads as an archive on a strip whose whole
 * point is that everything on it is from this week.
 */
function agedLabel(last: number, now: number = Date.now()): string {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const days = Math.round((startOfDay(now) - startOfDay(last)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/**
 * "Pick up where you left off" - the last few entities this user opened,
 * logged locally by the detail screens. Local-only and instant, so unlike the
 * data sections there is no loading state; absent history renders nothing.
 *
 * Entries age out on their own (see lib/recent-opens.ts). Dismissing is for the
 * case the clock cannot see: work you finished with today and do not want
 * looking at you for the rest of the week.
 */
export function RecentOpensRow() {
  const userId = useAppSelector((state) => state.auth.user?.id);
  // Seeded once per mount: the list only changes by navigating away and back,
  // or by dismissing, which updates this state directly.
  const [items, setItems] = useState(() => loadRecentOpens(userId));
  const shown = items.slice(0, SHOWN);
  if (shown.length === 0) return null;

  return (
    <section aria-label="Recently opened" className="rounded-2xl border border-primary/10 bg-primary/[0.025] p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">Continue</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Pick up where you left off</h2>
        <p className="mt-1 text-xs text-gray-400">Records you opened in the last few days.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map(({ kind, id, label, to, last }) => {
          const Icon = KIND_ICONS[kind];
          return (
            // The dismiss control is a sibling of the link, not a child: a
            // button inside an anchor is invalid, and nesting it would make
            // every dismiss also navigate.
            <div key={`${kind}:${id}`} className="group relative min-w-0">
              <Link
                to={to}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white bg-white p-3 pr-8 shadow-[0_1px_2px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-500 transition group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block max-w-48 truncate text-sm font-medium text-black-01">{label}</span>
                  <span className="block text-[11px] text-gray-400">{agedLabel(last)}</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label={`Remove ${label} from recently opened`}
                onClick={() => setItems(dismissRecentOpen(userId, kind, id))}
                // Hidden until the card is hovered, so the strip stays calm.
                // Keyboard focus reveals it too, and on touch there is no hover
                // to reveal anything, so it stays visible there.
                className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-lg text-gray-300 opacity-0 transition hover:bg-gray-50 hover:text-gray-500 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
