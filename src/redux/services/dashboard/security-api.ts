import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type {
  LoginSession,
  AuthAttempt,
  AccountLockout,
  ImpersonationSession,
  PasswordReset,
  MyPasswordReset,
  PaginatedResponse,
  ProxyTarget,
} from "./security-types";

export const securityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Live sessions ───────────────────────────────────────────────────────
    getLoginSessions: builder.query<PaginatedResponse<LoginSession>, Record<string, string | number>>({
      query: (params) => ({ url: `/user/sessions/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["LoginSessions"],
    }),

    getMyLoginSessions: builder.query<PaginatedResponse<LoginSession>, Record<string, string | number>>({
      query: (params) => ({ url: `/user/sessions/mine/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["LoginSessions"],
    }),

    endMySession: builder.mutation<{ data: { ended_sessions: number } }, { session_id: string }>({
      query: ({ session_id }) => ({ url: `/user/sessions/${session_id}/end-mine/`, method: "POST" }),
      invalidatesTags: ["LoginSessions"],
    }),

    endAllMySessions: builder.mutation<{ data: { ended_sessions: number } }, void>({
      query: () => ({ url: `/user/sessions/end-all-mine/`, method: "POST" }),
      invalidatesTags: ["LoginSessions"],
    }),

    forceLogout: builder.mutation<{ data: { ended_sessions: number } }, { user_id?: string; session_id?: string; reason: string }>({
      query: (body) => ({ url: `/user/sessions/force-logout/`, method: "POST", body }),
      invalidatesTags: ["LoginSessions"],
    }),

    // ── Login attempts ──────────────────────────────────────────────────────
    getAuthAttempts: builder.query<PaginatedResponse<AuthAttempt>, Record<string, string | number>>({
      query: (params) => ({ url: `/user/auth-attempts/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["AuthAttempts"],
    }),

    getMyAuthAttempts: builder.query<PaginatedResponse<AuthAttempt>, Record<string, string | number>>({
      query: (params) => ({ url: `/user/auth-attempts/mine/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["AuthAttempts"],
    }),

    // ── Account lockouts ────────────────────────────────────────────────────
    getAccountLockouts: builder.query<PaginatedResponse<AccountLockout>, Record<string, string | number>>({
      query: (params) => ({ url: `/user/account-lockouts/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["AccountLockouts"],
    }),

    unlockAccount: builder.mutation<{ message: string }, { user_id: string; send_reset?: boolean }>({
      query: (body) => ({ url: `/user/account-lockouts/unlock/`, method: "POST", body }),
      invalidatesTags: ["AccountLockouts", "LoginSessions"],
    }),

    // ── Auth events (password & account activity admin view) ────────────────
    getAuthEvents: builder.query<PaginatedResponse<{
      id: string;
      event: string;
      created_at: string;
      actor_user_id?: string;
      target_user_id?: string;
      school_id?: string;
      ip_address?: string;
      user_agent?: string;
      metadata?: Record<string, unknown>;
    }>, Record<string, string | number>>({
      query: (params) => ({ url: `/user/auth-events/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["AuthAttempts"],
    }),

    // ── Impersonation sessions ──────────────────────────────────────────────
    getProxyTargets: builder.query<PaginatedResponse<ProxyTarget>, { tenant_slug: string; search: string; page?: number; page_size?: number }>({
      query: ({ tenant_slug, ...params }) => ({
        url: `/admin/impersonations/targets/`,
        method: "GET",
        params: { ...params, tenant: tenant_slug },
      }),
    }),

    getImpersonations: builder.query<PaginatedResponse<ImpersonationSession>, Record<string, string | number>>({
      query: (params) => ({ url: `/admin/impersonations/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["ImpersonationSessions"],
    }),

    // Start asserts the TARGET tenant's slug (?tenant=<slug>) — the one place a
    // platform admin addresses another tenant directly. Because the request
    // carries its own tenant param, the central injection leaves it untouched.
    startImpersonation: builder.mutation<{ data: ImpersonationSession }, { tenant_slug: string; target_user: number }>({
      query: ({ tenant_slug, ...body }) => ({
        url: `/admin/impersonations/start/`,
        method: "POST",
        body,
        params: { tenant: tenant_slug },
      }),
      invalidatesTags: ["ImpersonationSessions"],
    }),

    endImpersonation: builder.mutation<{ data: ImpersonationSession }, { session_id: number }>({
      query: (body) => ({ url: `/admin/impersonations/end/`, method: "POST", body }),
      invalidatesTags: ["ImpersonationSessions"],
    }),

    // ── Pending password resets (admin) ─────────────────────────────────────
    getPendingResets: builder.query<{ data: PasswordReset[] }, void>({
      query: () => ({ url: `/user/password-resets/`, method: "GET" }),
      providesTags: ["PasswordResets"],
    }),

    revokeReset: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({ url: `/user/password-resets/${id}/revoke/`, method: "POST" }),
      invalidatesTags: ["PasswordResets"],
    }),

    resendPasswordReset: builder.mutation<{ message: string }, { user_id: string }>({
      query: ({ user_id }) => ({ url: `/user/${user_id}/password-reset/`, method: "POST" }),
      invalidatesTags: ["PasswordResets"],
    }),

    // ── Self-service security stats ─────────────────────────────────────────
    getMySecurityStats: builder.query<{ data: { failed_attempts_7d: number } }, void>({
      query: () => ({ url: `/user/auth/me/stats/`, method: "GET" }),
    }),

    // ── Self-service password change ────────────────────────────────────────
    changeMyPassword: builder.mutation<{ message: string }, { current_password: string; password: string; confirm_password: string }>({
      query: (body) => ({ url: `/user/auth/password/change/`, method: "POST", body }),
    }),

    // ── Self-service password reset history ────────────────────────────────
    getMyPasswordResets: builder.query<{ data: MyPasswordReset[] }, void>({
      query: () => ({ url: `/user/auth/me/password-resets/`, method: "GET" }),
    }),
  }),
});

export const {
  useGetLoginSessionsQuery,
  useGetMyLoginSessionsQuery,
  useEndMySessionMutation,
  useEndAllMySessionsMutation,
  useForceLogoutMutation,
  useGetAuthAttemptsQuery,
  useGetMyAuthAttemptsQuery,
  useGetAccountLockoutsQuery,
  useUnlockAccountMutation,
  useGetMySecurityStatsQuery,
  useGetAuthEventsQuery,
  useGetImpersonationsQuery,
  useGetProxyTargetsQuery,
  useStartImpersonationMutation,
  useEndImpersonationMutation,
  useGetPendingResetsQuery,
  useRevokeResetMutation,
  useResendPasswordResetMutation,
  useChangeMyPasswordMutation,
  useGetMyPasswordResetsQuery,
} = securityApi;
