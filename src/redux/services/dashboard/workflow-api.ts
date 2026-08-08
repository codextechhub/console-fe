import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type {
  ApprovalDelegation,
  ApprovalDelegationsResponse,
  ApproverPreviewPayload,
  ApproverPreviewResult,
  DelegationWritePayload,
  PendingApprovalsResponse,
  PublishTemplatePayload,
  TeamLoadRow,
  VoteAction,
  WorkflowInstance,
  WorkflowInstanceDetail,
  WorkflowInstancesResponse,
  WorkflowTemplate,
  WorkflowTemplatesResponse,
} from "./workflow-types";

type QueryParams = Record<string, string | number>;

// A workflow vote/withdraw/cancel/reverse changes the state of the *business
// document* underneath (a requisition, PO or vendor invoice), so those consoles'
// list / summary / detail caches must drop alongside the workflow caches -
// otherwise a status only refreshes after a manual refetch. RTK only refetches
// mounted queries, so the cross-domain tags are effectively free off-screen.
const PROC_DOC_TAGS = [
  "ProcRequisitions", "ProcPurchaseOrders", "ProcVendorInvoices", "ProcVendorPayments",
] as const;

export const workflowApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Templates ───────────────────────────────────────────────────────────
    getWorkflowTemplates: builder.query<WorkflowTemplatesResponse, QueryParams>({
      query: (params) => ({ url: `/workflow/templates/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["WorkflowTemplates"],
    }),

    getWorkflowTemplate: builder.query<WorkflowTemplate, string>({
      query: (id) => ({ url: `/workflow/templates/${id}/`, method: "GET" }),
      providesTags: ["WorkflowTemplates"],
    }),

    publishWorkflowTemplate: builder.mutation<WorkflowTemplate, PublishTemplatePayload>({
      query: (body) => ({ url: `/workflow/templates/publish/`, method: "POST", body }),
      invalidatesTags: ["WorkflowTemplates"],
    }),

    // ── Instances ───────────────────────────────────────────────────────────
    getWorkflowInstances: builder.query<WorkflowInstancesResponse, QueryParams>({
      query: (params) => ({ url: `/workflow/instances/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["WorkflowInstances"],
    }),

    getWorkflowInstance: builder.query<WorkflowInstanceDetail, string>({
      query: (id) => ({ url: `/workflow/instances/${id}/`, method: "GET" }),
      providesTags: ["WorkflowInstances"],
    }),

    // Approver vote - APPROVED / REJECTED / RETURNED.
    recordWorkflowAction: builder.mutation<
      WorkflowInstanceDetail,
      { id: string; action: VoteAction; comment?: string }
    >({
      query: ({ id, action, comment }) => ({
        url: `/workflow/instances/${id}/actions/`,
        method: "POST",
        body: { action, comment: comment ?? "" },
      }),
      invalidatesTags: ["WorkflowInstances", "WorkflowPending", "WorkflowSubmissions", "WorkflowTeamLoad", ...PROC_DOC_TAGS],
    }),

    withdrawWorkflowInstance: builder.mutation<WorkflowInstanceDetail, string>({
      query: (id) => ({ url: `/workflow/instances/${id}/withdraw/`, method: "POST" }),
      invalidatesTags: ["WorkflowInstances", "WorkflowSubmissions", "WorkflowPending", "WorkflowTeamLoad", ...PROC_DOC_TAGS],
    }),

    resubmitWorkflowInstance: builder.mutation<WorkflowInstanceDetail, string>({
      query: (id) => ({ url: `/workflow/instances/${id}/resubmit/`, method: "POST" }),
      invalidatesTags: ["WorkflowInstances", "WorkflowSubmissions", "WorkflowPending", "WorkflowTeamLoad", ...PROC_DOC_TAGS],
    }),

    cancelWorkflowInstance: builder.mutation<WorkflowInstanceDetail, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/workflow/instances/${id}/cancel/`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["WorkflowInstances", "WorkflowSubmissions", "WorkflowPending", "WorkflowTeamLoad", ...PROC_DOC_TAGS],
    }),

    // Admin reverses a recorded vote and re-activates the stage.
    reverseWorkflowAction: builder.mutation<{ reversal_action_id: string }, { action_id: string; reason: string }>({
      query: ({ action_id, reason }) => ({
        url: `/workflow/actions/${action_id}/reverse/`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["WorkflowInstances", "WorkflowPending", "WorkflowTeamLoad", ...PROC_DOC_TAGS],
    }),

    // ── Dashboards ──────────────────────────────────────────────────────────
    getPendingApprovals: builder.query<PendingApprovalsResponse, void>({
      query: () => ({ url: `/workflow/dashboard/pending/`, method: "GET" }),
      providesTags: ["WorkflowPending"],
    }),

    getMySubmissions: builder.query<WorkflowInstance[], QueryParams | void>({
      query: (params) => ({
        url: `/workflow/dashboard/submitted/${params ? generateQueryString(params) : ""}`,
        method: "GET",
      }),
      providesTags: ["WorkflowSubmissions"],
    }),

    // ── Notifications bell (background polls) ────────────────────────────────
    // Same data as the foreground endpoints, but marked `silent` so a transient
    // 5xx on the focus-resume poll never shows a global error toast. They share
    // the same tags, so foreground mutations still invalidate the bell.
    getPendingApprovalsBell: builder.query<PendingApprovalsResponse, void>({
      query: () => ({ url: `/workflow/dashboard/pending/`, method: "GET" }),
      extraOptions: { silent: true },
      providesTags: ["WorkflowPending"],
    }),
    getReturnedSubmissionsBell: builder.query<WorkflowInstance[], void>({
      query: () => ({ url: `/workflow/dashboard/submitted/?status=RETURNED`, method: "GET" }),
      extraOptions: { silent: true },
      providesTags: ["WorkflowSubmissions"],
    }),

    getTeamLoad: builder.query<TeamLoadRow[], void>({
      query: () => ({ url: `/workflow/dashboard/team-load/`, method: "GET" }),
      providesTags: ["WorkflowTeamLoad"],
    }),

    // ── Delegations ─────────────────────────────────────────────────────────
    getDelegations: builder.query<ApprovalDelegationsResponse, QueryParams>({
      query: (params) => ({ url: `/workflow/delegations/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["WorkflowDelegations"],
    }),

    createDelegation: builder.mutation<ApprovalDelegation, DelegationWritePayload>({
      query: (body) => ({ url: `/workflow/delegations/`, method: "POST", body }),
      invalidatesTags: ["WorkflowDelegations"],
    }),

    updateDelegation: builder.mutation<ApprovalDelegation, { id: string; body: Partial<DelegationWritePayload> }>({
      query: ({ id, body }) => ({ url: `/workflow/delegations/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["WorkflowDelegations"],
    }),

    deleteDelegation: builder.mutation<void, string>({
      query: (id) => ({ url: `/workflow/delegations/${id}/`, method: "DELETE" }),
      invalidatesTags: ["WorkflowDelegations"],
    }),

    revokeDelegation: builder.mutation<ApprovalDelegation, string>({
      query: (id) => ({ url: `/workflow/delegations/${id}/revoke/`, method: "POST" }),
      invalidatesTags: ["WorkflowDelegations"],
    }),

    // Resolve "who would approve?" for an ad-hoc stage config + sample requester,
    // without persisting. Backed by the organogram/RBAC resolver server-side.
    previewApprovers: builder.mutation<ApproverPreviewResult, ApproverPreviewPayload>({
      query: (body) => ({ url: `/workflow/templates/preview-approvers/`, method: "POST", body }),
    }),
  }),
});

export const {
  useGetWorkflowTemplatesQuery,
  useGetWorkflowTemplateQuery,
  usePublishWorkflowTemplateMutation,
  useGetWorkflowInstancesQuery,
  useGetWorkflowInstanceQuery,
  useRecordWorkflowActionMutation,
  useWithdrawWorkflowInstanceMutation,
  useResubmitWorkflowInstanceMutation,
  useCancelWorkflowInstanceMutation,
  useReverseWorkflowActionMutation,
  useGetPendingApprovalsQuery,
  useGetMySubmissionsQuery,
  useGetPendingApprovalsBellQuery,
  useGetReturnedSubmissionsBellQuery,
  useGetTeamLoadQuery,
  useGetDelegationsQuery,
  useCreateDelegationMutation,
  useUpdateDelegationMutation,
  useDeleteDelegationMutation,
  useRevokeDelegationMutation,
  usePreviewApproversMutation,
} = workflowApi;
