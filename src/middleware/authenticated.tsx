import { selectUser } from "@/redux/features/auth/authSlice";
import { useGetMeQuery } from "@/redux/services/auth/authApi";
import { routesPath } from "@/routes/routesPath";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router";
import { clearStorageItem } from "@/hooks/use-session-storage";
import { clearActivity, getLastActivity } from "@/utils/sessionActivity";
import { markSessionInvalidated } from "@/utils/tokenRefresh";

const { LOGIN } = routesPath.AUTH;

// Mirrors useSessionTimeout. If these diverge, the on-reload check would
// drift from the live idle-warning behavior.
const IDLE_MS = 14 * 60 * 1000;
const WARNING_MS = 1 * 60 * 1000;
const STALE_AFTER_MS = IDLE_MS + WARNING_MS;

function getJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isJwtExpired(token: string): boolean {
  const exp = getJwtExp(token);
  if (!exp) return true; // unparseable token is treated as expired
  return Date.now() / 1000 >= exp;
}

function killSession(message: string) {
  // Block any in-flight refresh from resurrecting the cookies we clear here.
  markSessionInvalidated();
  Cookies.remove("token");
  Cookies.remove("refresh_token");
  clearStorageItem();
  clearActivity();
  sessionStorage.setItem("_auth_banner", message);
}

export default function Authenticated() {
  const accessToken = Cookies.get("token");
  const refreshToken = Cookies.get("refresh_token");
  const user = useSelector(selectUser);

  const hasAccess = !!accessToken && accessToken !== "undefined";
  const hasRefresh = !!refreshToken && refreshToken !== "undefined";

  // Refresh token expired → silent refresh can't recover. Force logout.
  const refreshExpired = hasRefresh && isJwtExpired(refreshToken!);

  // Idle gap longer than the in-app warning window → treat as expired.
  // Skip the check when no activity has ever been recorded (e.g. a brand-new
  // login on this device) so first-time users aren't immediately bounced.
  const lastActivity = getLastActivity();
  const idleTooLong =
    lastActivity !== null && Date.now() - lastActivity >= STALE_AFTER_MS;

  const shouldRedirect = !hasAccess || refreshExpired || idleTooLong;

  useEffect(() => {
    if (!shouldRedirect) return;
    // Only show the expiry banner + clean up when there was an actual session
    // to end. A missing cookie just means "go log in" — no banner needed.
    if (refreshExpired || idleTooLong) {
      killSession(
        idleTooLong
          ? "Your session expired due to inactivity. Please log in to continue."
          : "Your session has expired. Please log in to continue."
      );
    }
    // Hard-redirect (full reload) rather than an in-SPA navigate so all the
    // stale in-memory state from the dead session — Redux store, RTK Query
    // cache, module-level refresh/logout flags — is torn down. This keeps every
    // logout path consistent and prevents a stale token leaking into the next
    // login attempt.
    window.location.replace(LOGIN);
  }, [shouldRedirect, refreshExpired, idleTooLong]);

  // Sync permissions on mount — catches role changes that happened while the
  // token was still valid. onQueryStarted in getMe dispatches updatePermissions.
  useGetMeQuery(undefined, { skip: shouldRedirect });

  useEffect(() => {
    document.title = user?.first_name
      ? `${user.first_name} - Intranet`
      : "CX - Intranet";
  }, [user?.first_name]);

  if (shouldRedirect) return null;

  return <Outlet />;
}
