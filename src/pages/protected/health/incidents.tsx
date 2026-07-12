// Incidents & Alerts — reliability stats, then Incidents / Alerts / Rules on
// the house URL-driven tab pill, each list paginated server-side.

import { useState } from "react";
import { useSearchParams } from "react-router";
import Tabs from "@/components/custom/tab";
import { Badge } from "@/components/ui/badge";
import {
  useGetAlertRulesQuery,
  useGetHealthAlertsQuery,
  useGetHealthIncidentsQuery,
  useGetReliabilityQuery,
} from "@/redux/services/health-api";
import { IncidentDrawer } from "./drawers";
import {
  HealthFrame,
  HealthKpi,
  HealthTable,
  PageIntro,
  SeverityBadge,
} from "./primitives";

type View = "incidents" | "alerts" | "rules";

export default function IncidentsPage() {
  const [searchParams] = useSearchParams();
  const view = (searchParams.get("view") as View) ?? "incidents";
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [incidentPage, setIncidentPage] = useState(1);
  const [alertPage, setAlertPage] = useState(1);

  const incidents = useGetHealthIncidentsQuery({ page: incidentPage, page_size: 25 });
  const alerts = useGetHealthAlertsQuery({ page: alertPage, page_size: 25 });
  const rules = useGetAlertRulesQuery();
  const reliability = useGetReliabilityQuery();
  const incidentRows = incidents.data?.data ?? [];

  return (
    <HealthFrame>
      <PageIntro
        title="Incidents & Alerts"
        description="Coordinate incidents and review the signals that triggered them."
        onRefresh={() => {
          incidents.refetch();
          alerts.refetch();
          rules.refetch();
          reliability.refetch();
        }}
        refreshing={incidents.isFetching || alerts.isFetching}
      />

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <HealthKpi
          label="Active incidents"
          value={reliability.data?.data.active ?? 0}
          status={(reliability.data?.data.active ?? 0) > 0 ? "warning" : "healthy"}
        />
        <HealthKpi label="Incidents · 30d" value={reliability.data?.data.incidents ?? 0} />
        <HealthKpi label="Mean acknowledge" value={reliability.data?.data.mtta_min ?? "—"} unit="min" />
        <HealthKpi label="Mean resolve" value={reliability.data?.data.mttr_min ?? "—"} unit="min" />
      </div>

      <Tabs
        tabKey="view"
        tabs={[
          { label: "Incidents", value: "incidents" },
          { label: "Alerts", value: "alerts" },
          { label: "Rules", value: "rules" },
        ]}
      />

      {view === "incidents" && (
        <HealthTable
          onRowClick={(index) => setSelectedIncident(incidentRows[index].id)}
          headers={["Incident", "Severity", "Status", "Owner", "Tenants", "Started"]}
          loading={incidents.isLoading}
          rows={incidentRows.map((i) => [
            <div>
              <p className="text-sm font-medium">{i.title}</p>
              <p className="text-xs text-gray-01">{i.code}</p>
            </div>,
            <SeverityBadge severity={i.severity} />,
            i.status,
            i.owner_label || "Unassigned",
            i.affected_tenant_count,
            new Date(i.started_at).toLocaleString(),
          ])}
          emptyText="No incidents recorded — that's the good outcome."
          totalPage={incidents.data?.pagination?.totalPages}
          currentPage={incidents.data?.pagination?.currentPage}
          onPageChange={(p) => setIncidentPage(p as number)}
        />
      )}

      {view === "alerts" && (
        <HealthTable
          headers={["Alert", "Rule", "Service", "Value", "Threshold", "Fired"]}
          loading={alerts.isLoading}
          rows={(alerts.data?.data ?? []).map((a) => [
            <div>
              <p className="text-sm font-medium">{a.title}</p>
              <SeverityBadge severity={a.severity} />
            </div>,
            a.rule_name,
            a.service_key || "Platform",
            a.value,
            a.threshold,
            new Date(a.fired_at).toLocaleString(),
          ])}
          emptyText="No alerts have fired."
          totalPage={alerts.data?.pagination?.totalPages}
          currentPage={alerts.data?.pagination?.currentPage}
          onPageChange={(p) => setAlertPage(p as number)}
        />
      )}

      {view === "rules" && (
        <HealthTable
          headers={["Rule", "Metric", "Condition", "Target", "Channel", "Status"]}
          loading={rules.isLoading}
          rows={(rules.data?.data ?? []).map((r) => [
            r.name,
            r.metric,
            `${r.comparator} ${r.threshold}`,
            r.target_service_key || r.target_queue || "Global",
            r.channel,
            <Badge variant={r.is_enabled ? "active" : "inactive"} className="font-mont text-xs">
              {r.is_enabled ? "Enabled" : "Disabled"}
            </Badge>,
          ])}
          emptyText="No alert rules configured."
        />
      )}

      <IncidentDrawer incidentId={selectedIncident} onClose={() => setSelectedIncident(null)} />
    </HealthFrame>
  );
}
