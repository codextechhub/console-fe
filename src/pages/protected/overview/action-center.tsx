import { Link } from "react-router";
import {
  ChevronRight,
  ClipboardCheck,
  CornerUpLeft,
  FileClock,
  FileText,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";
import type { Task } from "@/redux/services/dashboard/todo-types";
import { DocumentRef } from "../workflow/components/workflow-ui";
import { actionableTasks, buildActionRows } from "./action-center-model";

const R = routesPath.PROTECTED;

// Past this age a decision is officially lingering: the row's age turns red.
const STALE_AFTER_DAYS = 3;
// Each queue box lists at most this many items; the footer carries the rest.
const QUEUE_SHOWN = 3;

function ageDays(iso: string | null): number {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
}

function ageLabel(since: string): string {
  // Past the stale line, "how long has this waited" is the message; an
  // absolute date makes the reader do that arithmetic themselves.
  const days = ageDays(since);
  return days >= STALE_AFTER_DAYS ? `Waiting ${Math.floor(days)} days` : formatRelativeDate(since);
}

/**
 * `variant="row"` sits right-aligned beside the title (desktop); on phones the
 * title needs the full width, so the row stamp hides and a `variant="inline"`
 * copy rides in the sub-line instead.
 */
function AgeStamp({ since, variant }: { since: string | null; variant: "row" | "inline" }) {
  if (!since) return null;
  const stale = ageDays(since) >= STALE_AFTER_DAYS;
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap text-xs",
        stale ? "font-medium text-red-500" : "text-gray-400",
        variant === "row" ? "hidden sm:inline" : "sm:hidden",
      )}
    >
      {variant === "inline" && <span aria-hidden> · </span>}
      {ageLabel(since)}
    </span>
  );
}

const ROW_TONES = {
  red: {
    card: "border-red-100 bg-red-50/55 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-sm",
    tile: "bg-red-100/80 text-red-600",
    stat: "text-red-700",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/55 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-sm",
    tile: "bg-amber-100/80 text-amber-600",
    stat: "text-amber-700",
  },
  blue: {
    card: "border-blue-100 bg-blue-50/45 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm",
    tile: "bg-blue-100/70 text-blue-600",
    stat: "text-blue-700",
  },
};

/** A personalized queue box: header with a count, the actual items, view-all. */
function QueueBox({
  icon: Icon,
  title,
  count,
  viewAllTo,
  viewAllLabel,
  children,
}: {
  icon: typeof FileClock;
  title: string;
  count: number;
  viewAllTo: string;
  viewAllLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pry-01 text-primary">
            <Icon className="size-4" />
          </span>
          <h3 className="truncate text-sm font-semibold">{title}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          {count}
        </span>
      </div>
      <div className="mt-3 flex-1 divide-y divide-gray-100/80">{children}</div>
      {count > QUEUE_SHOWN && (
        <Link
          to={viewAllTo}
          className="mt-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-primary hover:underline"
        >
          {viewAllLabel}
        </Link>
      )}
    </section>
  );
}

function TaskDot({ task }: { task: Task }) {
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        task.status === "OVERDUE" ? "bg-red-500" : task.priority === "HIGH" ? "bg-amber-500" : "bg-primary",
      )}
    />
  );
}

function taskDeadline(value: string): string {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(value));
}

/**
 * The unified "Action needed" centre. One attention system for everything
 * waiting on the reader: compact tinted rows for module conditions and
 * notices, then a personalized queue box per work stream (approvals, returned
 * submissions, tasks) holding the actual items. Anything quiet is simply
 * absent; a fully clear day renders nothing at all - the hero already says so.
 */
export function ActionCenter({ overview }: { overview: ConsoleOverview | undefined }) {
  const rows = buildActionRows(overview);

  const allApprovalItems = overview?.approvals.items ?? [];
  // Delegate cover is its own duty, so it gets its own box; the counts split
  // the same way the items do (pending is the whole queue, delegated within).
  const approvals = allApprovalItems.filter((item) => !item.on_behalf_of_name);
  const covering = allApprovalItems.filter((item) => item.on_behalf_of_name);
  const delegatedCount = overview?.approvals.delegated ?? 0;
  const approvalsCount = (overview?.approvals.pending ?? 0) - delegatedCount;
  const returned = overview?.submissions.items ?? [];
  const tasks = actionableTasks(overview?.tasks?.items ?? []);

  const hasQueues =
    approvals.length > 0 || covering.length > 0 || returned.length > 0 || tasks.length > 0;
  if (rows.length === 0 && !hasQueues) return null;

  return (
    <section
      aria-label="Action needed"
      className="rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600">Today&apos;s focus</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Action needed</h2>
          <p className="mt-1 text-xs text-gray-400">Everything waiting on you, most urgent first.</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
          Priority view
        </span>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ key, icon: Icon, title, stat, message, to, severity }) => (
            <Link
              key={key}
              to={to}
              className={cn(
                "group flex items-center gap-3 rounded-xl border p-3.5 transition duration-200",
                ROW_TONES[severity].card,
              )}
            >
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", ROW_TONES[severity].tile)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-black-01">{title}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{message}</p>
              </div>
              <span className={cn("shrink-0 text-sm font-semibold tabular-nums", ROW_TONES[severity].stat)}>{stat}</span>
              <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-gray-500" />
            </Link>
          ))}
        </div>
      )}

      {hasQueues && (
        <div className={cn("grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3", rows.length > 0 && "mt-3")}>
          {approvals.length > 0 && (
            <QueueBox
              icon={FileClock}
              title="Approvals waiting on you"
              count={approvalsCount}
              viewAllTo={R.WORKFLOW.APPROVALS}
              viewAllLabel={`View all ${approvalsCount} pending approvals`}
            >
              {approvals.slice(0, QUEUE_SHOWN).map((item) => (
                <Link
                  key={item.id}
                  to={R.WORKFLOW.APPROVAL_DETAIL(item.id)}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-primary/[0.025]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-pry-01 text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm">
                        <DocumentRef documentType={item.document_type} objectId={item.document_object_id} />
                      </span>
                      <Badge variant="pending" className="hidden shrink-0 sm:inline-flex">
                        {item.stage_label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {item.requested_by_name ? `From ${item.requested_by_name}` : "Awaiting your decision"}
                      <AgeStamp since={item.awaiting_since} variant="inline" />
                    </p>
                  </div>
                  <AgeStamp since={item.awaiting_since} variant="row" />
                  <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-primary" />
                </Link>
              ))}
            </QueueBox>
          )}

          {covering.length > 0 && (
            <QueueBox
              icon={UserCheck}
              title="Covering as delegate"
              count={delegatedCount}
              viewAllTo={`${R.WORKFLOW.APPROVALS}?acting=delegated`}
              viewAllLabel={`View all ${delegatedCount} delegated approvals`}
            >
              {covering.slice(0, QUEUE_SHOWN).map((item) => (
                <Link
                  key={item.id}
                  to={R.WORKFLOW.APPROVAL_DETAIL(item.id)}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-primary/[0.025]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <UserCheck className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm">
                        <DocumentRef documentType={item.document_type} objectId={item.document_object_id} />
                      </span>
                      <Badge variant="pending" className="hidden shrink-0 sm:inline-flex">
                        {item.stage_label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      For {item.on_behalf_of_name}
                      <AgeStamp since={item.awaiting_since} variant="inline" />
                    </p>
                  </div>
                  <AgeStamp since={item.awaiting_since} variant="row" />
                  <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-primary" />
                </Link>
              ))}
            </QueueBox>
          )}

          {returned.length > 0 && (
            <QueueBox
              icon={CornerUpLeft}
              title="Returned to you"
              count={returned.length}
              viewAllTo={`${R.WORKFLOW.MY_SUBMISSIONS}?status=RETURNED`}
              viewAllLabel="View all returned submissions"
            >
              {returned.slice(0, QUEUE_SHOWN).map((item) => (
                <Link
                  key={item.id}
                  to={R.WORKFLOW.SUBMISSION_DETAIL(item.id)}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-primary/[0.025]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
                    <CornerUpLeft className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      <DocumentRef documentType={item.document_type} objectId={item.document_object_id} />
                    </span>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      Fix and resubmit
                      <AgeStamp since={item.returned_at} variant="inline" />
                    </p>
                  </div>
                  <AgeStamp since={item.returned_at} variant="row" />
                  <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-primary" />
                </Link>
              ))}
            </QueueBox>
          )}

          {tasks.length > 0 && (
            <QueueBox
              icon={ClipboardCheck}
              title="Tasks needing action"
              count={tasks.length}
              viewAllTo={`${R.TODO.INDEX}?tab=mine`}
              viewAllLabel="View all your tasks"
            >
              {tasks.slice(0, QUEUE_SHOWN).map((task) => (
                <Link
                  key={task.id}
                  to={`${R.TODO.INDEX}?tab=mine`}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-primary/[0.025]"
                >
                  <TaskDot task={task} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{task.department || "Personal task"}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-1 text-xs",
                      task.status === "OVERDUE" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500",
                    )}
                  >
                    {taskDeadline(task.deadline)}
                  </span>
                </Link>
              ))}
            </QueueBox>
          )}
        </div>
      )}
    </section>
  );
}
