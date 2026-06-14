import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Check, AlertTriangle, Info, Download, Play, RefreshCw, Trash2,
  Undo2, Inbox, ChevronRight, ShieldAlert, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList, ComboboxEmpty,
} from "@/components/ui/combobox";
import PermissionGate from "@/components/custom/permission-gate";
import PageAccessDenied from "@/components/custom/page-access-denied";
import PromptModal from "@/components/modal/prompt-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { routesPath } from "@/routes/routes-path";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatRelativeDate } from "@/utils/helpers";
import {
  useGetImportBatchQuery,
  useDeleteImportBatchMutation,
  useValidateImportBatchMutation,
  useStartImportBatchMutation,
  useGetValidationIssuesQuery,
  useGetImportJobsQuery,
  useGetImportJobQuery,
  useRollbackImportJobMutation,
  useGetImportAuditLogsQuery,
  useGetImportNotificationsQuery,
  importDownloadUrls,
} from "@/redux/services/dashboard/import-api";
import type {
  BatchStatus,
  ImportBatch,
  ImportJobListItem,
  ValidationIssueListItem,
  ValidationSeverity,
} from "@/redux/services/dashboard/import-types";

// ── Status configuration ─────────────────────────────────────────────────────

const STATUS_BADGE: Record<BatchStatus, "active" | "pending" | "suspended" | "locked" | "inactive"> = {
  draft: "inactive",
  uploaded: "inactive",
  detecting: "pending",
  mapping_required: "pending",
  validating: "locked",
  validation_failed: "suspended",
  ready_to_import: "pending",
  import_queued: "pending",
  import_running: "locked",
  import_partial: "suspended",
  import_succeeded: "active",
  import_failed: "suspended",
  rolled_back: "suspended",
  cancelled: "inactive",
};

const STATUS_LABEL: Record<BatchStatus, string> = {
  draft: "Draft",
  uploaded: "Uploaded",
  detecting: "Detecting Dataset",
  mapping_required: "Mapping Required",
  validating: "Validating",
  validation_failed: "Validation Failed",
  ready_to_import: "Ready to Import",
  import_queued: "Import Queued",
  import_running: "Importing",
  import_partial: "Partially Imported",
  import_succeeded: "Imported",
  import_failed: "Import Failed",
  rolled_back: "Rolled Back",
  cancelled: "Cancelled",
};

const IN_FLIGHT: Set<BatchStatus> = new Set([
  "validating", "import_queued", "import_running", "detecting",
]);

// Visual pipeline (happy path only). Terminal failure states render separately.
const PIPELINE: BatchStatus[] = [
  "uploaded",
  "validating",
  "ready_to_import",
  "import_running",
  "import_succeeded",
];

const PIPELINE_LABEL: Record<string, string> = {
  uploaded: "Uploaded",
  validating: "Validate",
  ready_to_import: "Ready",
  import_running: "Import",
  import_succeeded: "Done",
};

const FAILURE_STATUSES: Set<BatchStatus> = new Set([
  "validation_failed", "import_failed", "import_partial", "rolled_back", "cancelled",
]);

const SEVERITY_BADGE: Record<ValidationSeverity, "suspended" | "locked" | "inactive"> = {
  error: "suspended",
  warning: "locked",
  info: "inactive",
};

const JOB_STATUS_BADGE: Record<string, "active" | "pending" | "suspended" | "locked" | "inactive"> = {
  queued: "pending",
  running: "locked",
  succeeded: "active",
  failed: "suspended",
  cancelled: "inactive",
  rolled_back: "suspended",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const unwrap = <T,>(res: { data: T } | T | undefined): T | undefined => {
  if (!res) return undefined;
  return (res as { data: T }).data ?? (res as T);
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function triggerBlobDownload(url: string, filename: string) {
  try {
    const token = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)?.[1];
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// ── Pipeline timeline ────────────────────────────────────────────────────────

function PipelineTimeline({ status }: { status: BatchStatus }) {
  const isFailure = FAILURE_STATUSES.has(status);

  // Translate the wide status enum into a position along the happy-path pipeline.
  const pipelineIndex = (() => {
    if (status === "draft" || status === "uploaded" || status === "detecting" || status === "mapping_required") return 0;
    if (status === "validating") return 1;
    if (status === "validation_failed") return 1;
    if (status === "ready_to_import") return 2;
    if (status === "import_queued") return 2;
    if (status === "import_running") return 3;
    if (status === "import_partial" || status === "import_failed") return 3;
    if (status === "import_succeeded") return 4;
    if (status === "rolled_back" || status === "cancelled") return 4;
    return 0;
  })();

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {PIPELINE.map((step, idx) => {
        const isCompleted = !isFailure && idx < pipelineIndex;
        const isCurrent = !isFailure && idx === pipelineIndex;
        const isDone = step === "import_succeeded" && status === "import_succeeded";
        return (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className={cn(
                "size-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                (isCompleted || isDone) && "bg-primary border-primary text-white",
                isCurrent && !isDone && "bg-white border-primary text-primary",
                !isCompleted && !isCurrent && !isDone && "bg-gray-50 border-gray-200 text-gray-400",
              )}>
                {isCompleted || isDone ? <Check className="size-3" /> : idx + 1}
              </div>
              <p className={cn(
                "text-[10px] mt-1.5 whitespace-nowrap font-medium",
                (isCompleted || isDone) && "text-primary",
                isCurrent && !isDone && "text-primary",
                !isCompleted && !isCurrent && !isDone && "text-gray-400",
              )}>
                {PIPELINE_LABEL[step]}
              </p>
            </div>
            {idx < PIPELINE.length - 1 && (
              <div className={cn(
                "h-0.5 w-10 mb-4 mx-0.5 transition-colors",
                idx < pipelineIndex && !isFailure ? "bg-primary" : "bg-gray-200",
              )} />
            )}
          </div>
        );
      })}
      {isFailure && (
        <div className="flex items-center ml-2">
          <div className="h-0.5 w-8 bg-gray-200 mb-4" />
          <div className="flex flex-col items-center">
            <div className="size-7 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-400 text-red-600">
              <AlertTriangle className="size-3.5" />
            </div>
            <p className="text-[10px] mt-1.5 whitespace-nowrap text-red-500 font-medium">
              {STATUS_LABEL[status]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Issues tab ───────────────────────────────────────────────────────────────

function IssuesTab({ batchId }: { batchId: number }) {
  const [sev, setSev] = useState<"all" | ValidationSeverity>("all");
  const [resolved, setResolved] = useState<"all" | "open" | "resolved">("open");
  const [page, setPage] = useState(1);

  const params = useMemo<Record<string, string | number>>(() => {
    const p: Record<string, string | number> = { page, page_size: 50 };
    if (sev !== "all") p.severity = sev;
    if (resolved !== "all") p.is_resolved = resolved === "resolved" ? "true" : "false";
    return p;
  }, [sev, resolved, page]);

  const { data, isLoading, isError, refetch, isFetching } = useGetValidationIssuesQuery(
    { batchId, params },
    { refetchOnMountOrArgChange: true },
  );
  const issues = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <p className="text-sm text-destructive">Failed to load issues.</p>
        <Button size="sm" variant="white" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters + export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Combobox
            value={sev === "all" ? null : sev}
            onValueChange={(v) => { setSev((v as ValidationSeverity | null) ?? "all"); setPage(1); }}
          >
            <ComboboxInput
              placeholder="All severities"
              showTrigger
              showClear={sev !== "all"}
              className="w-44 h-9"
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxItem value="error">Errors only</ComboboxItem>
                <ComboboxItem value="warning">Warnings only</ComboboxItem>
                <ComboboxItem value="info">Info only</ComboboxItem>
                <ComboboxEmpty>No matches</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <Combobox
            value={resolved}
            onValueChange={(v) => { setResolved((v as "all" | "open" | "resolved" | null) ?? "open"); setPage(1); }}
          >
            <ComboboxInput
              placeholder="Status"
              showTrigger
              className="w-36 h-9"
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxItem value="open">Open</ComboboxItem>
                <ComboboxItem value="resolved">Resolved</ComboboxItem>
                <ComboboxItem value="all">All</ComboboxItem>
                <ComboboxEmpty>No matches</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <Button
          variant="white" size="sm"
          onClick={() => triggerDownload(importDownloadUrls.validationIssuesExport(batchId), `batch_${batchId}_issues.csv`)}
        >
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Check className="size-7 text-green-500 mb-2" />
          <p className="text-sm font-medium">No {resolved !== "all" ? resolved : ""} issues</p>
          <p className="text-xs text-gray-01 mt-1">
            {resolved === "open" ? "Nothing left to triage." : "Try changing the filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <Button variant="white" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-gray-01">Page {data.pagination.currentPage} of {data.pagination.totalPages}</span>
          <Button variant="white" size="sm" disabled={page >= data.pagination.totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

function IssueRow({
  issue,
}: {
  issue: ValidationIssueListItem;
}) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", issue.is_resolved && "opacity-60")}>
      <div className="shrink-0 mt-0.5">
        {issue.severity === "error" && <AlertTriangle className="size-4 text-red-500" />}
        {issue.severity === "warning" && <AlertTriangle className="size-4 text-amber-500" />}
        {issue.severity === "info" && <Info className="size-4 text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={SEVERITY_BADGE[issue.severity] ?? "inactive"} className="text-[10px] capitalize">
            {issue.severity}
          </Badge>
          <span className="font-mono text-[10px] text-gray-500">{issue.code}</span>
          {issue.row_number !== null && issue.row_number > 0 && (
            <span className="text-[10px] text-gray-400">Row {issue.row_number}</span>
          )}
          {issue.column_name && (
            <span className="font-mono text-[10px] text-gray-400">{issue.column_name}</span>
          )}
          {issue.is_resolved && (
            <Badge variant="active" className="text-[10px]">
              <Check className="size-2.5 mr-0.5" /> Resolved
            </Badge>
          )}
        </div>
        <p className="text-sm text-black-01 mt-1">{issue.message}</p>
      </div>
    </div>
  );
}

// ── Jobs tab ─────────────────────────────────────────────────────────────────

function JobsTab({ batchId, batchStatus }: { batchId: number; batchStatus: BatchStatus }) {
  const [rollbackJob, setRollbackJob] = useState<ImportJobListItem | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollback, { isLoading: rollingBack }] = useRollbackImportJobMutation();

  const isLive = IN_FLIGHT.has(batchStatus);

  const { data, isLoading, isError, refetch } = useGetImportJobsQuery(
    { batchId },
    {
      refetchOnMountOrArgChange: true,
      pollingInterval: isLive ? 5000 : 0,
    },
  );

  const jobs = data?.data ?? [];

  const handleRollback = async () => {
    if (!rollbackJob) return;
    try {
      await rollback({ batchId, jobId: rollbackJob.id, reason: rollbackReason }).unwrap();
      toast.success("Rollback completed.");
      setRollbackJob(null);
      setRollbackReason("");
    } catch { /* interceptor shows the toast */ }
  };

  if (isLoading) return <div className="flex h-32 items-center justify-center"><div className="loader" /></div>;
  if (isError) return (
    <div className="flex h-32 flex-col items-center justify-center gap-2">
      <p className="text-sm text-destructive">Failed to load jobs.</p>
      <Button size="sm" variant="white" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  if (jobs.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-01">
        No import jobs recorded yet. Start the import to create one.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {jobs.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            onRollback={() => setRollbackJob(job)}
          />
        ))}
      </div>

      <Dialog open={!!rollbackJob} onOpenChange={(o) => { if (!o) { setRollbackJob(null); setRollbackReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rollback Import Job?</DialogTitle>
            <DialogDescription>
              This will reverse the changes made by job #{rollbackJob?.id}.
              {rollbackJob && rollbackJob.succeeded_rows > 0 && (
                <> {rollbackJob.succeeded_rows.toLocaleString()} row{rollbackJob.succeeded_rows === 1 ? "" : "s"} will be reverted.</>
              )} A rollback record will be created for the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-black-01 font-mont">Reason (required)</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Why this rollback is needed…"
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="white" onClick={() => { setRollbackJob(null); setRollbackReason(""); }} disabled={rollingBack}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleRollback}
              disabled={rollingBack || !rollbackReason.trim()}
            >
              {rollingBack ? "Rolling back…" : "Confirm Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function JobRow({ job, onRollback }: { job: ImportJobListItem; onRollback: () => void }) {
  const isLive = job.status === "running" || job.status === "queued";
  const canRollback = ["succeeded", "failed", "cancelled"].includes(job.status);

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={JOB_STATUS_BADGE[job.status] ?? "inactive"} className="text-[10px] capitalize">
            {isLive && <span className="size-1 rounded-full bg-current animate-pulse mr-1" />}
            {job.status}
          </Badge>
          <span className="text-xs font-mono text-gray-01">#{job.id}</span>
          {job.retry_count > 0 && (
            <span className="text-[10px] text-amber-600">Retry x{job.retry_count}</span>
          )}
        </div>
        <PermissionGate permission={P.RUN_IMPORT_ROLLBACK}>
          {canRollback && (
            <Button variant="white" size="sm" onClick={onRollback}>
              <Undo2 className="size-3.5" /> Rollback
            </Button>
          )}
        </PermissionGate>
      </div>

      {/* Progress bar */}
      {(isLive || job.progress_percent > 0) && (
        <div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                job.status === "succeeded" ? "bg-green-500" :
                job.status === "failed" || job.status === "cancelled" ? "bg-red-400" :
                "bg-primary",
              )}
              style={{ width: `${job.progress_percent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-01 mt-1">
            {job.progress_percent}% · {job.processed_rows.toLocaleString()} / {job.total_rows.toLocaleString()} rows
          </p>
        </div>
      )}

      {/* Row counters */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
        <span className="text-green-600">✓ {job.succeeded_rows.toLocaleString()} succeeded</span>
        {job.failed_rows > 0 && <span className="text-red-500">✗ {job.failed_rows.toLocaleString()} failed</span>}
        {job.skipped_rows > 0 && <span className="text-gray-01">— {job.skipped_rows.toLocaleString()} skipped</span>}
      </div>

      {/* Timestamps */}
      <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-3">
        {job.started_at && <span>Started: {formatRelativeDate(job.started_at)}</span>}
        {job.completed_at && <span>Completed: {formatRelativeDate(job.completed_at)}</span>}
        <span>Created: {formatRelativeDate(job.created_at)}</span>
      </div>
    </div>
  );
}

// ── Row Results tab ──────────────────────────────────────────────────────────

function RowResultsTab({ batchId, latestJobId }: { batchId: number; latestJobId: number | null }) {
  const { data: job, isLoading, isError, refetch } = useGetImportJobQuery(
    { batchId, jobId: latestJobId as number },
    { skip: !latestJobId },
  );

  const [actionFilter, setActionFilter] = useState<"all" | "create" | "update" | "skip" | "failed">("all");

  if (!latestJobId) {
    return (
      <div className="py-12 text-center text-sm text-gray-01">
        No import jobs have been run for this batch yet.
      </div>
    );
  }

  if (isLoading) return <div className="flex h-32 items-center justify-center"><div className="loader" /></div>;
  if (isError) return (
    <div className="flex h-32 flex-col items-center justify-center gap-2">
      <p className="text-sm text-destructive">Failed to load row results.</p>
      <Button size="sm" variant="white" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const rows = job?.data?.row_results ?? [];
  const filtered = actionFilter === "all" ? rows : rows.filter((r) => r.action === actionFilter);

  const counts = {
    create: rows.filter((r) => r.action === "create").length,
    update: rows.filter((r) => r.action === "update").length,
    skip: rows.filter((r) => r.action === "skip").length,
    failed: rows.filter((r) => r.action === "failed").length,
  };

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-01">
        No row-level results recorded for job #{latestJobId}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-gray-01">Job #{latestJobId} · {rows.length.toLocaleString()} rows:</span>
          <Badge variant="active" className="text-[10px]">{counts.create} create</Badge>
          <Badge variant="pending" className="text-[10px]">{counts.update} update</Badge>
          <Badge variant="inactive" className="text-[10px]">{counts.skip} skip</Badge>
          <Badge variant="suspended" className="text-[10px]">{counts.failed} failed</Badge>
        </div>
        <Combobox
          value={actionFilter === "all" ? null : actionFilter}
          onValueChange={(v) => setActionFilter((v as "create" | "update" | "skip" | "failed" | null) ?? "all")}
        >
          <ComboboxInput
            placeholder="All actions"
            showTrigger
            showClear={actionFilter !== "all"}
            className="w-44 h-9"
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxItem value="create">Created</ComboboxItem>
              <ComboboxItem value="update">Updated</ComboboxItem>
              <ComboboxItem value="skip">Skipped</ComboboxItem>
              <ComboboxItem value="failed">Failed</ComboboxItem>
              <ComboboxEmpty>No matches</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden max-h-[600px] overflow-y-auto">
        {filtered.map((row) => {
          const actionColor =
            row.action === "create" ? "active" :
            row.action === "update" ? "pending" :
            row.action === "failed" ? "suspended" :
            "inactive";
          return (
            <div key={row.id} className="px-4 py-2.5 hover:bg-gray-50">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-gray-400">Row {row.row_number}</span>
                <Badge variant={actionColor} className="text-[10px] capitalize">{row.action}</Badge>
                {row.target_model && (
                  <span className="text-[10px] font-mono text-gray-500">{row.target_model}</span>
                )}
                {row.target_object_pk && (
                  <span className="text-[10px] font-mono text-gray-400">#{row.target_object_pk}</span>
                )}
              </div>
              {row.status_message && (
                <p className="text-xs text-black-01 mt-0.5">{row.status_message}</p>
              )}
              {row.action === "failed" && row.error_details && Object.keys(row.error_details).length > 0 && (
                <pre className="mt-1 text-[10px] text-red-500 font-mono bg-red-50 px-2 py-1 rounded overflow-x-auto">
                  {JSON.stringify(row.error_details, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Audit Logs tab ───────────────────────────────────────────────────────────

function AuditLogsTab({ batchId }: { batchId: number }) {
  const { data, isLoading, isError, refetch } = useGetImportAuditLogsQuery({ batchId });
  const logs = data?.data ?? [];

  if (isLoading) return <div className="flex h-32 items-center justify-center"><div className="loader" /></div>;
  if (isError) return (
    <div className="flex h-32 flex-col items-center justify-center gap-2">
      <p className="text-sm text-destructive">Failed to load audit logs.</p>
      <Button size="sm" variant="white" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (logs.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-01">No audit events for this batch.</div>;
  }

  return (
    <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 px-4 py-3">
          <ShieldAlert className="size-3.5 text-gray-300 mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={log.severity === "CRITICAL" ? "suspended" : log.severity === "WARNING" ? "locked" : "inactive"}
                className="text-[10px] uppercase"
              >
                {log.severity}
              </Badge>
              <span className="text-xs font-medium text-black-01">{log.action_type}</span>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[10px] text-gray-01">
                {log.actor_user?.full_name || log.actor_user?.email || log.actor_label || "System"}
              </span>
            </div>
            {log.summary && <p className="text-xs text-black-01 mt-0.5">{log.summary}</p>}
            <p className="text-[10px] text-gray-400 mt-0.5">
              {formatRelativeDate(log.event_at)}
              {log.ip_address && <span className="ml-2 font-mono">{log.ip_address}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Notifications tab ────────────────────────────────────────────────────────

function NotificationsTab({ batchId }: { batchId: number }) {
  const { data, isLoading, isError, refetch } = useGetImportNotificationsQuery({ batchId });
  const items = data?.data ?? [];

  const statusBadge: Record<string, "active" | "pending" | "suspended"> = {
    sent: "active",
    pending: "pending",
    failed: "suspended",
  };

  if (isLoading) return <div className="flex h-32 items-center justify-center"><div className="loader" /></div>;
  if (isError) return (
    <div className="flex h-32 flex-col items-center justify-center gap-2">
      <p className="text-sm text-destructive">Failed to load notifications.</p>
      <Button size="sm" variant="white" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (items.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-01">No notifications sent for this batch.</div>;
  }

  return (
    <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
      {items.map((n) => (
        <div key={n.id} className="flex items-start gap-3 px-4 py-3">
          <MessageSquare className="size-3.5 text-gray-300 mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusBadge[n.status] ?? "inactive"} className="text-[10px] capitalize">
                {n.status}
              </Badge>
              <span className="text-xs font-medium text-black-01 capitalize">{n.event_type.replace(/_/g, " ")}</span>
            </div>
            <p className="text-sm text-black-01 mt-1 font-medium">{n.title}</p>
            <p className="text-xs text-gray-01 mt-0.5">{n.body}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              {n.recipient?.full_name || n.recipient?.email || "—"}
              {n.sent_at && <span className="ml-2">{formatRelativeDate(n.sent_at)}</span>}
            </p>
            {n.error_message && (
              <p className="text-[10px] text-destructive mt-0.5">{n.error_message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

type TabKey = "issues" | "jobs" | "rows" | "audit" | "notifications";

export default function ViewBatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const batchId = Number(id);
  const { hasPermission } = usePermissions();

  const canViewBatch = hasPermission(P.VIEW_IMPORT_BATCHES);
  const canViewIssues = hasPermission(P.VIEW_IMPORT_ISSUES);
  const canViewJobs = hasPermission(P.VIEW_IMPORT_JOBS);
  const canViewAudit = hasPermission(P.VIEW_IMPORT_AUDIT);
  const canViewNotifications = hasPermission(P.VIEW_IMPORT_NOTIFICATIONS);

  const visibleTabKeys = useMemo<TabKey[]>(() => {
    const keys: TabKey[] = [];
    if (canViewIssues) keys.push("issues");
    if (canViewJobs) keys.push("jobs", "rows");
    if (canViewAudit) keys.push("audit");
    if (canViewNotifications) keys.push("notifications");
    return keys;
  }, [canViewIssues, canViewJobs, canViewAudit, canViewNotifications]);

  const [tab, setTab] = useState<TabKey>(() => {
    if (canViewIssues) return "issues";
    if (canViewJobs) return "jobs";
    if (canViewAudit) return "audit";
    if (canViewNotifications) return "notifications";
    return "issues";
  });
  const [confirm, setConfirm] = useState<"validate" | "start" | "delete" | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data, isLoading, isError, refetch } = useGetImportBatchQuery(batchId, {
    refetchOnMountOrArgChange: true,
    skip: !batchId || isNaN(batchId) || !canViewBatch || isDeleted,
  });

  const batch = unwrap<ImportBatch>(data);

  // Reset tab to first visible if current tab is no longer accessible
  // (guarded render-phase adjustment — no effect needed).
  if (visibleTabKeys.length > 0 && !visibleTabKeys.includes(tab)) {
    setTab(visibleTabKeys[0]);
  }

  // Auto-poll while batch is in flight.
  useEffect(() => {
    if (!batch) return;
    if (!IN_FLIGHT.has(batch.status)) return;
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [batch, refetch]);

  const [validate, { isLoading: validating }] = useValidateImportBatchMutation();
  const [startImport, { isLoading: starting }] = useStartImportBatchMutation();
  const [deleteBatch, { isLoading: deleting }] = useDeleteImportBatchMutation();

  // Latest job lookup for Row Results tab (only when user can view jobs).
  const { data: jobsData } = useGetImportJobsQuery({ batchId }, { skip: !batch || !canViewJobs });
  const latestJob = jobsData?.data?.[0] ?? null;

  if (!canViewBatch) {
    return (
      <PageAccessDenied
        layoutTitle="Batch Detail"
        hasBack
        onBack={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}
      />
    );
  }

  if (!batchId || isNaN(batchId)) {
    return (
      <DashboardLayout title="Batch Detail" hasBack onBack={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Invalid batch id.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Batch Detail" hasBack onBack={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}>
        <div className="flex h-96 items-center justify-center"><div className="loader" /></div>
      </DashboardLayout>
    );
  }

  if (isError || !batch) {
    return (
      <DashboardLayout title="Batch Detail" hasBack onBack={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}>
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">Batch not found or you don't have access.</p>
          <Button variant="white" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isInFlight = IN_FLIGHT.has(batch.status);
  const canValidate = !isInFlight && ["uploaded", "validation_failed", "mapping_required"].includes(batch.status);
  const canStart = batch.is_ready_for_import && !isInFlight && batch.status === "ready_to_import";

  const handleValidate = async () => {
    try {
      await validate({ id: batchId }).unwrap();
      toast.success("Validation completed.");
      refetch();
    } catch { /* interceptor shows the toast */ }
    setConfirm(null);
  };

  const handleStart = async () => {
    try {
      await startImport({ id: batchId, body: { run_async: true } }).unwrap();
      toast.success("Import queued.");
      refetch();
    } catch { /* interceptor shows the toast */ }
    setConfirm(null);
  };

  const handleDelete = async () => {
    setIsDeleted(true);
    try {
      await deleteBatch(batchId).unwrap();
      toast.success("Batch deleted.");
      navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX);
    } catch {
      setIsDeleted(false);
    }
  };

  const allTabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "issues", label: "Issues", count: batch.error_count + batch.warning_count },
    { key: "jobs", label: "Jobs" },
    { key: "rows", label: "Row Results" },
    { key: "audit", label: "Audit" },
    { key: "notifications", label: "Notifications" },
  ];
  const tabs = allTabs.filter((t) => visibleTabKeys.includes(t.key));

  return (
    <DashboardLayout
      title="Batch Detail"
      hasBack
      onBack={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}
    >
      <main className="px-4.5 py-6 text-black-01 space-y-5 max-w-6xl">
        {/* Header card */}
        <div className="bg-white rounded-md p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-01 mb-1">
                <span>Batches</span>
                <ChevronRight className="size-3" />
                <span className="font-mono">#{batch.id}</span>
              </div>
              <h1 className="text-lg font-semibold font-mont text-black-01 truncate">
                {batch.original_filename}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-01">
                <span className="capitalize">{batch.dataset_type}</span>
                <span>·</span>
                <span className="font-mono uppercase">{batch.file_format}</span>
                <span>·</span>
                <span>{formatBytes(batch.file_size_bytes)}</span>
                {batch.school?.name && (
                  <>
                    <span>·</span>
                    <span>{batch.school.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isInFlight && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Auto-refreshing
                </div>
              )}
              <Badge variant={STATUS_BADGE[batch.status]} className="capitalize">
                {STATUS_LABEL[batch.status]}
              </Badge>
            </div>
          </div>

          {/* Pipeline */}
          <PipelineTimeline status={batch.status} />

          {/* Action bar */}
          <div className="flex items-center gap-2 flex-wrap border-t border-gray-100 pt-4">
            <Button variant="white" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
            <PermissionGate permission={P.RUN_IMPORT_VALIDATION}>
              <Button
                size="sm"
                onClick={() => setConfirm("validate")}
                disabled={!canValidate || validating}
                title={canValidate ? "" : "Cannot validate from current state"}
              >
                <ShieldAlert className="size-3.5" /> {validating ? "Validating…" : "Validate"}
              </Button>
            </PermissionGate>
            <PermissionGate permission={P.EXECUTE_IMPORT_BATCH}>
              <Button
                size="sm"
                onClick={() => setConfirm("start")}
                disabled={!canStart || starting}
                title={canStart ? "" : batch.has_critical_errors ? "Resolve critical errors first" : "Batch not ready"}
              >
                <Play className="size-3.5" /> {starting ? "Starting…" : "Start Import"}
              </Button>
            </PermissionGate>
            {batch.file && (
              <button
                type="button"
                onClick={() => triggerBlobDownload(importDownloadUrls.batchFileDownload(batch.id), batch.original_filename)}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              >
                <Download className="size-3.5" /> Download original
              </button>
            )}
            <div className="flex-1" />
            <PermissionGate permission={P.DELETE_IMPORT_BATCH}>
              <Button
                variant="white"
                size="sm"
                className="text-destructive hover:bg-destructive/5"
                disabled={isInFlight}
                onClick={() => setConfirm("delete")}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Import failure banner */}
        {(batch.status === "import_failed" || batch.status === "import_partial") && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="size-4 shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">
                {batch.status === "import_failed" ? "Import failed" : "Import partially completed"}
              </p>
              <p className="text-[11px] text-destructive/80 mt-0.5">
                Validation passed with no issues. The failure occurred during the import execution — check the <strong>Jobs</strong> tab for the error details.
              </p>
            </div>
          </div>
        )}

        {/* Two-column meta + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Validation summary */}
          <div className="bg-white rounded-md p-5 space-y-4">
            <p className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
              Validation Summary
            </p>
            {batch.validation_summary == null ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <ShieldAlert className="size-8 text-gray-300" />
                <p className="text-xs text-gray--01 font-medium">Not yet validated</p>
                <p className="text-[11px] text-gray-01">Run validation to see the results here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-4">
                  <StatBlock label="Total Rows" value={batch.total_rows.toLocaleString()} />
                  <StatBlock label="Columns" value={batch.total_columns.toLocaleString()} />
                  <StatBlock
                    label="Errors"
                    value={String((batch.validation_summary as Record<string, number>).error_count ?? batch.error_count)}
                    accent={(batch.validation_summary as Record<string, number>).error_count > 0 ? "destructive" : undefined}
                  />
                  <StatBlock
                    label="Warnings"
                    value={String((batch.validation_summary as Record<string, number>).warning_count ?? batch.warning_count)}
                    accent={(batch.validation_summary as Record<string, number>).warning_count > 0 ? "warning" : undefined}
                  />
                  <StatBlock
                    label="Info"
                    value={String((batch.validation_summary as Record<string, number>).info_count ?? 0)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <ReadyChip label="Structure matches template" ok={batch.structure_matches_template} />
                  <ReadyChip label="No critical errors" ok={!batch.has_critical_errors} />
                  <ReadyChip label="Ready for import" ok={batch.is_ready_for_import} />
                </div>

                {(batch.validation_started_at || batch.validation_completed_at) && (
                  <div className="text-[10px] text-gray-400 flex gap-4 pt-2">
                    {batch.validation_started_at && (
                      <span>Started: {new Date(batch.validation_started_at).toLocaleString()}</span>
                    )}
                    {batch.validation_completed_at && (
                      <span>Completed: {new Date(batch.validation_completed_at).toLocaleString()}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Side meta */}
          <div className="bg-white rounded-md p-5 space-y-4">
            <p className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
              Metadata
            </p>
            <MetaRow label="Template">
              {batch.template ? (
                <div>
                  <p className="font-mono text-xs font-medium">{batch.template.code}</p>
                  <p className="text-[10px] text-gray-01">{batch.template.name}</p>
                </div>
              ) : <span className="text-xs text-gray-01">—</span>}
            </MetaRow>
            <MetaRow label="Uploaded by">
              <div>
                <p className="text-xs font-medium">{batch.uploaded_by.full_name || batch.uploaded_by.email}</p>
                {batch.uploaded_by.email && (
                  <p className="text-[10px] text-gray-01 truncate">{batch.uploaded_by.email}</p>
                )}
              </div>
            </MetaRow>
            <MetaRow label="Uploaded">
              <span className="text-xs">{formatRelativeDate(batch.created_at)}</span>
            </MetaRow>
            {batch.imported_at && (
              <MetaRow label="Imported">
                <span className="text-xs">{new Date(batch.imported_at).toLocaleString()}</span>
              </MetaRow>
            )}
            {batch.sheet_name && (
              <MetaRow label="Sheet">
                <span className="text-xs font-mono">{batch.sheet_name}</span>
              </MetaRow>
            )}
            <MetaRow label="Header row">
              <span className="text-xs font-mono">{batch.header_row_index}</span>
            </MetaRow>
            {batch.notes && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] uppercase tracking-wide text-gray-01 font-mont mb-1">Notes</p>
                <p className="text-xs whitespace-pre-wrap">{batch.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-md p-5">
          <div className="flex gap-1 border-b border-gray-100 mb-4 -mx-5 px-5 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 -mb-px",
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-01 hover:text-black-01",
                )}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5 font-medium",
                    tab === t.key ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500",
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "issues" && <IssuesTab batchId={batchId} />}
          {tab === "jobs" && <JobsTab batchId={batchId} batchStatus={batch.status} />}
          {tab === "rows" && <RowResultsTab batchId={batchId} latestJobId={latestJob?.id ?? null} />}
          {tab === "audit" && <AuditLogsTab batchId={batchId} />}
          {tab === "notifications" && <NotificationsTab batchId={batchId} />}
        </div>
      </main>

      {/* Confirms */}
      <PromptModal
        isOpen={confirm === "validate"}
        onClose={() => !validating && setConfirm(null)}
        onConfirm={handleValidate}
        canCancel
        onCancel={() => setConfirm(null)}
        title="Run Validation?"
        description="This will re-parse the file and check every row against the template. Any previous issues will be replaced."
        onConfirmText="Run Validation"
        src="/image/caution.png"
        srcClass="size-20"
        loading={validating}
      />
      <PromptModal
        isOpen={confirm === "start"}
        onClose={() => !starting && setConfirm(null)}
        onConfirm={handleStart}
        canCancel
        onCancel={() => setConfirm(null)}
        title="Start Import?"
        description="This will queue the batch for execution in the background. Watch the Jobs tab for progress."
        onConfirmText="Start Import"
        src="/image/caution.png"
        srcClass="size-20"
        loading={starting}
      />
      <PromptModal
        isOpen={confirm === "delete"}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={handleDelete}
        canCancel
        onCancel={() => setConfirm(null)}
        title="Delete Batch?"
        description={`Permanently delete "${batch.original_filename}"? This removes the file, validation issues, and job history. This cannot be undone.`}
        onConfirmText="Delete"
        onConfirmClass="bg-destructive text-white hover:bg-destructive/90"
        src="/image/caution.png"
        srcClass="size-20"
        loading={deleting}
      />
    </DashboardLayout>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "destructive" | "warning";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-01 font-mont">{label}</p>
      <p className={cn(
        "text-2xl font-bold mt-1",
        accent === "destructive" && "text-destructive",
        accent === "warning" && "text-amber-500",
      )}>
        {value}
      </p>
    </div>
  );
}

function ReadyChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
      ok ? "border-green-100 bg-green-50 text-green-700" : "border-gray-100 bg-gray-50 text-gray-500",
    )}>
      {ok ? <Check className="size-3.5 shrink-0" /> : <Inbox className="size-3.5 shrink-0" />}
      <span>{label}</span>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-01 font-mont mb-0.5">{label}</p>
      {children}
    </div>
  );
}
