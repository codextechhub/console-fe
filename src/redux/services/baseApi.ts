import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { resetAuth, setToken } from "../features/auth/authSlice";
import { toast } from "sonner";
import Cookies from "js-cookie";
import type { RootState } from "../features/root-reducer";
import { clearStorageItem } from "@/hooks/use-session-storage";
import { routesPath } from "@/routes/routesPath";

// Helper to get tokens from cookies
const getAccessToken = () => Cookies.get("token") || "";
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

// Refresh token request
const refreshTokenRequest = async (refreshToken?: string) => {
  const accessToken = getAccessToken();
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${baseUrl}/user/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
         redirect: 'follow',
         Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data;
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
    console.log(res, "api")
    
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

      // Try refresh token
      const refreshed = await refreshTokenRequest(refreshToken);

      if (
        refreshed?.detail !== "Invalid or expired token." &&
        refreshed?.access
      ) {
        // Store new tokens
        Cookies.set("token", refreshed?.access);
        api.dispatch(setToken(refreshed?.access)); // reset token in store

        // Retry original request with new token
        const retryResult = await baseQuery(args, api, extraOptions);
        // If still unauthorized, force logout
        if (retryResult?.error?.status === 401) {
          api.dispatch(resetAuth());
          Cookies.remove("token");
          Cookies.remove("refresh_token");
          clearStorageItem();
          window.location.href = routesPath.AUTH.LOGIN;
          return retryResult; // Return the failed retry result
        }
        return retryResult; // Return the failed retry result
      } else {
        // Refresh failed, force logout
        const authUrls = ["login", "reset-password", "password/reset", "forgot-password"];
        const isAuthRoute =
          typeof args === "string"
            ? authUrls.some((u) => args.includes(u))
            : typeof args === "object" &&
                "url" in args &&
                typeof args.url === "string"
              ? authUrls.some((u) => (args as { url: string }).url.includes(u))
              : false;
        if (isAuthRoute) {
          // Just show error for auth routes
          toast.error(res?.detail || "Authentication failed.");
        } else {
          // Force logout for non-auth routes

          api.dispatch(resetAuth());
          Cookies.remove("token");
          Cookies.remove("refresh_token");
          clearStorageItem();
          window.location.href = routesPath.AUTH.LOGIN;
        }
      }
    } else if (res?.status === 403) {
      toast.error("You don't have permission to perform this action.");
    } else if (res?.status === 404) {
      toast.error(res?.data?.message || "Resource not found.");
    } else if (res?.status === 405) {
      toast.error("Unauthorized. Please log in again.");
    } else if (res?.status === 413) {
      toast.error("Content Too Large");
      return result;
    } else if (res?.status === 405) {
      toast.error(res?.data?.detail || "Something went wrong. Please try again.");
      return result;
    } else if (typeof res?.status === "number" && res.status >= 500) {
      toast.error("A server error occurred. Please try again later.");
    } else if (res?.status === "FETCH_ERROR" || res?.status === "TIMEOUT_ERROR") {
      toast.error("Network error. Check your connection and try again.");
    }
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryInterceptor,
  endpoints: () => ({}),
  reducerPath: "baseApi",
  tagTypes: ["Users", "Role", "Schools", "Branches"],
});
