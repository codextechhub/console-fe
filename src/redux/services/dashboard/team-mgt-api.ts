 
import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type { TeamMemberRes, TeamMembersRes } from "./dashboard-types";

export interface BulkUploadRowError {
  row: number;
  email: string;
  errors: Record<string, unknown>;
}
export interface BulkUploadRes {
  message: string;
  data: {
    summary: { created: number; failed: number };
    created: { row: number; id: string; email: string }[];
    errors: BulkUploadRowError[];
  };
}

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
    // Promote a DRAFT user into the normal approval/invite flow. `role` is only
    // needed when the draft doesn't already have one.
    submitDraftUser: builder.mutation<unknown, { id: string; role?: string }>({
      query: ({ id, role }) => ({
        url: `/user/users/${id}/submit/`,
        method: "POST",
        body: role ? { role } : {},
      }),
      invalidatesTags: ["Users"],
    }),
    // Download the CSV template (blob so we can trigger a file save with auth).
    getBulkUserTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/user/users/bulk-template/`,
        method: "GET",
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),
    bulkUploadUsers: builder.mutation<BulkUploadRes, FormData>({
      query: (formData) => ({
        url: `/user/users/bulk-upload/`,
        method: "POST",
        body: formData,
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
  useSubmitDraftUserMutation,
  useLazyGetBulkUserTemplateQuery,
  useBulkUploadUsersMutation,
  useGetTeamMembersDetailsQuery,
  useUpdateTeamMemberMutation,
  useSuspendTeamMemberMutation,
  useReactivateTeamMemberMutation,
  useUnlockTeamMemberMutation,
  useAdminPasswordResetMutation,
  useChangeUserEmailMutation,
} = teamMgtApi;
