import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  LifeBuoy,
  Network,
  School,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAppSelector } from "@/redux/store";
import { routesPath } from "@/routes/routes-path";
import { useGetConsoleOverviewQuery } from "@/redux/services/dashboard/overview-api";
import { QuickActionsRow } from "./quick-actions";
import { ActionCenter } from "./action-center";
import { RecentOpensRow } from "./recent-opens-row";

const R = routesPath.PROTECTED;

function greetingCopy() {
  const hour = new Date().getHours();
  if (hour < 12) return "Start with what needs your attention, then make space for the important work.";
  if (hour < 17) return "A quick check-in now keeps the rest of the day moving smoothly.";
  return "Wrap up the essentials and leave tomorrow with a clear starting point.";
}

function greetingPeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function Shimmer({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded bg-gray-100", className)} />;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  to,
  tone = "primary",
  loading,
}: {
  icon: typeof School;
  label: string;
  value: number | string;
  note: string;
  to: string;
  tone?: "primary" | "blue" | "amber" | "green";
  loading?: boolean;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Link
      to={to}
      title={note}
      className="group min-w-0 rounded-xl border border-slate-200/75 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_8px_20px_rgba(15,23,42,0.055)]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg transition duration-200 group-hover:scale-105", tones[tone])}>
          <Icon className="size-3.5" />
        </span>
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium leading-4 text-slate-500">{label}</p>
      </div>
      <p className="mt-1.5 min-w-0 truncate text-lg font-semibold leading-none tracking-[-0.025em] text-black-01 tabular-nums">
        {loading ? <Shimmer className="my-0.5 h-4 w-10" /> : value}
      </p>
    </Link>
  );
}

export default function Overview() {
  const reduceMotion = useReducedMotion();
  const user = useAppSelector((state) => state.auth.user);
  const { hasPermission } = usePermissions();
  const canViewSchools = hasPermission(P.BROWSE_SCHOOLS);
  const canViewTeam = hasPermission(P.ACCESS_TEAM_PANEL);
  const canViewHealth = hasPermission(P.VIEW_HEALTH);
  const canViewTickets = hasPermission(P.VIEW_TICKETS);

  // One request for the whole screen. It used to be eight, which arrived in
  // whatever order the network settled and made the page appear in waves; the
  // numbers are one visual unit, so they now load and reveal as one.
  const { data: overviewRes, isLoading } = useGetConsoleOverviewQuery();
  const overview = overviewRes?.data;
  const revealed = !isLoading;

  const taskStats = overview?.tasks?.stats;
  const returnedCount = overview?.submissions.returned ?? 0;
  const approvalsCount = overview?.approvals.pending ?? 0;

  const metricCards = [
    canViewSchools && (
      <MetricCard key="schools" icon={School} label="Active schools" value={overview?.schools?.active ?? 0} note="Currently active on the platform" to={R.SCHOOL_MGT.INDEX} loading={!revealed} />
    ),
    canViewTeam && (
      <MetricCard key="team" icon={Users} label="CX team members" value={overview?.team?.total ?? 0} note="Active CX staff" to={R.TEAM_MGT.CX} tone="blue" loading={!revealed} />
    ),
    <MetricCard key="tasks" icon={ClipboardCheck} label="Open tasks" value={taskStats?.in_progress ?? 0} note={`${taskStats?.overdue ?? 0} overdue`} to={`${R.TODO.INDEX}?tab=mine`} tone="amber" loading={!revealed} />,
    <MetricCard key="approvals" icon={Workflow} label="Pending approvals" value={approvalsCount} note={`${returnedCount} returned to you`} to={R.WORKFLOW.APPROVALS} tone="green" loading={!revealed} />,
    canViewTickets && (
      <MetricCard key="tickets" icon={LifeBuoy} label="Support tickets" value={overview?.tickets?.open ?? 0} note={`${overview?.tickets?.assigned_to_me ?? 0} assigned to you`} to={`${R.SUPPORT.INDEX}?status=OPEN`} tone="amber" loading={!revealed} />
    ),
    canViewHealth && (
      <MetricCard key="health" icon={Activity} label="System posture" value={overview?.health ? ({ operational: "Normal", warning: "Warning", critical: "Critical" }[overview.health.overall] ?? overview.health.overall) : "Unknown"} note={`${overview?.health?.label ?? "Unknown"} - ${overview?.health?.active_incidents ?? 0} active incidents`} to={R.HEALTH.INDEX} tone="green" loading={!revealed} />
    ),
  ].filter(Boolean) as React.ReactElement[];

  const modules = [
    { label: "School Management", to: R.SCHOOL_MGT.INDEX, icon: School, show: canViewSchools },
    { label: "Users", to: R.TEAM_MGT.CX, icon: Users, show: canViewTeam },
    { label: "Organogram", to: R.ORGANOGRAM.INDEX, icon: Network, show: hasPermission(P.VIEW_ORGANOGRAM) },
    { label: "Tasks", to: R.TODO.INDEX, icon: ClipboardCheck, show: true },
    { label: "Workflow", to: R.WORKFLOW.APPROVALS, icon: Workflow, show: true },
    { label: "Audit & Security", to: R.AUDIT.DASHBOARD, icon: ShieldCheck, show: hasPermission(P.VIEW_AUDIT) },
    { label: "System Health", to: R.HEALTH.INDEX, icon: HeartPulse, show: canViewHealth },
    { label: "Support", to: R.SUPPORT.INDEX, icon: LifeBuoy, show: true },
  ].filter((item) => item.show);

  const enter = (delay: number) => reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] as const },
      };

  const today = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <>
      <main className="min-w-0 space-y-6 bg-[radial-gradient(circle_at_50%_0%,rgba(24,119,76,0.035),transparent_34%),#f8f9fb] px-4.5 py-5 text-black-01 lg:px-7 lg:py-6">
        <motion.section
          {...enter(0)}
          className="relative overflow-hidden rounded-2xl bg-[#17281f] px-4.5 py-4 text-white shadow-[0_14px_34px_rgba(20,41,31,0.12)] sm:px-5 lg:px-6"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 12% 0%, rgba(126,221,171,.17), transparent 34%), radial-gradient(circle at 88% 100%, rgba(48,178,121,.2), transparent 38%), linear-gradient(118deg, #14291f 0%, #17382a 54%, #10251d 100%)",
            backgroundSize: "28px 28px, 28px 28px, auto, auto, auto",
          }}
        >
          <div className="overview-ambient pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="overview-ambient-delayed pointer-events-none absolute -bottom-28 left-[38%] size-64 rounded-full bg-amber-200/[0.07] blur-3xl" />
          <div className="relative min-w-0">
            <div className="min-w-0 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/55">
                  <CalendarDays className="size-3.5" />
                  {today}
                </span>
              </div>
              <h1 className="mt-2 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                Good {greetingPeriod()}{user?.first_name ? `, ${user.first_name}` : ""}.
              </h1>
              <p className="mt-1 max-w-xl truncate text-xs leading-5 text-white/55" title={greetingCopy()}>{greetingCopy()}</p>
            </div>
          </div>
        </motion.section>

        <motion.div {...enter(0.08)}>
          {revealed ? (
            <ActionCenter overview={overview} />
          ) : (
            <section className="rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-5">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="mt-2 h-3 w-56" />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100/80 motion-reduce:animate-none" />
                ))}
              </div>
            </section>
          )}
        </motion.div>

        <motion.div {...enter(0.14)}>
          <QuickActionsRow />
        </motion.div>

        <motion.div {...enter(0.18)}>
          <RecentOpensRow />
        </motion.div>

        <motion.section {...enter(0.22)}>
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">At a glance</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Platform overview</h2>
          </div>
          <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6", revealed && "reveal-in")}>
            {metricCards}
          </div>
        </motion.section>

        <motion.section {...enter(0.26)} aria-label="Your workspace">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">Explore</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Your workspace</h2>
            <p className="mt-1 text-xs text-gray-400">Modules and tools matched to your access.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {modules.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/75 bg-white p-3.5 text-sm font-medium text-black-01 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_10px_24px_rgba(15,23,42,0.055)]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 transition duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-left text-xs leading-4 sm:text-sm">{label}</span>
                <ArrowUpRight className="size-4 shrink-0 text-slate-300 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </motion.section>

        <footer className="flex items-center justify-between gap-4 pb-2 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" /> Platform administration overview</span>
        </footer>
      </main>
    </>
  );
}
