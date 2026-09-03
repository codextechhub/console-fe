/**
 * One background job in full, opened from the Jobs & Queues table.
 *
 * Three layers, because reading them costs three different things:
 *
 *   the list          metadata. Everyone with the health console sees it.
 *   this drawer       + the REDACTED error, on platform.tasks.view.
 *   the raw record    the unredacted traceback, on platform.tasks.view_sensitive,
 *                     and every read writes an audit event.
 *
 * The last one is behind a confirmation rather than a click, and the
 * confirmation names the consequence: the read is recorded against the SCHOOL's
 * audit trail, not CodeX's, so the customer can see who read their data. That
 * is not a warning for the sake of friction - it is the fact that makes the
 * design defensible, and hiding it would leave an operator surprised by their
 * own footprint.
 */

import { useState } from "react";
import { AlertTriangle, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RunStatusPill } from "@/components/custom/run-status-pill";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useGetTaskRunQuery,
  useLazyGetTaskDiagnosticQuery,
  type TaskDiagnostic,
} from "@/redux/services/task-monitor-api";
import { errorStatus } from "@/utils/api-errors";
import { DetailMetrics, DrawerFrame, DrawerLoading } from "./primitives";

const REDACTION_MARKER = "[redacted]";

function fmt(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "-";
}

// A pre-formatted block for machine text: monospace, wrapping, and scrollable
// rather than stretching the drawer. A traceback is long by nature.
function Machine({ text }: { text: string }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-04 p-3 font-geist-mono text-[11px] leading-relaxed text-black-01">
      {text}
    </pre>
  );
}

function RawDiagnostic({ raw }: { raw: TaskDiagnostic }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border-l-[3px] border-destructive bg-destructive/10 px-4 py-3">
        <p className="font-mont text-sm font-semibold text-error-text">
          Unredacted. This read has been recorded.
        </p>
        <p className="mt-1 font-mont text-xs leading-relaxed text-gray-01">
          The audit trail now holds an entry naming you, this run, and the time,
          filed against the tenant whose task failed. Treat what follows as the
          customer's own data.
        </p>
      </div>
      {raw.raw_error && (
        <div>
          <p className="mb-2 font-mont text-[11px] uppercase tracking-widest text-gray-05">Error</p>
          <Machine text={raw.raw_error} />
        </div>
      )}
      {raw.raw_traceback && (
        <div>
          <p className="mb-2 font-mont text-[11px] uppercase tracking-widest text-gray-05">Traceback</p>
          <Machine text={raw.raw_traceback} />
        </div>
      )}
      <p className="font-mont text-[11px] text-gray-05">
        Recorded {fmt(raw.recorded_at)} · kept until {fmt(raw.expires_at)}
      </p>
    </div>
  );
}

export function TaskRunDrawer({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const { hasPermission } = usePermissions();
  const canSeeRaw = hasPermission(P.VIEW_RAW_TASK_DIAGNOSTIC);
  const [confirming, setConfirming] = useState(false);

  const detail = useGetTaskRunQuery(jobId ?? "", { skip: !jobId });
  const [loadRaw, rawState] = useLazyGetTaskDiagnosticQuery();
  const job = detail.data?.data;
  const raw = rawState.data?.data;

  const status = errorStatus(detail.error);
  // 403 and 404 mean different things and an operator can act on the
  // difference, so they are not collapsed into "something went wrong".
  const forbidden = status === 403;
  const outOfScope = status === 404;

  const close = () => {
    setConfirming(false);
    // Drop the fetched raw text on close: leaving it in the hook's state would
    // re-render it on the next open without a second audited read.
    rawState.reset?.();
    onClose();
  };

  return (
    <DrawerFrame
      open={!!jobId}
      onClose={close}
      title={job?.label || job?.task_name || "Background job"}
      description={job ? job.task_name : "One tracked run"}
    >
      {forbidden ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-gray-01">
          You do not have access to background job details. Ask a Super Admin for
          the task monitor permission.
        </div>
      ) : outOfScope ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-gray-01">
          This run belongs to a tenant you cannot open. Reading another
          customer's runs needs the cross-tenant task permission.
        </div>
      ) : (
        <>
          <DrawerLoading loading={detail.isLoading} error={detail.isError && !forbidden && !outOfScope} />
          {job && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <RunStatusPill status={job.status} />
                {job.kind && (
                  <span className="rounded-md bg-gray-04 px-2 py-1 font-mont text-[11px] uppercase tracking-wide text-gray-01">
                    {job.kind}
                  </span>
                )}
              </div>

              <DetailMetrics
                items={[
                  { label: "Created", value: <span className="text-sm">{fmt(job.created_at)}</span> },
                  { label: "Finished", value: <span className="text-sm">{fmt(job.finished_at)}</span> },
                  {
                    label: "Duration",
                    value: (
                      <span className="text-sm">
                        {job.runtime_seconds != null ? `${job.runtime_seconds}s` : "-"}
                      </span>
                    ),
                  },
                  { label: "Owner", value: <span className="text-sm">{job.owner_name ?? "System"}</span> },
                ]}
              />

              {job.error && (
                <div className="rounded-md border-l-[3px] border-destructive bg-destructive/10 px-4 py-3">
                  <p className="font-mont text-sm font-semibold text-error-text">This task failed</p>
                  <p className="mt-1 font-mont text-xs leading-relaxed text-gray-01">{job.error}</p>
                  {job.error.includes(REDACTION_MARKER) && (
                    <p className="mt-2 font-mont text-[11px] leading-relaxed text-gray-05">
                      Personal data in this message has been removed before it was stored.
                    </p>
                  )}
                </div>
              )}

              {job.has_diagnostic && canSeeRaw && !raw && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={rawState.isFetching}
                  onClick={() => setConfirming(true)}
                >
                  {rawState.isFetching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                  Reveal raw diagnostic
                </Button>
              )}

              {job.has_diagnostic && !canSeeRaw && (
                <p className="font-mont text-xs leading-relaxed text-gray-05">
                  The unredacted failure text is stored for this run. Reading it
                  needs the raw diagnostic permission, held by the Super Admin.
                </p>
              )}

              {rawState.isError && (
                <p className="font-mont text-xs text-destructive">
                  {errorStatus(rawState.error) === 404
                    ? "No raw record remains for this run. Diagnostics are kept for a limited period and then removed."
                    : "The raw diagnostic could not be loaded."}
                </p>
              )}

              {raw && <RawDiagnostic raw={raw} />}
            </>
          )}
        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              This read will be recorded
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>
                  The raw text is what the worker actually recorded, so it can
                  contain a person's email address, phone number or account
                  details - whatever the failing row held.
                </p>
                <p>
                  Opening it writes an audit entry naming you and this run,
                  against the audit trail of the tenant whose task failed. Their
                  administrators can see it.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (jobId) loadRaw(jobId);
              }}
            >
              Reveal and record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DrawerFrame>
  );
}
