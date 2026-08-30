import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useNow } from "@/hooks/use-now";
import { AlertOctagon, Download, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/custom/user-avatar";
import KpiCard from "@/components/custom/kpi-card";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { useGetAuditDashboardSummaryQuery, useGetAuditEventsQuery } from "@/redux/services/dashboard/audit-api";
import { formatRelativeDate } from "@/utils/helpers";
import type { AuditEventListItem } from "@/redux/services/dashboard/audit-types";
import EventDetailDrawer from "./components/event-detail-drawer";
import { PageShell } from "@/components/layout/page-shell";
import {
  CriticalHeatmap,
  ModuleDonut,
  SeverityStackedBar,
  SigninDualLine,
} from "@/components/charts/audit-charts";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

const FEED_FILTERS = ["All", "Critical only", "Failed/Denied", "Last hour", "Last 24h"] as const;
type FeedFilter = (typeof FEED_FILTERS)[number];


function SignalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 self-center" style={{ marginTop: "-5px" }}>
      {/* Outer arc */}
      <path
        d="M1.5 10 A8 8 0 0 1 14.5 10"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ animation: "signal-wave 1.8s ease-in-out 0.45s infinite" }}
      />
      {/* Inner arc */}
      <path
        d="M4.5 11.5 A4.5 4.5 0 0 1 11.5 11.5"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ animation: "signal-wave 1.8s ease-in-out 0s infinite" }}
      />
      {/* Center dot */}
      <circle cx="8" cy="13.5" r="1.25" fill="#22c55e" />
    </svg>
  );
}

export default function AuditDashboard() {
  const navigate = useNavigate();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("All");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditDashboardSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 60_000,
  });

  const { data: feedData } = useGetAuditEventsQuery(
    { page_size: 30 },
    { refetchOnMountOrArgChange: true, pollingInterval: 30_000 },
  );

  const summary = data?.data;
  const kpis = summary?.kpis;

  const now = useNow();
  const feedEvents = useMemo<AuditEventListItem[]>(() => {
    const events = feedData?.data ?? [];
    if (feedFilter === "Critical only") return events.filter((e) => e.severity === "CRITICAL");
    if (feedFilter === "Failed/Denied") return events.filter((e) => e.status === "FAILED" || e.status === "DENIED");
    if (feedFilter === "Last hour") return events.filter((e) => now - new Date(e.event_at).getTime() < 3_600_000);
    if (feedFilter === "Last 24h") return events.filter((e) => now - new Date(e.event_at).getTime() < 86_400_000);
    return events;
  }, [feedData, feedFilter, now]);

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
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
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Active sessions"
            value={kpis?.active_sessions ?? "-"}
            foot="Updated every minute"
            tone="live"
          />
          <KpiCard
            label="Events / 24h"
            value={kpis?.events_24h?.toLocaleString() ?? "-"}
            foot="Last 24 hours"
          />
          <KpiCard
            label="Critical / 24h"
            value={kpis?.critical_24h ?? "-"}
            foot={kpis?.critical_24h ? "Requires review" : "No critical events"}
            tone={kpis && kpis.critical_24h > 0 ? "alert" : "default"}
          />
          <KpiCard
            label="Failed / Denied"
            value={kpis?.failed_denied_24h ?? "-"}
            foot="Last 24 hours"
          />
          <KpiCard
            label="Locked accounts"
            value={kpis?.locked_accounts ?? "-"}
            foot={kpis?.locked_accounts ? "Now locked" : "None"}
            tone={kpis && kpis.locked_accounts > 0 ? "warn" : "default"}
          />
          <KpiCard
            label="Active impersonations"
            value={kpis?.active_impersonations ?? "-"}
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
          <div className="grid gap-5 xl:grid-cols-[1fr_360px] items-start">
            {/* Left - charts column */}
            <div className="space-y-5">
              {isLoading && (
                <div className="text-center text-xs text-gray-01 py-6">Loading dashboard metrics…</div>
              )}

              <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5")}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">Events by severity</p>
                    <p className="text-xs text-gray-01">Last 14 days</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-01">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />
                      Info
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />
                      Warning
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
                      Critical
                    </span>
                  </div>
                </div>
                <SeverityStackedBar data={summary?.severity_series ?? []} height={200} />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5")}>
                  <div className="mb-2">
                    <p className="font-semibold text-sm">By module</p>
                    <p className="text-xs text-gray-01">Last 24 hours</p>
                  </div>
                  <ModuleDonut data={summary?.module_breakdown ?? []} height={200} />
                </div>
                <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5")}>
                  <div className="mb-2">
                    <p className="font-semibold text-sm">Sign-in attempts</p>
                    <p className="text-xs text-gray-01">Success vs failure - last 30 days</p>
                  </div>
                  <SigninDualLine data={summary?.signin_series ?? []} height={200} />
                </div>
              </div>

              <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-5")}>
                <div className="mb-3">
                  <p className="font-semibold text-sm">Critical events heatmap</p>
                  <p className="text-xs text-gray-01">Hour of day × day of week - last 30 days</p>
                </div>
                <CriticalHeatmap data={summary?.critical_heatmap ?? Array.from({ length: 7 }, () => Array(24).fill(0))} />
              </div>
            </div>

            {/* Right - live event feed */}
            <div className="bg-white rounded-md border border-white-02 xl:sticky xl:top-4 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-white-02">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <SignalIcon />
                  <p className="font-semibold text-sm leading-none">Live event feed</p>
                </div>
                <p className="text-xs text-gray-01">Last 20 events · auto-refresh</p>
              </div>

              {/* Filter chips */}
              <div className="px-4 py-2.5 border-b border-white-02 flex flex-wrap gap-1.5">
                {FEED_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFeedFilter(f)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                      feedFilter === f
                        ? "bg-black-01 text-white border-black-01"
                        : "border-gray-200 text-gray-01 hover:border-gray-400 hover:text-black-01"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Feed rows */}
              <div className="overflow-y-auto max-h-[560px]">
                {feedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-xs text-gray-01">
                    No events match this filter.
                  </div>
                ) : (
                  feedEvents.slice(0, 20).map((e) => {
                    const actorName = e.actor_user?.full_name || e.actor_user?.email || e.actor_label || "System";
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEventId(e.id)}
                        className="w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition cursor-pointer"
                      >
                        {/* Severity dot */}
                        <span
                          className={`mt-1.5 size-2 rounded-full shrink-0 ${
                            e.severity === "CRITICAL"
                              ? "bg-red-500"
                              : e.severity === "WARNING"
                                ? "bg-amber-400"
                                : "bg-green-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <UserAvatar
                              userId={e.actor_user?.id}
                              name={actorName}
                              className="size-4 shrink-0"
                              fallbackClassName="text-[8px] font-semibold bg-blue-100 text-blue-700"
                            />
                            <span className="text-xs font-medium truncate">{actorName}</span>
                            <span className="text-gray-300 text-xs shrink-0">·</span>
                            <span className="text-[10px] text-gray-01 shrink-0">
                              {formatRelativeDate(e.event_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-01 truncate">{e.summary || e.action_type}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase">
                              {e.module_key}
                            </Badge>
                            <span className="text-[10px] text-gray-01 font-mono truncate">{e.action_type}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-white-02">
                <button
                  onClick={() => navigate(routesPath.PROTECTED.AUDIT.EVENTS)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View all events →
                </button>
              </div>
            </div>
          </div>
        )}

        <EventDetailDrawer
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      </PageShell>
    </>
  );
}
