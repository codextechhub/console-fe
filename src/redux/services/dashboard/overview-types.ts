import type { ResponseMessage } from "../auth/auth-types";
import type { Task, TaskStats } from "./todo-types";

/**
 * Console landing-screen roll-up.
 *
 * Every section is optional on purpose: the backend omits the ones the caller
 * has no permission for (`platform.schools.view`, `platform.team.view`,
 * `tickets.ticket.view`, `platform.health.view`, and CX-staff-only tasks). An
 * absent section means "no access" - render nothing, never a zero.
 */
/**
 * A decision waiting on the caller, shaped for the dashboard worklist row.
 * `id` is the workflow-instance id: exactly what APPROVAL_DETAIL(id) opens.
 */
export interface ApprovalWorklistItem {
  id: string;
  document_type: string;
  document_object_id: string;
  stage_label: string;
  awaiting_since: string | null;
  requested_by_name: string;
}

/** The caller's own submission that came back for changes. */
export interface ReturnedSubmissionItem {
  id: string;
  document_type: string;
  document_object_id: string;
  returned_at: string;
}

export interface ConsoleOverview {
  schools?: { active: number };
  team?: { total: number };
  tasks?: {
    stats: TaskStats;
    /** Only the few the panel lists, already ordered by the server. */
    items: Task[];
  };
  approvals: { pending: number; items: ApprovalWorklistItem[] };
  submissions: { returned: number; items: ReturnedSubmissionItem[] };
  notifications: { unread: number };
  tickets?: { open: number; assigned_to_me: number };
  health?: { label: string; overall: string; active_incidents: number };
  /**
   * Module signals - conditions someone should act on soon. Doubly omitted:
   * a key is absent when the caller lacks the target screen's permission AND
   * when there is nothing to act on (healthy = silence, never a green card).
   */
  signals?: {
    /** Worst non-healthy fiscal calendar across active entities. */
    fiscal_runway?: {
      entity_name: string;
      status: "EXPIRING" | "EXPIRED";
      days_remaining: number | null;
      calendar_end: string | null;
    };
    draft_journals?: { count: number };
    pos_awaiting_receipt?: { count: number };
    webhook_failures_24h?: { count: number };
    /** The caller's own background jobs that failed in the last 24h. */
    jobs_failed_24h?: { count: number };
  };
  /**
   * Backing for the "Getting started" checklist. Each flag follows the same
   * omit-don't-zero rule as the sections above - absent means the caller can't
   * see that screen, so its checklist row is hidden rather than shown unticked.
   */
  setup?: {
    /** Any active role assignment in the caller's tenant. */
    roles_assigned?: boolean;
    /** Any active node in the CX org tree. */
    organogram_built?: boolean;
  };
}

export interface ConsoleOverviewRes extends ResponseMessage {
  data: ConsoleOverview;
}
