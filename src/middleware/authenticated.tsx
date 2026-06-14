import { selectUser } from "@/redux/features/auth/auth-slice";
import { useGetMeQuery } from "@/redux/services/auth/auth-api";
import { routesPath } from "@/routes/routes-path";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router";
import { IDLE_MS, WARNING_MS } from "@/hooks/use-session-timeout";
import { getLastActivity } from "@/utils/session-activity";
import { isJwtExpired } from "@/utils/jwt";
import { endSession } from "@/utils/end-session";
import { captureReturnTo } from "@/utils/return-to";

const { LOGIN } = routesPath.AUTH;

// Same constants as the live idle-warning hook, imported so the on-reload
// check can never drift from the in-app behaviour.
const STALE_AFTER_MS = IDLE_MS + WARNING_MS;



// The gate decision is a deliberate once-per-mount snapshot of external state
// (cookies, last-activity timestamp, wall clock). It lives outside the
// component and is invoked from a lazy useState initialiser so the render
// itself stays pure — live expiry while mounted is handled by
// useSessionTimeout and the 401 interceptor, not by this gate.
function evaluateGate() {
  const accessToken = Cookies.get("token");
  const refreshToken = Cookies.get("refresh_token");

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

  return {
    shouldRedirect: !hasAccess || refreshExpired || idleTooLong,
    refreshExpired,
    idleTooLong,
  };
}

export default function Authenticated() {
  const [{ shouldRedirect, refreshExpired, idleTooLong }] = useState(evaluateGate);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!shouldRedirect) return;
    // Only show the expiry banner + clean up when there was an actual session
    // to end. A missing cookie just means "go log in" — no banner needed.
    if (refreshExpired || idleTooLong) {
      endSession(
        idleTooLong
          ? "Your session expired due to inactivity. Please log in to continue."
          : "Your session has expired. Please log in to continue."
      );
    }
    // Remember the page they were trying to reach so login can return them
    // there. Must run AFTER endSession (which clears sessionStorage).
    captureReturnTo();
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
