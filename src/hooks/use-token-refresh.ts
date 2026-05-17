import Cookies from "js-cookie";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { resetAuth, setToken } from "@/redux/features/auth/authSlice";
import { routesPath } from "@/routes/routesPath";
import { clearStorageItem } from "./use-session-storage";

// Module-level flag prevents concurrent refresh calls when navigating quickly.
let isRefreshing = false;

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
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const accessToken = Cookies.get("token") || "";
    const refreshToken = Cookies.get("refresh_token") || "";

    if (!accessToken || !refreshToken) return;
    if (!isExpiredOrExpiring(accessToken)) return;

    const doRefresh = async () => {
      if (isRefreshing) return;
      isRefreshing = true;

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/user/auth/token/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch {
        // Network error or server unreachable — leave the user logged in.
        // The next protected API call will surface the auth failure if needed.
        isRefreshing = false;
        return;
      }

      // Only log out when the server explicitly rejects the refresh token.
      if (response.status === 401 || response.status === 400) {
        isRefreshing = false;
        dispatch(resetAuth());
        Cookies.remove("token");
        Cookies.remove("refresh_token");
        clearStorageItem();
        sessionStorage.setItem("_auth_banner", "Your session has expired. Please log in to continue.");
        window.location.href = routesPath.AUTH.LOGIN;
        return;
      }

      // Any other non-OK status (500, 503…) — don't log out, just bail.
      if (!response.ok) {
        isRefreshing = false;
        return;
      }

      try {
        const data = await response.json();
        const newAccess = data?.data?.access;
        const newRefresh = data?.data?.refresh;
        if (newAccess) {
          Cookies.set("token", newAccess);
          dispatch(setToken(newAccess));
          if (newRefresh) Cookies.set("refresh_token", newRefresh);
        }
      } catch {
        // Malformed JSON — don't log out.
      } finally {
        isRefreshing = false;
      }
    };

    doRefresh();
  }, [location.pathname]);
}
