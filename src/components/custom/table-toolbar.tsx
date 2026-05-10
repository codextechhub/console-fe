import { svgIcons } from "@/assets/svg";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
}

export default function TableToolbar({
  search,
  onSearchChange,
  placeholder = "Search...",
  onFilter,
  onExport,
  addButton,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-5">
      <CustomInput
        id="toolbar-search"
        canSearch
        placeholder={placeholder}
        className="h-10"
        containerClass="max-w-[280px]"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="inline-flex items-center gap-3.5">
        {addButton && (
          <Button size="lg" onClick={addButton.onClick}>
            <Plus /> {addButton.label}
          </Button>
        )}
        <Button
          variant="white"
          size="lg"
          className="[&_svg]:size-5 font-medium font-mont"
          onClick={onFilter}
        >
          {svgIcons.filterIcon} Filter
        </Button>
        <Button
          variant="white"
          size="lg"
          className="[&_svg]:size-5 font-medium font-mont"
          onClick={onExport}
        >
          {svgIcons.exportIcon} Export
        </Button>
      </div>
    </div>
  );
}
