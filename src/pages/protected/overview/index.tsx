import { Link } from "react-router";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
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

const R = routesPath.PROTECTED;

function formatDate(value?: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

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
      // `block` explicitly: a grid cell blockifies its child for free, but in
      // the phone rail this <a> is a plain inline box and its padding and
      // background break across lines without it.
      className="group block rounded-xl border border-white-02 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}>
          <Icon className="size-4" />
        </span>
        <ArrowRight className="size-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-3 text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-black-01">
        {/* A dash reads as a real answer ("none"), so the swap to a number lands
            as a content change. A block the size of the value reads as pending
            and the swap is invisible. */}
        {loading ? <Shimmer className="my-1 h-5 w-14" /> : value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{loading ? <Shimmer className="my-0.5 h-3 w-28" /> : note}</p>
    </Link>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    // h-full so the box's leftover height centres the message rather than
    // leaving it pinned to the top above a void.
    <div className="flex h-full min-h-20 w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 text-center">
      <CheckCircle2 className="mb-2 size-5 text-emerald-500" />
      <p className="text-sm font-medium text-gray-600">{children}</p>
    </div>
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
  const activeTasks = overview?.tasks?.items ?? [];
  const returnedCount = overview?.submissions.returned ?? 0;
  const approvalsCount = overview?.approvals.pending ?? 0;
  const unreadCount = overview?.notifications.unread ?? 0;
  const attentionCount =
    approvalsCount + (taskStats?.overdue ?? 0) + returnedCount + unreadCount;
  const attentionItems = [
    {
      label: "Overdue tasks",
      copy: `${taskStats?.overdue ?? 0} items need a follow-up`,
      count: taskStats?.overdue ?? 0,
      urgency: 0,
      to: R.TODO.INDEX,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Returned submissions",
      copy: `${returnedCount} sent back for changes`,
      count: returnedCount,
      urgency: 1,
      to: R.WORKFLOW.MY_SUBMISSIONS,
      icon: CircleDot,
      tone: "bg-red-50 text-red-500",
    },
    {
      label: "Approvals waiting",
      copy: `${approvalsCount} decisions ready for review`,
      count: approvalsCount,
      urgency: 2,
      to: R.WORKFLOW.APPROVALS,
      icon: FileClock,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Unread notifications",
      copy: `${unreadCount} updates you have not read`,
      count: unreadCount,
      urgency: 3,
      to: R.NOTIFICATIONS,
      icon: Bell,
      tone: "bg-blue-50 text-blue-600",
    },
  ]
    // Per-item loading copy is gone with the per-item queries: the section is
    // skeletoned as a whole until the single request lands.
    .filter((item) => item.count > 0)
    .sort((a, b) => a.urgency - b.urgency || b.count - a.count);

  // Every row is answerable from the response, so every row can actually be
  // ticked. Two of them used to be hardcoded `done: null` — the endpoint
  // returned nothing to check them against, so they sat grey forever and the
  // percentage was measured over a different set of items than the one on
  // screen. `setup` now carries both flags, gated on the same keys as the rows.
  const setupItems = [
    {
      label: "Complete your profile",
      description: "Keep your contact and personal details up to date.",
      to: R.ME_PROFILE.INDEX,
      done: Boolean(user?.phone),
      // `pending` marks a state that can only be known once a query answers.
      pending: false,
      visible: true,
    },
    {
      label: "Invite your team",
      description: "Bring the people you work with into the platform.",
      to: R.TEAM_MGT.CX,
      done: (overview?.team?.total ?? 0) > 1,
      pending: true,
      visible: canViewTeam,
    },
    {
      // Was "Review roles and access" — a review is not a thing the data can
      // ever report as done. Assigning a role is, and it is the step that
      // actually matters.
      label: "Assign roles to your team",
      description: "Give people the access their responsibilities need.",
      to: R.ROLES.INDEX,
      done: Boolean(overview?.setup?.roles_assigned),
      pending: true,
      // Kept in place while loading so the list doesn't shuffle under the
      // reader; dropped only if the answer comes back absent (no access).
      visible: hasPermission(P.VIEW_ROLES) && (!revealed || overview?.setup?.roles_assigned !== undefined),
    },
    {
      label: "Build your organogram",
      description: "Connect reporting lines so ownership stays clear.",
      to: R.ORGANOGRAM.INDEX,
      done: Boolean(overview?.setup?.organogram_built),
      pending: true,
      visible: hasPermission(P.VIEW_ORGANOGRAM) && (!revealed || overview?.setup?.organogram_built !== undefined),
    },
  ].filter((item) => item.visible);
  const setupDone = setupItems.filter((item) => item.done).length;
  const setupPercent = setupItems.length ? Math.round((setupDone / setupItems.length) * 100) : 100;
  // The checklist has an end. Once every row the reader can see is ticked it
  // stops being guidance and becomes furniture, so it leaves the screen — but
  // only after the data has landed, or it would flash away and back on load.
  const showSetup = !revealed || setupDone < setupItems.length;

  // Built once and rendered by both the phone rail and the desktop grid, so the
  // two presentations can never drift apart.
  const metricCards = [
    canViewSchools && (
      <MetricCard key="schools" icon={School} label="Active schools" value={overview?.schools?.active ?? 0} note="Currently active on the platform" to={R.SCHOOL_MGT.INDEX} loading={!revealed} />
    ),
    canViewTeam && (
      <MetricCard key="team" icon={Users} label="CX team members" value={overview?.team?.total ?? 0} note="People in your admin workspace" to={R.TEAM_MGT.CX} tone="blue" loading={!revealed} />
    ),
    <MetricCard key="tasks" icon={ClipboardCheck} label="Open tasks" value={taskStats?.in_progress ?? 0} note={`${taskStats?.overdue ?? 0} overdue`} to={R.TODO.INDEX} tone="amber" loading={!revealed} />,
    <MetricCard key="approvals" icon={Workflow} label="Pending approvals" value={approvalsCount} note={`${returnedCount} returned to you`} to={R.WORKFLOW.APPROVALS} tone="green" loading={!revealed} />,
    canViewTickets && (
      <MetricCard key="tickets" icon={LifeBuoy} label="Open support tickets" value={overview?.tickets?.open ?? 0} note={`${overview?.tickets?.assigned_to_me ?? 0} assigned to you`} to={R.SUPPORT.INDEX} tone="amber" loading={!revealed} />
    ),
    canViewHealth && (
      <MetricCard key="health" icon={Activity} label="System posture" value={overview?.health?.label ?? "Unknown"} note={`${overview?.health?.active_incidents ?? 0} active incidents`} to={R.HEALTH.INDEX} tone="green" loading={!revealed} />
    ),
  ].filter(Boolean) as React.ReactElement[];

  // Hero spotlight. These are the same signals the sections below carry, shown
  // large and one at a time — the hero is the glance, the sections are the
  // detail. Nothing is invented: a slide only exists when its section came back
  // in the response, so a caller without health or tickets simply gets fewer.
  const spotlightSlides = [
    {
      key: "attention",
      icon: Bell,
      label: attentionCount ? "items may need your attention" : "you are all clear",
      value: attentionCount,
      to: resolveAttentionDestination(attentionItems, R.TODO.INDEX),
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
      to: R.TODO.INDEX,
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
    { label: "School Management", copy: "Schools and branches", to: R.SCHOOL_MGT.INDEX, icon: School, show: canViewSchools },
    { label: "Users", copy: "CX and school accounts", to: R.TEAM_MGT.CX, icon: Users, show: canViewTeam },
    { label: "Organogram", copy: "Structure and reporting", to: R.ORGANOGRAM.INDEX, icon: Network, show: hasPermission(P.VIEW_ORGANOGRAM) },
    { label: "Tasks", copy: "Goals and accountability", to: R.TODO.INDEX, icon: ClipboardCheck, show: true },
    { label: "Workflow", copy: "Approvals and submissions", to: R.WORKFLOW.APPROVALS, icon: Workflow, show: true },
    { label: "Audit & Security", copy: "Events and safeguards", to: R.AUDIT.DASHBOARD, icon: ShieldCheck, show: hasPermission(P.VIEW_AUDIT) },
    { label: "System Health", copy: "Services and incidents", to: R.HEALTH.INDEX, icon: HeartPulse, show: canViewHealth },
    { label: "Support", copy: "Tickets and assistance", to: R.SUPPORT.INDEX, icon: LifeBuoy, show: true },
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

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Platform overview</h2>
              <p className="mt-0.5 text-xs text-gray-400">A live view of the administration areas you can access.</p>
            </div>
          </div>
          {/* One set of cards, two presentations. Stacked on a phone these six
              ran ~620px — most of the first screen spent scrolling past boxes
              to reach anything actionable — so below `sm` they become a
              swipeable rail and the grid takes over from `sm` up. */}
          <div className={cn("sm:hidden", revealed && "reveal-in")}>
            {/* No auto-advance here, unlike the hero spotlight: these are
                numbers someone is reading, and sliding one away mid-read costs
                more than the motion is worth. Swipe and dots only. */}
            <SnapRail ariaLabel="Platform overview metrics" slideClassName="px-0.5">
              {metricCards}
            </SnapRail>
          </div>
          <div className={cn("hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4", revealed && "reveal-in")}>
            {metricCards}
          </div>
        </section>

        {/* A real 2-col grid, not CSS multi-column. `columns-2` balances the two
            columns by measured height, so the split moved with the data (0 vs 4
            attention items) and the boxes jumped columns when the query landed.
            A grid fixes each box to a cell, so row tops always line up. */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <section className="flex flex-col rounded-xl border border-white-02 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Needs your attention</h2>
                <p className="mt-0.5 text-xs text-gray-400">The most useful next actions from across your workspace.</p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {revealed ? `${attentionCount} total` : "counting…"}
              </span>
            </div>
            {!revealed || attentionItems.length ? (
              <div className={cn("mt-3 grid flex-1 auto-rows-min gap-2 sm:grid-cols-2", revealed && "reveal-in")}>
                {!revealed ? (
                  // Two rows the size of a real one: the section keeps its height
                  // instead of growing under the reader as items land.
                  [0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                      <Shimmer className="size-8 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Shimmer className="h-3 w-24" />
                        <Shimmer className="h-2.5 w-32" />
                      </div>
                    </div>
                  ))
                ) : attentionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} to={item.to} className="group flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:border-primary/20 hover:bg-primary/[0.025]">
                      <span className={cn("grid size-8 place-items-center rounded-lg", item.tone)}><Icon className="size-4" /></span>
                      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 text-xs text-gray-400">{item.copy}</p></div>
                      <ChevronRight className="size-4 text-gray-300 group-hover:text-primary" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              // Outside the auto-rows grid so the empty state centres in the
              // leftover height instead of leaving a void beneath it.
              <div className={cn("mt-3 flex flex-1", revealed && "reveal-in")}>
                <EmptyLine>Nothing needs your attention right now.</EmptyLine>
              </div>
            )}
          </section>

          <section className="flex flex-col rounded-xl border border-white-02 bg-white p-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-base font-semibold">My tasks</h2><p className="mt-0.5 text-xs text-gray-400">Keep your closest commitments in view.</p></div>
              <Link to={R.TODO.INDEX} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowRight className="size-3.5" /></Link>
            </div>
            <div className={cn("mt-3 flex-1 space-y-2", revealed && "reveal-in")}>
              {revealed && activeTasks.length === 0 ? <EmptyLine>You are all caught up.</EmptyLine> : activeTasks.map((task) => (
                <Link key={task.id} to={R.TODO.INDEX} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3.5 hover:border-primary/20">
                  <span className={cn("size-2 rounded-full", task.status === "OVERDUE" ? "bg-red-500" : task.priority === "HIGH" ? "bg-amber-500" : "bg-primary")} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-0.5 text-xs text-gray-400">{task.department || "Personal task"}</p></div>
                  <span className={cn("rounded-lg px-2 py-1 text-xs", task.status === "OVERDUE" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500")}>{formatDate(task.deadline)}</span>
                </Link>
              ))}
              {!revealed && <div className="h-28 animate-pulse rounded-xl bg-gray-50" />}
            </div>
          </section>

          {/* Row 2 pairs the two fixed-length lists. Pairing a short, data-driven
              box with a long one is what left a tall empty half in each row. */}
          {showSetup && (
          <section className="flex flex-col rounded-xl border border-white-02 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Getting started</h2>
                <p className="mt-0.5 text-xs text-gray-400">Set up the essentials for your admin workspace.</p>
              </div>
              <span className="text-sm font-semibold text-primary">
                {revealed ? `${setupPercent}%` : <Shimmer className="my-0.5 h-3.5 w-9" />}
              </span>
            </div>
            {/* Width stays 0 until the counts are in, so the bar grows into place
                once instead of stepping as each answer lands. */}
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: revealed ? `${setupPercent}%` : "0%" }} /></div>
            <div className="mt-4 space-y-1">
              {setupItems.map((item) => {
                // A checkmark that depends on a query shows the neutral dot until
                // the reveal, rather than a wrong "not done" that then flips.
                const done = item.pending && !revealed ? null : item.done;
                return (
                <Link key={item.label} to={item.to} className="group flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-gray-50">
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", done === true ? "border-primary bg-primary text-white" : done === false ? "border-gray-200 text-transparent" : "border-primary/25 bg-primary/5 text-primary")}>
                    {done === null ? <CircleDot className="size-2.5" /> : <Check className="size-3" />}
                  </span>
                  <div className="min-w-0 flex-1"><p className={cn("text-sm font-medium", done && "text-gray-400 line-through")}>{item.label}</p><p className="mt-0.5 text-xs leading-5 text-gray-400">{item.description}</p></div>
                  <ChevronRight className="mt-1 size-4 text-gray-300 group-hover:text-primary" />
                </Link>
                );
              })}
            </div>
          </section>
          )}

          {/* With the checklist retired, this would sit alone in a half-width
              cell next to a hole — so it takes the whole row and widens its
              own grid instead. */}
          <section className={cn("flex flex-col rounded-xl border border-white-02 bg-white p-4", !showSetup && "xl:col-span-2")}>
            <div><h2 className="text-base font-semibold">Your workspace</h2><p className="mt-0.5 text-xs text-gray-400">Shortcuts matched to your access.</p></div>
            <div className={cn("mt-5 grid flex-1 auto-rows-min gap-2 sm:grid-cols-2", !showSetup && "xl:grid-cols-4")}>
              {modules.map(({ label, copy, to, icon: Icon }) => (
                <Link key={label} to={to} className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-primary/20 hover:bg-primary/[0.025]">
                  <span className="grid size-9 place-items-center rounded-lg bg-gray-50 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"><Icon className="size-4.5" /></span>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{label}</p><p className="truncate text-[11px] text-gray-400">{copy}</p></div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-4 pb-2 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" /> Platform administration overview</span>
        </footer>
      </main>
    </>
  );
}
