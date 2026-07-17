export type AuthContextGateState = "redirect" | "loading" | "error" | "ready";

/**
 * Decide whether tenant-scoped routes are safe to mount.
 *
 * Persisted sessions from before tenant context was introduced can still have
 * a valid token and user while `tenant` is empty. Those sessions must wait for
 * `/me` before any protected query is allowed to run.
 */
export function getAuthContextGateState({
  shouldRedirect,
  hasTenant,
  isLoading,
  isFetching,
}: {
  shouldRedirect: boolean;
  hasTenant: boolean;
  isLoading: boolean;
  isFetching: boolean;
}): AuthContextGateState {
  if (shouldRedirect) return "redirect";
  if (hasTenant) return "ready";
  if (isLoading || isFetching) return "loading";
  return "error";
}
