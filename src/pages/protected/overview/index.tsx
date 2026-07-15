import { useMemo } from "react";
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
import DashboardLayout from "@/components/layout/dashboard-layout";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAppSelector } from "@/redux/store";
import { routesPath } from "@/routes/routes-path";
import { useGetSchoolStatsQuery } from "@/redux/services/dashboard/school-mgt-api";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import { useGetTodoMineQuery } from "@/redux/services/dashboard/todo-api";
import {
  useGetMySubmissionsQuery,
  useGetPendingApprovalsQuery,
} from "@/redux/services/dashboard/workflow-api";
import { useGetUnreadCountQuery } from "@/redux/services/notifications-api";
import { useGetTicketDashboardQuery } from "@/redux/services/tickets-api";
import { useGetHealthOverviewQuery } from "@/redux/services/health-api";

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
      className="group rounded-xl border border-white-02 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}>
          <Icon className="size-4" />
        </span>
        <ArrowRight className="size-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-3 text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-black-01">
        {loading ? <span className="text-gray-300">—</span> : value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </Link>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 text-center">
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

  const { data: schoolStats, isLoading: schoolsLoading } = useGetSchoolStatsQuery(undefined, {
    skip: !canViewSchools,
  });
  const { data: teamMembers, isLoading: teamLoading } = useGetTeamMembersQuery(
    { page_size: 1, user_type: "CX_STAFF", status: "ACTIVE" },
    { skip: !canViewTeam },
  );
  const { data: todo, isLoading: todoLoading } = useGetTodoMineQuery();
  const { data: approvals, isLoading: approvalsLoading } = useGetPendingApprovalsQuery();
  const { data: submissions, isLoading: submissionsLoading } = useGetMySubmissionsQuery({});
  const { data: unread, isLoading: unreadLoading } = useGetUnreadCountQuery();
  const { data: tickets, isLoading: ticketsLoading } = useGetTicketDashboardQuery(undefined, {
    skip: !canViewTickets,
  });
  const { data: health, isLoading: healthLoading } = useGetHealthOverviewQuery(
    { range: "24h" },
    { skip: !canViewHealth },
  );

  const taskStats = todo?.data.stats;
  const activeTasks = useMemo(
    () => (todo?.data.tasks ?? [])
      .filter((task) => !task.is_done)
      .sort((a, b) => {
        const statusRank = (task: typeof a) => task.status === "OVERDUE" ? 0 : task.priority === "HIGH" ? 1 : task.priority === "MEDIUM" ? 2 : 3;
        const rank = statusRank(a) - statusRank(b);
        return rank || new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 3),
    [todo?.data.tasks],
  );
  const returned = (submissions ?? []).filter((item) => item.status === "RETURNED");
  const attentionCount =
    (approvals?.count ?? 0) +
    (taskStats?.overdue ?? 0) +
    returned.length +
    (unread?.data.unread_count ?? 0);
  const attentionItems = [
    {
      label: "Overdue tasks",
      copy: `${taskStats?.overdue ?? 0} items need a follow-up`,
      loadingCopy: "Checking your tasks…",
      count: taskStats?.overdue ?? 0,
      urgency: 0,
      to: R.TODO.INDEX,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-600",
      loading: todoLoading,
    },
    {
      label: "Returned submissions",
      copy: `${returned.length} sent back for changes`,
      loadingCopy: "Checking submissions…",
      count: returned.length,
      urgency: 1,
      to: R.WORKFLOW.MY_SUBMISSIONS,
      icon: CircleDot,
      tone: "bg-red-50 text-red-500",
      loading: submissionsLoading,
    },
    {
      label: "Approvals waiting",
      copy: `${approvals?.count ?? 0} decisions ready for review`,
      loadingCopy: "Checking your queue…",
      count: approvals?.count ?? 0,
      urgency: 2,
      to: R.WORKFLOW.APPROVALS,
      icon: FileClock,
      tone: "bg-emerald-50 text-emerald-600",
      loading: approvalsLoading,
    },
    {
      label: "Unread notifications",
      copy: `${unread?.data.unread_count ?? 0} updates you have not read`,
      loadingCopy: "Checking notifications…",
      count: unread?.data.unread_count ?? 0,
      urgency: 3,
      to: R.NOTIFICATIONS,
      icon: Bell,
      tone: "bg-blue-50 text-blue-600",
      loading: unreadLoading,
    },
  ]
    .filter((item) => item.loading || item.count > 0)
    .sort((a, b) => a.urgency - b.urgency || b.count - a.count);

  const setupItems = [
    {
      label: "Complete your profile",
      description: "Keep your contact and personal details up to date.",
      to: R.ME_PROFILE.INDEX,
      done: Boolean(user?.phone),
      visible: true,
    },
    {
      label: "Invite your team",
      description: "Bring the people you work with into the platform.",
      to: R.TEAM_MGT.CX,
      done: (teamMembers?.pagination.totalItems ?? 0) > 1,
      visible: canViewTeam,
    },
    {
      label: "Review roles and access",
      description: "Make sure responsibilities have the right permissions.",
      to: R.ROLES.INDEX,
      done: null,
      visible: hasPermission(P.VIEW_ROLES),
    },
    {
      label: "Build your organogram",
      description: "Connect reporting lines so ownership stays clear.",
      to: R.ORGANOGRAM.INDEX,
      done: null,
      visible: hasPermission(P.VIEW_ORGANOGRAM),
    },
  ].filter((item) => item.visible);
  const trackedSetupItems = setupItems.filter((item) => item.done !== null);
  const setupDone = trackedSetupItems.filter((item) => item.done).length;
  const setupPercent = trackedSetupItems.length ? Math.round((setupDone / trackedSetupItems.length) * 100) : 100;

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
    <DashboardLayout>
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
            <div className="flex min-w-56 items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur-sm">
              <div className="grid size-9 place-items-center rounded-lg bg-white/10">
                <Bell className="size-4 text-amber-300" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{attentionCount}</p>
                <p className="text-xs text-white/60">items may need your attention</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Platform overview</h2>
              <p className="mt-0.5 text-xs text-gray-400">A live view of the administration areas you can access.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {canViewSchools && (
              <MetricCard icon={School} label="Active schools" value={schoolStats?.data.active ?? 0} note="Currently active on the platform" to={R.SCHOOL_MGT.INDEX} loading={schoolsLoading} />
            )}
            {canViewTeam && (
              <MetricCard icon={Users} label="CX team members" value={teamMembers?.pagination.totalItems ?? 0} note="People in your admin workspace" to={R.TEAM_MGT.CX} tone="blue" loading={teamLoading} />
            )}
            <MetricCard icon={ClipboardCheck} label="Open tasks" value={taskStats?.in_progress ?? 0} note={`${taskStats?.overdue ?? 0} overdue`} to={R.TODO.INDEX} tone="amber" loading={todoLoading} />
            <MetricCard icon={Workflow} label="Pending approvals" value={approvals?.count ?? 0} note={`${returned.length} returned to you`} to={R.WORKFLOW.APPROVALS} tone="green" loading={approvalsLoading || submissionsLoading} />
            {canViewTickets && (
              <MetricCard icon={LifeBuoy} label="Open support tickets" value={tickets?.data.by_status.OPEN ?? 0} note={`${tickets?.data.assigned_to_me ?? 0} assigned to you`} to={R.SUPPORT.INDEX} tone="amber" loading={ticketsLoading} />
            )}
            {canViewHealth && (
              <MetricCard icon={Activity} label="System posture" value={health?.data.posture.label ?? "Unknown"} note={`${health?.data.posture.active_incidents ?? 0} active incidents`} to={R.HEALTH.INDEX} tone="green" loading={healthLoading} />
            )}
          </div>
        </section>

        <div className="space-y-4 xl:columns-2 xl:gap-4 xl:space-y-0">
          <section className="mb-4 break-inside-avoid rounded-xl border border-white-02 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Needs your attention</h2>
                <p className="mt-0.5 text-xs text-gray-400">The most useful next actions from across your workspace.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{attentionCount} total</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {attentionItems.length ? attentionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} to={item.to} className="group flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:border-primary/20 hover:bg-primary/[0.025]">
                    <span className={cn("grid size-8 place-items-center rounded-lg", item.tone)}><Icon className="size-4" /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 text-xs text-gray-400">{item.loading ? item.loadingCopy : item.copy}</p></div>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-primary" />
                  </Link>
                );
              }) : <div className="sm:col-span-2"><EmptyLine>Nothing needs your attention right now.</EmptyLine></div>}
            </div>
          </section>

          <section className="mb-4 break-inside-avoid rounded-xl border border-white-02 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Getting started</h2>
                <p className="mt-0.5 text-xs text-gray-400">Set up the essentials for your admin workspace.</p>
              </div>
              <span className="text-sm font-semibold text-primary">{setupPercent}%</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${setupPercent}%` }} /></div>
            <div className="mt-4 space-y-1">
              {setupItems.map((item) => (
                <Link key={item.label} to={item.to} className="group flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-gray-50">
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", item.done === true ? "border-primary bg-primary text-white" : item.done === false ? "border-gray-200 text-transparent" : "border-primary/25 bg-primary/5 text-primary")}>
                    {item.done === null ? <CircleDot className="size-2.5" /> : <Check className="size-3" />}
                  </span>
                  <div className="min-w-0 flex-1"><p className={cn("text-sm font-medium", item.done && "text-gray-400 line-through")}>{item.label}</p><p className="mt-0.5 text-xs leading-5 text-gray-400">{item.description}</p></div>
                  <ChevronRight className="mt-1 size-4 text-gray-300 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
          <section className="mb-4 break-inside-avoid rounded-xl border border-white-02 bg-white p-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-base font-semibold">My tasks</h2><p className="mt-0.5 text-xs text-gray-400">Keep your closest commitments in view.</p></div>
              <Link to={R.TODO.INDEX} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowRight className="size-3.5" /></Link>
            </div>
            <div className="mt-3 space-y-2">
              {!todoLoading && activeTasks.length === 0 ? <EmptyLine>You are all caught up.</EmptyLine> : activeTasks.map((task) => (
                <Link key={task.id} to={R.TODO.INDEX} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3.5 hover:border-primary/20">
                  <span className={cn("size-2 rounded-full", task.status === "OVERDUE" ? "bg-red-500" : task.priority === "HIGH" ? "bg-amber-500" : "bg-primary")} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-0.5 text-xs text-gray-400">{task.department || "Personal task"}</p></div>
                  <span className={cn("rounded-lg px-2 py-1 text-xs", task.status === "OVERDUE" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500")}>{formatDate(task.deadline)}</span>
                </Link>
              ))}
              {todoLoading && <div className="h-28 animate-pulse rounded-xl bg-gray-50" />}
            </div>
          </section>

          <section className="mb-4 break-inside-avoid rounded-xl border border-white-02 bg-white p-4">
            <div><h2 className="text-base font-semibold">Your workspace</h2><p className="mt-0.5 text-xs text-gray-400">Shortcuts matched to your access.</p></div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
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
    </DashboardLayout>
  );
}
