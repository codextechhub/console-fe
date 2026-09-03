/**
 * The branch lifecycle, as the backend defines it.
 *
 * Kept in one module rather than inline in the screen so the edges can be
 * tested without a browser, and so there is one place to correct when the
 * backend adds a state. Every rule here has a backstop in `Branch.transition`
 * and `Branch._assert_may_leave_service`: this exists to stop the console
 * offering an action that can only be refused, not to be the thing enforcing
 * it. The API is the authority and answers 409 either way.
 */

export type BranchStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "CLOSED";

/** States that mean "no longer in service", mirroring Branch.OUT_OF_SERVICE_STATES. */
export const OUT_OF_SERVICE: ReadonlySet<string> = new Set<BranchStatus>([
  "SUSPENDED",
  "INACTIVE",
  "CLOSED",
]);

/**
 * Mirrors Branch.ALLOWED_TRANSITIONS. Two rules shape it: CLOSED is terminal,
 * because a shut-down branch is re-created rather than resurrected, and PENDING
 * is never a target, because "pending activation" is a fact about a branch that
 * has never opened and activation cannot be undone.
 */
const ALLOWED: Record<BranchStatus, readonly BranchStatus[]> = {
  PENDING: ["ACTIVE", "INACTIVE", "CLOSED"],
  ACTIVE: ["SUSPENDED", "INACTIVE", "CLOSED"],
  SUSPENDED: ["ACTIVE", "INACTIVE", "CLOSED"],
  INACTIVE: ["ACTIVE", "CLOSED"],
  CLOSED: [],
};

/** The states this branch may move to, in the order they should be offered. */
export function branchTransitionsFrom(status: string): readonly BranchStatus[] {
  return ALLOWED[status as BranchStatus] ?? [];
}

/** The verb for the move, not the name of the destination state. */
export function branchTransitionLabel(to: BranchStatus, from: string): string {
  if (to === "ACTIVE") return from === "PENDING" ? "Activate" : "Return to service";
  if (to === "SUSPENDED") return "Suspend";
  if (to === "INACTIVE") return "Deactivate";
  return "Close permanently";
}

/** What the operator is about to cause, in the words they would use. */
export function branchTransitionEffect(to: BranchStatus, branchName: string): string {
  if (to === "ACTIVE") {
    return `${branchName} returns to service. Staff assigned to it can work there again.`;
  }
  if (to === "SUSPENDED") {
    return `${branchName} stops trading. The record and its history are kept, and it can be returned to service later.`;
  }
  if (to === "INACTIVE") {
    return `${branchName} is taken out of service. The record and its history are kept, and it can be returned to service later.`;
  }
  return `${branchName} is closed for good. A closed branch cannot be reopened - it would have to be created again as a new branch, with a new code.`;
}

/**
 * Whether a reason is required for this move.
 *
 * The API accepts a blank one. The console does not, for anything that takes a
 * branch out of service: the reason is written into the branch's lifecycle
 * history, which is the record somebody reads months later when they are asking
 * why a campus stopped trading. Returning to service needs no explanation
 * beyond the fact of it.
 */
export function branchReasonRequired(to: BranchStatus): boolean {
  return OUT_OF_SERVICE.has(to);
}

/** Whether the operator must type the branch name to proceed. Closing only. */
export function branchNameConfirmationRequired(to: BranchStatus): boolean {
  return to === "CLOSED";
}

export interface BranchServiceContext {
  isMain: boolean;
  /** How many branches the school has, including this one. */
  branchCount: number;
}

/**
 * Why this branch may not leave service, or null when it may.
 *
 * The backend refuses both cases with a 409 of its own. Saying it here as well
 * means the rule is visible before the click rather than only after it, and the
 * control can be shown-but-refused instead of vanishing, which is what teaches
 * an operator that the main designation has to be handed over first.
 */
export function branchLeaveServiceBlock(
  to: BranchStatus,
  { isMain, branchCount }: BranchServiceContext,
): string | null {
  if (!OUT_OF_SERVICE.has(to)) return null;
  if (branchCount <= 1) {
    return "This is the school's only branch, and a school must keep one in service.";
  }
  if (isMain) {
    return "This is the main branch. Make another branch the main branch first, then take this one out of service.";
  }
  return null;
}
