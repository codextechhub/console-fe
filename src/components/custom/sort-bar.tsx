import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface SortOption {
  column: string;
  label: string;
}

interface SortBarProps {
  options: SortOption[];
  sortColumn: string;
  sortOrder: "asc" | "desc" | "";
  onSort: (column: string) => void;
  className?: string;
}

export function SortBar({
  options,
  sortColumn,
  sortOrder,
  onSort,
  className,
}: SortBarProps) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      <span className="text-[11px] text-gray-01 font-mont shrink-0">Sort:</span>
      {options.map((opt) => {
        const isActive = sortColumn === opt.column;
        const Icon = isActive
          ? sortOrder === "asc"
            ? ArrowUp
            : ArrowDown
          : ArrowUpDown;
        return (
          <Button
            key={opt.column}
            variant={isActive ? "default" : "white"}
            size="sm"
            className={cn(
              "h-7 gap-1 px-2.5 text-[11px] font-medium font-mont [&_svg]:size-3",
              isActive && "shadow-none",
            )}
            onClick={() => onSort(opt.column)}
          >
            <Icon />
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

export function useSortState() {
  return {
    sortColumn: "",
    sortOrder: "" as "asc" | "desc" | "",
  };
}

export function buildOrdering(
  sortColumn: string,
  sortOrder: "asc" | "desc" | "",
): string {
  if (!sortColumn || !sortOrder) return "";
  return sortOrder === "desc" ? `-${sortColumn}` : sortColumn;
}

export function handleSortToggle(
  column: string,
  current: { sortColumn: string; sortOrder: "asc" | "desc" | "" },
  set: (v: { sortColumn: string; sortOrder: "asc" | "desc" | "" }) => void,
) {
  if (current.sortColumn !== column) {
    set({ sortColumn: column, sortOrder: "asc" });
  } else if (current.sortOrder === "asc") {
    set({ sortColumn: column, sortOrder: "desc" });
  } else {
    set({ sortColumn: "", sortOrder: "" });
  }
}
