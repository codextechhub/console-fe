// Export → View Queues. One page over core.BackgroundJob: every async task the
// user started (imports, exports, emails) — plus system/scheduled runs for
// admins via the All Queues scope. Polls list + summary every 10 s while the
// tab is visible; rows expand into a timestamps/result/error detail panel.

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import KpiCard from "@/components/custom/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useNow } from "@/hooks/use-now";
import type { BackgroundJob, JobStatus, QueueParams } from "@/redux/services/dashboard/queue-types";
import { useGetMyTasksQuery, useGetMyTasksSummaryQuery } from "@/redux/services/dashboard/queue-api";

const POLL_MS = 10_000;

// ── Display maps ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: "" | JobStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "QUEUED", label: "Queued" },
  { value: "RUNNING", label: "Running" },
  { value: "SUCCEEDED", label: "Succeeded" },
  { value: "FAILED", label: "Failed" },
];

const KIND_OPTIONS = [
  { value: "", label: "All types" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "email", label: "Email" },
  { value: "system", label: "System" },
];

const KIND_CHIP: Record<string, string> = {
  import: "bg-sky-500/10 text-sky-600",
  export: "bg-violet-500/10 text-violet-600",
  email: "bg-yellow-01/10 text-yellow-01",
  system: "bg-gray-05/10 text-gray-05",
};

function StatusChip({ status }: { status: JobStatus }) {
  if (status === "RUNNING") {
    return (
      <Badge className="gap-1.5 bg-primary/10 font-mont text-primary">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        Running
      </Badge>
    );
  }
  const variant =
    status === "SUCCEEDED" ? "success" : status === "FAILED" ? "rejected" : status === "CANCELLED" ? "suspended" : "inactive";
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <Badge variant={variant} className="font-mont">
      {label}
    </Badge>
  );
}

function KindChip({ kind }: { kind: string }) {
  const k = kind.toLowerCase();
  return (
    <Badge className={cn("font-mont capitalize", KIND_CHIP[k] ?? "bg-gray-05/10 text-gray-05")}>{k || "task"}</Badge>
  );
}

// ── Formatting ────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null, now: number): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function fmtTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB");
}

const headCls = "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs lg:text-sm whitespace-nowrap pt-3 pb-2";
const cellCls = "text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5";
const selectCls =
  "h-10 rounded-md border bg-white px-3 font-mont text-sm text-black-01 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QueuesPage() {
  const [scope, setScope] = useState<"mine" | "all">("mine");
  // Defensive: a 403 on scope=all hides the toggle even if can_view_all lied.
  const [forceHideAll, setForceHideAll] = useState(false);
  const [status, setStatus] = useState<"" | JobStatus>("");
  const [kind, setKind] = useState("");
  const [since, setSince] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const now = useNow();

  // Summary and list take identical params so the cards match the table scope.
  const params = useMemo(() => {
    const p: QueueParams = { page };
    if (scope === "all") p.scope = "all";
    if (status) p.status = status;
    if (kind) p.kind = kind;
    if (since) p.since = since;
    return p;
  }, [scope, status, kind, since, page]);

  const pollOpts = { pollingInterval: POLL_MS, skipPollingIfUnfocused: true, refetchOnFocus: true } as const;
  const { data: listRes, isLoading: listLoading, isError: listError, error: listErr, refetch } = useGetMyTasksQuery(params, pollOpts);
  const { data: summaryRes } = useGetMyTasksSummaryQuery(params, pollOpts);

  const rows = useMemo(() => listRes?.data ?? [], [listRes]);
  const pagination = listRes?.pagination;
  const summary = summaryRes?.data;
  const canViewAll = !!summary?.can_view_all && !forceHideAll;

  // Defensive 403 on scope=all → drop back to mine and hide the toggle.
  // Render-time state adjustment (guarded: scope flips, so it can't loop).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const got403 = scope === "all" && listError && (listErr as any)?.status === 403;
  if (got403) {
    setScope("mine");
    setForceHideAll(true);
    setPage(1);
  }

  // Completion toasts: a row that was QUEUED/RUNNING on the previous poll and
  // is now terminal gets announced. First load seeds the map without toasting.
  const prevStatusRef = useRef<Map<number, JobStatus>>(new Map());
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev.size) {
      for (const job of rows) {
        const was = prev.get(job.id);
        if (was !== "QUEUED" && was !== "RUNNING") continue;
        const name = job.label || job.task_name;
        if (job.status === "SUCCEEDED") toast.success(`${name} finished successfully`);
        else if (job.status === "FAILED") toast.error(`${name} failed`);
      }
    }
    const next = new Map<number, JobStatus>();
    rows.forEach((j) => next.set(j.id, j.status));
    prevStatusRef.current = next;
  }, [rows]);

  const setFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
    setExpandedId(null);
  };
  const changeScope = (s: "mine" | "all") => {
    setScope(s);
    setPage(1);
    setExpandedId(null);
  };

  const showOwner = scope === "all";
  const colCount = showOwner ? 7 : 6;
  const counts = summary?.by_status ?? {};

  return (
    <DashboardLayout title="Queues">
      <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
        {/* Header row: title + (permission-gated) scope toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold font-mont text-gray-01">Queues</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Background tasks — imports, exports and emails you started, live as they run.
            </p>
          </div>
          {canViewAll && (
            <div className="flex h-11 w-fit items-center gap-x-1 rounded-sm bg-white px-1.5 py-1" role="tablist" aria-label="Queue scope">
              {([["mine", "My Queues"], ["all", "All Queues"]] as const).map(([value, label]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={scope === value}
                  onClick={() => changeScope(value)}
                  className={cn(
                    "h-full min-w-26.75 cursor-pointer rounded bg-transparent px-2 font-mont text-base font-medium text-black-01",
                    scope === value && "bg-pry-01",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status summary cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Queued" value={counts.QUEUED ?? 0} />
          <KpiCard label="Running" value={counts.RUNNING ?? 0} tone={(counts.RUNNING ?? 0) > 0 ? "live" : "default"} />
          <KpiCard label="Succeeded" value={counts.SUCCEEDED ?? 0} />
          <KpiCard label="Failed" value={counts.FAILED ?? 0} tone={(counts.FAILED ?? 0) > 0 ? "alert" : "default"} />
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => setFilter(setStatus)(e.target.value as "" | JobStatus)} className={selectCls} aria-label="Filter by status">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={kind} onChange={(e) => setFilter(setKind)(e.target.value)} className={selectCls} aria-label="Filter by type">
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Input
            type="date"
            value={since}
            onChange={(e) => setFilter(setSince)(e.target.value)}
            aria-label="From date"
            className="h-10 w-44 bg-white"
          />
          {(status || kind || since) && (
            <button
              onClick={() => { setStatus(""); setKind(""); setSince(""); setPage(1); setExpandedId(null); }}
              className="font-mont text-xs font-semibold text-gray-05 hover:text-primary"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Queue table */}
        {listError && !rows.length ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-white px-6 py-16 text-center">
            <p className="font-mont text-sm font-medium text-gray-05">We couldn’t load the queue. Please try again.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
              <RefreshCw className="size-4" /> Retry
            </Button>
          </div>
        ) : (
          <div className="rounded-md bg-white">
            <Table>
              <TableHeader className="border-0">
                <TableRow>
                  <TableHead className={headCls}>Task</TableHead>
                  <TableHead className={headCls}>Type</TableHead>
                  <TableHead className={headCls}>Status</TableHead>
                  <TableHead className={headCls}>Progress</TableHead>
                  <TableHead className={headCls}>Started</TableHead>
                  <TableHead className={headCls}>Duration</TableHead>
                  {showOwner && <TableHead className={headCls}>Owner</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {listLoading ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="h-60 text-center">
                      <figure className="size-fit mx-auto"><div className="loader" /></figure>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="h-56 text-center hover:bg-transparent">
                      <p className="font-mont text-sm text-gray-05">
                        No background tasks yet — imports and exports you start will appear here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      now={now}
                      showOwner={showOwner}
                      colCount={colCount}
                      expanded={expandedId === job.id}
                      onToggle={() => setExpandedId((id) => (id === job.id ? null : job.id))}
                    />
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination (house style, same as CustomTable's footer) */}
            {!!pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 px-3 py-3.5">
                <button
                  onClick={() => page > 1 && setPage(page - 1)}
                  disabled={page <= 1}
                  className={cn(
                    "grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors",
                    page <= 1 ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer",
                  )}
                >
                  Prev
                </button>
                <span className="font-mont text-sm text-gray-01">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => page < pagination.totalPages && setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className={cn(
                    "grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors",
                    page >= pagination.totalPages ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer",
                  )}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

// ── Row + expandable detail panel ────────────────────────────────────────────
function JobRow({
  job,
  now,
  showOwner,
  colCount,
  expanded,
  onToggle,
}: {
  job: BackgroundJob;
  now: number;
  showOwner: boolean;
  colCount: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const running = job.status === "RUNNING";
  return (
    <>
      <TableRow className="cursor-pointer transition-all duration-300 hover:bg-primary/5" onClick={onToggle}>
        <TableCell className={cn(cellCls, "font-semibold")}>
          <span className="inline-flex items-center gap-1.5">
            <ChevronDown className={cn("size-3.5 shrink-0 text-gray-02 transition-transform", expanded && "rotate-180")} />
            {job.label || job.task_name}
          </span>
        </TableCell>
        <TableCell className={cellCls}><KindChip kind={job.kind} /></TableCell>
        <TableCell className={cellCls}><StatusChip status={job.status} /></TableCell>
        <TableCell className={cellCls}>
          {running && job.progress != null ? (
            <span className="inline-flex w-28 items-center gap-2">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-gray-03">
                <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${job.progress}%` }} />
              </span>
              <span className="text-xs text-gray-05">{job.progress}%</span>
            </span>
          ) : null}
        </TableCell>
        <TableCell className={cellCls}>{timeAgo(job.started_at, now)}</TableCell>
        <TableCell className={cellCls}>{running ? "—" : fmtDuration(job.runtime_seconds)}</TableCell>
        {showOwner && <TableCell className={cellCls}>{job.owner_name ?? "System"}</TableCell>}
      </TableRow>

      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colCount} className="border-gray-03 bg-gray-04 px-6 py-4">
            <div className="grid gap-x-8 gap-y-2 font-mont text-xs sm:grid-cols-3">
              <div>
                <span className="font-semibold uppercase tracking-wide text-gray-05">Created</span>
                <p className="mt-0.5 font-medium text-black-01">{fmtTimestamp(job.created_at)}</p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wide text-gray-05">Started</span>
                <p className="mt-0.5 font-medium text-black-01">{fmtTimestamp(job.started_at)}</p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wide text-gray-05">Finished</span>
                <p className="mt-0.5 font-medium text-black-01">{fmtTimestamp(job.finished_at)}</p>
              </div>
            </div>
            {job.result != null && (
              <div className="mt-3">
                <span className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Result</span>
                <pre className="mt-1 max-h-60 overflow-auto rounded-md bg-white p-3 font-mono text-xs text-gray-01">
                  {JSON.stringify(job.result, null, 2)}
                </pre>
              </div>
            )}
            {job.status === "FAILED" && job.error && (
              <div className="mt-3">
                <span className="font-mont text-xs font-semibold uppercase tracking-wide text-destructive">Error</span>
                <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-destructive/5 p-3 font-mono text-xs text-destructive">
                  {job.error}
                </pre>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
