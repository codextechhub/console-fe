import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useCreateAuditExportMutation } from "@/redux/services/dashboard/audit-api";
import { routesPath } from "@/routes/routes-path";
import { toast } from "sonner";

const SEVERITIES = ["INFO", "WARNING", "CRITICAL"];
const STATUSES = ["SUCCESS", "FAILED", "DENIED", "PARTIAL"];
const DATE_PRESETS = [
  { v: "24h", l: "Last 24 hours", ms: 86_400_000 },
  { v: "7d", l: "Last 7 days", ms: 7 * 86_400_000 },
  { v: "30d", l: "Last 30 days", ms: 30 * 86_400_000 },
  { v: "all", l: "All time", ms: 0 },
];

export default function NewAuditExport() {
  const navigate = useNavigate();
  const [createExport, { isLoading }] = useCreateAuditExportMutation();
  const [datePreset, setDatePreset] = useState("7d");
  const [severities, setSeverities] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [moduleKey, setModuleKey] = useState("");
  const [actionType, setActionType] = useState("");
  const [entityType, setEntityType] = useState("");

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const handleCreate = () => {
    const filter: Record<string, unknown> = {};
    const preset = DATE_PRESETS.find((p) => p.v === datePreset);
    if (preset && preset.ms > 0) {
      filter.date_from = new Date(Date.now() - preset.ms).toISOString();
    }
    if (severities.length) filter.severity = severities;
    if (statuses.length) filter.status = statuses;
    if (moduleKey) filter.module_key = moduleKey;
    if (actionType) filter.action_type = actionType;
    if (entityType) filter.entity_type = entityType;

    createExport({ filter_payload: filter, export_format: "CSV" })
      .unwrap()
      .then((res) => {
        toast.success(`Export ready — ${res.data.row_count.toLocaleString()} rows.`);
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
              {DATE_PRESETS.map((d) => (
                <label key={d.v} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="date_preset"
                    checked={datePreset === d.v}
                    onChange={() => setDatePreset(d.v)}
                  />
                  {d.l}
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
                    checked={severities.includes(s)}
                    onChange={() => setSeverities(toggle(severities, s))}
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
                    checked={statuses.includes(s)}
                    onChange={() => setStatuses(toggle(statuses, s))}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Module</label>
              <input
                placeholder="e.g. IDENTITY"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2"
                value={moduleKey}
                onChange={(e) => setModuleKey(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Action type</label>
              <input
                placeholder="e.g. LOGIN_FAILED"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2 font-mono"
                value={actionType}
                onChange={(e) => setActionType(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Entity type</label>
              <input
                placeholder="e.g. User"
                className="w-full text-xs border border-gray-300 rounded px-2 py-2"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
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
