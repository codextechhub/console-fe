/**
 * Non-hook accessor for the caller's asserted tenant slug.
 *
 * RTK Query `query` callbacks are pure (they only receive their arg), but the
 * unified RBAC routes embed the tenant slug in the URL *path*
 * (`rbac/tenants/<slug>/roles/…`). Rather than thread the slug through every
 * page + hook call, we read it from the live store here. The store binds its
 * `getState` after creation (see store.ts) - no import cycle, because this
 * module imports nothing from the store at runtime.
 */

type AuthState = {
  auth?: {
    tenant?: { slug?: string } | null;
    impersonation?: { tenantSlug?: string } | null;
  };
};

/**
 * The tenant this app signs in to. school-fe reads its slug off the subdomain
 * it is served from (bright-star.xvs.codexng.com sends "bright-star"); the
 * console has no such subdomain and is always the platform tenant, so it sends
 * the constant. Sign-in and password reset are unauthenticated, so the slug
 * cannot come from the store the way getTenantSlug() reads it - one address may
 * now be an account at several tenants, and the backend has to be told which.
 */
export const PLATFORM_TENANT_SLUG = "codex";

let readState: (() => AuthState) | null = null;

export const bindTenantStore = (getState: () => AuthState): void => {
  readState = getState;
};

/**
 * The slug the caller asserts for RBAC paths: the impersonation target when a
 * session is active, otherwise the caller's own tenant. Empty string when the
 * session has no tenant yet (pre-login / legacy token) - the backend then 400s
 * with the "tenant required" message, which the auth flow already handles.
 */
export const getTenantSlug = (): string => {
  const state = readState?.();
  return state?.auth?.impersonation?.tenantSlug || state?.auth?.tenant?.slug || "";
};

/** Add the active tenant assertion to direct URLs that bypass RTK Query. */
export const appendTenantQuery = (url: string): string => {
  const tenant = getTenantSlug();
  if (!tenant) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tenant=${encodeURIComponent(tenant)}`;
};
