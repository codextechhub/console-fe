// The date field for anything that posts to the general ledger.
//
// Use this for a *document* date — invoice date, receipt date, GRN received date,
// vendor payment date. Those all reach `ensure_period_open` on the backend, which
// rejects a date outside an OPEN fiscal period with a 409, so the calendar here
// simply stops offering them.
//
// Do NOT use it for dates that never post: due dates, "needed by", "valid until",
// expected delivery. Those are deliberately in the future, past the end of every
// open period, and constraining them would break them. Plain <Input type="date"/>
// stays right for those, and for report filters — you must be able to run a report
// over a closed period.

import { useEffect, useRef } from "react";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { cn } from "@/lib/utils";
import { usePostingWindow } from "./use-posting-window";

export function PostingDateField({
  label,
  value,
  onChange,
  entity,
  required = true,
  disabled,
  className,
  hint,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  /** Defaults to the globally-selected entity; pass only to override. */
  entity?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Extra guidance shown under the field, above any period message. */
  hint?: string;
}) {
  const { ranges, defaultDate, constrained, noOpenPeriod, label: windowLabel, reasonFor, isLoading } =
    usePostingWindow(entity);

  // Seed the field once the window is known. Forms mount before the window
  // resolves, so they start empty and get filled here rather than showing today
  // and visibly flicking to another date a moment later.
  //
  // Only ever fills an EMPTY field. An existing document's date is left exactly
  // as saved even when it sits outside the window — silently rewriting a stored
  // date would be a data change disguised as a default. It shows an error instead.
  //
  // A required field refills whenever it goes empty, so a drawer that resets and
  // reopens gets a fresh default. An optional one seeds once: refilling there would
  // fight the calendar's own Clear button.
  const seeded = useRef(false);
  useEffect(() => {
    if (isLoading || value || !defaultDate) return;
    if (!required && seeded.current) return;
    seeded.current = true;
    onChange(defaultDate);
  }, [defaultDate, isLoading, value, required, onChange]);

  const reason = reasonFor(value);
  const invalid = Boolean(value) && Boolean(reason);

  return (
    <label className="block space-y-1">
      <span className="font-mont text-xs text-gray-05">
        {label}{required ? " *" : ""}
      </span>
      <DatePickerInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled || noOpenPeriod}
        allowedRanges={ranges}
        windowLabel={windowLabel}
        aria-invalid={invalid || undefined}
        className={cn("bg-white", className)}
      />
      {noOpenPeriod ? (
        <p className="font-mont text-[11px] text-error">
          No fiscal period is open for this entity — nothing can be posted until finance opens one.
        </p>
      ) : invalid ? (
        <p className="font-mont text-[11px] text-error">
          {reason} Pick a date in {windowLabel ?? "an open period"}.
        </p>
      ) : hint ? (
        <p className="font-mont text-[11px] text-gray-05">{hint}</p>
      ) : constrained && windowLabel ? (
        <p className="font-mont text-[11px] text-gray-05">Open period: {windowLabel}</p>
      ) : null}
    </label>
  );
}
