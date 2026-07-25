import { useMemo, useState } from "react";
import {
  RefreshCw, ChevronRight, Download, X,
  Globe, Clock, User, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomInput } from "@/components/custom/custom-input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import {
  useGetMyActivityQuery,
  useGetMyActivityOnMeQuery,
} from "@/redux/services/dashboard/audit-api";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { friendlyAction } from "../audit/audit-constants";
import { cn } from "@/lib/utils";
import type { AuditEventListItem } from "@/redux/services/dashboard/audit-types";

// ── helpers ────────────────────────────────────────────────────────────────

function maskIp(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.•••.•••.${parts[3]}`;
}

function exportToCsv(events: AuditEventListItem[], tab: string) {
  const rows = [
    ["When", "Action", "Module", "Status", "Entity", "By", "IP"],
    ...events.map((e) => [
      new Date(e.event_at).toISOString(),
      e.summary ?? friendlyAction(e.action_type),
      e.module_key,
      e.status,
      e.entity_label ?? e.entity_id,
      e.actor_user?.full_name ?? e.actor_label ?? "System",
      e.ip_address ?? "",
    ]),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-activity-${tab}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── severity & module maps ─────────────────────────────────────────────────

const SEV_DOT: Record<string, string> = {
  INFO: "bg-blue-500",
  WARNING: "bg-amber-500",
  CRITICAL: "bg-red-500",
};

const SEV_BADGE: Record<string, string> = {
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

const MODULE_CHIP: Record<string, { label: string; cls: string }> = {
  IDENTITY:    { label: "Auth",        cls: "bg-purple-100 text-purple-700" },
  USER:        { label: "Users",       cls: "bg-blue-100 text-blue-700" },
  RBAC:        { label: "Roles",       cls: "bg-indigo-100 text-indigo-700" },
  IMPORT:      { label: "Import",      cls: "bg-orange-100 text-orange-700" },
  CONFIG:      { label: "Config",      cls: "bg-gray-100 text-gray-700" },
  FINANCE:     { label: "Finance",     cls: "bg-green-100 text-green-700" },
  SCHOOL:      { label: "School",      cls: "bg-cyan-100 text-cyan-700" },
  BRANCH:      { label: "Branch",      cls: "bg-teal-100 text-teal-700" },
  SYSTEM:      { label: "System",      cls: "bg-slate-100 text-slate-700" },
  ONBOARDING:  { label: "Onboarding",  cls: "bg-amber-100 text-amber-700" },
  PROCUREMENT: { label: "Procurement", cls: "bg-red-100 text-red-700" },
};

function ModuleChip({ module }: { module: string }) {
  const cfg = MODULE_CHIP[module] ?? { label: module, cls: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={cn(
        "text-[10px] font-medium font-mont px-1.5 py-0.5 rounded-sm uppercase tracking-wide whitespace-nowrap",
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

function EventRow({
  event,
  onClick,
}: {
  event: AuditEventListItem;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-03 last:border-0 cursor-pointer hover:bg-gray-50 group"
    >
      <span
        className={cn(
          "size-2 rounded-full shrink-0",
          SEV_DOT[event.severity] ?? "bg-gray-400",
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-black-01 truncate">
          {event.summary ?? friendlyAction(event.action_type)}
        </p>
        {event.entity_label && (
          <p className="text-xs text-gray-01 font-mont truncate">{event.entity_label}</p>
        )}
      </div>
      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-28">
        <ModuleChip module={event.module_key} />
        <span className="text-[11px] text-gray-01 font-mont truncate max-w-full">
          {event.actor_user?.full_name ?? event.actor_label ?? "System"}
        </span>
      </div>
      <span className="text-xs text-gray-01 font-mont w-24 text-right shrink-0">
        {formatRelativeDate(event.event_at)}
      </span>
      <ChevronRight className="size-3.5 text-gray-03 group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center">
      <p className="text-sm text-gray-01 font-mont">{message}</p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-03">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      <span className="text-xs text-gray-01 font-mont">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────────

type TabKey = "mine" | "on-me";

const TABS: { key: TabKey; label: string }[] = [
  { key: "mine", label: "Things you did" },
  { key: "on-me", label: "Things done to your account" },
];

export default function MyActivity() {
  const [activeTab, setActiveTab] = useState<TabKey>("mine");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [minePage, setMinePage] = useState(1);
  const [onMePage, setOnMePage] = useState(1);
  const [selected, setSelected] = useState<AuditEventListItem | null>(null);

  const mineParams = useMemo(() => {
    const p: Record<string, string | number> = { page: minePage };
    if (debouncedSearch) p.search = debouncedSearch;
    return p;
  }, [minePage, debouncedSearch]);

  const onMeParams = useMemo(() => {
    const p: Record<string, string | number> = { page: onMePage };
    if (debouncedSearch) p.search = debouncedSearch;
    return p;
  }, [onMePage, debouncedSearch]);

  const {
    data: mineData, isLoading: mineLoading,
    isError: mineError, refetch: mineRefetch, isFetching: mineFetching,
  } = useGetMyActivityQuery(mineParams, { refetchOnMountOrArgChange: true });

  const {
    data: onMeData, isLoading: onMeLoading,
    isError: onMeError, refetch: onMeRefetch, isFetching: onMeFetching,
  } = useGetMyActivityOnMeQuery(onMeParams, { refetchOnMountOrArgChange: true });

  const events        = activeTab === "mine" ? (mineData?.data ?? []) : (onMeData?.data ?? []);
  const pagination    = activeTab === "mine" ? mineData?.pagination  : onMeData?.pagination;
  const isLoading     = activeTab === "mine" ? mineLoading           : onMeLoading;
  const isFetching    = activeTab === "mine" ? mineFetching          : onMeFetching;
  const isError       = activeTab === "mine" ? mineError             : onMeError;
  const refetch       = activeTab === "mine" ? mineRefetch           : onMeRefetch;
  const page          = activeTab === "mine" ? minePage              : onMePage;
  const setPage       = activeTab === "mine" ? setMinePage           : setOnMePage;

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold font-mont text-gray-01">Account activity</p>
            <p className="text-xs text-gray-01 mt-0.5">
              A timeline of things you did and things done to your account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv(events, activeTab)}
              disabled={events.length === 0}
            >
              <Download className="size-3.5" /> Download CSV
            </Button>
            <Button
              variant="white"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="h-10 w-fit max-w-full overflow-x-auto bg-white rounded-sm py-1 px-1.5 flex items-center gap-x-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "h-full px-3 rounded cursor-pointer font-medium font-mont text-sm text-black-01 transition-colors whitespace-nowrap",
                activeTab === tab.key ? "bg-pry-01" : "hover:bg-gray-03",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <CustomInput
          id="search-activity"
          canSearch
          placeholder="Search activity..."
          className="h-10"
          containerClass="w-full sm:max-w-[320px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setMinePage(1);
            setOnMePage(1);
          }}
        />

        {/* ── Table ── */}
        <div className="bg-white border border-gray-03 rounded-lg overflow-hidden">
          {isError ? (
            <EmptyState message="Failed to load activity." />
          ) : isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="loader" />
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              message={
                activeTab === "mine"
                  ? "No activity found."
                  : "No actions have been performed on your account."
              }
            />
          ) : (
            <>
              {events.map((e) => (
                <EventRow key={e.id} event={e} onClick={() => setSelected(e)} />
              ))}
              <Pagination
                currentPage={pagination?.currentPage ?? page}
                totalPages={pagination?.totalPages ?? 1}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </main>

      {/* ── Detail drawer ── */}
      <Sheet open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0" showCloseButton={false}>
          {selected && (
            <>
              <SheetHeader className="flex flex-row items-center justify-between border-b border-gray-03 px-5 py-4 gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-sm font-semibold text-black-01">Event detail</SheetTitle>
                  <p className="text-xs text-gray-01 font-mont mt-0.5">
                    {new Date(selected.event_at).toLocaleString()}
                  </p>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0">
                    <X className="size-4" />
                  </Button>
                </SheetClose>
              </SheetHeader>

              <div className="px-5 py-4 space-y-4">
                {/* "Was this you?" banner — only on done-to-me tab */}
                {activeTab === "on-me" && (
                  <div className="flex items-start gap-2.5 rounded-md bg-amber-50 border border-amber-200 px-3 py-3">
                    <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      This action was performed on your account by another user. If you did not authorize this, contact your administrator.
                    </p>
                  </div>
                )}

                {/* Severity + module + action */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded border",
                        SEV_BADGE[selected.severity] ?? "bg-gray-50 text-gray-700 border-gray-200",
                      )}
                    >
                      {selected.severity}
                    </span>
                    <ModuleChip module={selected.module_key} />
                  </div>
                  <p className="text-base font-semibold text-black-01">
                    {selected.summary ?? friendlyAction(selected.action_type)}
                  </p>
                  {selected.entity_label && (
                    <p className="text-xs text-gray-01 font-mont">{selected.entity_label}</p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 text-xs text-gray-01 font-mont">
                  <span>Status:</span>
                  <Badge
                    variant={selected.status === "SUCCESS" ? "active" : "suspended"}
                    className="text-[10px] uppercase"
                  >
                    {selected.status}
                  </Badge>
                </div>

                {/* By / When card */}
                <div className="rounded-lg border border-gray-03 bg-white p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-gray-01 font-mont uppercase tracking-wider">
                    By
                  </p>
                  <div className="flex items-start gap-2">
                    <User className="size-4 text-gray-01 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black-01">
                        {selected.actor_user?.full_name ?? selected.actor_label ?? "System"}
                      </p>
                      {selected.actor_user?.email && (
                        <p className="text-xs text-gray-01 font-mont break-all">
                          {selected.actor_user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-gray-01 shrink-0" />
                    <p className="text-sm text-black-01">
                      {formatRelativeDate(selected.event_at)}
                    </p>
                  </div>
                </div>

                {/* From card (IP) */}
                {selected.ip_address && (
                  <div className="rounded-lg border border-gray-03 bg-white p-4 space-y-3">
                    <p className="text-[11px] font-semibold text-gray-01 font-mont uppercase tracking-wider">
                      From
                    </p>
                    <div className="flex items-center gap-2">
                      <Globe className="size-4 text-gray-01 shrink-0" />
                      <p className="text-sm text-black-01 font-mono">
                        {maskIp(selected.ip_address)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
