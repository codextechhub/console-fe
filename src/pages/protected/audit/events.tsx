import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Download, RefreshCw, Filter } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import { useGetAuditEventsQuery } from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate, returnInitial } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import type { AuditEventListItem } from "@/redux/services/dashboard/auditTypes";
import EventDetailDrawer from "./components/event-detail-drawer";

const TABLE_HEADERS = ["Sev", "Status", "When", "Module", "Action Type", "Actor", "Entity", "Action"];

const MODULES = [
  "ONBOARDING", "IDENTITY", "USER", "RBAC", "IMPORT", "CONFIG",
  "FINANCE", "PROCUREMENT", "SCHOOL", "BRANCH", "SYSTEM",
];

const SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
const STATUSES = ["SUCCESS", "FAILED", "DENIED", "PARTIAL"] as const;
const DATE_RANGES = [
  { v: "15m", l: "Last 15m", ms: 15 * 60_000 },
  { v: "1h", l: "Last hour", ms: 3_600_000 },
  { v: "24h", l: "Last 24h", ms: 86_400_000 },
  { v: "7d", l: "Last 7 days", ms: 7 * 86_400_000 },
  { v: "30d", l: "Last 30 days", ms: 30 * 86_400_000 },
  { v: "all", l: "All time", ms: 0 },
];

const SEVERITY_TONE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  INFO: "active",
  WARNING: "locked",
  CRITICAL: "suspended",
};
const STATUS_TONE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  SUCCESS: "active",
  FAILED: "suspended",
  DENIED: "suspended",
  PARTIAL: "locked",
};

export default function AuditEventsExplorer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSeverity = searchParams.get("severity") || "";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState("24h");
  const [modules, setModules] = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>(initialSeverity ? [initialSeverity] : []);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [actorType, setActorType] = useState<"" | "USER" | "SYSTEM">("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEventListItem | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.search = debouncedSearch;
    if (severities.length === 1) p.severity = severities[0];
    if (statuses.length === 1) p.status = statuses[0];
    if (modules.length === 1) p.module_key = modules[0];
    if (actorType) p.actor_type = actorType;
    if (entityType) p.entity_type = entityType;
    if (entityId) p.entity_id = entityId;
    const range = DATE_RANGES.find((r) => r.v === dateRange);
    if (range && range.ms > 0) {
      p.date_from = new Date(Date.now() - range.ms).toISOString();
    }
    return p;
  }, [page, debouncedSearch, severities, statuses, modules, actorType, entityType, entityId, dateRange]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditEventsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const events = data?.data ?? [];

  const tableData = events.map((e) => ({
    sev: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`size-3 rounded-full block cursor-default ${
                e.severity === "CRITICAL"
                  ? "bg-red-500"
                  : e.severity === "WARNING"
                    ? "bg-amber-400"
                    : "bg-green-500"
              }`}
            />
          </TooltipTrigger>
          <TooltipContent>{e.severity}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    status: (
      <Badge variant={(STATUS_TONE[e.status] ?? "inactive") as any} className="text-xs uppercase">
        {e.status}
      </Badge>
    ),
    when: <span className="text-xs">{formatRelativeDate(e.event_at)}</span>,
    module: <span className="text-xs font-medium uppercase">{e.module_key}</span>,
    action_type: <span className="font-mono text-xs">{e.action_type}</span>,
    actor: (() => {
      const label = e.actor_user?.full_name || e.actor_user?.email || e.actor_label || "System";
      const initials = e.actor_user
        ? returnInitial(e.actor_user.full_name || e.actor_user.email.split("@")[0])
        : e.actor_label
          ? returnInitial(e.actor_label)
          : "SY";
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-7 cursor-default">
                <AvatarImage src={undefined} />
                <AvatarFallback className="text-[10px] font-semibold bg-blue-100 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    })(),
    entity: (
      <div className="flex flex-col leading-snug">
        <span className="text-xs text-black-01">{e.entity_label || "—"}</span>
        <span className="text-[10px] text-gray-01">{e.entity_type}</span>
      </div>
    ),
    _event: e,
  }));

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const resetFilters = () => {
    setDateRange("24h");
    setModules([]);
    setSeverities([]);
    setStatuses([]);
    setActorType("");
    setEntityType("");
    setEntityId("");
    setPage(1);
  };

  return (
    <DashboardLayout title="Audit Events">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Audit Events Explorer</p>
            <p className="text-xs text-gray-01 mt-0.5">
              {data?.pagination?.totalItems?.toLocaleString() ?? 0} events match current filters.
            </p>
          </div>
          <div className="inline-flex items-center gap-3.5">
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
            <PermissionGate permission={P.EXPORT_AUDIT}>
              <Button size="lg" onClick={() => navigate(`${routesPath.PROTECTED.AUDIT.EXPORT_NEW}?from=events`)}>
                <Download /> Export filtered
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="grid grid-cols-[260px_1fr] gap-5 items-start">
          {/* Filter rail */}
          <aside className="bg-white rounded-md p-4 space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Filter className="size-3.5" /> Filters
              </p>
              <button type="button" onClick={resetFilters} className="text-xs text-blue-600 hover:underline">
                Reset
              </button>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Date range</h3>
              <div className="space-y-1">
                {DATE_RANGES.map((r) => (
                  <label key={r.v} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="date_range"
                      checked={dateRange === r.v}
                      onChange={() => { setDateRange(r.v); setPage(1); }}
                    />
                    {r.l}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Severity</h3>
              <div className="space-y-1">
                {SEVERITIES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={severities.includes(s)}
                      onChange={() => { setSeverities(toggle(severities, s)); setPage(1); }}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Status</h3>
              <div className="space-y-1">
                {STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statuses.includes(s)}
                      onChange={() => { setStatuses(toggle(statuses, s)); setPage(1); }}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Module</h3>
              <div className="flex flex-wrap gap-1.5">
                {MODULES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setModules(toggle(modules, m)); setPage(1); }}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      modules.includes(m)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-01 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Actor</h3>
              <select
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                value={actorType}
                onChange={(e) => { setActorType(e.target.value as "" | "USER" | "SYSTEM"); setPage(1); }}
              >
                <option value="">All</option>
                <option value="USER">USER</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Entity</h3>
              <input
                placeholder="Entity type (e.g. User)"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 mb-1.5"
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              />
              <input
                placeholder="Entity ID"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 font-mono"
                value={entityId}
                onChange={(e) => { setEntityId(e.target.value); setPage(1); }}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="space-y-3 min-w-0 overflow-x-auto">
            <CustomInput
              id="search-events"
              canSearch
              placeholder="Search summary, entity label, actor, action..."
              className="h-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {isError ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
                <p className="text-sm font-medium text-destructive">Failed to load events.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="size-3.5" /> Retry
                </Button>
              </div>
            ) : (
              <CustomTable
                tableHeaderList={TABLE_HEADERS}
                tableBodyList={tableData}
                loading={isLoading}
                onRowClick={(row: { _event: AuditEventListItem }) => setSelectedEvent(row._event)}
                dropDown
                actionButton="View"
                actionButtonOnClick={(row) => setSelectedEvent((row as { _event: AuditEventListItem })._event)}
                perPage={data?.pagination?.pageSize}
                totalPage={data?.pagination?.totalPages}
                currentPage={data?.pagination?.currentPage}
                onPageChange={(p) => setPage(p as number)}
              />
            )}
          </div>
        </div>

        <EventDetailDrawer
          eventId={selectedEvent?.id ?? null}
          onClose={() => setSelectedEvent(null)}
          onFilterEntity={(t, i) => {
            setEntityType(t);
            setEntityId(i);
            setSelectedEvent(null);
            setPage(1);
          }}
        />
      </main>
    </DashboardLayout>
  );
}
