import { resetAuth, setAuthContext, setAuthUser } from "@/redux/features/auth/auth-slice";
import { baseApi } from "../base-api";
import { routesPath } from "@/routes/routes-path";
import { markAuthContextFromLogin } from "@/utils/auth-context-freshness";
import { recordActivity } from "@/utils/session-activity";
import { resetSessionInvalidation, setAuthCookies } from "@/utils/token-refresh";
import { endSession } from "@/utils/end-session";
import type { LoginResponse } from "./auth-types";
import type { AuthSchool, AuthTenant, User } from "@/redux/features/auth/auth-types";
import { PLATFORM_TENANT_SLUG } from "@/utils/tenant-context";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      // The tenant is added here, not at the call sites: an address can now be
      // an account at more than one tenant, so "find the user by email" is only
      // unambiguous once the sign-in names the tenant it is addressed to. Every
      // login this app makes is a platform login, so there is nothing for a
      // page to decide - see PLATFORM_TENANT_SLUG.
      query: (user) => ({
        url: `/user/auth/login/`,
        method: "POST",
        body: { ...user, tenant: PLATFORM_TENANT_SLUG },
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          const {data} = result;
          // A fresh, valid session - re-enable token refresh in case a prior
          // session in this JS context invalidated it.
          resetSessionInvalidation();
          setAuthCookies(data?.data?.access || "", data?.data?.refresh || "");
          recordActivity();
          dispatch(setAuthUser(data?.data));
          // The context we just stored is authoritative, so Authenticated can
          // skip its mount-time /me sync for this one mount - see
          // auth-context-freshness.
          markAuthContextFromLogin();
        } catch {
          // Login failed - the mutation hook surfaces the error to the page;
          // nothing to clean up because nothing was written yet.
        }
      },
    }),
    logout: builder.mutation({
      query: (token) => ({
        url: `/user/auth/logout/`,
        method: "POST",
         body: token,
        credentials: "include" as const
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } catch {
          // Server-side revocation failed - proceed with client-side cleanup anyway.
        } finally {
          endSession();
          dispatch(resetAuth());
          window.location.href = routesPath.AUTH.LOGIN;
        }
      },
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      // Scoped to the same tenant as login, and for the same reason: a reset
      // asked for here must never rewrite the password of an account that
      // shares the address at a school.
      query: (payload) => ({
        url: `/user/auth/password/reset/request/`,
        method: "POST",
        body: { ...payload, tenant: PLATFORM_TENANT_SLUG },
      }),
    }),
    passwordResetPreview: builder.query<{ message: string; data: { email: string; full_name: string } }, string>({
      query: (activation_key) => ({
        url: `/user/auth/reset-password/${activation_key}/preview/`,
        method: "GET",
      }),
    }),
    passwordResetConfirm: builder.mutation<{ message: string }, { activation_key: string; password: string; confirm_password: string }>({
      query: ({ activation_key, ...body }) => ({
        url: `/user/auth/password/reset/${activation_key}/confirm/`,
        method: "POST",
        body,
      }),
    }),
    activationPreview: builder.query<{ message: string; data: { email: string; full_name: string } }, string>({
      query: (activation_key) => ({
        url: `/user/auth/activate/${activation_key}/preview/`,
        method: "GET",
      }),
    }),
    activateAccount: builder.mutation<LoginResponse, { activation_key: string; password: string; confirm_password: string }>({
      query: ({ activation_key, ...body }) => ({
        url: `/user/auth/activate/${activation_key}/`,
        method: "POST",
        body,
      }),
    }),
    specialLoginPreview: builder.query<{ message: string; data: { full_name: string } }, string>({
      query: (email) => ({
        url: `/user/auth/special_login/preview/?email=${encodeURIComponent(email)}`,
        method: "GET",
      }),
    }),
    getMe: builder.query<{ message: string; data: { user: User; school: AuthSchool | null; tenant: AuthTenant | null; permissions: string[] } }, void>({
      query: () => ({ url: `/user/auth/me/`, method: "GET" }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAuthContext({
            user: data.data.user,
            permissions: data.data.permissions,
            school: data.data.school ?? null,
            tenant: data.data.tenant ?? null,
          }));
        } catch {
          // /me failed (e.g. transient 5xx) - keep the persisted permissions;
          // the 401 interceptor handles a genuinely dead session.
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  usePasswordResetPreviewQuery,
  usePasswordResetConfirmMutation,
  useActivationPreviewQuery,
  useActivateAccountMutation,
  useSpecialLoginPreviewQuery,
  useGetMeQuery,
} = authApi;
