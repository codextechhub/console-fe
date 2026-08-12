import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";
import { buildSignalCards } from "./signals-model";

const TONES = {
  red: {
    card: "border-red-100 bg-red-50/50 hover:border-red-200",
    tile: "bg-red-100/80 text-red-600",
    stat: "text-red-700",
    cta: "text-red-600",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/50 hover:border-amber-200",
    tile: "bg-amber-100/80 text-amber-600",
    stat: "text-amber-700",
    cta: "text-amber-700",
  },
};

/** Module alerts - rendered only when the payload carried signals. */
export function SignalsRow({ signals }: { signals: ConsoleOverview["signals"] }) {
  const cards = buildSignalCards(signals);
  if (cards.length === 0) return null;

  return (
    <section aria-label="Action needed">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Action needed</h2>
        <p className="mt-0.5 text-xs text-gray-400">Pending work and problems from the areas you manage.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ key, icon: Icon, title, stat, message, to, severity, cta }) => (
          <Link
            key={key}
            to={to}
            className={cn(
              "group flex flex-col rounded-xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:shadow-md",
              TONES[severity].card,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <span className={cn("grid size-9 place-items-center rounded-lg", TONES[severity].tile)}>
                <Icon className="size-4.5" />
              </span>
              <span className={cn("inline-flex items-center gap-1 text-xs font-semibold opacity-80 transition group-hover:opacity-100", TONES[severity].cta)}>
                {cta}
                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </div>
            <p className={cn("mt-3 text-2xl font-semibold tracking-tight", TONES[severity].stat)}>{stat}</p>
            <p className="mt-0.5 text-sm font-medium text-black-01">{title}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">{message}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
