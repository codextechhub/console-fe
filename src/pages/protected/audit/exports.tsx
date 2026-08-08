import { useEffect, useMemo, useRef, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { useNavigate } from "react-router";
import {
  CheckCircle2, Circle, Clock, Download, Loader2, Plus, RefreshCw, MoreVertical, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchSelect } from "@/components/custom/search-select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PermissionGate from "@/components/custom/permission-gate";
import {
  useGetAuditExportsQuery,
  useGetAuditExportDetailQuery,
} from "@/redux/services/dashboard/audit-api";
import type { AuditExportJob } from "@/redux/services/dashboard/audit-types";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import { ActorCell } from "./components/audit-cells";
import { P } from "@/permissions";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type DateRange = "24h" | "7d" | "30d" | "all";

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateRangeToMs(range: DateRange): number {
  return { "24h": 86400_000, "7d": 604800_000, "30d": 2592000_000, all: 0 }[range];
}

function formatCountdown(iso: string | null): string {
  if (!iso) return "-";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  COMPLETED: "active",
  RUNNING: "locked",
  PENDING: "locked",
  FAILED: "suspended",
  EXPIRED: "inactive",
};

// ── Countdown cell (live) ─────────────────────────────────────────────────────

function CountdownCell({ iso }: { iso: string | null }) {
  const [text, setText] = useState(() => formatCountdown(iso));
  useEffect(() => {
    const id = setInterval(() => setText(formatCountdown(iso)), 30_000);
    return () => clearInterval(id);
  }, [iso]);
  return <span className="text-xs tabular-nums">{text}</span>;
}

// ── Filter summary helper ─────────────────────────────────────────────────────

function FilterSummary({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload || Object.keys(payload).length === 0) {
    return <p className="text-xs text-gray-01 italic">No filters applied - full export.</p>;
  }
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {Object.entries(payload).map(([k, v]) => (
        <div key={k}>
          <dt className="text-[10px] text-gray-01 font-medium uppercase tracking-wide">{k.replace(/_/g, " ")}</dt>
          <dd className="text-xs text-black-01 font-mono break-all">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Timeline step ─────────────────────────────────────────────────────────────

function TimelineStep({
  icon: Icon, label, time, active, done,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  time?: string | null;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        "mt-0.5 size-5 rounded-full flex items-center justify-center shrink-0",
        done ? "bg-green-100 text-green-600" : active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400",
      )}>
        <Icon className="size-3" />
      </div>
      <div>
        <p className={cn("text-xs font-medium", !done && !active && "text-gray-400")}>{label}</p>
        {time && <p className="text-[10px] text-gray-01 mt-0.5">{formatRelativeDate(time)}</p>}
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function ExportDetailDrawer({
  jobId,
  onClose,
  onDownload,
  onRerun,
}: {
  jobId: string | null;
  onClose: () => void;
  onDownload: (id: string) => void;
  onRerun: () => void;
}) {
  const { data, isLoading } = useGetAuditExportDetailQuery(jobId ?? "", { skip: !jobId });
  const job = data?.data;

  const isCompleted = job?.status === "COMPLETED";
  const isFailed = job?.status === "FAILED";
  const isRunning = job?.status === "RUNNING";

  return (
    <Sheet open={!!jobId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[560px] overflow-y-auto p-0">
        <SheetTitle className="sr-only">Export job details</SheetTitle>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="font-semibold text-sm text-black-01">Export Job</p>
            {job && (
              <p className="text-[10px] text-gray-01 mt-0.5 font-mono">{job.id}</p>
            )}
          </div>
          {job && (
            <Badge
              variant={STATUS_TONE[job.status] ?? "inactive"}
              className={cn("text-[10px] uppercase", job.status === "EXPIRED" && "line-through")}
            >
              {job.status}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-gray-400" />
          </div>
        ) : job ? (
          <div className="px-5 py-5 space-y-5">

            {/* Requested by card */}
            <div className="rounded-md border bg-white p-4">
              <p className="text-[10px] font-semibold font-mont text-gray-01 uppercase tracking-wide mb-3">Requested by</p>
              <div className="flex items-center gap-3">
                <ActorCell
                  label={job.requested_by?.full_name || job.requested_by?.email || "System"}
                  email={job.requested_by?.email}
                  userId={job.requested_by?.id}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">
                    {job.requested_by?.full_name || job.requested_by?.email || "System"}
                  </p>
                  {job.requested_by?.email && (
                    <p className="text-[10px] text-gray-01 truncate">{job.requested_by.email}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-[10px] text-gray-01">Format</p>
                  <p className="text-xs font-medium mt-0.5">{job.export_format}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-01">Rows exported</p>
                  <p className="text-xs font-medium mt-0.5">
                    {job.row_count && job.row_count > 0 ? job.row_count.toLocaleString() : "-"}
                  </p>
                </div>
                {job.file_name && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-01">File</p>
                    <p className="text-xs font-mono mt-0.5 break-all">{job.file_name}</p>
                  </div>
                )}
                {job.expires_at && isCompleted && (
                  <div>
                    <p className="text-[10px] text-gray-01">Expires in</p>
                    <CountdownCell iso={job.expires_at} />
                  </div>
                )}
              </div>
            </div>

            {/* Filter payload */}
            <div className="rounded-md border bg-white p-4">
              <p className="text-[10px] font-semibold font-mont text-gray-01 uppercase tracking-wide mb-3">Applied filters</p>
              <FilterSummary payload={job.filter_payload ?? null} />
            </div>

            {/* Failure banner */}
            {isFailed && job.failure_reason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-2">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-destructive">Export failed</p>
                  <p className="text-[10px] text-destructive/80 mt-0.5">{job.failure_reason}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-md border bg-white p-4">
              <p className="text-[10px] font-semibold font-mont text-gray-01 uppercase tracking-wide mb-4">Timeline</p>
              <div className="space-y-4">
                <TimelineStep
                  icon={Circle}
                  label="Requested"
                  time={job.requested_at}
                  done
                />
                <TimelineStep
                  icon={isRunning ? Loader2 : Circle}
                  label="Processing started"
                  time={job.started_at}
                  done={!!job.started_at && !isRunning}
                  active={isRunning}
                />
                <TimelineStep
                  icon={isCompleted ? CheckCircle2 : isFailed ? XCircle : Circle}
                  label={isCompleted ? "Completed" : isFailed ? "Failed" : "Completed"}
                  time={job.completed_at}
                  done={isCompleted}
                  active={isFailed}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-1">
              {isCompleted && (
                <Button
                  size="sm"
                  onClick={() => { onClose(); onDownload(job.id); }}
                >
                  <Download className="size-3.5" /> Download CSV
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onClose(); onRerun(); }}
              >
                Re-run with same filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-gray-01">Failed to load export details.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  currentPage, totalPages, onPageChange,
}: {
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | string)[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);
  return (
    <div className="flex items-center justify-end gap-2 mt-3.5">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn("grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage <= 1 ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer")}
      >Prev</button>
      {pages.map((p, i) => typeof p === "string" ? (
        <span key={`e-${i}`} className="px-2 text-black-02">...</span>
      ) : (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn("grid size-7.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage === p ? "bg-primary text-white" : "text-black-02 hover:bg-gray-100")}
        >{p}</button>
      ))}
      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn("grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer")}
      >Next</button>
    </div>
  );
}

// ── Download trigger ──────────────────────────────────────────────────────────

function DownloadTrigger({ jobId, onDone }: { jobId: string | null; onDone: () => void }) {
  const { data } = useGetAuditExportDetailQuery(jobId ?? "", { skip: !jobId });
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!data?.data || triggeredRef.current) return;
    const job = data.data;
    if (!job.file_path || !job.file_name) return;
    triggeredRef.current = true;
    const blob = new Blob([job.file_path], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = job.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onDone();
  }, [data, onDone]);

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AuditExports() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [drawerJobId, setDrawerJobId] = useState<string | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [page, statusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditExportsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const rawExports = useMemo(() => data?.data ?? [], [data]);
  const now = useNow();

  // Client-side date range filter
  const exports = useMemo(() => {
    if (dateRange === "all") return rawExports;
    const cutoff = now - dateRangeToMs(dateRange);
    return rawExports.filter((j) => new Date(j.requested_at).getTime() >= cutoff);
  }, [rawExports, dateRange, now]);

  const resetPage = () => setPage(1);

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Audit Exports</p>
            <p className="text-xs text-gray-01 mt-0.5">Background jobs that package audit data for download.</p>
          </div>
          <div className="inline-flex items-center gap-3.5">
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Refresh
            </Button>
            <PermissionGate permission={P.EXPORT_AUDIT}>
              <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.AUDIT.EXPORT_NEW)}>
                <Plus /> New export
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex gap-3 items-center overflow-x-auto pb-1">
          <div className="w-44 shrink-0">
            <SearchSelect
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
              placeholder="All statuses"
              options={[
                { value: "PENDING", label: "PENDING" },
                { value: "RUNNING", label: "RUNNING" },
                { value: "COMPLETED", label: "COMPLETED" },
                { value: "FAILED", label: "FAILED" },
                { value: "EXPIRED", label: "EXPIRED" },
              ]}
            />
          </div>

          <div className="w-32 shrink-0">
            <SearchSelect
              value="CSV"
              onChange={() => {}}
              clearable={false}
              options={[{ value: "CSV", label: "CSV" }]}
            />
          </div>

          <div className="w-36 shrink-0">
            <SearchSelect
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value as DateRange); resetPage(); }}
              clearable={false}
              options={[
                { value: "24h", label: "Last 24h" },
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "all", label: "All time" },
              ]}
            />
          </div>
        </div>

        {/* Body */}
        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md border">
            <p className="text-sm font-medium text-destructive">Failed to load exports.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-md border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F1F1F1] border-b">
                    {["Requested", "Requested by", "Status", "Format", "Rows", "File", "Completed", "Expires", ""].map((h, i) => (
                      <th key={i} className="px-3 py-3 text-left text-xs font-semibold font-mont text-gray-01 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-03">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="h-60 text-center">
                        <div className="flex justify-center"><div className="loader" /></div>
                      </td>
                    </tr>
                  ) : exports.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="h-48 text-center">
                        <p className="text-xs text-gray-01">No export jobs found.</p>
                      </td>
                    </tr>
                  ) : (
                    exports.map((j) => (
                      <ExportRow
                        key={j.id}
                        job={j}
                        onViewDetails={() => setDrawerJobId(j.id)}
                        onDownload={() => setDownloadId(j.id)}
                        onRerun={() => navigate(routesPath.PROTECTED.AUDIT.EXPORT_NEW)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={data?.pagination?.currentPage ?? 1}
              totalPages={data?.pagination?.totalPages ?? 0}
              onPageChange={setPage}
            />
          </div>
        )}
      </main>

      <ExportDetailDrawer
        jobId={drawerJobId}
        onClose={() => setDrawerJobId(null)}
        onDownload={(id) => setDownloadId(id)}
        onRerun={() => navigate(routesPath.PROTECTED.AUDIT.EXPORT_NEW)}
      />

      {downloadId && (
        <DownloadTrigger
          jobId={downloadId}
          onDone={() => setDownloadId(null)}
        />
      )}
    </>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

function ExportRow({
  job: j,
  onViewDetails,
  onDownload,
  onRerun,
}: {
  job: AuditExportJob;
  onViewDetails: () => void;
  onDownload: () => void;
  onRerun: () => void;
}) {
  const isCompleted = j.status === "COMPLETED";
  const isPendingOrRunning = j.status === "PENDING" || j.status === "RUNNING";

  return (
    <tr
      className="hover:bg-primary/5 transition-colors cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Requested */}
      <td className="px-3 py-3 text-xs whitespace-nowrap">{formatRelativeDate(j.requested_at)}</td>

      {/* Requested by - avatar + name */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <ActorCell
            label={j.requested_by?.full_name || j.requested_by?.email || "System"}
            email={j.requested_by?.email}
            userId={j.requested_by?.id}
          />
          <span className="text-xs truncate max-w-[120px]">
            {j.requested_by?.full_name || j.requested_by?.email || "System"}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <Badge
          variant={STATUS_TONE[j.status] ?? "inactive"}
          className={cn("text-[10px] uppercase", j.status === "EXPIRED" && "line-through")}
        >
          {j.status}
        </Badge>
      </td>

      {/* Format */}
      <td className="px-3 py-3 text-xs">{j.export_format}</td>

      {/* Rows */}
      <td className="px-3 py-3">
        <span className="text-xs font-medium">
          {isPendingOrRunning || !j.row_count ? "-" : j.row_count.toLocaleString()}
        </span>
      </td>

      {/* File */}
      <td className="px-3 py-3">
        <span className="font-mono text-xs">{j.file_name || "-"}</span>
      </td>

      {/* Completed */}
      <td className="px-3 py-3 text-xs whitespace-nowrap">
        {j.completed_at ? formatRelativeDate(j.completed_at) : "-"}
      </td>

      {/* Expires - countdown only for COMPLETED */}
      <td className="px-3 py-3">
        {isCompleted && j.expires_at ? (
          <CountdownCell iso={j.expires_at} />
        ) : (
          <span className="text-xs text-gray-01">-</span>
        )}
      </td>

      {/* DotMenu */}
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid size-7 place-content-center rounded-md hover:bg-gray-100 transition-colors">
              <MoreVertical className="size-4 text-gray-01" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ width: 200 }}>
            <DropdownMenuItem onClick={onViewDetails}>
              <Clock className="size-3.5 mr-2" /> View details
            </DropdownMenuItem>
            {isCompleted && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="size-3.5 mr-2" /> Download CSV
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRerun}>
              <RefreshCw className="size-3.5 mr-2" /> Re-run with same filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
