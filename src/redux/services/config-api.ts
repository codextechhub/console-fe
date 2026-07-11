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

interface Page<T> {
  data: T[];
  pagination?: { totalItems: number; totalPages: number; currentPage: number; pageSize: number };
}

export const configApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
    setConfigValues: builder.mutation<
      { data: ConfigValue[] },
      { values: Array<{ key: string; value: unknown; reason: string }>; school?: string; branch?: string }
    >({
      query: (body) => ({ url: "/config/values/", method: "POST", body }),
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
    // Effective on/off per active capability at a scope (?school= / ?branch=;
    // omit both for platform). Backend: EffectiveCapabilitiesView.
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
    setEntitlement: builder.mutation<{ data: Entitlement }, Record<string, unknown>>({
      query: (body) => ({ url: "/config/entitlements/", method: "POST", body }),
      invalidatesTags: ["Config"],
    }),
    getOverrides: builder.query<Page<Override>, Record<string, string>>({
      query: (params) => `/config/overrides/${generateQueryString(params)}`,
      providesTags: ["Config"],
    }),
    setOverride: builder.mutation<{ data: Override }, Record<string, unknown>>({
      query: (body) => ({ url: "/config/overrides/", method: "POST", body }),
      invalidatesTags: ["Config"],
    }),

    // ── Audit + export ──────────────────────────────────────────────────────
    getConfigAudit: builder.query<Page<ConfigAudit>, Record<string, string>>({
      query: (params) => `/config/audit-events/${generateQueryString(params)}`,
      providesTags: ["Config"],
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
  useGetConfigDefinitionsQuery,
  useCreateConfigDefinitionMutation,
  useUpdateConfigDefinitionMutation,
  useArchiveConfigDefinitionMutation,
  useGetConfigValuesQuery,
  useSetConfigValuesMutation,
  useGetCapabilitiesQuery,
  useGetEffectiveCapabilitiesQuery,
  useCreateCapabilityMutation,
  useUpdateCapabilityMutation,
  useArchiveCapabilityMutation,
  useGetEntitlementsQuery,
  useSetEntitlementMutation,
  useGetOverridesQuery,
  useSetOverrideMutation,
  useGetConfigAuditQuery,
  useLazyExportConfigQuery,
} = configApi;
