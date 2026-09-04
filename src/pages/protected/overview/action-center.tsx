import { useEffect, useReducer, useState } from "react";
import { Link } from "react-router";
import {
  ChevronRight,
  Minimize2,
  Maximize2,
  ClipboardCheck,
  CornerUpLeft,
  FileClock,
  FileText,
  UserCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import { useAppSelector } from "@/redux/store";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";
import type { Task } from "@/redux/services/dashboard/todo-types";
import { DocumentRef } from "@/pages/protected/workflow/components/workflow-ui";
import {
  actionableTasks,
  buildActionRows,
  partitionRows,
  rankQueues,
  QUEUE_SHOWN,
  type ActionRow,
  type QueueKey,
} from "./action-center-model";
import { dismissNotice, isDismissed, loadDismissals } from "./notice-dismissals";
import { initialPanelState, panelOpenReducer } from "./panel-open-state";

const R = routesPath.PROTECTED;

// Past this age a decision is officially lingering: the row's age turns red.
const STALE_AFTER_DAYS = 3;

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
      <div className="mt-3 flex-1 divide-y divide-white-02/80">{children}</div>
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

/**
 * The label above each group. Small and quiet on purpose: it separates two
 * readings of the same panel, it is not a second page heading.
 */
function GroupHeading({
  title,
  note,
  tone,
}: {
  title: string;
  note: string;
  tone: "mine" | "watch";
}) {
  return (
    <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <h3
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.14em]",
          tone === "mine" ? "text-primary" : "text-slate-500",
        )}
      >
        {title}
      </h3>
      <p className="text-[11px] text-gray-400">{note}</p>
    </div>
  );
}

/**
 * One compact condition row. The link fills the card so the whole row stays
 * clickable; a dismissible notice hands the trailing slot to its own button
 * (nesting a button inside the anchor would be invalid markup).
 */
function ActionRowCard({ row, onDismiss }: { row: ActionRow; onDismiss?: () => void }) {
  const { icon: Icon, title, stat, message, to, severity } = row;
  return (
    <div
      className={cn(
        "group flex items-center rounded-xl border transition duration-200",
        ROW_TONES[severity].card,
        onDismiss && "pr-1.5",
      )}
    >
      <Link to={to} className="flex min-w-0 flex-1 items-center gap-3 p-3.5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", ROW_TONES[severity].tile)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-black-01">{title}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{message}</p>
        </div>
        <span className={cn("shrink-0 text-sm font-semibold tabular-nums", ROW_TONES[severity].stat)}>{stat}</span>
        {!onDismiss && <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-gray-500" />}
      </Link>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          title="Hide until this number changes"
          aria-label={`Dismiss ${title}`}
          className="shrink-0 rounded-lg p-2 text-gray-300 transition hover:bg-white/70 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
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
 * The unified "Action needed" centre, read in two groups.
 *
 * "Yours to act on" is work the reader personally clears: a queue box per work
 * stream (approvals, delegate cover, returned submissions, tasks) holding the
 * actual items, then their own counted rows (assigned tickets, their jobs,
 * their notices). "Watch" is everything else the modules are reporting -
 * conditions across the organisation that they should see but may not own.
 *
 * Anything quiet is simply absent; a fully clear day renders nothing at all -
 * the hero already says so.
 */
export function ActionCenter({ overview }: { overview: ConsoleOverview | undefined }) {
  const [panel, dispatchPanel] = useReducer(panelOpenReducer, undefined, initialPanelState);
  const [hoveredOpen, setHoveredOpen] = useState(false);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [dismissals, setDismissals] = useState(() => loadDismissals(userId));
  // Blue notices the reader put down today, at this exact figure, stay down.
  const rows = buildActionRows(overview).filter(
    (row) => !(row.severity === "blue" && isDismissed(dismissals, row.key, row.stat)),
  );
  // A red row is something actually broken (an open incident, a failed job). On
  // a phone there is no hover, so the panel has to open itself or that row can
  // sit unseen behind a one-line header. The payload lands after the first
  // render, so the decision lives in a reducer fed one frame at a time rather
  // than in a useState initializer that would only ever see "no data".
  // (Filtering above cannot hide a red row: only blue notices are dismissible.)
  const hasRed = rows.some((row) => row.severity === "red");
  useEffect(() => {
    dispatchPanel({ type: "data", hasRed });
  }, [hasRed]);

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

  // Two passes, not one list: what is mine to clear, then what is going on
  // around me. Org conditions outnumber personal work most days, so without
  // the split a single waiting approval sits below eleven things nobody asked
  // this reader to fix.
  const { mine, watch } = partitionRows(rows);
  // Only notices can be put down. A red or amber row reports something broken
  // or overdue, and hiding it would be a lie.
  const dismissHandler = (row: ActionRow) =>
    row.severity === "blue"
      ? () => setDismissals((prev) => dismissNotice(userId, prev, row.key, row.stat))
      : undefined;
  const queueCount = [approvals.length, covering.length, returned.length, tasks.length]
    .filter((count) => count > 0).length;
  const hasMine = hasQueues || mine.length > 0;
  const mineCount = queueCount + mine.length;
  const summary = [
    mineCount > 0 ? `${mineCount} for you` : null,
    watch.length > 0 ? `${watch.length} to watch` : null,
  ].filter(Boolean).join(" · ");
  const expanded = panel.expanded || hoveredOpen;

  // Each box's markup keyed by its work stream, so the render can lay them out
  // in whatever order rankQueues judges most urgent rather than a fixed one.
  const queueBoxes: Record<QueueKey, React.ReactNode> = {
    approvals: (
      <QueueBox
        key="approvals"
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
    ),
    covering: (
      <QueueBox
        key="covering"
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
    ),
    returned: (
      <QueueBox
        key="returned"
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
    ),
    tasks: (
      <QueueBox
        key="tasks"
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
    ),
  };

  return (
    <section
      aria-label="Action needed"
      // Stable walkthrough target - the console-basics tour points here.
      data-guide="overview.action-center"
      onMouseEnter={() => setHoveredOpen(true)}
      onMouseLeave={() => setHoveredOpen(false)}
      className="rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600">Today&apos;s focus</p>
            <h2 className="truncate text-sm font-semibold tracking-tight sm:text-base">Action needed</h2>
          </div>
          <p className="hidden truncate text-[11px] text-gray-400 sm:block sm:border-l sm:border-slate-200 sm:pl-3">{summary}</p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="overview-action-details"
          // The label text is hidden below sm, which would leave the button
          // with no accessible name on exactly the devices that cannot hover.
          aria-label={panel.expanded ? "Minimize action needed" : "Maximize action needed"}
          onClick={() => {
            if (panel.expanded) {
              dispatchPanel({ type: "close" });
              setHoveredOpen(false);
              return;
            }
            dispatchPanel({ type: "open" });
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          {panel.expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          <span className="hidden sm:inline">{panel.expanded ? "Minimize" : "Maximize"}</span>
        </button>
      </div>

      <div
        id="overview-action-details"
        aria-hidden={!expanded}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {/* No preamble when there is personal work: the group headings below
              already say which half is which, so a sentence repeating them just
              pushes the first row down. The all-Watch case is different - no
              heading tells the reader that nothing is theirs. */}
          {!hasMine && (
            <p className="mb-4 mt-3 text-xs text-gray-400">
              Nothing is waiting on you personally. Here is what is going on around you.
            </p>
          )}

          {hasMine && (
            // Carries the gap the removed preamble used to provide.
            <section aria-label="Yours to act on" className="mt-4">
              <GroupHeading title="Yours to act on" note="Work only you can clear" tone="mine" />

              {/* Queues first: they carry the actual items, so they answer
                  "what do I open now" in a way a counted row cannot. */}
              {hasQueues && (
            <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rankQueues({ approvals, covering, returned, tasks }).map((key) => queueBoxes[key])}
            </div>
              )}

              {mine.length > 0 && (
                <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3", hasQueues && "mt-3")}>
                  {mine.map((row) => (
                    <ActionRowCard key={row.key} row={row} onDismiss={dismissHandler(row)} />
                  ))}
                </div>
              )}
            </section>
          )}

          {watch.length > 0 && (
            <section aria-label="Watch" className={cn(hasMine && "mt-5")}>
              <GroupHeading
                title="Watch"
                note="Across the organisation, not only your work"
                tone="watch"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {watch.map((row) => (
                  <ActionRowCard key={row.key} row={row} onDismiss={dismissHandler(row)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
