/**
 * One-shot marker that the auth context in the store came straight off a login
 * response, letting the mount-time `/me` sync be skipped for that one mount.
 *
 * `Authenticated` re-fetches `/me` on mount to catch role changes that landed
 * while a persisted token sat valid. One moment after a login that is a
 * guaranteed no-op: the login response carries the same `user`, `school`,
 * `tenant` and permission set `/me` returns (checked against the live endpoint —
 * identical keys, identical 282-key permission list), so the request buys
 * nothing and costs a round trip plus a `setAuthContext` dispatch that
 * re-renders the whole protected tree on the login hot path.
 *
 * Module state rather than Redux or storage, deliberately: it must NOT survive a
 * page reload, because a reload is exactly the case where the sync is still
 * wanted (the store rehydrates from persisted state of unknown age).
 */
let contextFromLogin = false;

/** Called when a login response writes the auth context. */
export function markAuthContextFromLogin(): void {
  contextFromLogin = true;
}

/**
 * Read the marker. Pure and repeatable, so it is safe to call from a `useState`
 * initialiser — StrictMode double-invokes those, and a consume-on-read would
 * hand the two calls different answers.
 */
export function isAuthContextFromLogin(): boolean {
  return contextFromLogin;
}

/** Clear the marker once it has been acted on, so later mounts sync again. */
export function clearAuthContextFromLogin(): void {
  contextFromLogin = false;
}
