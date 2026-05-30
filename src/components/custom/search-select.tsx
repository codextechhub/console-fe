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
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
}

/**
 * Searchable single-select (base-ui Combobox) — a drop-in replacement for
 * CustomNativeSelect. It keeps the same event-based API (value / name /
 * onChange(event) / onBlur(event) / error), synthesizing native-like events so
 * Formik `getFieldProps(...)` spreads and `onChange={(e)=>setX(e.target.value)}`
 * handlers keep working unchanged. Filtering is real (via ComboboxCollection).
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
  onBlur,
}: SearchSelectProps) {
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? "";

  const emitChange = (v: string) =>
    onChange?.({
      target: { name: name ?? "", value: v },
    } as unknown as React.ChangeEvent<HTMLSelectElement>);

  const emitBlur = () =>
    onBlur?.({
      target: { name: name ?? "" },
    } as unknown as React.FocusEvent<HTMLSelectElement>);

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
        value={value}
        onValueChange={(v: string | null) => emitChange(v ?? "")}
        onOpenChange={(open: boolean) => {
          if (!open) emitBlur();
        }}
        items={options.map((o) => o.value)}
        itemToStringLabel={labelFor}
        filter={(item: string, q: string) =>
          !q || labelFor(item).toLowerCase().includes(q.toLowerCase())
        }
        disabled={disabled || loading}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          showTrigger
          disabled={disabled || loading}
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>No matches</ComboboxEmpty>
            <ComboboxCollection>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {labelFor(item)}
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
