import { Link } from "react-router";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  ClipboardCheck,
  FileClock,
  HeartPulse,
  LifeBuoy,
  Network,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAppSelector } from "@/redux/store";
import { routesPath } from "@/routes/routes-path";
import { useGetConsoleOverviewQuery } from "@/redux/services/dashboard/overview-api";
import { SnapRail } from "@/components/custom/snap-rail";
import { resolveAttentionDestination } from "./overview-navigation";
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

  // Compact by design: the top of the page carries the actionable work, so
  // these are reference numbers now - one glance, one line each. The note
  // survives as a tooltip rather than a third line.
  return (
    <Link
      to={to}
      title={note}
      className="group flex items-center gap-3 rounded-xl border border-white-02 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tones[tone])}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight tracking-tight text-black-01">
          {loading ? <Shimmer className="my-1 h-4 w-10" /> : value}
        </p>
        <p className="line-clamp-2 text-[11px] leading-tight text-gray-400">{label}</p>
      </div>
    </Link>
  );
}

export default function Overview() {
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

  // Sections the caller may not see are absent from the response rather than
  // zeroed. The cards are gated on the same permission keys the backend checks,
  // so an absent section never renders as a real 0.
  const taskStats = overview?.tasks?.stats;
  const returnedCount = overview?.submissions.returned ?? 0;
  const approvalsCount = overview?.approvals.pending ?? 0;
  const unreadCount = overview?.notifications.unread ?? 0;
  const attentionCount =
    approvalsCount + (taskStats?.overdue ?? 0) + returnedCount + unreadCount;
  // Hero-destination list only: the section itself is the ActionCenter now,
  // which derives its own cards from the same payload.
  const attentionItems = [
    { count: taskStats?.overdue ?? 0, to: `${R.TODO.INDEX}?tab=mine` },
    { count: returnedCount, to: `${R.WORKFLOW.MY_SUBMISSIONS}?status=RETURNED` },
    { count: approvalsCount, to: R.WORKFLOW.APPROVALS },
    { count: unreadCount, to: `${R.NOTIFICATIONS}?filter=unread` },
  ];

  // Built once and rendered by both the phone rail and the desktop grid, so the
  // two presentations can never drift apart.
  const metricCards = [
    canViewSchools && (
      <MetricCard key="schools" icon={School} label="Active schools" value={overview?.schools?.active ?? 0} note="Currently active on the platform" to={R.SCHOOL_MGT.INDEX} loading={!revealed} />
    ),
    canViewTeam && (
      <MetricCard key="team" icon={Users} label="CX team members" value={overview?.team?.total ?? 0} note="People in your admin workspace" to={R.TEAM_MGT.CX} tone="blue" loading={!revealed} />
    ),
    <MetricCard key="tasks" icon={ClipboardCheck} label="Open tasks" value={taskStats?.in_progress ?? 0} note={`${taskStats?.overdue ?? 0} overdue`} to={`${R.TODO.INDEX}?tab=mine`} tone="amber" loading={!revealed} />,
    <MetricCard key="approvals" icon={Workflow} label="Pending approvals" value={approvalsCount} note={`${returnedCount} returned to you`} to={R.WORKFLOW.APPROVALS} tone="green" loading={!revealed} />,
    canViewTickets && (
      <MetricCard key="tickets" icon={LifeBuoy} label="Support tickets" value={overview?.tickets?.open ?? 0} note={`${overview?.tickets?.assigned_to_me ?? 0} assigned to you`} to={`${R.SUPPORT.INDEX}?status=OPEN`} tone="amber" loading={!revealed} />
    ),
    canViewHealth && (
      // The one-word posture fits the compact tile; the full sentence label
      // ("All systems operational") moves to the tooltip with the incident count.
      <MetricCard key="health" icon={Activity} label="System posture" value={overview?.health ? ({ operational: "Normal", warning: "Warning", critical: "Critical" }[overview.health.overall] ?? overview.health.overall) : "Unknown"} note={`${overview?.health?.label ?? "Unknown"} - ${overview?.health?.active_incidents ?? 0} active incidents`} to={R.HEALTH.INDEX} tone="green" loading={!revealed} />
    ),
  ].filter(Boolean) as React.ReactElement[];

  // Hero spotlight. These are the same signals the sections below carry, shown
  // large and one at a time - the hero is the glance, the sections are the
  // detail. Nothing is invented: a slide only exists when its section came back
  // in the response, so a caller without health or tickets simply gets fewer.
  const spotlightSlides = [
    {
      key: "attention",
      icon: Bell,
      label: attentionCount ? "items may need your attention" : "you are all clear",
      value: attentionCount,
      to: resolveAttentionDestination(attentionItems, `${R.TODO.INDEX}?tab=mine`),
      show: true,
    },
    {
      key: "approvals",
      icon: FileClock,
      label: returnedCount ? `awaiting you, ${returnedCount} returned` : "awaiting your decision",
      value: approvalsCount,
      to: R.WORKFLOW.APPROVALS,
      show: true,
    },
    {
      key: "task",
      icon: ClipboardCheck,
      label: taskStats?.overdue ? "tasks now overdue" : "tasks in progress",
      value: taskStats?.overdue || taskStats?.in_progress || 0,
      to: `${R.TODO.INDEX}?tab=mine`,
      show: Boolean(overview?.tasks),
    },
    {
      key: "health",
      icon: HeartPulse,
      label: `${overview?.health?.active_incidents ?? 0} active incidents`,
      value: overview?.health?.label ?? "Unknown",
      to: R.HEALTH.INDEX,
      show: canViewHealth && Boolean(overview?.health),
    },
  ].filter((slide) => slide.show);

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

  return (
    <>
      <main className="min-w-0 space-y-5 bg-[#f8f9fb] px-4.5 py-5 text-black-01 lg:px-7 lg:py-5">
        <section
          className="relative overflow-hidden rounded-2xl bg-[#17281f] px-6 py-5 text-white shadow-sm lg:px-7 lg:py-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 12% 0%, rgba(126,221,171,.17), transparent 34%), radial-gradient(circle at 88% 100%, rgba(48,178,121,.2), transparent 38%), linear-gradient(118deg, #14291f 0%, #17382a 54%, #10251d 100%)",
            backgroundSize: "28px 28px, 28px 28px, auto, auto, auto",
          }}
        >
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-sm">
                <Sparkles className="size-3 text-amber-300" />
                Your admin workspace
              </span>
              <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                Good {greetingPeriod()}{user?.first_name ? `, ${user.first_name}` : ""}.
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/60">{greetingCopy()}</p>
            </div>
            {/* The single static count this replaced only ever answered one
                question; the rail cycles the handful that actually matter at a
                glance, and each slide is a way in to the screen behind it. */}
            {!revealed ? (
              <div className="flex min-w-56 items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur-sm lg:w-72">
                <Shimmer className="size-9 shrink-0 rounded-lg bg-white/20" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Shimmer className="h-4 w-10 bg-white/25" />
                  <Shimmer className="h-2.5 w-28 bg-white/15" />
                </div>
              </div>
            ) : (
              <SnapRail
                ariaLabel="Workspace spotlight"
                autoAdvanceMs={6000}
                className="w-full lg:w-72"
                dotClassName="bg-white/30 hover:bg-white/50"
                activeDotClassName="bg-amber-300"
              >
                {spotlightSlides.map(({ key, icon: Icon, label, value, to }) => (
                  <Link
                    key={key}
                    to={to}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/15"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10">
                      <Icon className="size-4 text-amber-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-semibold leading-none">{value}</p>
                      <p className="mt-1 truncate text-xs text-white/60">{label}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-white/40" />
                  </Link>
                ))}
              </SnapRail>
            )}
          </div>
        </section>

        <QuickActionsRow />

        {revealed ? (
          <ActionCenter overview={overview} />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100/80" />
            ))}
          </div>
        )}

        <RecentOpensRow />

        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold">Platform overview</h2>
            <p className="mt-0.5 text-xs text-gray-400">A live view of the administration areas you can access.</p>
          </div>
          {/* Compact tiles in a dense grid: on a phone two abreast, six across
              on a wide screen - reference numbers, not the day's work. */}
          <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6", revealed && "reveal-in")}>
            {metricCards}
          </div>
        </section>

        <section aria-label="Your workspace">
          <div className="mb-3">
            <h2 className="text-base font-semibold">Your workspace</h2>
            <p className="mt-0.5 text-xs text-gray-400">Shortcuts matched to your access.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {modules.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-white-02 bg-white px-3 py-2 text-xs font-medium text-black-01 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:border-primary/25 hover:text-primary"
              >
                <Icon className="size-3.5 text-gray-400 transition group-hover:text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-between gap-4 pb-2 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" /> Platform administration overview</span>
        </footer>
      </main>
    </>
  );
}
