/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../baseApi";
import type { TeamMemberRes, TeamMembersRes } from "./type";

export const teamMgtApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeamMembers: builder.query<
      TeamMembersRes,
      Record<string, string | number>
    >({
      query: (payload) => ({
        url: `/user/users/${generateQueryString(payload)}`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    getTeamMembersDetails: builder.query<TeamMemberRes, string>({
      query: (user_id) => ({
        url: `/user/users/${user_id}/`,
        method: "GET",
      }),
    }),
    resendInvite: builder.mutation({
      query: (user_id) => ({
        url: `/user/${user_id}/invite/resend/`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    createTeamMember: builder.mutation({
      query: (payload) => ({
        url: `/user/users/`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Users"],
    }),
    updateTeamMember: builder.mutation({
      query: (payload) => ({
        url: `/user/users/${payload.id}/`,
        method: "PATCH",
        body: payload.body,
      }),
      invalidatesTags: ["Users"],
    }),
    suspendTeamMember: builder.mutation({
      query: (user_id) => ({
        url: `/user/${user_id}/suspend/`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    reactivateTeamMember: builder.mutation({
      query: (user_id) => ({
        url: `/user/${user_id}/reactivate/`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    unlockTeamMember: builder.mutation({
      query: (user_id) => ({
        url: `/user/${user_id}/unlock/`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    adminPasswordReset: builder.mutation({
      query: (user_id) => ({
        url: `/user/${user_id}/password-reset/`,
        method: "POST",
      }),
    }),
    changeUserEmail: builder.mutation<{ message: string }, { user_id: string; email: string }>({
      query: ({ user_id, email }) => ({
        url: `/user/${user_id}/email/change/`,
        method: "PATCH",
        body: { email },
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetTeamMembersQuery,
  useResendInviteMutation,
  useCreateTeamMemberMutation,
  useGetTeamMembersDetailsQuery,
  useUpdateTeamMemberMutation,
  useSuspendTeamMemberMutation,
  useReactivateTeamMemberMutation,
  useUnlockTeamMemberMutation,
  useAdminPasswordResetMutation,
  useChangeUserEmailMutation,
} = teamMgtApi;
