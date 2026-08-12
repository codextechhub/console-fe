// Model for the unified "Action needed" centre - kept JSX-free so it isn't a
// react-refresh boundary. One attention system, three shapes: compact rows for
// module conditions and low-urgency notices, queue boxes for the reader's own
// work items (approvals, returned submissions, tasks).
import { Bell, FileDown, LifeBuoy, Siren } from "lucide-react";
import { routesPath } from "@/routes/routes-path";
import type { ConsoleOverview } from "@/redux/services/dashboard/overview-types";
import type { Task } from "@/redux/services/dashboard/todo-types";
import { buildSignalCards, type SignalCard } from "./signals-model";

const R = routesPath.PROTECTED;

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
    });
  }

  const assigned = overview?.tickets?.assigned_to_me ?? 0;
  if (assigned > 0) {
    rows.push({
      key: "tickets",
      icon: LifeBuoy,
      title: "Tickets assigned to you",
      stat: String(assigned),
      message: "Support tickets are waiting on your reply.",
      to: R.SUPPORT.INDEX,
      severity: "amber",
    });
  }

  // A notice, not a signal card: finished work is good news, so it rides blue
  // alongside notifications rather than tinted like a problem.
  const finished = overview?.signals?.jobs_succeeded_24h?.count ?? 0;
  if (finished > 0) {
    rows.push({
      key: "exports_ready",
      icon: FileDown,
      title: "Exports ready to download",
      stat: String(finished),
      message: "Jobs you started finished in the last 24 hours.",
      to: R.EXPORT.QUEUES,
      severity: "blue",
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
    });
  }

  return rows.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
