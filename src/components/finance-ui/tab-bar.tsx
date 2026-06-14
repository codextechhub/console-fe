// Small in-page tab bar for areas that group several related lists (e.g.
// Receivables → Invoices / Credit notes / Refunds). House pill style.

import { cn } from "@/lib/utils";

export interface TabDef {
  key: string;
  label: string;
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-md bg-white p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded px-3.5 py-1.5 font-mont text-sm font-medium transition-colors",
            active === t.key ? "bg-pry-01 text-primary" : "text-gray-01 hover:bg-white-02/60",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
