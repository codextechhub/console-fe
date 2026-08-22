export type AuthContextGateState =
  | "redirect"
  | "loading"
  | "retry"
  | "logout"
  | "forbidden"
  | "ready";

/**
 * Decide whether tenant-scoped routes are safe to mount.
 *
 * Persisted sessions from before tenant context was introduced can still have
 * a valid token and user while `tenant` is empty. Those sessions must wait for
 * `/me` before any protected query is allowed to run.
 *
 * When `/me` settles without a tenant we distinguish two cases:
 *   - the request errored → likely transient (network/server): offer a retry;
 *   - the request succeeded but carried no tenant → context is gone: log out.
 *
 * A tenant that is present but is not the platform one is "forbidden": this is
 * the console, and a customer has no business being inside its shell. The
 * backend already states that boundary (`IsPlatformActor` in
 * `vs_admin_console/permissions.py`), so without this the customer gets the
 * console's chrome wrapped around panels that 403 one by one - which reads as a
 * broken staff account rather than as the closed door it actually is.
 *
 * Two deliberate narrowings:
 *   - only an *explicit* non-platform kind forbids. A tenant whose `kind` is
 *     absent predates the field; `/me` repopulates it on mount (login and `/me`
 *     share `tenant_context_block`), so it is judged on the next pass rather
 *     than locking the session out on a value we never received.
 *   - impersonation is exempt. A platform operator acting as a school user has
 *     the target's SCHOOL tenant in `auth.tenant` by design (`setAuthContext`),
 *     with their own context parked in `impersonation.actor`. Forbidding on kind
 *     alone would eject the operator from the console the moment they reload.
 */
export function getAuthContextGateState({
  shouldRedirect,
  hasTenant,
  tenantKind,
  isImpersonating,
  isLoading,
  isFetching,
  isError,
}: {
  shouldRedirect: boolean;
  hasTenant: boolean;
  tenantKind?: string | null;
  isImpersonating?: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}): AuthContextGateState {
  if (shouldRedirect) return "redirect";
  if (hasTenant) {
    if (!isImpersonating && tenantKind && tenantKind !== "PLATFORM") {
      return "forbidden";
    }
    return "ready";
  }
  if (isLoading || isFetching) return "loading";
  return isError ? "retry" : "logout";
}
