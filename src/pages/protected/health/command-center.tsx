// Command Center — the single-pane overview: posture banner, golden-signal
// KPIs, request activity, active incidents, and per-service drill-ins.
// Polls gently so "live" is actually live (paused when the tab is hidden).

import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetHealthOverviewQuery } from "@/redux/services/health-api";
import { TrendChart } from "./charts";
import { IncidentDrawer, ServiceDrawer } from "./drawers";
import {
  Empty,
  HEALTH_POLL,
  HealthFrame,
  HealthKpi,
  PageIntro,
  QueryState,
  SeverityBadge,
  StatusDot,
} from "./primitives";

const KPI_LABELS = {
  latency: "P95 latency",
  traffic: "Traffic",
  errors: "Error rate",
  saturation: "Saturation",
} as const;

export default function CommandCenter() {
  const [range, setRange] = useState("1h");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const query = useGetHealthOverviewQuery({ range }, HEALTH_POLL);
  const data = query.data?.data;

  const intro = (
    <PageIntro
      title="Command Center"
      description="A live, unified view of platform reliability."
      range={range}
      onRange={setRange}
      onRefresh={query.refetch}
      refreshing={query.isFetching}
    />
  );

  if (!data) {
    return (
      <HealthFrame>
        {intro}
        <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch} />
      </HealthFrame>
    );
  }

  const operational = data.posture.overall === "operational";

  return (
    <HealthFrame>
      {intro}

      {/* Posture banner */}
      <div
        className={cn(
          "flex items-center justify-between rounded-md border px-5 py-4",
          operational ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              operational ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
            )}
          >
            {operational ? <CheckCircle2 /> : <AlertTriangle />}
          </span>
          <div>
            <p className="font-mont font-semibold">{data.posture.label}</p>
            <p className="text-xs text-gray-01">
              {data.posture.active_incidents} active incidents
              {data.global_uptime != null
                ? ` · ${data.global_uptime}% 30-day uptime`
                : " · uptime accruing from live checks"}
            </p>
          </div>
        </div>
        <Badge variant={operational ? "active" : "suspended"}>{data.posture.overall}</Badge>
      </div>

      {/* Golden signals */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {(["latency", "traffic", "errors", "saturation"] as const).map((key) => (
          <HealthKpi key={key} label={KPI_LABELS[key]} {...data.kpis[key]} />
        ))}
      </div>

      {/* Activity + incidents */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className="rounded-md bg-white p-5.5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-mont font-semibold">Request activity</h2>
              <p className="text-xs text-gray-01">Traffic through the platform over the selected window</p>
            </div>
            <Activity className="size-5 text-primary" />
          </div>
          <TrendChart data={data.request_series} />
        </section>
        <section className="rounded-md bg-white p-5.5">
          <h2 className="font-mont font-semibold">Active incidents</h2>
          <div className="mt-4 space-y-3">
            {data.active_incidents.length ? (
              data.active_incidents.slice(0, 5).map((incident) => (
                <button
                  type="button"
                  onClick={() => setSelectedIncident(incident.id)}
                  key={incident.id}
                  className="block w-full rounded-md border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-medium">{incident.title}</p>
                    <SeverityBadge severity={incident.severity} />
                  </div>
                  <p className="mt-1 text-xs text-gray-01">
                    {incident.code} · {incident.owner_label || "Unassigned"}
                  </p>
                </button>
              ))
            ) : (
              <Empty text="No active incidents" />
            )}
          </div>
        </section>
      </div>

      {/* Service grid */}
      <section>
        <div className="mb-3">
          <h2 className="font-mont font-semibold">Service health</h2>
          <p className="text-xs text-gray-01">Select a service to inspect uptime and recent alerts</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.services.map((service) => (
            <button
              type="button"
              onClick={() => setSelectedService(service.key)}
              key={service.key}
              className="rounded-md bg-white p-4 text-left transition-colors hover:bg-pry-01/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-md bg-gray-50 text-primary">
                  <Server className="size-4" />
                </span>
                <StatusDot status={service.status} />
              </div>
              <p className="mt-4 text-sm font-semibold">{service.name}</p>
              <p className="mt-1 text-xs text-gray-01">
                {service.group} · Tier {service.tier}
              </p>
            </button>
          ))}
        </div>
      </section>

      <ServiceDrawer serviceKey={selectedService} onClose={() => setSelectedService(null)} />
      <IncidentDrawer incidentId={selectedIncident} onClose={() => setSelectedIncident(null)} />
    </HealthFrame>
  );
}
