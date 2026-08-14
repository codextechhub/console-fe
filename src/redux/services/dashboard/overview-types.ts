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
  /** Set when the caller is a delegate covering this decision for someone else. */
  on_behalf_of_name: string | null;
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
  approvals: { pending: number; delegated: number; items: ApprovalWorklistItem[] };
  submissions: { returned: number; items: ReturnedSubmissionItem[] };
  notifications: { unread: number };
  /**
   * Unfinished tickets only (OPEN / ASSIGNED / IN_PROGRESS). Resolved and
   * closed work is excluded on purpose: a counter you cannot clear by doing
   * the work is worse than no counter.
   */
  tickets?: { active: number; assigned_to_me: number };
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
    /** The caller's own jobs that finished in the last 24h - ready to collect. */
    jobs_succeeded_24h?: { count: number };
    /** Posted AR invoices past due and not fully settled. */
    overdue_invoices?: { count: number };
    /** Posted receipts with cash not yet applied to any invoice or refunded. */
    unallocated_credit?: { count: number };
    /** Posted vendor bills not yet fully paid. */
    vendor_invoices_unpaid?: { count: number };
    /** RFQs issued to vendors and still awaiting award. */
    rfqs_open?: { count: number };
    /** ACTIVE vendor contracts ending within 30 days. */
    contracts_expiring?: { count: number };
    /** Active accounts in the caller's tenant holding no role. */
    users_without_roles?: { count: number };
    /** Overdue tasks across the caller's reporting subtree (managers only). */
    team_overdue_tasks?: { count: number };
  };
}

export interface ConsoleOverviewRes extends ResponseMessage {
  data: ConsoleOverview;
}
