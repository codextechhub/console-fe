import { cn } from "@/lib/utils";
import { DatePickerInput } from "@/components/ui/date-picker-input";

interface CustomDateInputProps {
  label: string;
  id: string;
  error?: string;
  isRequired?: boolean;
  containerClass?: string;
  value?: string;
  onValueChange?: (date: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomDateInput = ({
  label,
  id,
  error,
  isRequired,
  value,
  onValueChange,
  className,
  placeholder,
  disabled,
}: CustomDateInputProps) => {
  return (
    <div className="grid w-full items-center gap-1">
      <label
        htmlFor={id}
        className={cn(
          "text-sm text-black-01",
          isRequired && "after:text-error after:content-['*'] after:pl-1.5",
        )}
      >
        {label}
      </label>
      <div className="relative">
        <DatePickerInput
          id={id}
          value={value ?? ""}
          disabled={disabled}
          required={isRequired}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onValueChange?.(event.target.value)}
          className={cn("border-none", className)}
        />
      </div>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
};
CustomDateInput.displayName = "CustomDateInput";
