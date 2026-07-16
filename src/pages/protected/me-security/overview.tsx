import { useNavigate } from "react-router";
import { AlertTriangle, Clock, Key, Monitor, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routes-path";
import { useAppSelector } from "@/redux/store";
import { useGetMyLoginSessionsQuery, useGetMySecurityStatsQuery } from "@/redux/services/dashboard/security-api";
import { useGetMyActivityQuery } from "@/redux/services/dashboard/audit-api";
import { formatRelativeDate } from "@/utils/helpers";
import type { AuditSeverity } from "@/redux/services/dashboard/audit-types";

function parseUA(ua: string | null | undefined): { browser: string; os: string } {
  if (!ua) return { browser: "—", os: "—" };
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "—";
  const os =
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "Mac OS" :
    /Windows/.test(ua) ? "Windows" :
    /Linux/.test(ua) ? "Linux" : "—";
  return { browser, os };
}

const SEV_DOT_COLOR: Record<AuditSeverity, string> = {
  INFO: "bg-blue-500",
  WARNING: "bg-amber-400",
  CRITICAL: "bg-red-500",
};

function SevDot({ level }: { level: AuditSeverity }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 mt-1.5 ${SEV_DOT_COLOR[level] ?? "bg-gray-400"}`}
    />
  );
}

export default function MeSecurityOverview() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const { data: activeSess } = useGetMyLoginSessionsQuery(
    { is_active: "true", page_size: 1 },
    { refetchOnMountOrArgChange: true },
  );
  const { data: activity } = useGetMyActivityQuery(
    { page: 1, page_size: 10 },
    { refetchOnMountOrArgChange: true },
  );
  const { data: stats } = useGetMySecurityStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const activeSessionCount = activeSess?.pagination?.totalItems ?? 0;
  const lastSessionUA = activeSess?.data?.[0]?.user_agent ?? null;
  const lastUA = parseUA(lastSessionUA);
  const lastLoginAt = user?.last_login_at || null;
  const passwordChangedAt = user?.password_changed_at || null;
  const failed7d = stats?.data?.failed_attempts_7d ?? null;
  const needsAttention = failed7d !== null && failed7d > 0;
  const recentEvents = activity?.data ?? [];

  return (
    <DashboardLayout title="My Security">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-7 text-blue-600" />
          <div>
            <p className="font-semibold font-mont text-gray-01">My Security</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Manage your sign-in devices, password, and activity.
            </p>
          </div>
        </div>

        {/* Gap 1 — Security health card */}
        <div
          className={`rounded-md p-5 flex items-center gap-4 border ${
            needsAttention
              ? "bg-amber-50 border-amber-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              needsAttention ? "bg-amber-400" : "bg-green-500"
            }`}
          >
            {needsAttention ? (
              <AlertTriangle size={22} color="#fff" strokeWidth={2} />
            ) : (
              <ShieldCheck size={22} color="#fff" strokeWidth={2} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {needsAttention ? "A few things need your attention" : "Your account is secure"}
            </p>
            <p className="text-xs text-gray-01 mt-0.5">
              {needsAttention
                ? "We noticed failed sign-in attempts on your account. Review the details below."
                : `No unusual activity detected. Sessions look healthy${passwordChangedAt ? ", password is recent" : ""}.`}
            </p>
          </div>
          <Button size="sm" variant="white" className="h-7 text-xs shrink-0">
            Security tips
          </Button>
        </div>

        {/* Gap 2 — 4-column KPI grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Active sessions */}
          <div className="bg-white rounded-md px-5.5 py-5 min-h-26 flex flex-col gap-1.5">
            <p className="font-mont text-sm font-medium text-gray-01">Active sessions</p>
            <p className="font-semibold text-2xl text-[#221122]">{activeSessionCount}</p>
            <button
              className="text-xs text-blue-600 hover:underline text-left w-fit"
              onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.SESSIONS)}
            >
              View all →
            </button>
          </div>

          {/* KPI 2: Last sign-in */}
          <div className="bg-white rounded-md px-5.5 py-5 min-h-26 flex flex-col gap-1.5">
            <p className="font-mont text-sm font-medium text-gray-01">Last sign-in</p>
            <p className="font-semibold text-xl text-[#221122] leading-tight">
              {lastLoginAt ? formatRelativeDate(lastLoginAt) : "—"}
            </p>
            <p className="text-xs text-gray-01">
              {lastSessionUA ? `${lastUA.browser} on ${lastUA.os}` : ""}
            </p>
          </div>

          {/* KPI 3: Failed sign-ins (7d) */}
          <div
            className={`rounded-md px-5.5 py-5 min-h-26 flex flex-col gap-1.5 border ${
              needsAttention
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-transparent"
            }`}
          >
            <p className="font-mont text-sm font-medium text-gray-01">Failed sign-ins (7d)</p>
            <p
              className={`font-semibold text-2xl ${needsAttention ? "text-amber-700" : "text-[#221122]"}`}
            >
              {failed7d ?? "—"}
            </p>
            <button
              className="text-xs text-blue-600 hover:underline text-left w-fit"
              onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.LOGIN_HISTORY)}
            >
              {needsAttention ? "View →" : "View history →"}
            </button>
          </div>

          {/* KPI 4: Password last changed */}
          <div className="bg-white rounded-md px-5.5 py-5 min-h-26 flex flex-col gap-1.5">
            <p className="font-mont text-sm font-medium text-gray-01">Password last changed</p>
            <p className="font-semibold text-xl text-[#221122] leading-tight">
              {passwordChangedAt ? formatRelativeDate(passwordChangedAt) : "Never"}
            </p>
            <button
              className="text-xs text-blue-600 hover:underline text-left w-fit"
              onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.PASSWORD)}
            >
              Change password →
            </button>
          </div>
        </div>

        {/* Navigation tiles */}
        <div className="grid gap-5 lg:grid-cols-3">
          <button
            onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.SESSIONS)}
            className="bg-white rounded-md p-5 text-left hover:shadow-sm transition"
          >
            <Monitor className="size-5 text-blue-600 mb-2" />
            <p className="font-semibold text-sm">Active sessions</p>
            <p className="text-xs text-gray-01 mt-1">Review and sign out of devices you no longer use.</p>
          </button>
          <button
            onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.PASSWORD)}
            className="bg-white rounded-md p-5 text-left hover:shadow-sm transition"
          >
            <Key className="size-5 text-blue-600 mb-2" />
            <p className="font-semibold text-sm">Password & sign-in</p>
            <p className="text-xs text-gray-01 mt-1">Change password and review password history.</p>
          </button>
          <button
            onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.ACTIVITY)}
            className="bg-white rounded-md p-5 text-left hover:shadow-sm transition"
          >
            <Clock className="size-5 text-blue-600 mb-2" />
            <p className="font-semibold text-sm">Account activity</p>
            <p className="text-xs text-gray-01 mt-1">Audit trail of actions you have performed.</p>
          </button>
        </div>

        {/* Gaps 3–7 — Recent activity card */}
        <div className="bg-white rounded-md p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-sm">Recent activity</p>
            <Button
              size="sm"
              variant="white"
              className="h-7 text-xs"
              onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.ACTIVITY)}
            >
              See all →
            </Button>
          </div>
          {/* Gap 7 — card subtitle */}
          <p className="text-xs text-gray-01 mb-3">Last 10 events on your account</p>

          {recentEvents.length === 0 ? (
            <p className="text-xs text-gray-01">No recent activity.</p>
          ) : (
            <ul className="divide-y">
              {recentEvents.map((e) => (
                <li key={e.id} className="py-2.5 flex items-start gap-3 text-xs">
                  {/* Gap 4 — severity dot */}
                  <SevDot level={e.severity} />
                  <div className="flex-1 min-w-0">
                    {/* Gap 3 — use summary over raw action_type */}
                    <p className="font-medium leading-snug">{e.summary ?? e.action_type}</p>
                    {/* Gap 5 — ip_address as secondary line */}
                    {e.ip_address && (
                      <p className="text-gray-01 mt-0.5">{e.ip_address}</p>
                    )}
                  </div>
                  <span className="text-gray-01 shrink-0">{formatRelativeDate(e.event_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
