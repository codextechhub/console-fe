import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../baseApi";
import type {
  LoginSession,
  AuthAttempt,
  AccountLockout,
  ImpersonationSession,
  PasswordReset,
  PaginatedResponse,
} from "./securityTypes";

export const securityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Live sessions ───────────────────────────────────────────────────────
    getLoginSessions: builder.query<PaginatedResponse<LoginSession>, Record<string, string | number>>({
      query: (params) => ({ url: `/user/sessions/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["LoginSessions"],
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
    getImpersonations: builder.query<PaginatedResponse<ImpersonationSession>, Record<string, string | number>>({
      query: (params) => ({ url: `/admin/impersonations/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["ImpersonationSessions"],
    }),

    startImpersonation: builder.mutation<{ data: ImpersonationSession }, { school: number; target_user: number; justification: string; duration_minutes?: number }>({
      query: (body) => ({ url: `/admin/impersonations/start/`, method: "POST", body }),
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

    // ── Self-service password change ────────────────────────────────────────
    changeMyPassword: builder.mutation<{ message: string }, { old_password: string; new_password: string }>({
      query: (body) => ({ url: `/user/auth/password/change/`, method: "POST", body }),
    }),
  }),
});

export const {
  useGetLoginSessionsQuery,
  useForceLogoutMutation,
  useGetAuthAttemptsQuery,
  useGetAccountLockoutsQuery,
  useUnlockAccountMutation,
  useGetAuthEventsQuery,
  useGetImpersonationsQuery,
  useStartImpersonationMutation,
  useEndImpersonationMutation,
  useGetPendingResetsQuery,
  useRevokeResetMutation,
  useResendPasswordResetMutation,
  useChangeMyPasswordMutation,
} = securityApi;
