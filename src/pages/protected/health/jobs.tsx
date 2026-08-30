// Jobs & Queues - queue pressure from the snapshot collector plus the real
// background-job execution history (core.BackgroundJob), paginated.

import { useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { RunStatusPill, runStatusWord } from "@/components/custom/run-status-pill";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { TaskRunDrawer } from "./task-drawer";
import {
  useGetHealthQueuesQuery,
  useGetHealthTasksQuery,
  type Queue,
} from "@/redux/services/health-api";
import { QueueDrawer } from "./drawers";
import {
  HEALTH_POLL,
  HealthFrame,
  HealthKpi,
  HealthTable,
  PageIntro,
  QueryState,
  StatusDot,
} from "./primitives";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

// The API's own tokens, from core.BackgroundJob.Status. This screen used to
// offer "pending" and "completed", which match no row the backend can produce -
// the values are QUEUED and SUCCEEDED - so two of the four filters silently
// returned an empty table. Labels come from runStatusWord, the same helper
// Export -> View Queues uses, so the two screens cannot drift into two words
// for one outcome. CANCELLED is deliberately absent: nothing writes it, and a
// filter that can only ever return nothing is the bug this comment describes.
export const STATUS_OPTIONS = (["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"] as const).map((value) => ({
  value,
  label: runStatusWord(value),
}));

export default function JobsPage() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  // Rows open a drawer only for a caller who may read the detail. Without the
  // key the row detail would 403, and a click that can only fail is worse than
  // a row that does not invite one.
  const { hasPermission } = usePermissions();
  const canOpenRuns = hasPermission(P.VIEW_TASK_MONITOR);
  const queues = useGetHealthQueuesQuery(undefined, HEALTH_POLL);
  const tasks = useGetHealthTasksQuery({
    page,
    page_size: 25,
    ...(status !== "all" ? { status } : {}),
  });
  const data = queues.data?.data;

  return (
    <HealthFrame>
      <PageIntro
        title="Jobs & Queues"
        description="Background processing, queue pressure, workers, and failures."
        guideTarget="platform-health.jobs"
        onRefresh={() => {
          queues.refetch();
          tasks.refetch();
        }}
        refreshing={queues.isFetching || tasks.isFetching}
      />

      {!data ? (
        <QueryState loading={queues.isLoading} error={queues.isError} retry={queues.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            <HealthKpi label="Queued jobs" value={data.queues.reduce((s, q) => s + q.depth, 0)} />
            <HealthKpi label="Active workers" value={data.workers.active} />
            <HealthKpi label="Idle workers" value={data.workers.idle} />
            <HealthKpi
              label="Failed jobs"
              value={data.queues.reduce((s, q) => s + q.failed, 0)}
              status={data.queues.some((q) => q.failed) ? "warning" : "healthy"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {data.queues.map((q) => (
              <button
                type="button"
                onClick={() => setSelectedQueue(q)}
                key={q.name}
                className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5 text-left transition-colors hover:bg-pry-01/40")}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-mont font-semibold capitalize">{q.name}</p>
                    <p className="mt-1 text-xs text-gray-01">{q.throughput_per_min}/min throughput</p>
                  </div>
                  <StatusDot status={q.status} />
                </div>
                <p className="mt-5 text-3xl font-semibold">{q.depth}</p>
                <p className="text-xs text-gray-01">jobs waiting</p>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-gray-50 p-3 text-center text-xs">
                  {(
                    [
                      [q.retrying, "Retrying"],
                      [q.failed, "Failed"],
                      [q.dead, "Dead"],
                    ] as const
                  ).map(([value, label]) => (
                    <div key={label}>
                      <p className="font-semibold">{value}</p>
                      <p className="text-gray-01">{label}</p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont font-semibold">Recent tasks</h2>
          <p className="text-xs text-gray-01">Background job execution history</p>
        </div>
        {/* NativeSelect's wrapper is w-full; size it from a parent div. */}
        <div className="w-44">
          <NativeSelect
            className="h-10"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <HealthTable
        headers={["Task", "Queue", "Tenant", "Status", "Duration", "Created"]}
        loading={tasks.isLoading}
        onRowClick={
          canOpenRuns
            ? (index) => setOpenJobId((tasks.data?.data ?? [])[index]?.id ?? null)
            : undefined
        }
        rows={(tasks.data?.data ?? []).map((t) => [
          <div>
            <p className="text-sm font-medium">{t.label || t.task_name}</p>
            <p className="text-xs text-gray-01">{t.kind}</p>
          </div>,
          t.queue,
          t.tenant || "Global",
          // RunStatusPill rather than a local variant map: the old one tested
          // for "COMPLETED", which this API never sends, so every successful
          // job was badged as pending.
          <RunStatusPill status={t.status} />,
          t.duration_sec != null ? `${t.duration_sec}s` : "-",
          new Date(t.created_at).toLocaleString(),
        ])}
        emptyText="No background jobs recorded yet."
        totalPage={tasks.data?.pagination?.totalPages}
        currentPage={tasks.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
      />

      <QueueDrawer queue={selectedQueue} onClose={() => setSelectedQueue(null)} />
      <TaskRunDrawer jobId={openJobId} onClose={() => setOpenJobId(null)} />
    </HealthFrame>
  );
}
