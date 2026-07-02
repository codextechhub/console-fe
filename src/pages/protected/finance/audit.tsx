// Finance audit trail (§6.9) — rebuilt to the Vision prototype in the house
// theme. The immutable log of every finance mutation for the selected entity:
// who did what, to which document, and the field-level before/after of the
// change. Filterable by actor / entity type / action / status / date. Export is
// disabled-with-tooltip until an audit-export service exists (no fake download).

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { FinanceShell } from "./finance-shell";
import { DataTable, StatusPill, TeachingNote, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { cn } from "@/lib/utils";
import { useGetAuditLogQuery, useGetAuditFacetsQuery } from "@/redux/services/finance/setup-api";
import type { FinanceAuditLog } from "@/redux/services/finance/setup-types";

// Action tone: rejections read red, reversals/cancellations amber, master-data
// edits blue, everything else (posts/approvals/completions) green.
function actionTone(action: string, status: string): string {
  if (status === "FAILED" || action.includes("REJECTED")) return "bg-destructive/10 text-destructive";
  if (/(CANCELLED|VOIDED|REVERSED|REOPENED|DISPOSED|TERMINATED|WRITTEN_OFF|LOCKED)/.test(action)) return "bg-amber-50 text-amber-700";
  if (/(CREATED|UPDATED|GENERATED|PREPARED|SUBMITTED|ESTABLISHED)/.test(action)) return "bg-blue-50 text-blue-700";
  return "bg-green-01/10 text-green-01";
}

// Initials for the actor monogram (from the email local-part); "SY" for system.
function initials(actor: string | null): string {
  if (!actor) return "SY";
  const local = actor.split("@")[0] ?? actor;
  const parts = local.split(/[._-]+/).filter(Boolean);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : local.slice(0, 2)).toUpperCase();
}

function short(v: unknown): string {
  const s = v === null || v === undefined ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 22 ? s.slice(0, 21) + "…" : s;
}

// Summarise the field-level diff: one changed field reads "field: a → b",
// several collapse to "N fields changed"; nothing changed falls back to message.
function summariseChange(log: FinanceAuditLog): React.ReactNode {
  const before = log.before ?? {}, after = log.after ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  if (keys.length === 0) return log.message ? <span className="text-gray-01">{log.message}</span> : <span className="text-gray-04">—</span>;
  if (keys.length === 1) {
    const k = keys[0];
    return (
      <span className="font-mono text-xs text-gray-01">
        {k}: <span className="text-gray-05">{short(before[k])}</span> → <span className="font-semibold text-black-01">{short(after[k])}</span>
      </span>
    );
  }
  return <span className="font-medium text-gray-01">{keys.length} fields changed</span>;
}

const STATUS_OPTIONS = [
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
];
const DATE_PRESETS = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

function presetToDateFrom(preset: string): string | undefined {
  if (!preset) return undefined;
  const d = new Date();
  if (preset === "7") d.setDate(d.getDate() - 7);
  else if (preset === "30") d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function FilterSelect({ value, onChange, className, children }: { value: string; onChange: (v: string) => void; className?: string; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 rounded-md border border-gray-03 bg-white px-2.5 font-mont text-xs text-black-01 focus:border-primary focus:outline-none", className)}>
      {children}
    </select>
  );
}

export default function FinanceAuditPage() {
  const { code: entity } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [status, setStatus] = useState("");
  const [actor, setActor] = useState("");
  const [datePreset, setDatePreset] = useState("");

  // Any filter change resets to page 1.
  const bind = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  const params = useMemo(() => ({
    entity: entity!, page,
    ...(action ? { action } : {}),
    ...(targetType ? { target_type: targetType } : {}),
    ...(status ? { status } : {}),
    ...(actor ? { actor } : {}),
    ...(presetToDateFrom(datePreset) ? { date_from: presetToDateFrom(datePreset) } : {}),
  }), [entity, page, action, targetType, status, actor, datePreset]);

  const { data, isLoading, isFetching, isError, refetch } = useGetAuditLogQuery(params, { skip: !entity });
  const { data: facetsData } = useGetAuditFacetsQuery({ entity: entity! }, { skip: !entity });
  const facets = facetsData?.data;
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<FinanceAuditLog>[] = [
    { header: "When", cell: (l) => <span className="whitespace-nowrap tabular-nums text-gray-01">{new Date(l.created_at).toLocaleString("en-GB")}</span> },
    { header: "Actor", cell: (l) => (
      <span className="flex items-center gap-2">
        <span className={cn("grid size-6 shrink-0 place-content-center rounded-full text-[10px] font-semibold",
          l.actor ? "bg-primary/10 text-primary" : "bg-gray-03 text-gray-05")}>{initials(l.actor)}</span>
        <span className="truncate">{l.actor ?? "System"}</span>
      </span>
    ) },
    { header: "Action", cell: (l) => (
      <span className={cn("inline-flex rounded px-2 py-0.5 font-mont text-xs font-medium", actionTone(l.action, l.status))}>
        {l.action_display || l.action}
      </span>
    ) },
    { header: "Entity", cell: (l) => l.target_type || "—" },
    { header: "Reference", cell: (l) => (
      <span className="font-mono text-xs text-gray-01">{l.document_number || (l.target_id ? `#${l.target_id}` : "—")}</span>
    ) },
    { header: "Status", cell: (l) => <StatusPill status={l.status} /> },
    { header: "Change", cell: (l) => <span className="block max-w-xs truncate">{summariseChange(l)}</span> },
  ];

  if (!entity) return <FinanceShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></FinanceShell>;

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Audit Trail</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Every finance mutation, recorded immutably for this entity.</p>
          </div>
          <button type="button" disabled title="Audit export is not available yet"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-gray-03 px-2.5 py-1.5 font-mont text-xs font-semibold text-gray-04 opacity-70">
            <Download className="size-3.5" /> Export
          </button>
        </div>

        <TeachingNote id="finance-audit">
          The audit trail is your accountability layer. Every finance action — posts, reversals, approvals,
          rejections, period closes and system postings — is captured with a field-level before/after snapshot,
          and rows can never be edited or deleted. The <span className="font-semibold">Change</span> column
          summarises exactly which fields moved.
        </TeachingNote>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect value={action} onChange={bind(setAction)} className="w-52">
            <option value="">All actions</option>
            {facets?.actions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </FilterSelect>
          <FilterSelect value={targetType} onChange={bind(setTargetType)} className="w-44">
            <option value="">All entities</option>
            {facets?.target_types.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>
          <FilterSelect value={actor} onChange={bind(setActor)} className="w-52">
            <option value="">All actors</option>
            {facets?.actors.map((a) => <option key={a.id} value={String(a.id)}>{a.email}</option>)}
          </FilterSelect>
          <FilterSelect value={status} onChange={bind(setStatus)} className="w-36">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </FilterSelect>
          <FilterSelect value={datePreset} onChange={bind(setDatePreset)} className="w-40">
            {DATE_PRESETS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </FilterSelect>
        </div>

        <DataTable columns={columns} rows={rows} rowKey={(l) => l.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch}
          emptyTitle="No audit entries" emptyMessage="Finance actions matching these filters will be logged here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>
    </FinanceShell>
  );
}
