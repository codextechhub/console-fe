// Support tickets API (backend: vs_tickets, mounted at /v1/support/).
// Anyone authenticated may file a ticket; assignment, transitions and audit
// are RBAC-gated server-side (tickets.ticket.assign / manage / audit.view).

import { baseApi } from "./base-api";
import { generateQueryString } from "@/utils/helpers";
import type { SafeTicketContext } from "@/features/guides";

export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketUser {
  id: string;
  name: string;
  email: string;
  user_type: string;
  role: string;
}

export interface TicketAttachment {
  id: string;
  original_filename: string;
  content_type: string;
  size: number;
  url: string;
  uploaded_by: TicketUser;
  comment_id: string | null;
  created_at: string;
}

export interface TicketComment {
  id: string;
  author: TicketUser;
  body: string;
  visibility: "PUBLIC" | "INTERNAL";
  attachments: TicketAttachment[];
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  source: string;
  context: SafeTicketContext;
  requester: TicketUser;
  assignee: TicketUser | null;
  /** Slug of the tenant that owns the ticket (also the ticket-number prefix). */
  tenant: string;
  school: string | null;
  school_name: string;
  branch: string | null;
  branch_name: string;
  resolved_at: string | null;
  closed_at: string | null;
  comments_count: number;
  attachments_count: number;
  created_at: string;
  updated_at: string;
  /** Present on the detail serializer only. */
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
  capabilities?: { can_comment: boolean; can_attach: boolean };
}

export interface TicketDashboard {
  total: number;
  by_status: Record<TicketStatus, number>;
  by_priority: Record<TicketPriority, number>;
  by_category: Record<string, number>;
  assigned_to_me: number;
  requested_by_me: number;
}

export interface TicketAudit {
  id: string;
  actor: TicketUser | null;
  action: string;
  summary: string;
  before_data: Record<string, unknown>;
  after_data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Page<T> {
  data: T[];
  pagination: { totalItems: number; totalPages: number; currentPage: number; pageSize: number };
}

export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTicketDashboard: builder.query<{ data: TicketDashboard }, void>({
      query: () => "/support/dashboard/",
      providesTags: ["Tickets"],
    }),
    getTickets: builder.query<Page<Ticket>, Record<string, string | number>>({
      query: (params) => `/support/tickets/${generateQueryString(params)}`,
      providesTags: ["Tickets"],
    }),
    getTicket: builder.query<{ data: Ticket }, string>({
      query: (id) => `/support/tickets/${id}/`,
      providesTags: ["Tickets"],
    }),
    createTicket: builder.mutation<
      { data: Ticket },
      { title: string; description: string; category: string; priority: string; context?: SafeTicketContext }
    >({
      query: (body) => ({ url: "/support/tickets/", method: "POST", body }),
      invalidatesTags: ["Tickets"],
    }),
    updateTicket: builder.mutation<{ data: Ticket }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/support/tickets/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["Tickets"],
    }),
    assignTicket: builder.mutation<{ data: Ticket }, { id: string; assignee_id: string | null }>({
      query: ({ id, ...body }) => ({ url: `/support/tickets/${id}/assign/`, method: "POST", body }),
      invalidatesTags: ["Tickets"],
    }),
    // Own tag: eligibility depends on roles/permissions, not ticket state, so
    // ticket mutations (assign, comment, transition) must not refetch it.
    getEligibleTicketAssignees: builder.query<{ data: TicketUser[] }, string>({
      query: (id) => `/support/tickets/${id}/eligible-assignees/`,
      providesTags: ["TicketAssignees"],
    }),
    transitionTicket: builder.mutation<{ data: Ticket }, { id: string; status: TicketStatus }>({
      query: ({ id, ...body }) => ({ url: `/support/tickets/${id}/transition/`, method: "POST", body }),
      invalidatesTags: ["Tickets"],
    }),
    addTicketComment: builder.mutation<
      { data: TicketComment },
      { id: string; body: string; visibility: string }
    >({
      query: ({ id, ...body }) => ({ url: `/support/tickets/${id}/comments/`, method: "POST", body }),
      invalidatesTags: ["Tickets"],
    }),
    uploadTicketAttachment: builder.mutation<
      { data: TicketAttachment },
      { id: string; file: File; comment_id?: string }
    >({
      query: ({ id, file, comment_id }) => {
        const body = new FormData();
        body.append("file", file);
        if (comment_id) body.append("comment_id", comment_id);
        return { url: `/support/tickets/${id}/attachments/`, method: "POST", body };
      },
      invalidatesTags: ["Tickets"],
    }),
    // Resolves to an object URL (caller must revokeObjectURL when done) -
    // storing the raw Blob in redux state trips the serializability check.
    downloadTicketAttachment: builder.mutation<
      string,
      { id: string; attachmentId: string }
    >({
      query: ({ id, attachmentId }) => ({
        url: `/support/tickets/${id}/attachments/${attachmentId}/download/`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (blob: Blob) => URL.createObjectURL(blob),
    }),
    getTicketAudit: builder.query<{ data: TicketAudit[] }, string>({
      query: (id) => `/support/tickets/${id}/audit/`,
      providesTags: ["Tickets"],
    }),
  }),
});

export const {
  useGetTicketDashboardQuery,
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAssignTicketMutation,
  useGetEligibleTicketAssigneesQuery,
  useTransitionTicketMutation,
  useAddTicketCommentMutation,
  useUploadTicketAttachmentMutation,
  useDownloadTicketAttachmentMutation,
  useGetTicketAuditQuery,
} = ticketsApi;
