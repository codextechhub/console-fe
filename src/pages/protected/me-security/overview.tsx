import { useNavigate } from "react-router";
import { Clock, Key, Monitor, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import KpiCard from "@/components/custom/kpi-card";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routesPath";
import { useAppSelector } from "@/redux/store";
import { useGetLoginSessionsQuery } from "@/redux/services/dashboard/securityApi";
import { useGetMyActivityQuery } from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate } from "@/utils/helpers";

export default function MeSecurityOverview() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { data: sessions } = useGetLoginSessionsQuery({ is_active: "true", page_size: 1 });
  const { data: activity } = useGetMyActivityQuery({ page: 1 });

  const activeSessions = sessions?.pagination?.totalItems ?? 0;
  const recentEvents = activity?.data ?? [];

  return (
    <DashboardLayout title="My Security">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-7 text-blue-600" />
          <div>
            <p className="font-semibold font-mont text-gray-01">My Security</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Manage your sign-in devices, password, and activity.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <KpiCard
            label="Active sessions"
            value={activeSessions}
            foot="Devices signed in to your account"
            tone="live"
          />
          <KpiCard
            label="Recent activity"
            value={activity?.pagination?.totalItems ?? 0}
            foot="Events you triggered"
          />
          <KpiCard
            label="Account"
            value={user?.email ? "Active" : "—"}
            foot={user?.email ?? ""}
          />
        </div>

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

        <div className="bg-white rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">Recent activity</p>
            <Button
              size="sm"
              variant="white"
              className="h-7 text-xs"
              onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.ACTIVITY)}
            >
              View all
            </Button>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-gray-01">No recent activity.</p>
          ) : (
            <ul className="divide-y">
              {recentEvents.slice(0, 5).map((e) => (
                <li key={e.id} className="py-2 flex items-center gap-3 text-xs">
                  <span className="font-mono font-medium">{e.action_type}</span>
                  <span className="text-gray-01">·</span>
                  <span className="text-gray-01 uppercase">{e.module_key}</span>
                  <span className="text-gray-01 ml-auto">{formatRelativeDate(e.event_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
