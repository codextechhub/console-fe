import { clearStorageItem } from "@/hooks/use-session-storage";
import { clearActivity } from "./session-activity";
import { blockSessionRestore, markSessionInvalidated } from "./token-refresh";

/**
 * Single client-side teardown for every "this session is over" path - logout,
 * idle expiry, dead refresh token, forced re-auth. Callers remain responsible
 * for backend revocation, dispatching resetAuth and the redirect; this handles
 * the shared local cleanup so no path can forget a step (the historical bug
 * was paths missing markSessionInvalidated, letting an in-flight refresh
 * resurrect cleared cookies).
 *
 * Order matters: clearStorageItem() wipes sessionStorage, so the banner is
 * written after it - the login page reads and clears it on mount.
 */
export function endSession(banner?: string): void {
  markSessionInvalidated();
  // Remove only the obsolete access cookie from pre-migration builds. The
  // refresh cookie is HttpOnly and can be cleared only by the backend.
  document.cookie = "token=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Strict";
  clearStorageItem();
  blockSessionRestore();
  clearActivity();
  // Persisted workspace selections are identity-scoped and must not cross the
  // next sign-in boundary.
  localStorage.removeItem("persist:root");
  if (banner) sessionStorage.setItem("_auth_banner", banner);
}
