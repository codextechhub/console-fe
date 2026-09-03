/**
 * Who sees which Tasks tab, and when the screen is allowed to act on that.
 *
 * Two facts decide the tab, and they do NOT arrive together:
 *
 *   * whether the viewer manages anyone - derived from the assignable-people
 *     query, so it is unknown until that query settles;
 *   * which tab was asked for - known immediately, including from a `?tab=`
 *     deep link.
 *
 * Treating "not loaded yet" as "not a manager" is what broke the `?tab=team`
 * deep link: the screen forced "mine" on first render, and nothing restored the
 * requested tab once the real answer arrived. Hence the explicit
 * `managerStatusKnown` input - absence of data is not an answer.
 */

export type TasksTab = "team" | "mine";

/**
 * Should the screen overwrite the selected tab with "My Tasks"?
 *
 * Only once the viewer's manager status is actually known. This decision
 * *writes* state, so acting on a guess is unrecoverable - unlike the render-time
 * reads (which tab is showing, whether Assign Task appears), which self-correct
 * when the data lands.
 */
export function shouldForceMyTasks(input: {
  tab: TasksTab;
  viewerIsManager: boolean;
  /** The assignable-people query has settled - successfully or not. */
  managerStatusKnown: boolean;
}): boolean {
  if (!input.managerStatusKnown) return false;
  return !input.viewerIsManager && input.tab !== "mine";
}
