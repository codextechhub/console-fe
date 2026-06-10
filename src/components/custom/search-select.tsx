import * as React from "react";
import {
  Combobox,
  ComboboxCollection,
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
  /** Show a clear (✕) button once a value is chosen. Default true. */
  clearable?: boolean;
  /**
   * Withhold the option list until the user types — useful for long lists
   * (e.g. org units). The dropdown shows a "type to search" hint while empty.
   */
  revealOnSearch?: boolean;
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
 * Uses the canonical base-ui pattern: object items + itemToStringLabel (so the
 * input shows the LABEL, not the value, and filtering matches the label) +
 * isItemEqualToValue + ComboboxCollection (filtered + mouse-clickable).
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
  clearable = true,
  revealOnSearch = false,
  value = "",
  onChange,
}: SearchSelectProps) {
  const selected = options.find((o) => o.value === value) ?? null;
  const [query, setQuery] = React.useState("");

  // When revealOnSearch is on, withhold the list until something is typed. The
  // selected item's label fills the input, so treat a query equal to the
  // current selection's label as "empty" — otherwise reopening would list it.
  const hasQuery = query.trim().length > 0 && query.trim() !== (selected?.label ?? "").trim();
  const visibleItems = revealOnSearch && !hasQuery ? [] : options;

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
      <Combobox<SearchSelectOption>
        items={visibleItems}
        value={selected}
        onValueChange={(item) => emitChange(item?.value ?? "")}
        onInputValueChange={(v: string) => setQuery(v ?? "")}
        itemToStringLabel={(item) => item?.label ?? ""}
        isItemEqualToValue={(a, b) => a?.value === b?.value}
        disabled={disabled || loading}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          showTrigger
          showClear={!!value && clearable}
          disabled={disabled || loading}
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>{revealOnSearch && !hasQuery ? "Type to search…" : "No matches"}</ComboboxEmpty>
            <ComboboxCollection>
              {(item: SearchSelectOption) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <p className="text-xs font-medium text-destructive/70">{error}</p>}
    </div>
  );
}
