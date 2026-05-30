import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  isRequired?: boolean;
  disabled?: boolean;
  loading?: boolean;
  containerClass?: string;
  className?: string;
  options: SearchSelectOption[];
  placeholder?: string;
  size?: "default" | "sm";
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
}

/**
 * Searchable single-select (base-ui Combobox) — a drop-in for CustomNativeSelect.
 * Keeps the same event-based API (value / name / onChange(event) / error /
 * isRequired / disabled / loading) so Formik `getFieldProps(...)` spreads and
 * `onChange={(e)=>setX(e.target.value)}` handlers work unchanged.
 *
 * Items are mapped as ComboboxItem children — base-ui then auto-filters them by
 * their visible label and keeps them mouse-clickable. (Passing `items`/`filter`
 * flips base-ui into data-collection mode, which breaks plain children.)
 */
export function SearchSelect({
  id,
  name,
  label,
  error,
  isRequired,
  disabled,
  loading,
  containerClass,
  options,
  placeholder = "Select an option",
  value = "",
  onChange,
}: SearchSelectProps) {
  const emitChange = (v: string) =>
    onChange?.({
      target: { name: name ?? "", value: v },
    } as unknown as React.ChangeEvent<HTMLSelectElement>);

  return (
    <div className={cn("grid w-full items-center gap-1.5 h-fit", containerClass)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-sm text-black-01",
            isRequired && "after:text-error after:content-['*'] after:pl-1.5",
          )}
        >
          {label}
        </label>
      )}
      <Combobox
        value={value || null}
        onValueChange={(v: string | null) => emitChange(v ?? "")}
        disabled={disabled || loading}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          showTrigger
          showClear={!!value}
          disabled={disabled || loading}
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxList>
            {options.map((o) => (
              <ComboboxItem key={o.value} value={o.value}>
                {o.label}
              </ComboboxItem>
            ))}
            <ComboboxEmpty>No matches</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <p className="text-xs font-medium text-destructive/70">{error}</p>}
    </div>
  );
}
