import { generateQueryString } from "@/utils/helpers";
import { getTenantSlug } from "@/utils/tenant-context";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "../base-api";
import type {
  ChangeRequest,
  AccessCatalogueModule,
  PaginatedResponse,
  Permission,
  PermissionAction,
  PermissionDependency,
  PermissionDetail,
  PermissionGroupDetail,
  PermissionGroupList,
  PermissionModule,
  PermissionResource,
  PlatformRole,
  PlatformRoleDetail,
  RoleFieldAccessChange,
  RoleFieldAccessResponse,
  UserAssignment,
} from "./rbac-types";

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Tenant Roles (unified; addressed by per-tenant KEY, not id) ─────────────
    // Old /rbac/platform/roles/... and /rbac/schools/<slug>/roles/... are gone;
    // this single surface is scoped by the asserted ?tenant= (added centrally)
    // and the matching path slug from the auth slice.
    getPlatformRoles: builder.query<PaginatedResponse<PlatformRole>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/tenants/${getTenantSlug()}/roles/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PlatformRoles"],
    }),

    /**
     * Every role the tenant holds, for pickers that must offer all of them.
     *
     * The roles list is paginated with at most 100 rows a page and has no
     * search, so a single request silently drops later roles once a tenant
     * outgrows one page. This walks every page at the largest size instead.
     */
    getFieldAccessRoles: builder.query<PlatformRole[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        fetchAllPages<PlatformRole, FetchBaseQueryError>(async (page) => {
          const { data, error } = await baseQuery({
            url: `/rbac/tenants/${getTenantSlug()}/roles/`,
            method: "GET",
            params: { page, page_size: 100 },
          });
          return error ? { error } : { data: data as PaginatedResponse<PlatformRole> };
        }),
      providesTags: ["PlatformRoles"],
    }),

    getPlatformRoleDetail: builder.query<{ data: PlatformRoleDetail }, string>({
      query: (key) => ({ url: `/rbac/tenants/${getTenantSlug()}/roles/${encodeURIComponent(key)}/`, method: "GET" }),
      providesTags: ["PlatformRoles"],
    }),

    getAccessCatalogue: builder.query<
      { data: AccessCatalogueModule[] },
      { tenantSlug?: string; module?: string; resource?: string; search?: string } | void
    >({
      query: (args) => {
        const { tenantSlug, ...params } = args ?? {};
        const slug = tenantSlug || getTenantSlug();
        return {
          url: `/rbac/tenants/${slug}/access-catalogue/`,
          method: "GET",
          params: tenantSlug ? { ...params, tenant: slug } : params,
        };
      },
      providesTags: ["AccessCatalogue"],
    }),

    getRoleFieldAccess: builder.query<
      { data: RoleFieldAccessResponse },
      { key: string; module?: string; resource?: string; search?: string; state?: "hidden" | "read_only" | "full" }
    >({
      query: ({ key, ...params }) => ({
        url: `/rbac/tenants/${getTenantSlug()}/roles/${encodeURIComponent(key)}/field-access/`,
        method: "GET",
        params,
      }),
      providesTags: (_result, _error, { key }) => [{ type: "RoleFieldAccess", id: key }],
    }),

    updateRoleFieldAccess: builder.mutation<
      { data: RoleFieldAccessResponse },
      { key: string; changes: RoleFieldAccessChange[] }
    >({
      query: ({ key, changes }) => ({
        url: `/rbac/tenants/${getTenantSlug()}/roles/${encodeURIComponent(key)}/field-access/`,
        method: "PATCH",
        body: { changes },
      }),
      invalidatesTags: (_result, _error, { key }) => [{ type: "RoleFieldAccess", id: key }],
    }),

    createPlatformRole: builder.mutation<{ data: PlatformRoleDetail }, Record<string, unknown>>({
      query: (body) => ({ url: `/rbac/tenants/${getTenantSlug()}/roles/`, method: "POST", body }),
      invalidatesTags: ["PlatformRoles"],
    }),

    updatePlatformRole: builder.mutation<{ data: PlatformRoleDetail }, { key: string; body: Record<string, unknown> }>({
      query: ({ key, body }) => ({ url: `/rbac/tenants/${getTenantSlug()}/roles/${encodeURIComponent(key)}/`, method: "PATCH", body }),
      invalidatesTags: ["PlatformRoles"],
    }),

    deletePlatformRole: builder.mutation<void, string>({
      query: (key) => ({ url: `/rbac/tenants/${getTenantSlug()}/roles/${encodeURIComponent(key)}/`, method: "DELETE" }),
      invalidatesTags: ["PlatformRoles"],
    }),

    // ── Permission Groups ──────────────────────────────────────────────────────
    getPermissionGroups: builder.query<PaginatedResponse<PermissionGroupList>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/vision/permission-groups/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PermissionGroups"],
    }),

    getPermissionGroupDetail: builder.query<{ data: PermissionGroupDetail }, string>({
      query: (id) => ({ url: `/rbac/vision/permission-groups/${id}/`, method: "GET" }),
      providesTags: ["PermissionGroups"],
    }),

    // ── Permissions ────────────────────────────────────────────────────────────
    getPermissions: builder.query<PaginatedResponse<Permission>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/vision/permissions/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["Permissions"],
    }),

    getPermissionDetail: builder.query<{ data: PermissionDetail }, string>({
      query: (key) => ({ url: `/rbac/vision/permissions/${encodeURIComponent(key)}/`, method: "GET" }),
      providesTags: ["Permissions"],
    }),

    // ── Permission Modules ─────────────────────────────────────────────────────
    getPermissionModules: builder.query<PaginatedResponse<PermissionModule>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/vision/permission-modules/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PermissionModules"],
    }),

    getPermissionModuleDetail: builder.query<{ data: PermissionModule }, string>({
      query: (name) => ({ url: `/rbac/vision/permission-modules/${name}/`, method: "GET" }),
      providesTags: ["PermissionModules"],
    }),

    // ── Permission Resources ───────────────────────────────────────────────────
    getPermissionResources: builder.query<PaginatedResponse<PermissionResource>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/vision/permission-resources/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PermissionResources"],
    }),

    getPermissionResourceDetail: builder.query<{ data: PermissionResource }, string>({
      query: (id) => ({ url: `/rbac/vision/permission-resources/${id}/`, method: "GET" }),
      providesTags: ["PermissionResources"],
    }),

    // ── Permission Actions ─────────────────────────────────────────────────────
    getPermissionActions: builder.query<PaginatedResponse<PermissionAction>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/vision/permission-actions/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PermissionActions"],
    }),

    getPermissionActionDetail: builder.query<{ data: PermissionAction }, string>({
      query: (name) => ({ url: `/rbac/vision/permission-actions/${name}/`, method: "GET" }),
      providesTags: ["PermissionActions"],
    }),

    // ── Permission Dependencies ────────────────────────────────────────────────
    getPermissionDependencies: builder.query<PaginatedResponse<PermissionDependency>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/vision/permission-dependencies/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PermissionDependencies"],
    }),

    // ── Tenant Role Assignments (was /rbac/platform/role-assignments/) ──────────
    getUserAssignments: builder.query<PaginatedResponse<UserAssignment>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/tenants/${getTenantSlug()}/role-assignments/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["UserAssignments"],
    }),

    assignRole: builder.mutation<{ data: UserAssignment }, { user_id: string; role_id: string }>({
      query: ({ user_id, role_id }) => ({ url: `/rbac/tenants/${getTenantSlug()}/role-assignments/`, method: "POST", body: { user: user_id, role: role_id } }),
      invalidatesTags: ["UserAssignments"],
    }),

    revokeAssignment: builder.mutation<{ data: UserAssignment }, { id: string; reason_note: string }>({
      query: ({ id, reason_note }) => ({ url: `/rbac/tenants/${getTenantSlug()}/role-assignments/${id}/revoke/`, method: "POST", body: { reason_note } }),
      invalidatesTags: ["UserAssignments"],
    }),

    replaceAssignment: builder.mutation<{ data: UserAssignment }, { id: string; role_id: string; reason_note?: string }>({
      query: ({ id, role_id, reason_note }) => ({
        url: `/rbac/tenants/${getTenantSlug()}/role-assignments/${id}/replace/`,
        method: "POST",
        body: { role: role_id, reason_note },
      }),
      invalidatesTags: ["UserAssignments"],
    }),

    // ── Tenant Role Change Requests (was /rbac/platform/change-requests/) ───────
    getChangeRequests: builder.query<PaginatedResponse<ChangeRequest>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/tenants/${getTenantSlug()}/role-change-requests/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["ChangeRequests"],
    }),

    createChangeRequest: builder.mutation<{ data: ChangeRequest }, { target_role_id: string; delta_items: { permission_key: string; operation: "ADD" | "REMOVE" }[]; justification: string }>({
      // `target_role` (a role pk) is the wire field; the page still speaks `target_role_id`.
      query: ({ target_role_id, ...rest }) => ({
        url: `/rbac/tenants/${getTenantSlug()}/role-change-requests/`,
        method: "POST",
        body: { target_role: target_role_id, ...rest },
      }),
      invalidatesTags: ["ChangeRequests"],
    }),

    decideChangeRequest: builder.mutation<{ data: ChangeRequest }, { id: string; decision: "APPROVED" | "DENIED"; reviewer_note?: string }>({
      // New contract: { action: APPROVE|DENY, notes }. Map from the page's decision/reviewer_note.
      query: ({ id, decision, reviewer_note }) => ({
        url: `/rbac/tenants/${getTenantSlug()}/role-change-requests/${id}/decide/`,
        method: "POST",
        body: { action: decision === "APPROVED" ? "APPROVE" : "DENY", notes: reviewer_note },
      }),
      invalidatesTags: ["ChangeRequests"],
    }),

    // ── Transfer Super Admin ───────────────────────────────────────────────────
    transferSuperAdmin: builder.mutation<{ message: string }, { new_super_admin_id: string }>({
      query: (body) => ({ url: `/rbac/platform/transfer-super-admin/`, method: "POST", body }),
      invalidatesTags: ["UserAssignments", "PlatformRoles"],
    }),
  }),
});

export const {
  useGetPlatformRolesQuery,
  useGetFieldAccessRolesQuery,
  useGetPlatformRoleDetailQuery,
  useGetAccessCatalogueQuery,
  useGetRoleFieldAccessQuery,
  useUpdateRoleFieldAccessMutation,
  useCreatePlatformRoleMutation,
  useUpdatePlatformRoleMutation,
  useDeletePlatformRoleMutation,
  useGetPermissionGroupsQuery,
  useGetPermissionGroupDetailQuery,
  useGetPermissionsQuery,
  useGetPermissionDetailQuery,
  useGetPermissionModulesQuery,
  useGetPermissionModuleDetailQuery,
  useGetPermissionResourcesQuery,
  useGetPermissionResourceDetailQuery,
  useGetPermissionActionsQuery,
  useGetPermissionActionDetailQuery,
  useGetPermissionDependenciesQuery,
  useGetUserAssignmentsQuery,
  useAssignRoleMutation,
  useRevokeAssignmentMutation,
  useReplaceAssignmentMutation,
  useGetChangeRequestsQuery,
  useCreateChangeRequestMutation,
  useDecideChangeRequestMutation,
  useTransferSuperAdminMutation,
} = rbacApi;
