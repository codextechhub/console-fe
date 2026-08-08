// Jobs & Queues - queue pressure from the snapshot collector plus the real
// background-job execution history (core.BackgroundJob), paginated.

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
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

export default function JobsPage() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
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
                className="rounded-md bg-white p-5 text-left transition-colors hover:bg-pry-01/40"
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
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </NativeSelect>
        </div>
      </div>
      <HealthTable
        headers={["Task", "Queue", "Tenant", "Status", "Duration", "Created"]}
        loading={tasks.isLoading}
        rows={(tasks.data?.data ?? []).map((t) => [
          <div>
            <p className="text-sm font-medium">{t.label || t.task_name}</p>
            <p className="text-xs text-gray-01">{t.kind}</p>
          </div>,
          t.queue,
          t.tenant || "Global",
          <Badge
            variant={t.status === "COMPLETED" ? "active" : t.status === "FAILED" ? "rejected" : "pending"}
            className="font-mont text-xs"
          >
            {t.status}
          </Badge>,
          t.duration_sec != null ? `${t.duration_sec}s` : "-",
          new Date(t.created_at).toLocaleString(),
        ])}
        emptyText="No background jobs recorded yet."
        totalPage={tasks.data?.pagination?.totalPages}
        currentPage={tasks.data?.pagination?.currentPage}
        onPageChange={(p) => setPage(p as number)}
      />

      <QueueDrawer queue={selectedQueue} onClose={() => setSelectedQueue(null)} />
    </HealthFrame>
  );
}
