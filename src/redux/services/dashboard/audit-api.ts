import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type {
  AuditEventListItem,
  AuditEventDetail,
  AuditExportJob,
  AuditExportJobDetail,
  ComplianceRule,
  ComplianceRuleDetail,
  EntityTrail,
  EntityTrailDetail,
  AuditDashboardSummary,
  AuditEventFilterOptions,
  AuditEventQueryParams,
  PaginatedResponse,
} from "./audit-types";

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Security Dashboard summary ──────────────────────────────────────────
    getAuditDashboardSummary: builder.query<{ data: AuditDashboardSummary }, void>({
      query: () => ({ url: `/audit/dashboard-summary/`, method: "GET" }),
      providesTags: ["AuditDashboard"],
    }),

    // ── Audit Events ────────────────────────────────────────────────────────
    getAuditEvents: builder.query<PaginatedResponse<AuditEventListItem>, AuditEventQueryParams>({
      query: (params) => ({ url: `/audit/events/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["AuditEvents"],
    }),

    getAuditEventFilterOptions: builder.query<{ data: AuditEventFilterOptions }, void>({
      query: () => ({ url: "/audit/events/filter-options/", method: "GET" }),
      providesTags: ["AuditEvents"],
    }),

    getAuditEventDetail: builder.query<{ data: AuditEventDetail }, string>({
      query: (id) => ({ url: `/audit/events/${id}/`, method: "GET" }),
      providesTags: ["AuditEvents"],
    }),

    // ── Entity Trails ───────────────────────────────────────────────────────
    getEntityTrails: builder.query<PaginatedResponse<EntityTrail>, Record<string, string | number>>({
      query: (params) => ({ url: `/audit/entity-trails/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["EntityTrails"],
    }),

    getEntityTrailDetail: builder.query<{ data: EntityTrailDetail }, { entity_type: string; entity_id: string }>({
      query: ({ entity_type, entity_id }) => ({
        url: `/audit/entity-trails/${encodeURIComponent(entity_type)}/${encodeURIComponent(entity_id)}/`,
        method: "GET",
      }),
      providesTags: ["EntityTrails"],
    }),

    // ── Audit Exports ───────────────────────────────────────────────────────
    getAuditExports: builder.query<PaginatedResponse<AuditExportJob>, Record<string, string | number>>({
      query: (params) => ({ url: `/audit/exports/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["AuditExports"],
    }),

    getAuditExportDetail: builder.query<{ data: AuditExportJobDetail }, string>({
      query: (id) => ({ url: `/audit/exports/${id}/`, method: "GET" }),
      providesTags: ["AuditExports"],
    }),

    createAuditExport: builder.mutation<{ data: AuditExportJobDetail }, { filter_payload: Record<string, unknown>; export_format?: string }>({
      query: (body) => ({ url: `/audit/exports/`, method: "POST", body }),
      invalidatesTags: ["AuditExports"],
    }),

    // ── Compliance Rules ────────────────────────────────────────────────────
    getComplianceRules: builder.query<PaginatedResponse<ComplianceRule>, Record<string, string | number>>({
      query: (params) => ({ url: `/audit/compliance-rules/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["ComplianceRules"],
    }),

    getComplianceRuleDetail: builder.query<{ data: ComplianceRuleDetail }, string>({
      query: (id) => ({ url: `/audit/compliance-rules/${id}/`, method: "GET" }),
      providesTags: ["ComplianceRules"],
    }),

    createComplianceRule: builder.mutation<{ data: ComplianceRuleDetail }, Record<string, unknown>>({
      query: (body) => ({ url: `/audit/compliance-rules/`, method: "POST", body }),
      invalidatesTags: ["ComplianceRules"],
    }),

    updateComplianceRule: builder.mutation<{ data: ComplianceRuleDetail }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/audit/compliance-rules/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["ComplianceRules"],
    }),

    deleteComplianceRule: builder.mutation<void, string>({
      query: (id) => ({ url: `/audit/compliance-rules/${id}/`, method: "DELETE" }),
      invalidatesTags: ["ComplianceRules"],
    }),

    // ── /me self-service ────────────────────────────────────────────────────
    getMyActivity: builder.query<PaginatedResponse<AuditEventListItem>, Record<string, string | number>>({
      query: (params) => ({ url: `/audit/me/activity/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["MyActivity"],
    }),

    getMyActivityOnMe: builder.query<PaginatedResponse<AuditEventListItem>, Record<string, string | number>>({
      query: (params) => ({ url: `/audit/me/activity-on-me/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["MyActivity"],
    }),
  }),
});

export const {
  useGetAuditDashboardSummaryQuery,
  useGetAuditEventsQuery,
  useGetAuditEventFilterOptionsQuery,
  useGetAuditEventDetailQuery,
  useGetEntityTrailsQuery,
  useGetEntityTrailDetailQuery,
  useGetAuditExportsQuery,
  useGetAuditExportDetailQuery,
  useCreateAuditExportMutation,
  useGetComplianceRulesQuery,
  useGetComplianceRuleDetailQuery,
  useCreateComplianceRuleMutation,
  useUpdateComplianceRuleMutation,
  useDeleteComplianceRuleMutation,
  useGetMyActivityQuery,
  useGetMyActivityOnMeQuery,
} = auditApi;
