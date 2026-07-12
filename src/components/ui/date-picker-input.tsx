import * as React from "react";
import { CalendarDays, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerInputProps = Omit<React.ComponentProps<"input">, "type">;

function parseDate(value: DatePickerInputProps["value"]): Date | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined;
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function displayDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function DatePickerInput({
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  readOnly,
  required,
  min,
  max,
  name,
  id,
  placeholder,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  ...props
}: DatePickerInputProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(
    typeof defaultValue === "string" ? defaultValue : "",
  );
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const currentValue = typeof value === "string" ? value : internalValue;
  const selected = parseDate(currentValue);
  const fromDate = parseDate(min);
  const toDate = parseDate(max);
  const disabledDates = [
    ...(fromDate ? [{ before: fromDate }] : []),
    ...(toDate ? [{ after: toDate }] : []),
  ];

  const commit = (nextValue: string) => {
    if (!controlled) setInternalValue(nextValue);
    if (inputRef.current) {
      inputRef.current.value = nextValue;
      onChange?.({
        target: inputRef.current,
        currentTarget: inputRef.current,
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen && inputRef.current) {
        onBlur?.({
          target: inputRef.current,
          currentTarget: inputRef.current,
        } as React.FocusEvent<HTMLInputElement>);
      }
    }}>
      <input
        {...props}
        ref={inputRef}
        type="hidden"
        name={name}
        value={currentValue}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
      />
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled || readOnly}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-required={required}
          className={cn(
            "h-10.5 w-full min-w-0 justify-between rounded-md border-input bg-white px-3 py-1 text-left text-sm font-normal text-gray-01 shadow-none hover:bg-white hover:text-gray-01 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-gray-02",
            className,
          )}
        >
          <span className="truncate">{selected ? displayDate(selected) : (placeholder ?? "Select date")}</span>
          <CalendarDays className="size-4 shrink-0 text-gray-04" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden rounded-xl p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? fromDate ?? new Date()}
          startMonth={fromDate ?? new Date(1900, 0)}
          endMonth={toDate ?? new Date(new Date().getFullYear() + 20, 11)}
          captionLayout="dropdown"
          disabled={disabledDates}
          onSelect={(date) => {
            if (!date) return;
            commit(toIsoDate(date));
            setOpen(false);
          }}
          footer={
            <div className="mt-3 flex items-center justify-between border-t px-1 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  commit(toIsoDate(new Date()));
                  setOpen(false);
                }}
                disabled={Boolean(
                  (fromDate && new Date(new Date().setHours(0, 0, 0, 0)) < fromDate)
                  || (toDate && new Date(new Date().setHours(0, 0, 0, 0)) > toDate),
                )}
              >
                Today
              </Button>
              {!required && currentValue && (
                <Button type="button" variant="ghost" size="sm" onClick={() => commit("")}>
                  <X className="size-3.5" aria-hidden="true" />
                  Clear
                </Button>
              )}
            </div>
          }
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePickerInput, parseDate, toIsoDate };
