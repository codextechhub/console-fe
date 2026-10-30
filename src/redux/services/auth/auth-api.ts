import { resetAuth, setAuthContext, setAuthUser } from "@/redux/features/auth/auth-slice";
import { baseApi } from "../base-api";
import { routesPath } from "@/routes/routes-path";
import { markAuthContextFromLogin } from "@/utils/auth-context-freshness";
import { recordActivity } from "@/utils/session-activity";
import { resetSessionInvalidation } from "@/utils/token-refresh";
import { endSession } from "@/utils/end-session";
import { setAccessToken } from "@/utils/access-token";
import { readCsrfToken } from "@/utils/csrf";
import type { LoginResponse, MyTwoStep, TwoStepSetUpResponse } from "./auth-types";
import type {
  AuthSchool,
  AuthTenant,
  FieldAccessPayload,
  ProxyTargetIdentity,
  User,
} from "@/redux/features/auth/auth-types";
import { PLATFORM_TENANT_SLUG } from "@/utils/tenant-context";

/**
 * Make a finished sign-in this console's session.
 *
 * Shared by the password step, the ID card and the two-step code step, which
 * all answer alike.
 */
export function adoptSignIn(data: LoginResponse, dispatch: (action: unknown) => unknown): void {
  // A fresh, valid session - re-enable token refresh in case a prior
  // session in this JS context invalidated it.
  resetSessionInvalidation();
  setAccessToken(data?.data?.access || "");
  recordActivity();
  dispatch(setAuthUser(data?.data));
  // The context we just stored is authoritative, so Authenticated can
  // skip its mount-time /me sync for this one mount - see
  // auth-context-freshness.
  markAuthContextFromLogin();
}

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
        credentials: "include" as const,
        headers: { "X-Auth-Mode": "cookie" },
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          adoptSignIn(data, dispatch);
        } catch {
          // Login failed - the mutation hook surfaces the error to the page;
          // nothing to clean up because nothing was written yet. A refusal
          // asking for a two-step code is one of these: it carries no session.
        }
      },
    }),
    /**
     * The second step of a sign-in: a code from the authenticator app, or one
     * backup code, for the challenge the password step was refused with.
     * Answers as `login` does and is adopted the same way.
     */
    twoStepVerify: builder.mutation<
      LoginResponse,
      { challenge: string; code?: string; recovery_code?: string }
    >({
      query: (body) => ({
        url: `/user/auth/two-step/verify/`,
        method: "POST",
        body,
        credentials: "include" as const,
        headers: { "X-Auth-Mode": "cookie" },
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          adoptSignIn(data, dispatch);
        } catch {
          // A wrong code; the page shows it.
        }
      },
    }),
    /** A new secret to scan, for a sign-in refused with TWO_STEP_SET_UP_REQUIRED. */
    twoStepSetUp: builder.mutation<TwoStepSetUpResponse, { challenge: string }>({
      query: (body) => ({
        url: `/user/auth/two-step/set-up/`,
        method: "POST",
        body,
        credentials: "include" as const,
      }),
    }),
    /**
     * The first code from the new authenticator. Answers as `login` does, plus
     * the backup codes. Not adopted here: the page shows the backup codes
     * first and adopts the sign-in when they are saved, because a signed-in
     * console leaves the sign-in page at once.
     */
    twoStepConfirm: builder.mutation<
      LoginResponse & { data: { recovery_codes: string[] } },
      { challenge: string; code: string }
    >({
      query: (body) => ({
        url: `/user/auth/two-step/set-up/confirm/`,
        method: "POST",
        body,
        credentials: "include" as const,
        headers: { "X-Auth-Mode": "cookie" },
      }),
    }),
    /** Whether the signed-in person's two-step sign-in is set up, and how many backup codes are left. */
    getMyTwoStep: builder.query<{ message: string; data: MyTwoStep }, void>({
      query: () => ({ url: `/user/auth/me/two-step/`, method: "GET" }),
      providesTags: ["MyTwoStep"],
    }),
    /** Ten new backup codes for a code from the app; silent, the card shows a refusal. */
    renewMyBackupCodes: builder.mutation<
      { message: string; data: { recovery_codes: string[] } },
      { code: string }
    >({
      query: (body) => ({ url: `/user/auth/me/two-step/recovery-codes/`, method: "POST", body }),
      extraOptions: { silent: true },
      invalidatesTags: ["MyTwoStep"],
    }),
    specialLogin: builder.mutation<LoginResponse, { card_id: string; password: string }>({
      query: (credentials) => ({
        url: `/user/auth/login/`,
        method: "POST",
        body: credentials,
        credentials: "include" as const,
        headers: { "X-Auth-Mode": "cookie" },
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          adoptSignIn(data, dispatch);
        } catch {
          // The mutation result carries the authentication error to the card page.
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: `/user/auth/logout/`,
        method: "POST",
        body: {},
        credentials: "include" as const,
        headers: { "X-CSRFToken": readCsrfToken() },
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
      query: (cardId) => ({
        url: `/user/auth/special_login/preview/?card_id=${encodeURIComponent(cardId)}`,
        method: "GET",
      }),
    }),
    getMe: builder.query<{
      message: string;
      data: {
        user: User;
        school: AuthSchool | null;
        tenant: AuthTenant | null;
        permissions: string[];
        field_access?: FieldAccessPayload;
        active_impersonation?: {
          id: number;
          tenant_slug: string;
          target: ProxyTargetIdentity;
        };
      };
    }, void>({
      query: () => ({ url: `/user/auth/me/`, method: "GET" }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAuthContext({
            user: data.data.user,
            permissions: data.data.permissions,
            field_access: data.data.field_access ?? {},
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
  useSpecialLoginMutation,
  useTwoStepVerifyMutation,
  useTwoStepSetUpMutation,
  useTwoStepConfirmMutation,
  useGetMyTwoStepQuery,
  useRenewMyBackupCodesMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  usePasswordResetPreviewQuery,
  usePasswordResetConfirmMutation,
  useActivationPreviewQuery,
  useActivateAccountMutation,
  useSpecialLoginPreviewQuery,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi;
