// Non-hook accessor for the caller's asserted tenant slug.
//
// RTK Query `query` callbacks are pure (they only receive their arg), but the
// unified RBAC routes embed the tenant slug in the URL *path*
// (`rbac/tenants/<slug>/roles/…`). Rather than thread the slug through every
// page + hook call, we read it from the live store here. The store binds its
// `getState` after creation (see store.ts) — no import cycle, because this
// module imports nothing from the store at runtime.

type AuthState = {
  auth?: {
    tenant?: { slug?: string } | null;
    impersonation?: { tenantSlug?: string } | null;
  };
};

let readState: (() => AuthState) | null = null;

export const bindTenantStore = (getState: () => AuthState): void => {
  readState = getState;
};

// The slug the caller asserts for RBAC paths: the impersonation target when a
// session is active, otherwise the caller's own tenant. Empty string when the
// session has no tenant yet (pre-login / legacy token) — the backend then 400s
// with the "tenant required" message, which the auth flow already handles.
export const getTenantSlug = (): string => {
  const state = readState?.();
  return state?.auth?.impersonation?.tenantSlug || state?.auth?.tenant?.slug || "";
};
