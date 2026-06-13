// The "My Team" dashboard for one focused node and the personal "My Tasks" view.
// Both render straight off the API payloads (NodeDashboard / MineDashboard) — the
// roll-up stats, reports and breadcrumb are all computed server-side. Structured
// like the console's other pages: KPI grid, font-mont section headings, flat
// white rounded-md cards.

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Users } from "lucide-react";
import type {
  MineDashboard,
  NodeDashboard,
  Person,
  ReportCard as ReportCardData,
  Task,
  TaskStats,
} from "@/redux/services/dashboard/todoTypes";
import { Input } from "@/components/ui/input";
import KpiCard from "@/components/custom/kpi-card";
import { cn } from "@/lib/utils";
import { Avatar, HealthPill, ProgressRing } from "./primitives";
import { PersonTaskList } from "./person-task-list";

// ── Breadcrumb (root viewer → focused person) ─────────────────────────────────
export function Breadcrumb({ chain, onJump }: { chain: Person[]; onJump: (index: number) => void }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 font-mont text-sm">
      {chain.map((p, i) => {
        const last = i === chain.length - 1;
        return (
          <span key={p.id} className="inline-flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-4 text-gray-02" />}
            <button
              onClick={() => !last && onJump(i)}
              disabled={last}
              className={cn(
                "rounded px-1.5 py-0.5 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                last ? "text-black-01" : "text-gray-05 hover:text-primary hover:underline",
              )}
            >
              {p.name.split(" ")[0]}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

// ── KPI grid (house style: roles/audit metric rows) ───────────────────────────
function StatsGrid({ stats, scope }: { stats: TaskStats; scope: "branch" | "personal" }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard label={scope === "branch" ? "Tasks in branch" : "Total tasks"} value={stats.total} />
      <KpiCard label="Completed" value={stats.done} foot={`${stats.pct}% complete`} />
      <KpiCard label="In progress" value={stats.in_progress} />
      <KpiCard
        label="Overdue"
        value={stats.overdue}
        foot={stats.overdue ? "needs attention" : undefined}
        tone={stats.overdue ? "alert" : "default"}
      />
    </div>
  );
}

// ── Compact person header (drilled report / manager roll-up summary) ──────────
function PersonHeader({
  person,
  isManager,
  areaStats,
  ownStats,
  directReports,
}: {
  person: Person;
  isManager: boolean;
  areaStats: TaskStats;
  ownStats: TaskStats;
  directReports: number;
}) {
  const stats = isManager ? areaStats : ownStats;
  const summary = isManager
    ? `${areaStats.done} of ${areaStats.total} tasks done across the team${areaStats.overdue ? ` · ${areaStats.overdue} overdue` : ""}`
    : ownStats.total
      ? `${ownStats.done} of ${ownStats.total} tasks done${ownStats.overdue ? ` · ${ownStats.overdue} overdue` : ""}`
      : "No commitments logged yet.";

  return (
    <div className="flex items-center justify-between gap-6 rounded-md bg-white px-5.5 py-5">
      <div className="flex items-center gap-3.5">
        <Avatar person={person} size={42} />
        <div>
          <p className="font-mont font-semibold text-black-01">{person.name}</p>
          <p className="mt-0.5 text-xs text-gray-01">{person.role}</p>
          <p className="mt-1.5 font-mont text-xs font-medium text-gray-05">{summary}</p>
          {isManager && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded bg-gray-03 px-2 py-1 font-mont text-[11px] font-semibold text-gray-06">
              <Users className="size-3" />
              {directReports} direct {directReports === 1 ? "report" : "reports"}
              <span className="text-gray-02">·</span>
              Own tasks {ownStats.done}/{ownStats.total}
            </span>
          )}
        </div>
      </div>
      <ProgressRing pct={stats.pct} size={76} stroke={7} sublabel={null} />
    </div>
  );
}

// ── Report card (one direct report's area roll-up) ────────────────────────────
function ReportCard({ report, onClick }: { report: ReportCardData; onClick: () => void }) {
  const { person, is_manager, area_stats } = report;
  return (
    <button
      onClick={onClick}
      className="group rounded-md bg-white px-5.5 py-5 text-left transition-colors hover:bg-pry-01/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2.5">
        <Avatar person={person} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mont text-sm font-semibold text-black-01">{person.name}</p>
          <p className="truncate text-xs text-gray-01">{person.role}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-gray-02 transition-colors group-hover:text-primary" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mont text-sm font-semibold text-black-01">
            {area_stats.done} of {area_stats.total} done
          </p>
          <p className="mt-0.5 text-xs text-gray-05">{is_manager ? "Leads a team" : "Individual contributor"}</p>
          <div className="mt-2.5">
            <HealthPill overdue={area_stats.overdue} />
          </div>
        </div>
        <ProgressRing pct={area_stats.pct} size={64} stroke={6} sublabel={null} />
      </div>
    </button>
  );
}

// ── Node dashboard (manager team view, or a drilled report) ───────────────────
export function NodeDashboardView({
  dashboard,
  viewerId,
  onToggle,
  onEdit,
  onDelete,
  onOpenReport,
  togglingId,
}: {
  dashboard: NodeDashboard;
  viewerId: number;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpenReport: (id: number) => void;
  togglingId?: number | null;
}) {
  const { person, is_manager, own_tasks, own_stats, area_stats, reports } = dashboard;
  const isViewerNode = person.id === viewerId;

  const [query, setQuery] = useState("");
  // Direct reports start minimised so the manager sees the tasks first and
  // expands the roll-up only when they want to scan the team.
  const [reportsOpen, setReportsOpen] = useState(false);
  const showSearch = reports.length >= 4;
  const filteredReports = useMemo(() => {
    if (!query.trim()) return reports;
    const q = query.toLowerCase();
    return reports.filter((r) => r.person.name.toLowerCase().includes(q) || r.person.role.toLowerCase().includes(q));
  }, [reports, query]);

  // Backend: a task is modifiable by its assignee or its assigner.
  const canModify = (t: Task) => t.assignee.id === viewerId || t.assigned_by?.id === viewerId;

  return (
    <div className="space-y-5">
      {/* Drilled into a report → show who this is. On the viewer's own team view
          the intro row already names them, so skip the duplicate header. */}
      {!isViewerNode && (
        <PersonHeader
          person={person}
          isManager={is_manager}
          areaStats={area_stats}
          ownStats={own_stats}
          directReports={reports.length}
        />
      )}

      {is_manager ? (
        <>
          <StatsGrid stats={area_stats} scope="branch" />

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReportsOpen((o) => !o)}
                aria-expanded={reportsOpen}
                className="inline-flex items-center gap-2 rounded font-mont font-semibold text-gray-01 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown className={cn("size-4 text-gray-05 transition-transform", !reportsOpen && "-rotate-90")} />
                Direct reports
                <span className="rounded-full bg-gray-03 px-2 py-0.5 text-[11px] font-semibold text-gray-06">{reports.length}</span>
              </button>
              {reportsOpen && showSearch && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reports" className="h-10 w-56 bg-white pl-9" />
                </div>
              )}
            </div>
            {reportsOpen && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((r) => (
                  <ReportCard key={r.person.id} report={r} onClick={() => onOpenReport(r.person.id)} />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 font-mont font-semibold text-gray-01">
              {isViewerNode ? "My own tasks" : `${person.name.split(" ")[0]}'s own tasks`}
            </p>
            <PersonTaskList
              tasks={own_tasks}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              canModify={canModify}
              togglingId={togglingId}
              emptyMsg="No personal tasks yet."
            />
          </div>
        </>
      ) : (
        <>
          <StatsGrid stats={own_stats} scope="personal" />
          <PersonTaskList
            tasks={own_tasks}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            canModify={canModify}
            togglingId={togglingId}
            emptyMsg={isViewerNode ? "No tasks yet — add your first commitment." : "No tasks yet."}
          />
        </>
      )}
    </div>
  );
}

// ── My Tasks (personal-only view) ─────────────────────────────────────────────
export function MyTasksView({
  dashboard,
  onToggle,
  onEdit,
  onDelete,
  togglingId,
}: {
  dashboard: MineDashboard;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  togglingId?: number | null;
}) {
  const { person, tasks, stats } = dashboard;
  const canModify = (t: Task) => t.assignee.id === person.id || t.assigned_by?.id === person.id;

  return (
    <div className="space-y-5">
      <StatsGrid stats={stats} scope="personal" />
      <PersonTaskList
        tasks={tasks}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        canModify={canModify}
        togglingId={togglingId}
        emptyMsg="No tasks yet — add your first commitment."
      />
    </div>
  );
}
