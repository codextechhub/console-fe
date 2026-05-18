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
import { clearStorageItem } from "@/hooks/use-session-storage";
import { routesPath } from "@/routes/routesPath";
import { refreshTokenSingleFlight } from "@/utils/tokenRefresh";

const getAccessToken = () => {
  const token = Cookies.get("token");
  return token && token !== "undefined" ? token : "";
};

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const accessToken = getAccessToken();
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set("accept", "application/json");
    return headers;
  },
});

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

const extractFirstDetailError = (detail: unknown): string | null => {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return typeof detail[0] === "string" ? detail[0] : null;
  if (typeof detail === "object") {
    for (const key of Object.keys(detail as Record<string, unknown>)) {
      const found = extractFirstDetailError((detail as Record<string, unknown>)[key]);
      if (found) return found;
    }
  }
  return null;
};

const AUTH_URLS = [
  "login",
  "reset-password",
  "password/reset",
  "forgot-password",
  "activate",
  "special_login",
];

const isAuthRoute = (args: string | FetchArgs): boolean => {
  const url =
    typeof args === "string"
      ? args
      : typeof args === "object" && "url" in args && typeof args.url === "string"
        ? args.url
        : "";
  return AUTH_URLS.some((u) => url.includes(u));
};

export const baseQueryInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (!result?.error) return result;

  // FetchBaseQueryError uses a string status for transport-level failures
  // and a number for HTTP responses, so narrow access via `any`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = result.error;

  if (res?.status === 400 || res?.status === 422) {
    const message = extractFirstDetailError(res?.data?.error?.detail) || res?.data?.message;
    if (message) toast.error(message);
    return result;
  }

  if (res?.status === 401) {
    const refreshed = await refreshTokenSingleFlight();

    if (refreshed.ok) {
      // The singleton already updated cookies. Mirror access into Redux so any
      // selector reading state.auth.access stays consistent.
      api.dispatch(setToken(refreshed.access));

      // Role may have changed since last login — keep permissions fresh.
      const freshPermissions = await fetchFreshPermissions(refreshed.access);
      if (freshPermissions) api.dispatch(updatePermissions(freshPermissions));

      const retry = await baseQuery(args, api, extraOptions);
      if (retry?.error?.status === 401) {
        forceLogoutAndRedirect(api);
      }
      return retry;
    }

    if (refreshed.reason === "token_invalid") {
      if (isAuthRoute(args)) {
        const msg =
          extractFirstDetailError(res?.data?.error?.detail) ||
          res?.data?.message ||
          "Invalid credentials. Please try again.";
        toast.error(msg);
      } else {
        forceLogoutAndRedirect(api);
      }
      return result;
    }

    // network_error, server_error, no_token — transient. Keep the user signed
    // in; the failing query surfaces its own error. Do not show the misleading
    // "session could not be restored" toast.
    return result;
  }

  if (res?.status === 403) {
    if (!isAuthRoute(args)) {
      const msg =
        extractFirstDetailError(res?.data?.error?.detail) ||
        res?.data?.message ||
        "You don't have permission to perform this action.";
      toast.error(msg);
    }
    return result;
  }

  if (res?.status === 404) {
    if (!isAuthRoute(args)) toast.error(res?.data?.message || "Resource not found.");
    return result;
  }

  if (res?.status === 405) {
    toast.error(res?.data?.detail || "Something went wrong. Please try again.");
    return result;
  }

  if (res?.status === 413) {
    toast.error("Content Too Large");
    return result;
  }

  if (typeof res?.status === "number" && res.status >= 500) {
    toast.error("A server error occurred. Please try again later.");
    return result;
  }

  if (res?.status === "TIMEOUT_ERROR") toast.error("The request timed out. Please try again.");
  else if (res?.status === "FETCH_ERROR") toast.error("Could not reach the server. Please try again.");
  else if (res?.status === "PARSING_ERROR") toast.error("Unexpected response from the server. Please try again.");

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryInterceptor,
  endpoints: () => ({}),
  reducerPath: "baseApi",
  tagTypes: [
    "Users",
    "Role",
    "Schools",
    "Branches",
    "PlatformRoles",
    "PermissionGroups",
    "Permissions",
    "PermissionModules",
    "PermissionResources",
    "PermissionActions",
    "PermissionDependencies",
    "UserAssignments",
    "ChangeRequests",
    "AuditEvents",
    "AuditExports",
    "AuditDashboard",
    "EntityTrails",
    "ComplianceRules",
    "MyActivity",
    "LoginSessions",
    "AuthAttempts",
    "AccountLockouts",
    "ImpersonationSessions",
  ],
});
