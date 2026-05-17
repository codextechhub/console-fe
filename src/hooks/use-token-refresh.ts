import Cookies from "js-cookie";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { resetAuth, setToken } from "@/redux/features/auth/authSlice";
import { routesPath } from "@/routes/routesPath";
import { clearStorageItem } from "./use-session-storage";
import { refreshTokenSingleFlight } from "@/utils/tokenRefresh";

const REFRESH_BUFFER_SECONDS = 120; // refresh if token expires within 2 minutes

const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
};

const isExpiredOrExpiring = (token: string): boolean => {
  const exp = getTokenExpiry(token);
  if (!exp) return true;
  return Date.now() / 1000 >= exp - REFRESH_BUFFER_SECONDS;
};

export function useTokenRefresh() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const accessToken = Cookies.get("token") || "";
    const refreshToken = Cookies.get("refresh_token") || "";
    if (!accessToken || !refreshToken) return;
    if (!isExpiredOrExpiring(accessToken)) return;

    let cancelled = false;
    (async () => {
      const outcome = await refreshTokenSingleFlight();
      if (cancelled) return;

      if (outcome.ok) {
        // Cookies were already written by the singleton. Mirror access into
        // Redux so selectors reading state.auth.access stay consistent.
        dispatch(setToken(outcome.access));
        return;
      }

      // Only force-logout when the server says the refresh token is invalid.
      // Transient errors (5xx, network, no_token) leave the user signed in;
      // the next protected API call will retry via baseApi's 401 handler.
      if (outcome.reason === "token_invalid") {
        dispatch(resetAuth());
        Cookies.remove("token");
        Cookies.remove("refresh_token");
        clearStorageItem();
        sessionStorage.setItem(
          "_auth_banner",
          "Your session has expired. Please log in to continue.",
        );
        window.location.href = routesPath.AUTH.LOGIN;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, dispatch]);
}
