import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";
import { buildSignalCards } from "./signals-model";

const TONES = {
  red: {
    card: "border-red-100 bg-red-50/60 hover:border-red-200",
    tile: "bg-red-100/70 text-red-600",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/60 hover:border-amber-200",
    tile: "bg-amber-100/70 text-amber-600",
  },
};

/** Module alerts strip - rendered only when the payload carried signals. */
export function SignalsRow({ signals }: { signals: ConsoleOverview["signals"] }) {
  const cards = buildSignalCards(signals);
  if (cards.length === 0) return null;

  return (
    <section aria-label="Module signals">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Signals</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ key, icon: Icon, title, message, to, severity }) => (
          <Link
            key={key}
            to={to}
            className={cn(
              "group flex items-center gap-3 rounded-xl border p-3 transition",
              TONES[severity].card,
            )}
          >
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TONES[severity].tile)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-black-01">{title}</p>
              <p className="mt-0.5 truncate text-xs text-gray-500">{message}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-gray-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}
