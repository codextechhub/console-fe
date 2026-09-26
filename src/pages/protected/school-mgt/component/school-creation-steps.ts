import type { SchoolCreationJob } from "@/redux/services/dashboard/school-types";

/**
 * The words for each step of a school's creation, keyed by the step names the
 * creation job reports. The job decides which steps run and in what order; the
 * console only names them. A step this build does not know yet still shows,
 * under a neutral label, rather than vanishing from the count.
 */
export const SCHOOL_CREATION_STEP_LABELS: Record<string, string> = {
  school: "Creating the school record",
  roles: "Setting up roles and permissions",
  school_admin: "Creating the school administrator's account",
  branches: "Opening the branches and their administrators",
  plan: "Applying the package plan",
  books: "Opening the finance books",
  onboarding: "Preparing the onboarding checklist",
  invitations: "Queuing the invitation emails",
};

export function stepLabel(step: string): string {
  return SCHOOL_CREATION_STEP_LABELS[step] ?? "Finishing the setup";
}

export type StepState = "done" | "current" | "pending" | "failed";

export type CreationPhase = "starting" | "running" | "succeeded" | "failed";

/**
 * How long a finished step is held before the next one is marked done. Steps
 * can finish faster than the eye follows, and a list that jumps from empty to
 * complete reads as nothing having happened. The pacing only slows the reveal
 * of steps the server has actually finished; it never marks one done early.
 */
export const STEP_REVEAL_MS = 320;

/**
 * The phase a creation is in, from what the job has reported and how many of
 * its finished steps have been revealed so far. Success waits for the reveal
 * to catch up, so the list is seen completing before the box says it is done.
 */
export function creationPhase(
  job: SchoolCreationJob | undefined,
  revealed: number,
): CreationPhase {
  if (!job) return "starting";
  if (job.status === "FAILED" || job.status === "CANCELLED") return "failed";
  if (job.status === "SUCCEEDED") {
    return revealed >= job.steps.length ? "succeeded" : "running";
  }
  return job.steps.length ? "running" : "starting";
}

/**
 * The state each step is drawn in. `revealed` is how many finished steps are
 * shown as done; the first unrevealed step is the running one, or, when the
 * job failed, the step it stopped on.
 */
export function stepStates(
  job: SchoolCreationJob,
  revealed: number,
): { step: string; state: StepState }[] {
  const failed = job.status === "FAILED" || job.status === "CANCELLED";
  const shownDone = Math.min(revealed, job.done.length);
  return job.steps.map((step, index) => {
    if (index < shownDone) return { step, state: "done" };
    if (index === shownDone) {
      if (failed && shownDone >= job.done.length) return { step, state: "failed" };
      return { step, state: "current" };
    }
    return { step, state: "pending" };
  });
}

/** How full the progress bar is, 0 to 1, from the revealed steps. */
export function progressFraction(job: SchoolCreationJob | undefined, revealed: number): number {
  if (!job || job.steps.length === 0) return 0;
  return Math.min(revealed, job.done.length) / job.steps.length;
}
