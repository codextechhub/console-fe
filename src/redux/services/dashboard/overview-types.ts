import type { ResponseMessage } from "../auth/auth-types";
import type { Task, TaskStats } from "./todo-types";

/**
 * Console landing-screen roll-up.
 *
 * Every section is optional on purpose: the backend omits the ones the caller
 * has no permission for (`platform.schools.view`, `platform.team.view`,
 * `tickets.ticket.view`, `platform.health.view`, and CX-staff-only tasks). An
 * absent section means "no access" — render nothing, never a zero.
 */
export interface ConsoleOverview {
  schools?: { active: number };
  team?: { total: number };
  tasks?: {
    stats: TaskStats;
    /** Only the few the panel lists, already ordered by the server. */
    items: Task[];
  };
  approvals: { pending: number };
  submissions: { returned: number };
  notifications: { unread: number };
  tickets?: { open: number; assigned_to_me: number };
  health?: { label: string; overall: string; active_incidents: number };
}

export interface ConsoleOverviewRes extends ResponseMessage {
  data: ConsoleOverview;
}
