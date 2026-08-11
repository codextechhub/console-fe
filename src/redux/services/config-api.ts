// Platform configuration API (backend: vs_config, mounted at /v1/config/).
// Typed setting definitions + scoped values, capability catalogue,
// entitlements, overrides, the immutable audit trail and a JSON export.
// Creation of definitions/capabilities is platform-only server-side.

import { baseApi } from "./base-api";
import { generateQueryString } from "@/utils/helpers";

export interface ConfigDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  value_type: string;
  default_value: unknown;
  validation_rules: Record<string, unknown>;
  allowed_scopes: string[];
  sensitivity: string;
  is_active: boolean;
  consumer: { service: string; consumer: string; impact: string } | null;
  updated_at: string;
}

export interface ConfigValue {
  id: string;
  definition: string;
  key: string;
  school: string | null;
  branch: string | null;
  value: unknown;
  updated_by: { full_name: string; email: string } | null;
  updated_at: string;
}

export interface Capability {
  id: string;
  key: string;
  label: string;
  description: string;
  kind: string;
  requires_entitlement: boolean;
  default_enabled: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  dependencies: string[];
  updated_at: string;
}

export interface Entitlement {
  id: string;
  capability: string;
  capability_key: string;
  school: string | null;
  state: string;
  source: string;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
}

export interface EntitlementCalendarEntry {
  id: string;
  capability: string;
  capability_label: string;
  tenant_slug: string;
  tenant_name: string;
  scope: "platform" | "school";
  starts_at: string | null;
  ends_at: string | null;
  status: "active" | "scheduled" | "expired";
  warning: "none" | "notice" | "warning" | "critical" | "scheduled" | "expired";
  days_until_expiry: number | null;
}

export interface EntitlementCalendarData {
  generated_at: string;
  window_days: number;
  summary: {
    expired: number;
    expiring_7_days: number;
    expiring_30_days: number;
    expiring_90_days: number;
    scheduled: number;
  };
  entries: EntitlementCalendarEntry[];
  truncated: boolean;
}

export interface Override {
  id: string;
  capability: string;
  capability_key: string;
  school: string | null;
  branch: string | null;
  state: string;
  reason: string;
  updated_at: string;
}

export interface ConfigAudit {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  /** Human name of the audited object ("" when the target was deleted). */
  target_label: string;
  school: string | null;
  branch: string | null;
  actor: { id: string; full_name: string; email: string } | null;
  before_data: unknown;
  after_data: unknown;
  reason: string;
  created_at: string;
}

export interface PlatformSettingsProfile {
  name: string;
  tagline: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string;
}

export interface SchoolOnboardingDefaults {
  ownership_type: string;
  term_structure: string;
  currency: string;
  branch_country: string;
}

export interface PlatformSettingsData {
  profile: PlatformSettingsProfile;
  onboarding: SchoolOnboardingDefaults;
  sources: {
    profile: Record<keyof PlatformSettingsProfile, "database" | "environment" | "default">;
    onboarding: Record<keyof SchoolOnboardingDefaults, "database" | "default">;
  };
  options: {
    ownership_types: Array<{ value: string; label: string }>;
    term_structures: Array<{ value: string; label: string }>;
    currencies: Array<{ value: string; label: string }>;
  };
}

export interface SecuritySettingsData {
  settings: {
    failed_login_threshold: number;
    account_lock_minutes: number;
    self_reset_expiry_hours: number;
    admin_reset_expiry_hours: number;
    invitation_expiry_days: number;
    proxy_idle_timeout_minutes: number;
  };
  sources: Record<string, "database" | "default">;
  source_scopes: Record<string, "default" | "platform" | "school" | "branch">;
  overrides: Record<string, boolean>;
  compliance: Record<string, {
    direction: "minimum" | "maximum";
    min: number;
    max: number;
    boundary: number;
    parent_scope: "platform" | "school";
  }>;
  scope: { type: "platform" | "school" | "branch"; tenant: string | null; branch: string | null };
}

export interface ConfigAuditFacets {
  actions: string[];
  target_types: string[];
  actors: Array<{ id: string; full_name: string; email: string }>;
  targets: Array<{ type: string; id: string; label: string }>;
}

export interface ConfigAuditSavedView {
  id: string;
  name: string;
  filters: {
    window_days: 7 | 30 | 90 | "all";
    action?: string;
    actor?: string;
    target_type?: string;
    target_id?: string;
  };
  scope_key: string;
  tenant_slug: string | null;
  tenant_name: string | null;
  branch: string | null;
  branch_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfigAuditExportJob {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  filters: Record<string, string>;
  scope_key: string;
  tenant_slug: string | null;
  tenant_name: string | null;
  branch: string | null;
  branch_name: string | null;
  file_name: string;
  row_count: number;
  failure_message: string;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  available_until: string | null;
  download_available: boolean;
}

export interface IntegrationSettingsData {
  settings: {
    email_sender_name: string;
    email_sender_address: string;
    email_max_retries: number;
    email_retry_backoff_seconds: number;
  };
  sources: Record<string, "database" | "environment" | "default">;
  status: {
    email: { configured: boolean; host: string; credentials_managed_by: "deployment" };
    payments: { provider: string; configured: boolean; credentials_managed_by: "deployment" };
    public_application: { base_url: string; managed_by: "deployment" };
  };
}

type NullableSettingsPatch<T> = { [K in keyof T]?: T[K] | null } & { reason: string };

interface Page<T> {
  data: T[];
  pagination?: { totalItems: number; totalPages: number; currentPage: number; pageSize: number };
}

export const configApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformSettings: builder.query<{ data: PlatformSettingsData }, void>({
      query: () => "/config/platform-settings/",
      providesTags: ["Config"],
    }),
    updatePlatformSettings: builder.mutation<
      { data: PlatformSettingsData },
      { profile?: Partial<PlatformSettingsProfile>; onboarding?: Partial<SchoolOnboardingDefaults>; reason: string }
    >({
      query: (body) => ({ url: "/config/platform-settings/", method: "PATCH", body }),
      invalidatesTags: ["Config"],
    }),
    getSecuritySettings: builder.query<{ data: SecuritySettingsData }, Record<string, string> | void>({
      query: (params) => ({ url: "/config/security-settings/", params: params ?? undefined }),
      providesTags: ["Config"],
    }),
    updateSecuritySettings: builder.mutation<
      { data: SecuritySettingsData },
      NullableSettingsPatch<SecuritySettingsData["settings"]> & { tenant?: string; branch?: string }
    >({
      query: ({ tenant, branch, ...body }) => ({
        url: "/config/security-settings/", method: "PATCH", body,
        params: { ...(tenant ? { tenant } : {}), ...(branch ? { branch } : {}) },
      }),
      invalidatesTags: ["Config"],
    }),
    getIntegrationSettings: builder.query<{ data: IntegrationSettingsData }, void>({
      query: () => "/config/integration-settings/",
      providesTags: ["Config"],
    }),
    updateIntegrationSettings: builder.mutation<
      { data: IntegrationSettingsData },
      NullableSettingsPatch<IntegrationSettingsData["settings"]>
    >({
      query: (body) => ({ url: "/config/integration-settings/", method: "PATCH", body }),
      invalidatesTags: ["Config"],
    }),
    testIntegrationConnection: builder.mutation<
      { data: { connection: "email" | "payments"; connected: boolean; message: string } },
      { connection: "email" | "payments" }
    >({
      query: (body) => ({ url: "/config/integration-settings/test/", method: "POST", body }),
    }),
    // ── Definitions (the typed settings catalogue) ──────────────────────────
    getConfigDefinitions: builder.query<Page<ConfigDefinition>, Record<string, string> | void>({
      query: (params) => `/config/definitions/${generateQueryString(params ?? {})}`,
      providesTags: ["Config"],
    }),
    createConfigDefinition: builder.mutation<{ data: ConfigDefinition }, Partial<ConfigDefinition>>({
      query: (body) => ({ url: "/config/definitions/", method: "POST", body }),
      invalidatesTags: ["Config"],
    }),
    updateConfigDefinition: builder.mutation<
      { data: ConfigDefinition },
      { key: string; body: Partial<ConfigDefinition> }
    >({
      query: ({ key, body }) => ({ url: `/config/definitions/${key}/`, method: "PATCH", body }),
      invalidatesTags: ["Config"],
    }),
    archiveConfigDefinition: builder.mutation<void, { key: string; reason: string }>({
      query: ({ key, ...body }) => ({ url: `/config/definitions/${key}/`, method: "DELETE", body }),
      invalidatesTags: ["Config"],
    }),

    // ── Values (explicit rows at platform/school/branch scope) ─────────────
    getConfigValues: builder.query<Page<ConfigValue>, Record<string, string>>({
      query: (params) => `/config/values/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    // Scope is the asserted tenant (?tenant=<slug>, injected centrally or set
    // explicitly to target another tenant's config) plus optional ?branch=.
    // The old body-level `school` scope field is gone.
    setConfigValues: builder.mutation<
      { data: ConfigValue[] },
      { values: Array<{ key: string; value: unknown; reason: string }>; tenant?: string; branch?: string }
    >({
      query: ({ tenant, branch, ...body }) => ({
        url: "/config/values/",
        method: "POST",
        body,
        params: { ...(tenant ? { tenant } : {}), ...(branch ? { branch } : {}) },
      }),
      invalidatesTags: ["Config"],
    }),
    resetConfigValue: builder.mutation<
      { data: { key: string; cleared: boolean; effective_value: unknown; source: string } },
      { key: string; reason: string; tenant?: string; branch?: string }
    >({
      query: ({ key, tenant, branch, ...body }) => ({
        url: `/config/values/${key}/`,
        method: "DELETE",
        body,
        params: { ...(tenant ? { tenant } : {}), ...(branch ? { branch } : {}) },
      }),
      invalidatesTags: ["Config"],
    }),
    getEffectiveConfig: builder.query<{ data: Record<string, unknown> }, Record<string, string>>({
      query: (params) => `/config/effective-values/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),

    // ── Capabilities / entitlements / overrides ────────────────────────────
    getCapabilities: builder.query<Page<Capability>, Record<string, string> | void>({
      query: (params) => `/config/capabilities/${generateQueryString(params ?? {})}`,
      providesTags: ["Config"],
    }),
    // Effective on/off per active capability at a scope (?tenant= / ?branch=;
    // omit for the caller's own platform scope). Backend: EffectiveCapabilitiesView.
    getEffectiveCapabilities: builder.query<
      { data: Array<{ key: string; enabled: boolean }> },
      Record<string, string>
    >({
      query: (params) => `/config/effective-capabilities/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    createCapability: builder.mutation<{ data: Capability }, Partial<Capability>>({
      query: (body) => ({ url: "/config/capabilities/", method: "POST", body }),
      invalidatesTags: ["Config"],
    }),
    updateCapability: builder.mutation<{ data: Capability }, { key: string; body: Partial<Capability> }>({
      query: ({ key, body }) => ({ url: `/config/capabilities/${key}/`, method: "PATCH", body }),
      invalidatesTags: ["Config"],
    }),
    archiveCapability: builder.mutation<void, { key: string; reason: string }>({
      query: ({ key, ...body }) => ({ url: `/config/capabilities/${key}/`, method: "DELETE", body }),
      invalidatesTags: ["Config"],
    }),
    getEntitlements: builder.query<Page<Entitlement>, Record<string, string>>({
      query: (params) => `/config/entitlements/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    // Scope (tenant/branch) rides as query params - the backend derives it from
    // the asserted tenant, not a body field.
    setEntitlement: builder.mutation<{ data: Entitlement }, Record<string, unknown>>({
      query: ({ tenant, branch, ...body }) => ({
        url: "/config/entitlements/",
        method: "POST",
        body,
        params: { ...(tenant ? { tenant } : {}), ...(branch ? { branch } : {}) },
      }),
      invalidatesTags: ["Config"],
    }),
    resetEntitlement: builder.mutation<
      { data: { capability: string; cleared: boolean; effective: boolean; status: string; source: string } },
      { capability: string; reason: string; tenant?: string }
    >({
      query: ({ capability, tenant, ...body }) => ({
        url: `/config/entitlements/${capability}/`, method: "DELETE", body,
        params: tenant ? { tenant } : undefined,
      }),
      invalidatesTags: ["Config"],
    }),
    getEntitlementCalendar: builder.query<{ data: EntitlementCalendarData }, Record<string, string>>({
      query: (params) => `/config/entitlements/calendar/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    bulkScheduleEntitlements: builder.mutation<
      { data: Entitlement[]; message: string },
      {
        items: Array<{ capability: string; tenant?: string }>;
        starts_at?: string | null;
        ends_at?: string | null;
        reason: string;
      }
    >({
      query: (body) => ({ url: "/config/entitlements/bulk-schedule/", method: "POST", body }),
      invalidatesTags: ["Config"],
    }),
    getOverrides: builder.query<Page<Override>, Record<string, string>>({
      query: (params) => `/config/overrides/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    setOverride: builder.mutation<{ data: Override }, Record<string, unknown>>({
      query: ({ tenant, branch, ...body }) => ({
        url: "/config/overrides/",
        method: "POST",
        body,
        params: { ...(tenant ? { tenant } : {}), ...(branch ? { branch } : {}) },
      }),
      invalidatesTags: ["Config"],
    }),

    // ── Audit + export ──────────────────────────────────────────────────────
    getConfigAudit: builder.query<Page<ConfigAudit>, Record<string, string>>({
      query: (params) => `/config/audit-events/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    getConfigAuditDetail: builder.query<{ data: ConfigAudit }, { id: string; tenant?: string }>({
      query: ({ id, tenant }) => ({
        url: `/config/audit-events/${id}/`,
        params: tenant ? { tenant } : undefined,
      }),
      providesTags: ["Config"],
    }),
    getConfigAuditFacets: builder.query<{ data: ConfigAuditFacets }, Record<string, string>>({
      query: (params) => `/config/audit-events/facets/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    exportConfigAudit: builder.query<string, Record<string, string>>({
      query: (params) => ({
        url: `/config/audit-events/export/${generateQueryString(params)}`,
        responseHandler: (response) => response.text(),
      }),
    }),
    getConfigAuditSavedViews: builder.query<Page<ConfigAuditSavedView>, void>({
      query: () => "/config/audit-events/saved-views/?page_size=100",
      providesTags: ["Config"],
    }),
    saveConfigAuditView: builder.mutation<
      { data: ConfigAuditSavedView; message: string },
      {
        name: string;
        filters: ConfigAuditSavedView["filters"];
        tenant?: string;
      }
    >({
      query: ({ tenant, ...body }) => ({
        url: "/config/audit-events/saved-views/",
        method: "POST",
        body,
        params: tenant ? { tenant } : undefined,
      }),
      invalidatesTags: ["Config"],
    }),
    deleteConfigAuditView: builder.mutation<void, string>({
      query: (id) => ({ url: `/config/audit-events/saved-views/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Config"],
    }),
    getConfigAuditExportJobs: builder.query<Page<ConfigAuditExportJob>, void>({
      query: () => "/config/audit-events/export-jobs/?page_size=10",
      providesTags: ["Config"],
    }),
    queueConfigAuditExport: builder.mutation<
      { data: ConfigAuditExportJob; message: string },
      { filters: Record<string, string>; client_key: string; tenant?: string }
    >({
      query: ({ tenant, ...body }) => ({
        url: "/config/audit-events/export-jobs/",
        method: "POST",
        body,
        params: tenant ? { tenant } : undefined,
      }),
      invalidatesTags: ["Config"],
    }),
    downloadConfigAuditExport: builder.query<Blob, string>({
      query: (id) => ({
        url: `/config/audit-events/export-jobs/${id}/download/`,
        responseHandler: (response) => response.blob(),
      }),
    }),
    exportConfig: builder.query<
      {
        data: {
          values: Array<{ key: string; value: unknown; source: string }>;
          capabilities: Array<{ key: string; enabled: boolean }>;
        };
      },
      void
    >({
      query: () => "/config/export/",
    }),
  }),
});

export const {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useGetSecuritySettingsQuery,
  useUpdateSecuritySettingsMutation,
  useGetIntegrationSettingsQuery,
  useUpdateIntegrationSettingsMutation,
  useTestIntegrationConnectionMutation,
  useGetConfigDefinitionsQuery,
  useCreateConfigDefinitionMutation,
  useUpdateConfigDefinitionMutation,
  useArchiveConfigDefinitionMutation,
  useGetConfigValuesQuery,
  useSetConfigValuesMutation,
  useResetConfigValueMutation,
  useGetCapabilitiesQuery,
  useGetEffectiveCapabilitiesQuery,
  useCreateCapabilityMutation,
  useUpdateCapabilityMutation,
  useArchiveCapabilityMutation,
  useGetEntitlementsQuery,
  useSetEntitlementMutation,
  useResetEntitlementMutation,
  useGetEntitlementCalendarQuery,
  useBulkScheduleEntitlementsMutation,
  useGetOverridesQuery,
  useSetOverrideMutation,
  useGetConfigAuditQuery,
  useGetConfigAuditDetailQuery,
  useGetConfigAuditFacetsQuery,
  useLazyExportConfigAuditQuery,
  useGetConfigAuditSavedViewsQuery,
  useSaveConfigAuditViewMutation,
  useDeleteConfigAuditViewMutation,
  useGetConfigAuditExportJobsQuery,
  useQueueConfigAuditExportMutation,
  useLazyDownloadConfigAuditExportQuery,
  useLazyExportConfigQuery,
} = configApi;
