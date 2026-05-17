import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { resetAuth, setToken, updatePermissions } from "../features/auth/authSlice";
import { toast } from "sonner";
import Cookies from "js-cookie";
import type { RootState } from "../features/root-reducer";
import { clearStorageItem } from "@/hooks/use-session-storage";
import { routesPath } from "@/routes/routesPath";

const getAccessToken = () => {
  const token = Cookies.get("token");
  return token && token !== "undefined" ? token : "";
};
// const getRefreshToken = () => Cookies.get("refresh_token") || ""; // No needed

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  prepareHeaders: (headers, {}) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

type RefreshOutcome =
  | { ok: true; access: string }
  | { ok: false; reason: "token_invalid" | "network_error" | "server_error" };

let refreshInFlight: Promise<RefreshOutcome> | null = null;
let sessionRecoveryInProgress = false;

const forceLogoutAndRedirect = (api: Parameters<BaseQueryFn>[1]) => {
  if (sessionRecoveryInProgress) return;
  sessionRecoveryInProgress = true;
  api.dispatch(resetAuth());
  Cookies.remove("token");
  Cookies.remove("refresh_token");
  clearStorageItem();
  window.location.href = routesPath.AUTH.LOGIN;
};

const refreshTokenRequest = async (refreshToken?: string): Promise<RefreshOutcome> => {
  if (!refreshToken) return { ok: false, reason: "token_invalid" };
  try {
    const response = await fetch(`${baseUrl}/user/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (response.status >= 500) return { ok: false, reason: "server_error" };
    if (!response.ok) return { ok: false, reason: "token_invalid" };
    const data = await response.json();
    const access = data?.data?.access;
    if (!access) return { ok: false, reason: "token_invalid" };
    return { ok: true, access };
  } catch {
    return { ok: false, reason: "network_error" };
  }
};

const refreshTokenRequestSingleFlight = (refreshToken?: string): Promise<RefreshOutcome> => {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokenRequest(refreshToken).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const fetchFreshPermissions = async (accessToken: string): Promise<string[] | null> => {
  try {
    const response = await fetch(`${baseUrl}/user/auth/me/`, {
      headers: { Authorization: `Bearer ${accessToken}`, accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.permissions ?? null;
  } catch {
    return null;
  }
};

const extractFirstDetailError = (detail: any): string | null => {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return typeof detail[0] === "string" ? detail[0] : null;
  if (typeof detail === "object") {
    for (const key of Object.keys(detail)) {
      const found = extractFirstDetailError(detail[key]);
      if (found) return found;
    }
  }
  return null;
};

export const baseQueryInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result?.error) {
    const res: any = result?.error;

    if (res?.status === 400 || res?.status === 422) {
      const specific = extractFirstDetailError(res?.data?.error?.detail);
      const message = specific || res?.data?.message;
      if (message) toast.error(message);
      return result;
    } else if (res?.status === 401) {
      // Get the refresh token from the redux store
      const refreshToken =
        (api.getState() as RootState)?.auth.refresh ||
        Cookies.get("refresh_token") ||
        "";

      const refreshed = await refreshTokenRequestSingleFlight(refreshToken);

      if (refreshed.ok) {
        Cookies.set("token", refreshed.access);
        api.dispatch(setToken(refreshed.access));

        // Sync permissions — role may have changed since last login
        const freshPermissions = await fetchFreshPermissions(refreshed.access);
        if (freshPermissions) api.dispatch(updatePermissions(freshPermissions));

        const retryResult = await baseQuery(args, api, extraOptions);
        if (retryResult?.error?.status === 401) {
          forceLogoutAndRedirect(api);
          return retryResult;
        }
        return retryResult;
      } else if (refreshed.reason === "network_error") {
        // The server was just reached (it returned 401), so this is a transient
        // issue with the refresh endpoint — not a connectivity problem. Return the
        // original result silently; the component will surface the error.
        return result;
      } else if (refreshed.reason === "server_error") {
        toast.error("Your session could not be restored. Please log in again.");
        forceLogoutAndRedirect(api);
      } else {
        // token_invalid — logout unless on an auth page
        const authUrls = ["login", "reset-password", "password/reset", "forgot-password", "activate", "special_login"];
        const isAuthRoute =
          typeof args === "string"
            ? authUrls.some((u) => args.includes(u))
            : typeof args === "object" &&
                "url" in args &&
                typeof args.url === "string"
              ? authUrls.some((u) => (args as { url: string }).url.includes(u))
              : false;
        if (isAuthRoute) {
          const errorMsg =
            extractFirstDetailError(res?.data?.error?.detail) ||
            res?.data?.message ||
            "Invalid credentials. Please try again.";
          toast.error(errorMsg);
        } else {
          forceLogoutAndRedirect(api);
        }
      }
    } else if (res?.status === 403) {
      const authUrls = ["login", "reset-password", "password/reset", "forgot-password", "activate"];
      const isAuthRoute =
        typeof args === "string"
          ? authUrls.some((u) => args.includes(u))
          : typeof args === "object" && "url" in args && typeof args.url === "string"
            ? authUrls.some((u) => (args as { url: string }).url.includes(u))
            : false;
      if (!isAuthRoute) {
        const errorMsg =
          extractFirstDetailError(res?.data?.error?.detail) ||
          res?.data?.message ||
          "You don't have permission to perform this action.";
        toast.error(errorMsg);
      }
    } else if (res?.status === 404) {
      const authUrls = ["login", "reset-password", "password/reset", "forgot-password", "activate", "special_login"];
      const isAuthRoute =
        typeof args === "string"
          ? authUrls.some((u) => args.includes(u))
          : typeof args === "object" && "url" in args && typeof args.url === "string"
            ? authUrls.some((u) => (args as { url: string }).url.includes(u))
            : false;
      if (!isAuthRoute) toast.error(res?.data?.message || "Resource not found.");
    } else if (res?.status === 405) {
      toast.error(res?.data?.detail || "Something went wrong. Please try again.");
    } else if (res?.status === 413) {
      toast.error("Content Too Large");
      return result;
    } else if (typeof res?.status === "number" && res.status >= 500) {
      toast.error("A server error occurred. Please try again later.");
    } else if (res?.status === "TIMEOUT_ERROR") {
      toast.error("The request timed out. Please try again.");
    } else if (res?.status === "FETCH_ERROR") {
      toast.error("Could not reach the server. Please try again.");
    } else if (res?.status === "PARSING_ERROR") {
      toast.error("Unexpected response from the server. Please try again.");
    }
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryInterceptor,
  endpoints: () => ({}),
  reducerPath: "baseApi",
  tagTypes: ["Users", "Role", "Schools", "Branches", "PlatformRoles", "PermissionGroups", "Permissions", "PermissionModules", "PermissionResources", "PermissionActions", "PermissionDependencies", "UserAssignments", "ChangeRequests"],
});
