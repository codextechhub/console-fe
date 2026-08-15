import { svgIcons } from "@/assets/svg";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { CustomInput } from "./custom-input";

interface AddButton {
  label: string;
  onClick: () => void;
}

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  onExport?: () => void;
  addButton?: AddButton;
  /** Extra controls for the action row - a QuickExportButton, usually. */
  actions?: ReactNode;
}

export default function TableToolbar({
  search,
  onSearchChange,
  placeholder = "Search...",
  onFilter,
  onExport,
  addButton,
  actions,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <CustomInput
        id="toolbar-search"
        canSearch
        placeholder={placeholder}
        className="h-10"
        containerClass="w-full sm:max-w-[280px]"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* Every button here is conditional on its handler. A control that is
          visible, enabled and does nothing is worse than an absent one: the user
          reads it as "export is broken" rather than "export is not offered
          here". This matches PageAccessDenied's onBack and ErrorState's onRetry,
          which have always been gated this way. */}
      <div className="inline-flex flex-wrap items-center gap-3.5 sm:shrink-0">
        {addButton && (
          <Button size="lg" onClick={addButton.onClick}>
            <Plus /> {addButton.label}
          </Button>
        )}
        {onFilter && (
          <Button
            variant="white"
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
            onClick={onFilter}
          >
            {svgIcons.filterIcon} Filter
          </Button>
        )}
        {onExport && (
          <Button
            variant="white"
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
            onClick={onExport}
          >
            {svgIcons.exportIcon} Export
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
