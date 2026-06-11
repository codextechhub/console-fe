import Cookies from "js-cookie";
import { clearStorageItem } from "@/hooks/use-session-storage";
import { clearActivity } from "./sessionActivity";
import { markSessionInvalidated } from "./tokenRefresh";

/**
 * Single client-side teardown for every "this session is over" path — logout,
 * idle expiry, dead refresh token, forced re-auth. Callers remain responsible
 * for backend revocation, dispatching resetAuth and the redirect; this handles
 * the shared local cleanup so no path can forget a step (the historical bug
 * was paths missing markSessionInvalidated, letting an in-flight refresh
 * resurrect cleared cookies).
 *
 * Order matters: clearStorageItem() wipes sessionStorage, so the banner is
 * written after it — the login page reads and clears it on mount.
 */
export function endSession(banner?: string): void {
  markSessionInvalidated();
  Cookies.remove("token");
  Cookies.remove("refresh_token");
  clearStorageItem();
  clearActivity();
  if (banner) sessionStorage.setItem("_auth_banner", banner);
}
