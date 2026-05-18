import { useNavigate } from "react-router";
import { AlertOctagon, Download, RefreshCw, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import KpiCard from "@/components/custom/kpi-card";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import { useGetAuditDashboardSummaryQuery } from "@/redux/services/dashboard/auditApi";
import {
  CriticalHeatmap,
  ModuleDonut,
  SeverityStackedBar,
  SigninDualLine,
} from "@/components/charts/audit-charts";

export default function AuditDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useGetAuditDashboardSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 60_000,
  });

  const summary = data?.data;
  const kpis = summary?.kpis;

  return (
    <DashboardLayout title="Security Dashboard">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Security Dashboard</p>
            <p className="text-xs text-gray-01 mt-0.5">Cross-platform forensic and compliance overview.</p>
          </div>
          <div className="inline-flex items-center gap-3.5">
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
            <PermissionGate permission={P.EXPORT_AUDIT}>
              <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.AUDIT.EXPORT_NEW)}>
                <Download /> Export view
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Banners */}
        {kpis && kpis.critical_24h > 0 && (
          <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertOctagon className="size-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                {kpis.critical_24h} critical event{kpis.critical_24h !== 1 ? "s" : ""} in the last 24 hours
              </p>
              <p className="text-xs text-red-700/80">Investigate any unexpected activity below.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-800"
              onClick={() => navigate(`${routesPath.PROTECTED.AUDIT.EVENTS}?severity=CRITICAL`)}
            >
              Review →
            </Button>
          </div>
        )}
        {kpis && kpis.failed_denied_24h > 5 && (
          <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TrendingUp className="size-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{kpis.failed_denied_24h} failed/denied actions in the last 24 hours</p>
              <p className="text-xs text-amber-700/80">Check for repeated failures from individual IPs.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-800"
              onClick={() => navigate(routesPath.PROTECTED.AUDIT.LOGIN_ATTEMPTS)}
            >
              Investigate →
            </Button>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Active sessions"
            value={kpis?.active_sessions ?? "—"}
            foot="Updated every minute"
            tone="live"
          />
          <KpiCard
            label="Events / 24h"
            value={kpis?.events_24h?.toLocaleString() ?? "—"}
            foot="Last 24 hours"
          />
          <KpiCard
            label="Critical / 24h"
            value={kpis?.critical_24h ?? "—"}
            foot={kpis?.critical_24h ? "Requires review" : "No critical events"}
            tone={kpis && kpis.critical_24h > 0 ? "alert" : "default"}
          />
          <KpiCard
            label="Failed / Denied"
            value={kpis?.failed_denied_24h ?? "—"}
            foot="Last 24 hours"
          />
          <KpiCard
            label="Locked accounts"
            value={kpis?.locked_accounts ?? "—"}
            foot={kpis?.locked_accounts ? "Now locked" : "None"}
            tone={kpis && kpis.locked_accounts > 0 ? "warn" : "default"}
          />
          <KpiCard
            label="Active impersonations"
            value={kpis?.active_impersonations ?? "—"}
            foot={kpis?.active_impersonations ? "In progress" : "None"}
            tone={kpis && kpis.active_impersonations > 0 ? "warn" : "default"}
          />
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-destructive">Failed to load dashboard.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-md p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">Events by severity</p>
                  <p className="text-xs text-gray-01">Last 14 days</p>
                </div>
              </div>
              <SeverityStackedBar data={summary?.severity_series ?? []} height={220} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="bg-white rounded-md p-5">
                <div className="mb-2">
                  <p className="font-semibold text-sm">By module</p>
                  <p className="text-xs text-gray-01">Last 24 hours</p>
                </div>
                <ModuleDonut data={summary?.module_breakdown ?? []} height={220} />
              </div>
              <div className="bg-white rounded-md p-5">
                <div className="mb-2">
                  <p className="font-semibold text-sm">Sign-in attempts</p>
                  <p className="text-xs text-gray-01">Success vs failure — last 30 days</p>
                </div>
                <SigninDualLine data={summary?.signin_series ?? []} height={220} />
              </div>
            </div>

            <div className="bg-white rounded-md p-5">
              <div className="mb-3">
                <p className="font-semibold text-sm">Critical events heatmap</p>
                <p className="text-xs text-gray-01">Hour of day × day of week — last 30 days</p>
              </div>
              <CriticalHeatmap data={summary?.critical_heatmap ?? Array.from({ length: 7 }, () => Array(24).fill(0))} />
            </div>
          </>
        )}

        {isLoading && (
          <div className="text-center text-xs text-gray-01">Loading dashboard metrics…</div>
        )}
      </main>
    </DashboardLayout>
  );
}
