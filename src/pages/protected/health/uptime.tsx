// Uptime — probe monitors with 24h/7d/30d availability, the 90-day segment
// strip, and certificate tracking. All figures come from real probe results;
// "No history yet" is the honest state until the beat schedule has run.

import { useState } from "react";
import { useGetHealthUptimeQuery } from "@/redux/services/health-api";
import { MonitorDrawer } from "./drawers";
import {
  HealthFrame,
  HealthKpi,
  PageIntro,
  QueryState,
  StatusDot,
  statusStyle,
} from "./primitives";
import { cn } from "@/lib/utils";

export default function UptimePage() {
  const query = useGetHealthUptimeQuery();
  const monitors = query.data?.data.monitors;
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);

  const intro = (
    <PageIntro
      title="Uptime"
      description="Availability, response time, and certificate health."
      onRefresh={query.refetch}
      refreshing={query.isFetching}
    />
  );

  if (!monitors) {
    return (
      <HealthFrame>
        {intro}
        <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch} />
      </HealthFrame>
    );
  }

  // A monitor with no probe results yet must not claim an uptime figure —
  // the backend defaults to 100 when the rollup set is empty.
  const withHistory = monitors.filter((m) => m.segments.length > 0);
  const averageUptime = withHistory.length
    ? (withHistory.reduce((sum, m) => sum + m.uptime_30d, 0) / withHistory.length).toFixed(3)
    : "—";

  return (
    <HealthFrame>
      {intro}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <HealthKpi label="Monitors" value={monitors.length} />
        <HealthKpi label="Healthy" value={monitors.filter((m) => m.status === "healthy").length} />
        <HealthKpi
          label="Average uptime"
          value={averageUptime}
          unit={averageUptime === "—" ? undefined : "%"}
        />
        <HealthKpi label="Certificates tracked" value={monitors.filter((m) => m.ssl).length} />
      </div>

      <section className="overflow-hidden rounded-md bg-white">
        <div className="border-b border-white-02 px-5.5 py-4">
          <h2 className="font-mont font-semibold">Service monitors</h2>
          <p className="text-xs text-gray-01">Select a monitor for its response and certificate details</p>
        </div>
        <div className="divide-y divide-white-02">
          {monitors.map((monitor) => (
            <button
              type="button"
              onClick={() => setSelectedMonitor(monitor.key)}
              key={monitor.key}
              className="block w-full p-5.5 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{monitor.name}</p>
                    <StatusDot status={monitor.status} />
                  </div>
                  <p className="mt-1 text-xs text-gray-01">
                    Average response {monitor.avg_response_ms ?? 0} ms
                    {monitor.ssl?.domain ? ` · SSL ${monitor.ssl.days_left ?? "—"} days` : ""}
                  </p>
                </div>
                <div className="flex gap-5 text-right text-xs">
                  {(
                    [
                      ["24h", monitor.uptime_24h],
                      ["7d", monitor.uptime_7d],
                      ["30d", monitor.uptime_30d],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-gray-01">{label}</p>
                      {/* No probe history → no uptime claim. */}
                      <p className="mt-1 font-semibold">
                        {monitor.segments.length ? `${value}%` : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex h-7 gap-0.5">
                {monitor.segments.length ? (
                  monitor.segments.slice(-90).map((segment) => (
                    <span
                      key={segment.day}
                      title={`${segment.day}: ${segment.uptime}%`}
                      className={cn("min-w-0 flex-1 rounded-sm", statusStyle(segment.status).dot)}
                    />
                  ))
                ) : (
                  <div className="flex w-full items-center justify-center rounded bg-gray-50 text-xs text-gray-01">
                    No history yet — probes fill this in as they run
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      <MonitorDrawer monitorKey={selectedMonitor} onClose={() => setSelectedMonitor(null)} />
    </HealthFrame>
  );
}
