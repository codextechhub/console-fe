import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ProfileTabId = "overview" | "access" | "activity" | "history";

export interface ProfileTab {
  id: ProfileTabId;
  label: string;
}

export function ProfileHero({
  avatar,
  name,
  title,
  email,
  badges,
  facts,
  actions,
}: {
  avatar: ReactNode;
  name: string;
  title?: string | null;
  email?: string | null;
  badges?: ReactNode;
  facts?: { label: string; value: ReactNode; icon?: LucideIcon }[];
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          {avatar}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-black-01 sm:text-2xl">{name}</h1>
            {title ? <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{title}</p> : null}
            {email ? <p className="mt-0.5 break-all text-sm text-gray-01">{email}</p> : null}
            {badges ? <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div> : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          {facts?.length ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:flex-wrap sm:justify-end">
              {facts.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex min-w-0 items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-5">
                  {Icon ? <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <div className="truncate text-xs font-semibold text-slate-700">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: ProfileTab[];
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
}) {
  return (
    <div className="max-w-full overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Profile sections">
      <div className="flex min-w-max items-center gap-6 px-1">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`profile-panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                "border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
                selected
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-01 hover:border-slate-300 hover:text-black-01",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfilePanel({ id, children, className }: { id: ProfileTabId; children: ReactNode; className?: string }) {
  return (
    <div id={`profile-panel-${id}`} role="tabpanel" className={cn("min-w-0", className)}>
      {children}
    </div>
  );
}

export function ProfileCard({
  title,
  icon: Icon,
  badge,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-slate-200 bg-white p-5", className)}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {Icon ? <Icon className="size-4 text-primary" aria-hidden="true" /> : null}
        <h2 className="text-sm font-semibold font-mont text-black-01">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function ProfileFields({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-5 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

export function ProfileField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-slate-700">{value || "-"}</div>
    </div>
  );
}

export function ProfileEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-10 text-center text-sm text-gray-01">
      {children}
    </div>
  );
}

export function ProfileTimeline({
  items,
}: {
  items: { id: string | number; title: ReactNode; detail?: ReactNode; current?: boolean; badge?: ReactNode }[];
}) {
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", item.current ? "bg-primary" : "bg-slate-300")} />
            {index < items.length - 1 ? <span className="min-h-8 w-px flex-1 bg-slate-200" /> : null}
          </div>
          <div className="min-w-0 pb-5">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
              {item.title}
              {item.badge}
            </div>
            {item.detail ? <div className="mt-1 text-xs leading-5 text-gray-01">{item.detail}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
