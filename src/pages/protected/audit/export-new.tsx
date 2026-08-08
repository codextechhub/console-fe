import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
  useCreateAuditExportMutation,
  useGetAuditEventFilterOptionsQuery,
} from "@/redux/services/dashboard/audit-api";
import { routesPath } from "@/routes/routes-path";
import { toast } from "sonner";
import { friendlyAction } from "./audit-constants";
import {
  AUDIT_DATE_RANGES,
  buildAuditExportFilterPayload,
  defaultAuditEventFilters,
  parseAuditEventFilters,
  type AuditEventFilters,
} from "./event-filter-contract";

const SEVERITIES: AuditEventFilters["severities"] = ["INFO", "WARNING", "CRITICAL"];
const STATUSES: AuditEventFilters["statuses"] = ["SUCCESS", "FAILED", "DENIED", "PARTIAL"];

export default function NewAuditExport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createExport, { isLoading }] = useCreateAuditExportMutation();
  const { data: filterOptions } = useGetAuditEventFilterOptionsQuery();
  const [filters, setFilters] = useState<AuditEventFilters>(() => {
    if (searchParams.get("from") === "events") return parseAuditEventFilters(searchParams);
    return defaultAuditEventFilters("7d");
  });

  const toggle = <T extends string>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  const updateFilters = (patch: Partial<AuditEventFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleCreate = () => {
    const filter = buildAuditExportFilterPayload(filters, Date.now());

    createExport({ filter_payload: filter, export_format: "CSV" })
      .unwrap()
      .then((res) => {
        toast.success(`Export ready - ${res.data.row_count.toLocaleString()} rows.`);
        navigate(routesPath.PROTECTED.AUDIT.EXPORTS);
      })
      .catch(() => {});
  };

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01 max-w-2xl">
        <div>
          <p className="font-semibold font-mont text-gray-01">New Audit Export</p>
          <p className="text-xs text-gray-01 mt-0.5">Choose which audit data to export as a CSV file.</p>
        </div>

        <div className="bg-white rounded-md p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Date range</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIT_DATE_RANGES.map((d) => (
                <label key={d.value} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="date_preset"
                    checked={filters.dateRange === d.value}
                    onChange={() => updateFilters({ dateRange: d.value })}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-01 mb-2">Severity</h3>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
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
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Module</label>
              <select
                aria-label="Add module filter"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2"
                value=""
                onChange={(event) => {
                  if (event.target.value && !filters.modules.includes(event.target.value)) {
                    updateFilters({ modules: [...filters.modules, event.target.value] });
                  }
                }}
              >
                <option value="">All modules</option>
                {(filterOptions?.data.modules ?? []).map((module) => (
                  <option key={module.value} value={module.value}>{module.label}</option>
                ))}
              </select>
              {filters.modules.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {filters.modules.map((module) => (
                    <button
                      key={module}
                      type="button"
                      onClick={() => updateFilters({ modules: filters.modules.filter((item) => item !== module) })}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white"
                    >
                      {module} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Action type</label>
              <select
                aria-label="Add action filter"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2 font-mono"
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
                    >
                      {friendlyAction(action)} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Entity type</label>
              <input
                placeholder="e.g. User"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2"
                value={filters.entityType}
                onChange={(e) => updateFilters({ entityType: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Entity ID</label>
              <input
                placeholder="Exact entity identifier"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2 font-mono"
                value={filters.entityId}
                onChange={(e) => updateFilters({ entityId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Actor</label>
              <select
                className="w-full text-xs border border-gray-300 rounded px-2 py-2"
                value={filters.actorType}
                onChange={(e) => updateFilters({ actorType: e.target.value as AuditEventFilters["actorType"] })}
              >
                <option value="">All actors</option>
                <option value="USER">User</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Search</label>
              <input
                placeholder="Summary, actor, action…"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="white" size="lg" onClick={() => navigate(routesPath.PROTECTED.AUDIT.EXPORTS)}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Generating…" : "Generate CSV"}
          </Button>
        </div>
      </main>
    </>
  );
}
