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

/**
 * Searchable single-select dropdown (base-ui Combobox) with a label, matching
 * the project's combobox style. Drop-in replacement for CustomNativeSelect:
 * `value` is a string, `onChange` receives the selected value ("" when cleared).
 */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  label,
  id,
  isRequired,
  containerClass,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  label?: string;
  id?: string;
  isRequired?: boolean;
  containerClass?: string;
  disabled?: boolean;
}) {
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? "";

  return (
    <div className={cn("grid w-full items-center gap-1.5 h-fit", containerClass)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-xs font-medium text-black-01",
            isRequired && "after:text-error after:content-['*'] after:pl-1.5",
          )}
        >
          {label}
        </label>
      )}
      <Combobox
        value={value}
        onValueChange={(v: string | null) => onChange(v ?? "")}
        items={options.map((o) => o.value)}
        itemToStringLabel={labelFor}
        filter={(item: string, q: string) =>
          !q || labelFor(item).toLowerCase().includes(q.toLowerCase())
        }
        disabled={disabled}
      >
        <ComboboxInput id={id} placeholder={placeholder} showTrigger className="h-10.5" />
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
    </div>
  );
}
