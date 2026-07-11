// Universal notifications API (backend: vs_notifications, mounted at /v1/notify/).
// Covers the user-facing feed (bell + Notifications page) and the admin
// surfaces: delivery history, the effective settings matrix, templates and the
// event-type catalogue.

import { baseApi } from "./base-api";
import { generateQueryString } from "@/utils/helpers";

export interface NotificationItem {
  id: string;
  event_type_key: string;
  event_type_label: string;
  channel: "in_app";
  subject: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationDetail extends NotificationItem {
  body: string;
  status: "PENDING" | "SENT" | "FAILED";
  read_at: string | null;
  dispatched_at: string | null;
}

export interface Page<T> {
  data: T[];
  pagination: { totalItems: number; totalPages: number; currentPage: number; pageSize: number };
}

export interface NotificationHistory {
  id: string;
  event_type_key: string;
  event_type_label: string;
  channel: "in_app" | "email";
  subject: string;
  status: "PENDING" | "SENT" | "FAILED";
  retry_count: number;
  failure_reason: string;
  recipient_name: string;
  recipient_email: string;
  school: string | null;
  dispatched_at: string | null;
  created_at: string;
  body?: string;
}

export interface NotificationSetting {
  event_type_key: string;
  event_type_label: string;
  source_module: string;
  channel: "in_app" | "email";
  is_enabled: boolean;
  is_transactional: boolean;
  /** Which layer produced the effective value: school override, platform row or registry default. */
  source: "school" | "platform" | "default";
}

export interface NotificationEventType {
  id: string;
  key: string;
  label: string;
  description: string;
  source_module: string;
  supported_channels: ("in_app" | "email")[];
  default_enabled: boolean;
  is_transactional: boolean;
  is_active: boolean;
}

export interface NotificationTemplate {
  id: string;
  event_type: string;
  event_type_key: string;
  channel: "in_app" | "email";
  subject: string;
  body: string;
  html_body: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Feed (user-facing) ──────────────────────────────────────────────────
    getNotifications: builder.query<Page<NotificationItem>, Record<string, string | number | boolean>>({
      query: (params) => ({ url: `/notify/${generateQueryString(params)}` }),
      providesTags: ["Notifications"],
    }),
    getNotification: builder.query<{ data: NotificationDetail }, string>({
      query: (id) => `/notify/${id}/`,
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query<{ data: { unread_count: number } }, void>({
      query: () => ({ url: "/notify/unread-count/", method: "GET" }),
      providesTags: ["Notifications"],
    }),
    markNotificationsRead: builder.mutation<{ data: { updated_count: number } }, { ids: string[] }>({
      query: (body) => ({ url: "/notify/mark-read/", method: "POST", body }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<{ data: { updated_count: number } }, void>({
      query: () => ({ url: "/notify/mark-all-read/", method: "POST" }),
      invalidatesTags: ["Notifications"],
    }),

    // ── History (admin — communication.message_activity.audit) ─────────────
    // The backend requires at least one filter so the whole log can't be dumped.
    getNotificationHistory: builder.query<Page<NotificationHistory>, Record<string, string | number>>({
      query: (params) => ({ url: `/notify/history/${generateQueryString(params)}` }),
      providesTags: ["NotificationHistory"],
    }),
    getNotificationHistoryDetail: builder.query<{ data: NotificationHistory }, string>({
      query: (id) => `/notify/history/${id}/`,
      providesTags: ["NotificationHistory"],
    }),

    // ── Settings matrix (communication.communication_permissions.enforce) ──
    getNotificationSettings: builder.query<{ data: NotificationSetting[] }, void>({
      query: () => "/notify/settings/",
      providesTags: ["NotificationSettings"],
    }),
    updateNotificationSettings: builder.mutation<
      { data: NotificationSetting[] },
      { updates: Array<Pick<NotificationSetting, "event_type_key" | "channel" | "is_enabled">> }
    >({
      query: (body) => ({ url: "/notify/settings/update/", method: "PATCH", body }),
      invalidatesTags: ["NotificationSettings"],
    }),

    // ── Templates (communication.notification_templates.configure) ─────────
    getNotificationTemplates: builder.query<{ data: NotificationTemplate[] }, void>({
      query: () => "/notify/templates/",
      providesTags: ["NotificationTemplates"],
    }),
    updateNotificationTemplate: builder.mutation<
      { data: NotificationTemplate },
      { id: string; body: Partial<NotificationTemplate> }
    >({
      query: ({ id, body }) => ({ url: `/notify/templates/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["NotificationTemplates"],
    }),
    previewNotificationTemplate: builder.mutation<
      { data: { subject: string; body: string; html_body: string } },
      { id: string; context: Record<string, string> }
    >({
      query: ({ id, ...body }) => ({ url: `/notify/templates/${id}/preview/`, method: "POST", body }),
    }),

    // ── Event-type catalogue ────────────────────────────────────────────────
    getNotificationEventTypes: builder.query<{ data: NotificationEventType[] }, void>({
      query: () => "/notify/event-types/",
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useGetUnreadCountQuery,
  useMarkNotificationsReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationHistoryQuery,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useGetNotificationTemplatesQuery,
  useUpdateNotificationTemplateMutation,
  usePreviewNotificationTemplateMutation,
  useGetNotificationEventTypesQuery,
} = notificationsApi;
