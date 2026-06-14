// <Money kobo={…} /> — renders an integer-kobo amount as currency. Tabular
// numerals keep columns aligned; pass `align="right"` in tables (the house
// convention for money columns).

import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";

interface MoneyProps {
  kobo: number | null | undefined;
  currency?: string | null;
  className?: string;
  /** Right-align as a block — used inside table cells. */
  align?: "left" | "right";
  /** Dim zero/empty amounts. */
  muted?: boolean;
}

export function Money({ kobo, currency, className, align = "left", muted }: MoneyProps) {
  const value = kobo ?? 0;
  return (
    <span
      className={cn(
        "font-mont tabular-nums",
        align === "right" && "block text-right",
        (muted || value === 0) && "text-gray-05",
        value < 0 && "text-destructive",
        className,
      )}
    >
      {formatMoney(value, currency)}
    </span>
  );
}
