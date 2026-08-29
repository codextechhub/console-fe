import { useEffect, useMemo, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { useNavigate, useSearchParams } from "react-router";
import { Download, RefreshCw, Filter } from "lucide-react";
import { friendlyAction } from "./audit-constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { ActorCell } from "./components/audit-cells";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import {
  useGetAuditEventFilterOptionsQuery,
  useGetAuditEventsQuery,
} from "@/redux/services/dashboard/audit-api";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import type { AuditEventListItem } from "@/redux/services/dashboard/audit-types";
import EventDetailDrawer from "./components/event-detail-drawer";
import { PageShell } from "@/components/layout/page-shell";
import {
  AUDIT_DATE_RANGES,
  AUDIT_NO_TENANT,
  buildAuditEventQuery,
  defaultAuditEventFilters,
  parseAuditEventFilters,
  parseAuditEventPage,
  serializeAuditEventFilters,
  type AuditEventFilters,
} from "./event-filter-contract";

const TABLE_HEADERS = ["Sev", "Status", "When", "Module", "Action Type", "Actor", "Entity", "Action"];

const SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
const STATUSES = ["SUCCESS", "FAILED", "DENIED", "PARTIAL"] as const;

const STATUS_TONE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  SUCCESS: "active",
  FAILED: "suspended",
  DENIED: "suspended",
  PARTIAL: "locked",
};

export default function AuditEventsExplorer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<AuditEventFilters>(() => parseAuditEventFilters(searchParams));
  const [page, setPage] = useState(() => parseAuditEventPage(searchParams));
  const debouncedSearch = useDebounce(filters.search, 600);
  const debouncedEntityType = useDebounce(filters.entityType, 600);
  const debouncedEntityId = useDebounce(filters.entityId, 600);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventListItem | null>(null);
  const { data: filterOptions } = useGetAuditEventFilterOptionsQuery();
  // Empty for a school-tenant caller, who has no tenant dimension to narrow by
  // and must not be handed the roster of every other school. Hidden rather than
  // rendered as a control with nothing in it.
  const tenantOptions = filterOptions?.data.tenants ?? [];

  // Quantised clock (30 s ticks) - keeps date_from stable between renders so
  // the query arg doesn't churn, while staying compiler-pure.
  const now = useNow();

  const activeFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      entityType: debouncedEntityType,
      entityId: debouncedEntityId,
    }),
    [filters, debouncedSearch, debouncedEntityType, debouncedEntityId],
  );
  const params = useMemo(
    () => buildAuditEventQuery(activeFilters, page, now),
    [activeFilters, page, now],
  );

  // Keep every input shareable/restorable. The API query itself uses the
  // debounced copy above so free-text typing does not create request-per-key.
  useEffect(() => {
    const next = serializeAuditEventFilters(filters, page);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [filters, page, searchParams, setSearchParams]);

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
      <Badge variant={STATUS_TONE[e.status] ?? "inactive"} className="text-xs uppercase">
        {e.status}
      </Badge>
    ),
    when: <span className="text-xs">{formatRelativeDate(e.event_at)}</span>,
    module: <span className="text-xs font-medium uppercase">{e.module_key}</span>,
    action_type: <span className="text-xs">{friendlyAction(e.action_type)}</span>,
    actor: (
      <ActorCell
        label={e.actor_user?.full_name || e.actor_user?.email || e.actor_label || "System"}
        email={e.actor_user?.email}
        userId={e.actor_user?.id}
      />
    ),
    entity: (
      <div className="flex flex-col leading-snug">
        <span className="text-xs text-black-01">{e.entity_label || "-"}</span>
        <span className="text-[10px] text-gray-01">{e.entity_type}</span>
      </div>
    ),
    _event: e,
  }));

  const toggle = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const updateFilters = (patch: Partial<AuditEventFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultAuditEventFilters());
    setPage(1);
  };

  const exportFiltered = () => {
    const exportParams = serializeAuditEventFilters(filters);
    exportParams.set("from", "events");
    navigate(`${routesPath.PROTECTED.AUDIT.EXPORT_NEW}?${exportParams.toString()}`);
  };

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div data-guide="audit-events.heading" className="flex flex-wrap items-center justify-between gap-3">
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
              <Button size="lg" onClick={exportFiltered}>
                <Download /> Export filtered
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Phone: filter rail stacks above the feed; md+: fixed 260px rail. */}
        <div className="grid grid-cols-1 gap-5 items-start md:grid-cols-[260px_1fr]">
          {/* Filter rail */}
          <aside data-guide="audit-events.filters" className="bg-white rounded-md p-4 space-y-5 h-fit">
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
                {AUDIT_DATE_RANGES.map((r) => (
                  <label key={r.value} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="date_range"
                      checked={filters.dateRange === r.value}
                      onChange={() => updateFilters({ dateRange: r.value })}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {tenantOptions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Tenant</h3>
                <select
                  aria-label="Filter by tenant"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                  value={filters.tenantSlug}
                  onChange={(e) => updateFilters({ tenantSlug: e.target.value })}
                >
                  <option value="">All tenants</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.value} value={tenant.value}>{tenant.label}</option>
                  ))}
                </select>
                {filters.tenantSlug && (
                  <p className="mt-1.5 text-[10px] leading-4 text-gray-01">
                    {filters.tenantSlug === AUDIT_NO_TENANT
                      ? "Platform operations, sweeps and management commands, plus anything recorded before tenants were stamped on the trail."
                      : "Events recorded before tenants were stamped on the trail carry none, so they are under No tenant rather than here."}
                  </p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Severity</h3>
              <div className="space-y-1">
                {SEVERITIES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.severities.includes(s)}
                      onChange={() => updateFilters({ severities: toggle(filters.severities, s) })}
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
                      checked={filters.statuses.includes(s)}
                      onChange={() => updateFilters({ statuses: toggle(filters.statuses, s) })}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Module</h3>
              <div className="flex flex-wrap gap-1.5">
                {(filterOptions?.data.modules ?? []).map((module) => (
                  <button
                    key={module.value}
                    type="button"
                    title={module.label}
                    onClick={() => updateFilters({ modules: toggle(filters.modules, module.value) })}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      filters.modules.includes(module.value)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-01 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {module.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Action</h3>
              <select
                aria-label="Add action filter"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                value=""
                onChange={(event) => {
                  if (event.target.value && !filters.actionTypes.includes(event.target.value)) {
                    updateFilters({ actionTypes: [...filters.actionTypes, event.target.value] });
                  }
                }}
              >
                <option value="">All actions</option>
                {(filterOptions?.data.actions ?? []).map((action) => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>
              {filters.actionTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {filters.actionTypes.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => updateFilters({ actionTypes: filters.actionTypes.filter((item) => item !== action) })}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white"
                      aria-label={`Remove ${action} filter`}
                    >
                      {friendlyAction(action)} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Actor</h3>
              <select
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                value={filters.actorType}
                onChange={(e) => updateFilters({ actorType: e.target.value as "" | "USER" | "SYSTEM" })}
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
                value={filters.entityType}
                onChange={(e) => updateFilters({ entityType: e.target.value })}
              />
              <input
                placeholder="Entity ID"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 font-mono"
                value={filters.entityId}
                onChange={(e) => updateFilters({ entityId: e.target.value })}
              />
            </div>
          </aside>

          {/* Results */}
          <div data-guide="audit-events.results" className="space-y-3 min-w-0 overflow-x-auto">
            <CustomInput
              id="search-events"
              canSearch
              placeholder="Search summary, entity label, actor, action..."
              className="h-10"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
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
            updateFilters({ entityType: t, entityId: i, dateRange: "all" });
            setSelectedEvent(null);
          }}
        />
      </PageShell>
    </>
  );
}
