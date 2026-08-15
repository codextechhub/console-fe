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
  body: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationDetail extends NotificationItem {
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
  event_type_label: string;
  channel: "in_app" | "email";
  subject: string;
  body: string;
  /** Button text. Only rendered when cta_url is set. */
  cta_label: string;
  /** Button destination, normally a single {{ variable }}. */
  cta_url: string;
  /** The email HTML as stored and as sent, placeholders intact. */
  html_body: string;
  /** The {{ names }} this template uses - read-only, derived by the backend. */
  variables: string[];
  /**
   * false: the markup follows the platform's standard design and is
   * regenerated whenever the message changes.
   * true: someone edited it by hand, so it is kept verbatim and no longer
   * inherits design changes. PATCH false to restore the standard design.
   */
  html_is_custom: boolean;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Unsaved editor content, previewed without being written. */
export type NotificationTemplateDraft = Partial<
  Pick<
    NotificationTemplate,
    "subject" | "body" | "cta_label" | "cta_url" | "html_body" | "html_is_custom"
  >
>;

/** What a recipient would actually see. html_body is the finished email. */
export interface NotificationTemplatePreview {
  channel: "in_app" | "email";
  subject: string;
  body: string;
  /** Rendered for a recipient: placeholders replaced with sample values. */
  html_body: string;
  /** The markup behind it, placeholders intact. This is what the editor edits. */
  html_source: string;
  html_is_custom: boolean;
  variables: string[];
  context_used: Record<string, string>;
}

/** An (event, channel) pair that has no template yet. */
export interface AvailableTemplateEvent {
  event_type: string;
  event_type_key: string;
  event_type_label: string;
  source_module: string;
  description: string;
  channels: ("in_app" | "email")[];
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Feed (user-facing) ──────────────────────────────────────────────────
    getNotifications: builder.query<Page<NotificationItem>, Record<string, string | number | boolean>>({
      query: (params) => ({ url: `/notify/${generateQueryString(params)}` }),
      extraOptions: { silent: true },
      providesTags: ["Notifications"],
    }),
    getNotification: builder.query<{ data: NotificationDetail }, string>({
      query: (id) => `/notify/${id}/`,
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query<{ data: { unread_count: number } }, void>({
      query: () => ({ url: "/notify/unread-count/", method: "GET" }),
      extraOptions: { silent: true },
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
    // Fires on every route change (DashboardLayout), so only refetch the feed
    // when something was actually acknowledged - most navigations update 0 rows.
    acknowledgeNotificationRoute: builder.mutation<
      { data: { updated_count: number } },
      { path: string }
    >({
      query: (body) => ({ url: "/notify/acknowledge-route/", method: "POST", body }),
      extraOptions: { silent: true },
      invalidatesTags: (result, error) =>
        !error && result?.data.updated_count ? ["Notifications"] : [],
    }),

    // ── History (admin - communication.message_activity.audit) ─────────────
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
    // ?search= filters on event key, event label, subject and body.
    getNotificationTemplates: builder.query<
      { data: NotificationTemplate[] },
      Record<string, string> | void
    >({
      query: (params) => ({ url: `/notify/templates/${generateQueryString(params ?? {})}` }),
      providesTags: ["NotificationTemplates"],
    }),
    getNotificationTemplate: builder.query<{ data: NotificationTemplate }, string>({
      query: (id) => `/notify/templates/${id}/`,
      providesTags: ["NotificationTemplates"],
    }),
    updateNotificationTemplate: builder.mutation<
      { data: NotificationTemplate },
      { id: string; body: Partial<NotificationTemplate> }
    >({
      query: ({ id, body }) => ({ url: `/notify/templates/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["NotificationTemplates"],
    }),
    createNotificationTemplate: builder.mutation<
      { data: NotificationTemplate },
      Partial<NotificationTemplate> & { event_type: string; channel: string }
    >({
      query: (body) => ({ url: "/notify/templates/", method: "POST", body }),
      invalidatesTags: ["NotificationTemplates"],
    }),
    // The (event, channel) pairs a new template can still be created for. An
    // event exists only when code fires it, so this is the whole creatable set.
    getAvailableTemplateEvents: builder.query<{ data: AvailableTemplateEvent[] }, void>({
      query: () => "/notify/templates/available-events/",
      providesTags: ["NotificationTemplates"],
    }),
    // Renders the template as a recipient would see it. Sample values are
    // generated per variable, so an empty context still produces a real
    // preview; anything passed in context overrides its sample.
    // `draft` renders unsaved editor content: nothing is written, which is what
    // lets the preview follow typing. Omit it to preview what is stored.
    previewNotificationTemplate: builder.query<
      { data: NotificationTemplatePreview },
      { id: string; context?: Record<string, string>; draft?: NotificationTemplateDraft }
    >({
      query: ({ id, context, draft }) => ({
        url: `/notify/templates/${id}/preview/`,
        method: "POST",
        body: { context: context ?? {}, ...(draft ? { draft } : {}) },
        // The preview is derived state, never a reason to shout at the user.
        meta: { silent: true },
      }),
      extraOptions: { silent: true },
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
  useAcknowledgeNotificationRouteMutation,
  useGetNotificationHistoryQuery,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useGetNotificationTemplatesQuery,
  useGetNotificationTemplateQuery,
  useUpdateNotificationTemplateMutation,
  useCreateNotificationTemplateMutation,
  useGetAvailableTemplateEventsQuery,
  usePreviewNotificationTemplateQuery,
  useGetNotificationEventTypesQuery,
} = notificationsApi;
