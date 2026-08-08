// Detail drawers for the Health screens - one per drill-in target (service,
// monitor, endpoint, incident, tenant, queue, SLO). All read-only.

import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useGetHealthEndpointDetailQuery,
  useGetHealthIncidentDetailQuery,
  useGetHealthMonitorDetailQuery,
  useGetHealthServiceDetailQuery,
  useGetTenantHealthDetailQuery,
  type Queue,
  type Slo,
} from "@/redux/services/health-api";
import { TrendChart } from "./charts";
import {
  DetailMetrics,
  DrawerFrame,
  DrawerLoading,
  Empty,
  HealthKpi,
  SeverityBadge,
  StatusDot,
} from "./primitives";

export function ServiceDrawer({ serviceKey, onClose }: { serviceKey: string | null; onClose: () => void }) {
  const query = useGetHealthServiceDetailQuery(serviceKey ?? "", { skip: !serviceKey });
  const d = query.data?.data;
  return (
    <DrawerFrame
      open={!!serviceKey}
      onClose={onClose}
      title={d?.name ?? "Service details"}
      description={d ? `${d.group} · Tier ${d.tier}` : "Live service posture and recent signals"}
    >
      <DrawerLoading loading={query.isLoading} error={query.isError} />
      {d && (
        <>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <p className="text-xs text-gray-01">Current status</p>
              <div className="mt-2">
                <StatusDot status={d.status} />
              </div>
            </div>
            <Server className="size-7 text-primary" />
          </div>
          <DetailMetrics
            items={[
              { label: "30-day uptime", value: d.uptime ? `${d.uptime.uptime_30d}%` : "-" },
              {
                label: "Average response",
                value: d.uptime?.avg_response_ms != null ? `${d.uptime.avg_response_ms} ms` : "-",
              },
              { label: "Service kind", value: <span className="capitalize">{d.kind}</span> },
              { label: "Recent alerts", value: d.recent_alerts.length },
            ]}
          />
          <section>
            <h3 className="font-mont text-sm font-semibold">Recent alerts</h3>
            <div className="mt-3 space-y-3">
              {d.recent_alerts.length ? (
                d.recent_alerts.map((alert) => (
                  <div key={alert.id} className="rounded-md border p-3">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="mt-1 text-xs text-gray-01">{new Date(alert.fired_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <Empty text="No recent alerts" />
              )}
            </div>
          </section>
        </>
      )}
    </DrawerFrame>
  );
}

export function MonitorDrawer({ monitorKey, onClose }: { monitorKey: string | null; onClose: () => void }) {
  const query = useGetHealthMonitorDetailQuery(monitorKey ?? "", { skip: !monitorKey });
  const d = query.data?.data;
  return (
    <DrawerFrame
      open={!!monitorKey}
      onClose={onClose}
      title={d?.name ?? "Monitor details"}
      description="Availability, latency, and certificate timeline"
    >
      <DrawerLoading loading={query.isLoading} error={query.isError} />
      {d && (
        <>
          <div className="flex items-center justify-between rounded-md border p-4">
            <StatusDot status={d.status} />
            <span className="text-2xl font-semibold">{d.uptime_30d}%</span>
          </div>
          <DetailMetrics
            items={[
              { label: "24-hour uptime", value: `${d.uptime_24h}%` },
              { label: "7-day uptime", value: `${d.uptime_7d}%` },
              { label: "90-day uptime", value: `${d.uptime_90d}%` },
              {
                label: "Average response",
                value: d.avg_response_ms != null ? `${d.avg_response_ms} ms` : "-",
              },
            ]}
          />
          {d.response_series.length > 0 && (
            <section>
              <h3 className="mb-3 font-mont text-sm font-semibold">Response time</h3>
              <TrendChart
                data={d.response_series.map((p) => ({
                  t: p.t,
                  requests: p.ms,
                  status_2xx: 0,
                  status_3xx: 0,
                  status_4xx: 0,
                  status_5xx: 0,
                  error_rate: 0,
                  p95: p.ms,
                }))}
                dataKey="p95"
              />
            </section>
          )}
          {d.ssl && (
            <section className="rounded-md border p-4">
              <p className="text-xs text-gray-01">TLS certificate</p>
              <p className="mt-2 font-medium">{d.ssl.domain || "Configured domain"}</p>
              <p className="mt-1 text-sm text-gray-01">{d.ssl.days_left ?? "-"} days remaining</p>
            </section>
          )}
        </>
      )}
    </DrawerFrame>
  );
}

export function EndpointDrawer({
  route,
  range,
  onClose,
}: {
  route: string | null;
  range: string;
  onClose: () => void;
}) {
  const query = useGetHealthEndpointDetailQuery({ route: route ?? "", range }, { skip: !route });
  const d = query.data?.data;
  return (
    <DrawerFrame
      open={!!route}
      onClose={onClose}
      title="Endpoint details"
      description={route ?? "Request performance and tenant impact"}
    >
      <DrawerLoading loading={query.isLoading} error={query.isError} />
      {d && (
        <>
          <DetailMetrics
            items={[
              { label: "Requests", value: d.totals.requests.toLocaleString() },
              { label: "Error rate", value: `${d.totals.error_rate}%` },
              { label: "P95 latency", value: `${d.p95} ms` },
              { label: "Throttled", value: d.totals.throttled },
            ]}
          />
          <section>
            <h3 className="mb-3 font-mont text-sm font-semibold">Request trend</h3>
            <TrendChart data={d.series} />
          </section>
          <section>
            <h3 className="font-mont text-sm font-semibold">Affected tenants</h3>
            <div className="mt-3 space-y-2">
              {d.affected_tenants.length ? (
                d.affected_tenants.map((t) => (
                  <div key={t.tenant_id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-01">{t.requests.toLocaleString()} requests</p>
                    </div>
                    <Badge variant={t.error_rate > 1 ? "rejected" : "active"}>{t.error_rate}% errors</Badge>
                  </div>
                ))
              ) : (
                <Empty text="No tenant impact recorded" />
              )}
            </div>
          </section>
        </>
      )}
    </DrawerFrame>
  );
}

export function IncidentDrawer({ incidentId, onClose }: { incidentId: string | null; onClose: () => void }) {
  const query = useGetHealthIncidentDetailQuery(incidentId ?? "", { skip: !incidentId });
  const d = query.data?.data;
  return (
    <DrawerFrame
      open={!!incidentId}
      onClose={onClose}
      title={d?.title ?? "Incident war room"}
      description={d ? `${d.code} · ${d.status}` : "Timeline, impact, ownership, and response context"}
    >
      <DrawerLoading loading={query.isLoading} error={query.isError} />
      {d && (
        <>
          <div className="flex items-center justify-between rounded-md border p-4">
            <SeverityBadge severity={d.severity} />
            <span className="text-sm font-medium capitalize">{d.status}</span>
          </div>
          <DetailMetrics
            items={[
              { label: "Owner", value: d.owner_label || "Unassigned" },
              { label: "Affected tenants", value: d.affected_tenant_count },
              { label: "Services", value: d.service_keys.length },
              { label: "Started", value: new Date(d.started_at).toLocaleString() },
            ]}
          />
          {d.summary && (
            <section>
              <h3 className="font-mont text-sm font-semibold">Summary</h3>
              <p className="mt-2 text-sm leading-6 text-gray-05">{d.summary}</p>
            </section>
          )}
          <section>
            <h3 className="font-mont text-sm font-semibold">Incident timeline</h3>
            <div className="mt-4">
              {d.timeline.length ? (
                d.timeline.map((event, index) => (
                  <div key={event.id} className="relative flex gap-3 pb-5">
                    <div className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                    {index < d.timeline.length - 1 && (
                      <span className="absolute left-[4px] top-3 h-full w-px bg-gray-200" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{event.text}</p>
                      <p className="mt-1 text-xs text-gray-01">
                        {event.who} · {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="No timeline events" />
              )}
            </div>
          </section>
        </>
      )}
    </DrawerFrame>
  );
}

export function TenantDrawer({
  tenant,
  range,
  onClose,
}: {
  tenant: { id: number; name: string } | null;
  range: string;
  onClose: () => void;
}) {
  const query = useGetTenantHealthDetailQuery({ id: tenant?.id ?? 0, range }, { skip: !tenant });
  const d = query.data?.data;
  return (
    <DrawerFrame
      open={!!tenant}
      onClose={onClose}
      title={tenant?.name ?? "Tenant details"}
      description="Tenant-scoped latency, traffic, errors, and endpoint health"
    >
      <DrawerLoading loading={query.isLoading} error={query.isError} />
      {d && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(["latency", "traffic", "errors", "saturation"] as const).map((k) => (
              <HealthKpi key={k} label={k} {...d.kpis[k]} />
            ))}
          </div>
          <section>
            <h3 className="mb-3 font-mont text-sm font-semibold">Request activity</h3>
            <TrendChart data={d.series} />
          </section>
          <section>
            <h3 className="font-mont text-sm font-semibold">Top endpoints</h3>
            <div className="mt-3 space-y-2">
              {d.endpoints.slice(0, 8).map((e) => (
                <div
                  key={`${e.method}-${e.route}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <p className="min-w-0 truncate font-mono text-xs">
                    {e.method} {e.route}
                  </p>
                  <span className="text-xs font-semibold">{e.p95} ms</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </DrawerFrame>
  );
}

export function QueueDrawer({ queue, onClose }: { queue: Queue | null; onClose: () => void }) {
  return (
    <DrawerFrame
      open={!!queue}
      onClose={onClose}
      title={queue?.name ?? "Queue details"}
      description="Depth, throughput, retries, failures, and recent pressure"
    >
      {queue && (
        <>
          <div className="flex items-center justify-between rounded-md border p-4">
            <StatusDot status={queue.status} />
            <span className="text-2xl font-semibold">{queue.depth} waiting</span>
          </div>
          <DetailMetrics
            items={[
              { label: "Throughput", value: `${queue.throughput_per_min}/min` },
              { label: "Average duration", value: `${queue.avg_duration_sec}s` },
              { label: "Retrying", value: queue.retrying },
              { label: "Failed", value: queue.failed },
              { label: "Dead", value: queue.dead },
              { label: "Retry storm", value: queue.retry_storm ? "Detected" : "No" },
            ]}
          />
          <section>
            <h3 className="mb-3 font-mont text-sm font-semibold">Queue depth trend</h3>
            <TrendChart
              data={queue.depth_trend.map((value, index) => ({
                t: String(index),
                requests: value,
                status_2xx: 0,
                status_3xx: 0,
                status_4xx: 0,
                status_5xx: 0,
                error_rate: 0,
                p95: 0,
              }))}
            />
          </section>
        </>
      )}
    </DrawerFrame>
  );
}

export function SloDrawer({ slo, onClose }: { slo: Slo | null; onClose: () => void }) {
  return (
    <DrawerFrame
      open={!!slo}
      onClose={onClose}
      title={slo?.service ?? "SLO details"}
      description="Objective attainment and error-budget interpretation"
    >
      {slo && (
        <>
          <div className="flex items-center justify-between rounded-md border p-4">
            <Badge variant={slo.breached ? "rejected" : "active"}>
              {slo.breached ? "Objective breached" : "Meeting objective"}
            </Badge>
            <span className="text-2xl font-semibold">{slo.current}%</span>
          </div>
          <DetailMetrics
            items={[
              { label: "Target", value: `${slo.target}%` },
              { label: "Window", value: `${slo.window_days} days` },
              { label: "Budget remaining", value: `${slo.error_budget_remaining}%` },
              {
                label: "Budget consumed",
                value: `${Math.max(0, 100 - slo.error_budget_remaining).toFixed(1)}%`,
              },
            ]}
          />
          <section className="rounded-md bg-gray-50 p-4">
            <h3 className="font-mont text-sm font-semibold">What this means</h3>
            <p className="mt-2 text-sm leading-6 text-gray-05">
              {slo.breached
                ? "Observed availability is below the reliability target. Prioritize stability work until the rolling window recovers."
                : slo.error_budget_remaining < 25
                  ? "The objective is currently met, but little error budget remains. Changes should be made cautiously."
                  : "The service is meeting its reliability target with sufficient budget remaining for normal delivery."}
            </p>
          </section>
        </>
      )}
    </DrawerFrame>
  );
}
