import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { routesPath } from "@/routes/routesPath";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, AlertTriangle, Info } from "lucide-react";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";

interface BatchIssue {
  id: string;
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  row_number: number;
  column_name: string;
  raw_value?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
}

interface RowCorrection {
  id: string;
  row_number: number;
  column_name: string;
  old_value: string;
  new_value: string;
  reason: string;
  applied_by: string;
  applied_at: string;
}

interface ImportJob {
  id: string;
  job_type: "validation" | "import" | "rollback";
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  started_at: string | null;
  finished_at: string | null;
  rows_processed: number;
  error_message?: string;
}

interface BatchNotification {
  id: string;
  recipient_email: string;
  event: string;
  status: "sent" | "pending" | "failed";
  sent_at: string | null;
}

interface BatchDetail {
  id: string;
  original_filename: string;
  dataset_type: string;
  status: string;
  total_rows: number;
  total_columns: number;
  error_count: number;
  warning_count: number;
  has_critical_errors: boolean;
  uploaded_by: string;
  school: string;
  imported_at: string | null;
  validation_started_at: string | null;
  validation_completed_at: string | null;
  notes: string;
  template_code: string;
  file_format: string;
  issues: BatchIssue[];
  corrections: RowCorrection[];
  jobs: ImportJob[];
  notifications: BatchNotification[];
}

const PIPELINE = [
  "draft", "uploaded", "parsing", "parsed",
  "validating", "validated", "importing", "imported",
];

const PIPELINE_LABELS: Record<string, string> = {
  draft: "Draft", uploaded: "Uploaded", parsing: "Parsing", parsed: "Parsed",
  validating: "Validating", validated: "Validated", importing: "Importing", imported: "Imported",
};

const TERMINAL_STATUSES = new Set(["validation_failed", "rolled_back", "cancelled"]);

const STATUS_BADGE: Record<string, string> = {
  imported: "active", validation_failed: "suspended", importing: "locked",
  validated: "pending", draft: "inactive", rolled_back: "suspended", validating: "locked",
};

const SEVERITY_BADGE: Record<string, string> = { error: "suspended", warning: "locked", info: "inactive" };
const JOB_STATUS_BADGE: Record<string, string> = { queued: "pending", running: "locked", succeeded: "active", failed: "suspended", cancelled: "inactive" };

const DUMMY_BATCHES: Record<string, BatchDetail> = {
  bch_001: {
    id: "bch_001", original_filename: "students_js1_term1.xlsx", dataset_type: "students",
    status: "imported", total_rows: 142, total_columns: 8, error_count: 0, warning_count: 3,
    has_critical_errors: false, uploaded_by: "Tunde Bakare", school: "Lekki Heights Academy",
    imported_at: "2026-05-08T09:21:14Z", validation_started_at: "2026-05-08T09:15:00Z",
    validation_completed_at: "2026-05-08T09:18:30Z", notes: "", template_code: "STUDENTS_STANDARD",
    file_format: "XLSX",
    issues: [
      { id: "i20", severity: "warning", code: "value_too_long", message: "address_line near max length.", row_number: 8, column_name: "address_line", is_resolved: true, resolved_by: "Tunde Bakare", resolved_at: "2026-05-08T09:20:00Z" },
      { id: "i21", severity: "warning", code: "value_too_long", message: "guardian_name is unusually long.", row_number: 33, column_name: "guardian_name", is_resolved: false },
      { id: "i22", severity: "warning", code: "optional_missing", message: "phone_number is blank for this student.", row_number: 71, column_name: "phone_number", is_resolved: false },
    ],
    corrections: [
      { id: "cr1", row_number: 4, column_name: "guardian_email", old_value: "parent@@example.com", new_value: "parent@example.com", reason: "Fix double @", applied_by: "Tunde Bakare", applied_at: "2026-05-08T09:19:00Z" },
    ],
    jobs: [
      { id: "job1", job_type: "validation", status: "succeeded", started_at: "2026-05-08T09:15:00Z", finished_at: "2026-05-08T09:18:30Z", rows_processed: 142 },
      { id: "job2", job_type: "import", status: "succeeded", started_at: "2026-05-08T09:20:00Z", finished_at: "2026-05-08T09:21:14Z", rows_processed: 142 },
    ],
    notifications: [
      { id: "n1", recipient_email: "tunde.bakare@school.com", event: "validation_completed", status: "sent", sent_at: "2026-05-08T09:18:35Z" },
      { id: "n2", recipient_email: "tunde.bakare@school.com", event: "import_completed", status: "sent", sent_at: "2026-05-08T09:21:20Z" },
    ],
  },
  bch_002: {
    id: "bch_002", original_filename: "students_ss3_intake.xlsx", dataset_type: "students",
    status: "validation_failed", total_rows: 87, total_columns: 8, error_count: 12, warning_count: 5,
    has_critical_errors: true, uploaded_by: "Folake Ojo", school: "Lekki Heights Academy",
    imported_at: null, validation_started_at: "2026-05-10T14:02:00Z",
    validation_completed_at: "2026-05-10T14:05:22Z", notes: "Needs data cleanup before re-upload.",
    template_code: "STUDENTS_STANDARD", file_format: "XLSX",
    issues: [
      { id: "i1", severity: "error", code: "required_value_missing", message: "guardian_email is required.", row_number: 4, column_name: "guardian_email", raw_value: "", is_resolved: false },
      { id: "i2", severity: "error", code: "invalid_email", message: "Not a valid email address.", row_number: 9, column_name: "guardian_email", raw_value: "notanemail", is_resolved: false },
      { id: "i3", severity: "error", code: "foreign_key_not_found", message: "Class 'JS9X' does not exist.", row_number: 18, column_name: "class_code", raw_value: "JS9X", is_resolved: false },
      { id: "i4", severity: "error", code: "duplicate_value", message: "admission_number appears twice.", row_number: 27, column_name: "admission_number", raw_value: "ADM-2025-0101", is_resolved: false },
      { id: "i5", severity: "warning", code: "optional_missing", message: "phone_number is blank.", row_number: 5, column_name: "phone_number", is_resolved: false },
    ],
    corrections: [],
    jobs: [
      { id: "job3", job_type: "validation", status: "failed", started_at: "2026-05-10T14:02:00Z", finished_at: "2026-05-10T14:05:22Z", rows_processed: 87, error_message: "Critical validation errors detected." },
    ],
    notifications: [
      { id: "n3", recipient_email: "folake.ojo@school.com", event: "validation_failed", status: "sent", sent_at: "2026-05-10T14:05:30Z" },
    ],
  },
};


function PipelineTimeline({ status }: { status: string }) {
  const isTerminal = TERMINAL_STATUSES.has(status);
  const currentIdx = PIPELINE.indexOf(status);

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {PIPELINE.map((step, idx) => {
        const isCompleted = isTerminal ? false : idx < currentIdx;
        const isCurrent = step === status && !isTerminal;
        const isDone = step === status && status === "imported";

        return (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className={cn(
                "size-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                (isCompleted || isDone) && "bg-primary border-primary text-white",
                isCurrent && !isDone && "bg-white border-primary text-primary",
                !isCompleted && !isCurrent && !isDone && "bg-gray-50 border-gray-200 text-gray-400",
              )}>
                {isCompleted || isDone ? <Check size={13} /> : idx + 1}
              </div>
              <p className={cn(
                "text-xs mt-1.5 whitespace-nowrap",
                (isCompleted || isDone) && "text-primary font-medium",
                isCurrent && !isDone && "text-primary font-semibold",
                !isCompleted && !isCurrent && !isDone && "text-gray-400",
              )}>
                {PIPELINE_LABELS[step]}
              </p>
            </div>
            {idx < PIPELINE.length - 1 && (
              <div className={cn(
                "h-0.5 w-8 mb-4 mx-0.5 transition-colors",
                idx < currentIdx && !isTerminal ? "bg-primary" : "bg-gray-200",
              )} />
            )}
          </div>
        );
      })}
      {isTerminal && (
        <div className="flex items-center ml-2">
          <div className="h-0.5 w-8 bg-gray-200 mb-4" />
          <div className="flex flex-col items-center">
            <div className="size-7 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-400 text-red-600">
              <AlertTriangle size={12} />
            </div>
            <p className="text-xs mt-1.5 whitespace-nowrap text-red-500 font-medium capitalize">
              {status.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Issues tab
// ============================================================================
function IssuesTab({ issues, onIssuesChange }: { issues: BatchIssue[]; onIssuesChange: (issues: BatchIssue[]) => void }) {
  const [sevFilter, setSevFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");

  const filtered = issues.filter((i) => {
    if (sevFilter !== "all" && i.severity !== sevFilter) return false;
    if (resolvedFilter === "open" && i.is_resolved) return false;
    if (resolvedFilter === "resolved" && !i.is_resolved) return false;
    return true;
  });

  const resolve = (id: string) => {
    onIssuesChange(issues.map((i) => i.id === id ? { ...i, is_resolved: true, resolved_by: "Olumide Bankole", resolved_at: new Date().toISOString() } : i));
    toast.success("Issue marked as resolved.");
  };

  const reopen = (id: string) => {
    onIssuesChange(issues.map((i) => i.id === id ? { ...i, is_resolved: false, resolved_by: undefined, resolved_at: undefined } : i));
    toast.info("Issue reopened.");
  };

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Check size={24} className="text-green-500 mb-2" />
        <p className="text-sm font-medium text-black-01">No validation issues</p>
        <p className="text-xs text-gray-01 mt-1">This batch passed validation cleanly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <CustomNativeSelect
          id="sev-filter" name="sev-filter" label=""
          value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}
          options={[{ value: "all", label: "All Severities" }, { value: "error", label: "Error" }, { value: "warning", label: "Warning" }, { value: "info", label: "Info" }]}
        />
        <CustomNativeSelect
          id="resolved-filter" name="resolved-filter" label=""
          value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)}
          options={[{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "resolved", label: "Resolved" }]}
        />
      </div>

      <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {filtered.map((issue) => (
          <div key={issue.id} className={cn("flex items-start gap-3 px-4 py-3", issue.is_resolved && "opacity-60")}>
            <div className="shrink-0 mt-0.5">
              {issue.severity === "error" && <AlertTriangle size={14} className="text-red-500" />}
              {issue.severity === "warning" && <AlertTriangle size={14} className="text-amber-500" />}
              {issue.severity === "info" && <Info size={14} className="text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={(SEVERITY_BADGE[issue.severity] ?? "inactive") as any} className="text-xs capitalize">
                  {issue.severity}
                </Badge>
                <span className="font-mono text-xs text-gray-500">{issue.code}</span>
                {issue.row_number > 0 && <span className="text-xs text-gray-400">Row {issue.row_number}</span>}
                {issue.column_name && <span className="font-mono text-xs text-gray-400">{issue.column_name}</span>}
                {issue.is_resolved && (
                  <Badge variant="active" className="text-xs">
                    <Check size={10} className="mr-0.5" /> Resolved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-black-01 mt-1">{issue.message}</p>
              {issue.raw_value && (
                <p className="font-mono text-xs text-gray-400 mt-0.5">Raw: {issue.raw_value}</p>
              )}
              {issue.is_resolved && issue.resolved_by && (
                <p className="text-xs text-gray-400 mt-0.5">Resolved by {issue.resolved_by}</p>
              )}
            </div>
            <div className="shrink-0">
              {issue.is_resolved ? (
                <Button variant="white" size="sm" onClick={() => reopen(issue.id)}>Reopen</Button>
              ) : (
                <Button size="sm" onClick={() => resolve(issue.id)}>Resolve</Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-01">No issues match the current filters.</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Corrections tab
// ============================================================================
function CorrectionsTab({ corrections }: { corrections: RowCorrection[] }) {
  if (corrections.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-01">No row corrections have been applied to this batch.</div>
    );
  }
  return (
    <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
      {corrections.map((c) => (
        <div key={c.id} className="px-4 py-3 space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Row {c.row_number}</span>
            <span className="font-mono text-xs font-semibold text-black-01">{c.column_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-red-500 bg-red-50 px-1.5 py-0.5 rounded">{c.old_value || "(blank)"}</span>
            <span className="text-gray-400">→</span>
            <span className="font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{c.new_value}</span>
          </div>
          <p className="text-xs text-gray-01">{c.reason}</p>
          <p className="text-xs text-gray-400">{c.applied_by} · {new Date(c.applied_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Jobs tab
// ============================================================================
function JobsTab({ jobs }: { jobs: ImportJob[] }) {
  if (jobs.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-01">No import jobs recorded for this batch.</div>;
  }
  return (
    <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
      {jobs.map((job) => (
        <div key={job.id} className="flex items-start gap-4 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={(JOB_STATUS_BADGE[job.status] ?? "inactive") as any} className="text-xs capitalize">
                {job.status}
              </Badge>
              <span className="text-xs font-semibold text-black-01 capitalize">{job.job_type.replace(/_/g, " ")}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
              {job.started_at && <p>Started: {new Date(job.started_at).toLocaleString()}</p>}
              {job.finished_at && <p>Finished: {new Date(job.finished_at).toLocaleString()}</p>}
              {job.rows_processed > 0 && <p>{job.rows_processed.toLocaleString()} rows processed</p>}
              {job.error_message && <p className="text-red-500">{job.error_message}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Notifications tab
// ============================================================================
function NotificationsTab({ notifications }: { notifications: BatchNotification[] }) {
  if (notifications.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-01">No notifications sent for this batch.</div>;
  }
  const statusBadge: Record<string, string> = { sent: "active", pending: "pending", failed: "suspended" };
  return (
    <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-4 px-4 py-3">
          <Badge variant={(statusBadge[n.status] ?? "inactive") as any} className="text-xs capitalize shrink-0 mt-0.5">
            {n.status}
          </Badge>
          <div>
            <p className="text-sm text-black-01 font-medium">{n.recipient_email}</p>
            <p className="text-xs text-gray-01 capitalize mt-0.5">{n.event.replace(/_/g, " ")}</p>
            {n.sent_at && <p className="text-xs text-gray-400 mt-0.5">{new Date(n.sent_at).toLocaleString()}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
type TabKey = "issues" | "corrections" | "jobs" | "notifications";

export default function ViewBatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("issues");
  const [batchData, setBatchData] = useState<typeof DUMMY_BATCHES>(DUMMY_BATCHES);

  const batch = id ? batchData[id] : null;

  if (!batch) {
    return (
      <DashboardLayout title="Batch Detail" hasBack onBack={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Batch not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const updateIssues = (issues: BatchIssue[]) => {
    setBatchData((s) => ({ ...s, [batch.id]: { ...batch, issues } }));
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "issues", label: "Validation Issues", count: batch.issues.length },
    { key: "corrections", label: "Row Corrections", count: batch.corrections.length },
    { key: "jobs", label: "Import Jobs", count: batch.jobs.length },
    { key: "notifications", label: "Notifications", count: batch.notifications.length },
  ];

  return (
    <DashboardLayout
      title="Batch Detail"
      hasBack
      onBack={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}
    >
      <main className="px-4.5 py-6 text-black-01 space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold font-mont text-black-01">{batch.original_filename}</h1>
            <p className="text-xs text-gray-01 mt-0.5 capitalize">{batch.dataset_type} · {batch.school} · {batch.file_format}</p>
          </div>
          <Badge variant={(STATUS_BADGE[batch.status] ?? "inactive") as any} className="capitalize shrink-0 mt-0.5">
            {batch.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Meta cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-md p-4">
            <p className="text-xs text-gray-01 font-mont">Template</p>
            <p className="font-mono text-sm font-semibold text-black-01 mt-1">{batch.template_code}</p>
          </div>
          <div className="bg-white rounded-md p-4">
            <p className="text-xs text-gray-01 font-mont">Uploaded By</p>
            <p className="text-sm font-semibold text-black-01 mt-1">{batch.uploaded_by}</p>
            <p className="text-xs text-gray-400">{batch.school}</p>
          </div>
          <div className="bg-white rounded-md p-4">
            <p className="text-xs text-gray-01 font-mont">Imported At</p>
            <p className="text-sm font-semibold text-black-01 mt-1">
              {batch.imported_at ? new Date(batch.imported_at).toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {/* Pipeline timeline */}
        <div className="bg-white rounded-md p-5">
          <p className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3 mb-4">Pipeline</p>
          <PipelineTimeline status={batch.status} />
        </div>

        {/* Validation summary */}
        <div className="bg-white rounded-md p-5">
          <p className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3 mb-4">Validation Summary</p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-01 font-mont">Total Rows</p>
              <p className={cn("text-2xl font-bold mt-1")}>{batch.total_rows.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-01 font-mont">Errors</p>
              <p className={cn("text-2xl font-bold mt-1", batch.error_count > 0 && "text-red-500")}>{batch.error_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-01 font-mont">Warnings</p>
              <p className={cn("text-2xl font-bold mt-1", batch.warning_count > 0 && "text-amber-500")}>{batch.warning_count}</p>
            </div>
          </div>
          {(batch.validation_started_at || batch.validation_completed_at) && (
            <div className="mt-4 flex gap-6 text-xs text-gray-400">
              {batch.validation_started_at && (
                <span>Started: {new Date(batch.validation_started_at).toLocaleString()}</span>
              )}
              {batch.validation_completed_at && (
                <span>Completed: {new Date(batch.validation_completed_at).toLocaleString()}</span>
              )}
            </div>
          )}
          {batch.notes && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-01 font-mont mb-1">Notes</p>
              <p className="text-sm text-black-01">{batch.notes}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-md p-5">
          <div className="flex gap-1 border-b border-gray-100 pb-0 mb-5 -mx-5 px-5 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-01 hover:text-black-01",
                )}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={cn(
                    "text-xs rounded-full px-1.5 py-0.5 font-medium",
                    tab === t.key ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500",
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "issues" && (
            <IssuesTab issues={batchData[batch.id].issues} onIssuesChange={updateIssues} />
          )}
          {tab === "corrections" && <CorrectionsTab corrections={batch.corrections} />}
          {tab === "jobs" && <JobsTab jobs={batch.jobs} />}
          {tab === "notifications" && <NotificationsTab notifications={batch.notifications} />}
        </div>
      </main>
    </DashboardLayout>
  );
}
