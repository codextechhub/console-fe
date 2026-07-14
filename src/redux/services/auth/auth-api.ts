import { resetAuth, setAuthUser, updatePermissions, updateSchool, updateTenant } from "@/redux/features/auth/auth-slice";
import { baseApi } from "../base-api";
import { routesPath } from "@/routes/routes-path";
import { recordActivity } from "@/utils/session-activity";
import { resetSessionInvalidation, setAuthCookies } from "@/utils/token-refresh";
import { endSession } from "@/utils/end-session";
import type { LoginResponse } from "./auth-types";
import type { AuthSchool, AuthTenant } from "@/redux/features/auth/auth-types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (user) => ({
        url: `/user/auth/login/`,
        method: "POST",
        body: user,
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          const {data} = result;
          // A fresh, valid session — re-enable token refresh in case a prior
          // session in this JS context invalidated it.
          resetSessionInvalidation();
          setAuthCookies(data?.data?.access || "", data?.data?.refresh || "");
          recordActivity();
          dispatch(setAuthUser(data?.data));
        } catch {
          // Login failed — the mutation hook surfaces the error to the page;
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
          // Server-side revocation failed — proceed with client-side cleanup anyway.
        } finally {
          endSession();
          dispatch(resetAuth());
          window.location.href = routesPath.AUTH.LOGIN;
        }
      },
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (payload) => ({
        url: `/user/auth/password/reset/request/`,
        method: "POST",
        body: payload,
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
    getMe: builder.query<{ message: string; data: { user: unknown; school: AuthSchool | null; tenant: AuthTenant | null; permissions: string[] } }, void>({
      query: () => ({ url: `/user/auth/me/`, method: "GET" }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(updatePermissions(data.data.permissions));
          dispatch(updateSchool(data.data.school ?? null));
          dispatch(updateTenant(data.data.tenant ?? null));
        } catch {
          // /me failed (e.g. transient 5xx) — keep the persisted permissions;
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
