import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPackagePlansQuery,
  useGetSchoolStatsQuery,
} from "@/redux/services/dashboard/school-mgt-api";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import {
  ActivityBar,
  DowntimesPie,
  type ActivityPoint,
  type DowntimeSlice,
} from "@/components/charts/overview-charts";

// ── Static placeholder data (no backend overview endpoint yet) ───────────────
// Cards/charts wired to real APIs: Registered Companies, Active Users,
// Available Plans. Everything else below is placeholder until the aggregate
// overview endpoint is built.

const DOWNTIME_SLICES: DowntimeSlice[] = [
  { name: "unresponsive\nApi error", value: 25, date: "25/09/22", color: "#FF1B1B" },
  { name: "System error", value: 11, date: "25/09/22", color: "#B70E0E" },
];

const ACTIVITY_DATA: Record<ActivityPeriod, ActivityPoint[]> = {
  Monthly: [
    { label: "Jan", value: 4200 },
    { label: "Feb", value: 3300 },
    { label: "Mar", value: 2900 },
    { label: "Apr", value: 4700 },
    { label: "May", value: 2600 },
    { label: "Jun", value: 2900 },
    { label: "Jul", value: 4500 },
    { label: "Aug", value: 3100 },
    { label: "Sept", value: 2200 },
    { label: "Oct", value: 4500 },
    { label: "Nov", value: 3100 },
    { label: "Dec", value: 4900 },
  ],
  Weekly: [
    { label: "W1", value: 1200 },
    { label: "W2", value: 2100 },
    { label: "W3", value: 1700 },
    { label: "W4", value: 2600 },
    { label: "W5", value: 1900 },
    { label: "W6", value: 3100 },
  ],
  Daily: [
    { label: "Mon", value: 320 },
    { label: "Tue", value: 540 },
    { label: "Wed", value: 410 },
    { label: "Thu", value: 690 },
    { label: "Fri", value: 750 },
    { label: "Sat", value: 280 },
    { label: "Sun", value: 190 },
  ],
};

type ActivityPeriod = "Monthly" | "Weekly" | "Daily";
const ACTIVITY_PERIODS: ActivityPeriod[] = ["Monthly", "Weekly", "Daily"];

// ── Stat card (matches the dashboard's KPI tiles with trend chip) ────────────

type Trend = { dir: "up" | "down"; value: string; note: string };

function SampleChip() {
  return (
    <span
      className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
      title="Placeholder figure — the aggregate overview endpoint is not built yet."
    >
      Sample
    </span>
  );
}

function StatCard({
  label,
  value,
  trend,
  loading,
  sample,
}: {
  label: string;
  value: number | string;
  trend?: Trend;
  loading?: boolean;
  /** Marks hard-coded placeholder figures until the overview endpoint exists. */
  sample?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg px-6 py-5 space-y-3 border border-gray-100">
      <h5 className="text-sm font-medium text-gray-500 inline-flex items-center gap-2">
        {label}
        {sample && <SampleChip />}
      </h5>
      <p className="text-3xl font-bold text-[#1a1a2e]">
        {loading ? <span className="text-gray-300">—</span> : value}
      </p>
      {trend && (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
              trend.dir === "up"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500",
            )}
          >
            {trend.dir === "up" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )}
            {trend.value}
          </span>
          <span className="text-xs text-gray-400">{trend.note}</span>
        </div>
      )}
    </div>
  );
}

export default function Overview() {
  const [period, setPeriod] = useState<ActivityPeriod>("Monthly");

  const { data: schoolStats, isLoading: schoolsLoading } = useGetSchoolStatsQuery();
  const { data: teamMembers, isLoading: teamLoading } = useGetTeamMembersQuery({});
  const { data: packagePlans } = useGetPackagePlansQuery();

  const activeSchools = schoolStats?.data.active ?? 0;
  const activeSchoolUsers = teamMembers?.pagination.totalItems ?? 0;

  const activityData = ACTIVITY_DATA[period];
  const mostActive = useMemo(
    () =>
      activityData.reduce(
        (peak, p) => (p.value > peak.value ? p : peak),
        activityData[0],
      ),
    [activityData],
  );

  // Real plan names where available; fall back to the design's tiers.
  const plans = useMemo(() => {
    const real = packagePlans?.data ?? [];
    const fallback = [
      "Free Plan",
      "Small scale plan",
      "Medium scale plan",
      "Large scale plan",
    ];
    return Array.from({ length: 4 }).map((_, i) => real[i]?.name ?? fallback[i]);
  }, [packagePlans]);

  return (
    <DashboardLayout>
      <main className="px-4.5 py-6 space-y-6 min-w-0">
        {/* Top KPI row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Active Schools"
            value={activeSchools}
            loading={schoolsLoading}
          />
          {/* getTeamMembers lists console (CX) team members — not school
              users. Label matches what the number actually counts. */}
          <StatCard
            label="CX Team Members"
            value={activeSchoolUsers}
            loading={teamLoading}
          />
          <StatCard label="Total Demo Requests" value={14} sample />
          <StatCard
            label="Website Visits"
            value={14}
            sample
            trend={{ dir: "up", value: "5%", note: "Last Month" }}
          />
        </div>

        {/* Downtimes + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Downtimes */}
          <div className="lg:col-span-1 bg-white rounded-lg px-6 py-5 flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#1a1a2e] inline-flex items-center gap-2">
                Downtimes
                <SampleChip />
              </h4>
              <Link
                to={routesPath.PROTECTED.AUDIT.DASHBOARD}
                className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600"
              >
                See more <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-2">
              <DowntimesPie data={DOWNTIME_SLICES} />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <p className="text-xl font-bold text-red-500">9:58Am</p>
              <span className="size-2.5 rounded-xs bg-red-500" />
              <div className="text-xs leading-tight">
                <p className="font-medium text-gray-700">last recorded error</p>
                <p className="text-gray-400">25/09/22</p>
              </div>
            </div>
          </div>

          {/* Average Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg px-6 py-5">
            <p className="text-center text-sm font-medium text-gray-400 inline-flex w-full items-center justify-center gap-2">
              Average Activity Chart
              <SampleChip />
            </p>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Most Active Period</span>
                <span className="rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                  {mostActive.label} - {mostActive.value} Users
                </span>
              </div>

              <div className="flex items-center gap-4">
                {ACTIVITY_PERIODS.map((p) => {
                  const active = p === period;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-500"
                    >
                      <span
                        className={cn(
                          "grid size-3.5 place-content-center rounded-full border",
                          active ? "border-cyan-500" : "border-gray-300",
                        )}
                      >
                        {active && (
                          <span className="size-1.5 rounded-full bg-cyan-500" />
                        )}
                      </span>
                      {p} Activity
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <ActivityBar data={activityData} />
            </div>
          </div>
        </div>

        {/* Total Mission Plans + Available Plans */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StatCard label="Total Mission Plans" value={14} sample />
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg px-6 py-5">
            <h4 className="text-lg font-semibold text-[#1a1a2e] inline-flex items-center gap-2">
              Available Plans
              <SampleChip />
            </h4>
            <div className="mt-5 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
              {plans.map((name) => (
                <div key={name} className="space-y-2">
                  <p className="text-sm font-medium text-amber-600">{name}</p>
                  <p className="text-3xl font-bold text-[#1a1a2e]">14</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
