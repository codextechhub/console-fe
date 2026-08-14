// Model for the unified "Action needed" centre - kept JSX-free so it isn't a
// react-refresh boundary. One attention system, three shapes: compact rows for
// module conditions and low-urgency notices, queue boxes for the reader's own
// work items (approvals, returned submissions, tasks).
//
// Everything here also carries an `ownership`, because the panel is read in two
// passes: what is mine to clear today, and what is going on around me. Mixing
// the two was the old failure - eleven org conditions could bury the one
// approval that was actually waiting on the reader.
import { Bell, FileDown, LifeBuoy, Siren } from "lucide-react";
import { routesPath } from "@/routes/routes-path";
import type {
  ApprovalWorklistItem,
  ConsoleOverview,
  ReturnedSubmissionItem,
} from "@/redux/services/dashboard/overview-types";
import type { Task } from "@/redux/services/dashboard/todo-types";
import { buildSignalCards, type RowOwnership, type SignalCard } from "./signals-model";

const R = routesPath.PROTECTED;

export type { RowOwnership };

/** Compact row: a signal, plus "blue" for notices that inform rather than warn. */
export interface ActionRow extends Omit<SignalCard, "severity"> {
  severity: "red" | "amber" | "blue";
}

const SEVERITY_RANK: Record<ActionRow["severity"], number> = { red: 0, amber: 1, blue: 2 };

/** A task is action-needed when overdue, or its deadline is inside this window. */
export const DUE_SOON_DAYS = 7;

export function actionableTasks(items: Task[], now = Date.now()): Task[] {
  const horizon = now + DUE_SOON_DAYS * 24 * 60 * 60 * 1000;
  return items
    .filter(
      (t) =>
        t.status === "OVERDUE" ||
        (Boolean(t.deadline) && new Date(t.deadline).getTime() <= horizon),
    )
    .sort((a, b) => {
      const overdue = Number(b.status === "OVERDUE") - Number(a.status === "OVERDUE");
      if (overdue) return overdue;
      const at = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bt = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return at - bt;
    });
}

// Each queue box lists at most this many items; the footer carries the rest.
// Exported so the box render and the urgency ranking agree on the same window:
// the ranking can only judge the items a reader can actually see (see below).
export const QUEUE_SHOWN = 3;

/** The four personalised work-stream boxes, in their fixed fallback order. */
export type QueueKey = "approvals" | "covering" | "returned" | "tasks";
const QUEUE_ORDER: QueueKey[] = ["approvals", "covering", "returned", "tasks"];

// Urgency is measured as "lateness": milliseconds past the moment a thing became
// actionable, so a bigger number is more urgent and the scale is shared across
// every box. A waiting approval 9 days old (+9d) and a task overdue by 9 days
// (+9d) read as equally pressing; a task not due until next week is negative
// (its deadline is still in the future), so it always sits below anything that
// is already waiting or overdue. A missing timestamp is never late by accident:
// it scores -Infinity (least urgent), so an item we cannot date cannot win.
const UNKNOWN_LATENESS = Number.NEGATIVE_INFINITY;

function waitingLateness(iso: string | null, now: number): number {
  if (!iso) return UNKNOWN_LATENESS;
  const at = new Date(iso).getTime();
  return Number.isNaN(at) ? UNKNOWN_LATENESS : now - at;
}

function taskLateness(task: Task, now: number): number {
  const due = task.deadline ? new Date(task.deadline).getTime() : NaN;
  if (task.status === "OVERDUE") {
    // Overdue outranks anything merely due soon. With a deadline we know how far
    // overdue; without one we cannot, so it rests at the boundary (0) - past due
    // but never the most urgent thing on the page by accident.
    return Number.isNaN(due) ? 0 : now - due;
  }
  // Not overdue: still upcoming, so lateness is negative (deadline in future).
  return Number.isNaN(due) ? UNKNOWN_LATENESS : now - due;
}

function maxLateness(values: number[]): number {
  return values.reduce((max, value) => (value > max ? value : max), UNKNOWN_LATENESS);
}

/**
 * Order the four queue boxes by the urgency of what they actually hold, most
 * urgent first, and drop the empty ones. A box's urgency is the lateness of its
 * most pressing VISIBLE item (the first {@link QUEUE_SHOWN}) - honestly derived
 * from what the reader can see, not from the unseen remainder its count implies.
 * Ties fall back to the fixed order so the result is deterministic.
 */
export function rankQueues(
  queues: {
    approvals: ApprovalWorklistItem[];
    covering: ApprovalWorklistItem[];
    returned: ReturnedSubmissionItem[];
    tasks: Task[];
  },
  now = Date.now(),
): QueueKey[] {
  const urgency: Record<QueueKey, number> = {
    approvals: maxLateness(
      queues.approvals.slice(0, QUEUE_SHOWN).map((item) => waitingLateness(item.awaiting_since, now)),
    ),
    covering: maxLateness(
      queues.covering.slice(0, QUEUE_SHOWN).map((item) => waitingLateness(item.awaiting_since, now)),
    ),
    returned: maxLateness(
      queues.returned.slice(0, QUEUE_SHOWN).map((item) => waitingLateness(item.returned_at, now)),
    ),
    tasks: maxLateness(queues.tasks.slice(0, QUEUE_SHOWN).map((item) => taskLateness(item, now))),
  };
  const present: Record<QueueKey, boolean> = {
    approvals: queues.approvals.length > 0,
    covering: queues.covering.length > 0,
    returned: queues.returned.length > 0,
    tasks: queues.tasks.length > 0,
  };
  return QUEUE_ORDER.filter((key) => present[key]).sort((a, b) => {
    // Equal urgency (including two boxes we cannot date) keeps the fixed order.
    if (urgency[a] === urgency[b]) return QUEUE_ORDER.indexOf(a) - QUEUE_ORDER.indexOf(b);
    return urgency[b] - urgency[a];
  });
}

/**
 * All compact rows, severity-first (broken now, needs action soon, notices).
 * Every row follows the section's rule: presence means "act", absence means
 * quiet - a zero never renders.
 */
export function buildActionRows(overview: ConsoleOverview | undefined): ActionRow[] {
  const rows: ActionRow[] = [...buildSignalCards(overview?.signals)];

  // Incidents ride the health section (already permission-gated by the
  // backend's omit rule) rather than a signal key - same data, same contract.
  const incidents = overview?.health?.active_incidents ?? 0;
  if (incidents > 0) {
    rows.push({
      key: "incidents",
      icon: Siren,
      title: "Active incidents",
      stat: String(incidents),
      message: "Service incidents are open right now.",
      to: R.HEALTH.INDEX,
      severity: "red",
      // Platform-wide, and rarely one reader's to close - it belongs under
      // watch even though it is the loudest thing on the page.
      ownership: "watch",
    });
  }

  // Unfinished tickets only - the backend drops resolved and closed ones, so
  // clearing your queue clears this row. The link lands on exactly the rows
  // this number counted, rather than the whole ticket list.
  const assigned = overview?.tickets?.assigned_to_me ?? 0;
  if (assigned > 0) {
    rows.push({
      key: "tickets",
      icon: LifeBuoy,
      title: "Tickets assigned to you",
      stat: String(assigned),
      message: "Support tickets are open on your queue.",
      to: `${R.SUPPORT.INDEX}?status=ACTIVE&assignee=me`,
      severity: "amber",
      ownership: "mine",
    });
  }

  // A notice, not a signal card: finished work is good news, so it rides blue
  // alongside notifications rather than tinted like a problem. The backend
  // counts only exports still waiting to be collected, so downloading them is
  // what clears this row.
  const finished = overview?.signals?.exports_uncollected?.count ?? 0;
  if (finished > 0) {
    rows.push({
      key: "exports_ready",
      icon: FileDown,
      title: "Exports ready to download",
      stat: String(finished),
      message: "Exports you have not downloaded yet.",
      to: R.EXPORT.QUEUES,
      severity: "blue",
      ownership: "mine",
    });
  }

  const unread = overview?.notifications.unread ?? 0;
  if (unread > 0) {
    rows.push({
      key: "notifications",
      icon: Bell,
      title: "Unread notifications",
      stat: String(unread),
      message: "Updates you have not read yet.",
      to: `${R.NOTIFICATIONS}?filter=unread`,
      severity: "blue",
      ownership: "mine",
    });
  }

  return rows.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

/**
 * Split the rows the way the panel reads them: the reader's own work first,
 * then the organisation's conditions. Severity order is preserved inside each
 * group, so a red row is still first among its own kind - but a platform-wide
 * incident no longer outranks the approval that is actually waiting on you.
 */
export function partitionRows(rows: ActionRow[]): { mine: ActionRow[]; watch: ActionRow[] } {
  return {
    mine: rows.filter((row) => row.ownership === "mine"),
    watch: rows.filter((row) => row.ownership === "watch"),
  };
}
