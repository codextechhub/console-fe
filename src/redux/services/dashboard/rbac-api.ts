import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type {
  ChangeRequest,
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
  UserAssignment,
} from "./rbac-types";

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Platform Roles ─────────────────────────────────────────────────────────
    getPlatformRoles: builder.query<PaginatedResponse<PlatformRole>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/platform/roles/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PlatformRoles"],
    }),

    getPlatformRoleDetail: builder.query<{ data: PlatformRoleDetail }, string>({
      query: (id) => ({ url: `/rbac/platform/roles/${id}/`, method: "GET" }),
      providesTags: ["PlatformRoles"],
    }),

    createPlatformRole: builder.mutation<{ data: PlatformRoleDetail }, Record<string, unknown>>({
      query: (body) => ({ url: `/rbac/platform/roles/`, method: "POST", body }),
      invalidatesTags: ["PlatformRoles"],
    }),

    updatePlatformRole: builder.mutation<{ data: PlatformRoleDetail }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/rbac/platform/roles/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["PlatformRoles"],
    }),

    deletePlatformRole: builder.mutation<void, string>({
      query: (id) => ({ url: `/rbac/platform/roles/${id}/`, method: "DELETE" }),
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

    createPermissionGroup: builder.mutation<{ data: PermissionGroupDetail }, Record<string, unknown>>({
      query: (body) => ({ url: `/rbac/vision/permission-groups/`, method: "POST", body }),
      invalidatesTags: ["PermissionGroups"],
    }),

    updatePermissionGroup: builder.mutation<{ data: PermissionGroupDetail }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/rbac/vision/permission-groups/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["PermissionGroups"],
    }),

    deletePermissionGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/rbac/vision/permission-groups/${id}/`, method: "DELETE" }),
      invalidatesTags: ["PermissionGroups"],
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

    createPermission: builder.mutation<{ data: Permission }, Record<string, unknown>>({
      query: (body) => ({ url: `/rbac/vision/permissions/`, method: "POST", body }),
      invalidatesTags: ["Permissions"],
    }),

    updatePermission: builder.mutation<{ data: Permission }, { key: string; body: Record<string, unknown> }>({
      query: ({ key, body }) => ({ url: `/rbac/vision/permissions/${encodeURIComponent(key)}/`, method: "PATCH", body }),
      invalidatesTags: ["Permissions"],
    }),

    deletePermission: builder.mutation<void, string>({
      query: (key) => ({ url: `/rbac/vision/permissions/${encodeURIComponent(key)}/`, method: "DELETE" }),
      invalidatesTags: ["Permissions"],
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

    createPermissionModule: builder.mutation<{ data: PermissionModule }, Record<string, unknown>>({
      query: (body) => ({ url: `/rbac/vision/permission-modules/`, method: "POST", body }),
      invalidatesTags: ["PermissionModules"],
    }),

    updatePermissionModule: builder.mutation<{ data: PermissionModule }, { name: string; body: Record<string, unknown> }>({
      query: ({ name, body }) => ({ url: `/rbac/vision/permission-modules/${name}/`, method: "PATCH", body }),
      invalidatesTags: ["PermissionModules"],
    }),

    deletePermissionModule: builder.mutation<void, string>({
      query: (name) => ({ url: `/rbac/vision/permission-modules/${name}/`, method: "DELETE" }),
      invalidatesTags: ["PermissionModules"],
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

    createPermissionResource: builder.mutation<{ data: PermissionResource }, Record<string, unknown>>({
      query: (body) => ({ url: `/rbac/vision/permission-resources/`, method: "POST", body }),
      invalidatesTags: ["PermissionResources"],
    }),

    updatePermissionResource: builder.mutation<{ data: PermissionResource }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/rbac/vision/permission-resources/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["PermissionResources"],
    }),

    deletePermissionResource: builder.mutation<void, string>({
      query: (id) => ({ url: `/rbac/vision/permission-resources/${id}/`, method: "DELETE" }),
      invalidatesTags: ["PermissionResources"],
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

    createPermissionAction: builder.mutation<{ data: PermissionAction }, Record<string, unknown>>({
      query: (body) => ({ url: `/rbac/vision/permission-actions/`, method: "POST", body }),
      invalidatesTags: ["PermissionActions"],
    }),

    updatePermissionAction: builder.mutation<{ data: PermissionAction }, { name: string; body: Record<string, unknown> }>({
      query: ({ name, body }) => ({ url: `/rbac/vision/permission-actions/${name}/`, method: "PATCH", body }),
      invalidatesTags: ["PermissionActions"],
    }),

    deletePermissionAction: builder.mutation<void, string>({
      query: (name) => ({ url: `/rbac/vision/permission-actions/${name}/`, method: "DELETE" }),
      invalidatesTags: ["PermissionActions"],
    }),

    // ── Permission Dependencies ────────────────────────────────────────────────
    getPermissionDependencies: builder.query<PaginatedResponse<PermissionDependency>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/vision/permission-dependencies/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["PermissionDependencies"],
    }),

    createPermissionDependency: builder.mutation<{ data: PermissionDependency }, { permission_key: string; depends_on_key: string }>({
      query: (body) => ({ url: `/rbac/vision/permission-dependencies/`, method: "POST", body }),
      invalidatesTags: ["PermissionDependencies"],
    }),

    deletePermissionDependency: builder.mutation<void, string>({
      query: (id) => ({ url: `/rbac/vision/permission-dependencies/${id}/`, method: "DELETE" }),
      invalidatesTags: ["PermissionDependencies"],
    }),

    // ── User Assignments ───────────────────────────────────────────────────────
    getUserAssignments: builder.query<PaginatedResponse<UserAssignment>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/platform/role-assignments/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["UserAssignments"],
    }),

    assignRole: builder.mutation<{ data: UserAssignment }, { user_id: string; role_id: string }>({
      query: ({ user_id, role_id }) => ({ url: `/rbac/platform/role-assignments/`, method: "POST", body: { user: user_id, role: role_id } }),
      invalidatesTags: ["UserAssignments"],
    }),

    revokeAssignment: builder.mutation<{ data: UserAssignment }, { id: string; reason_note: string }>({
      query: ({ id, reason_note }) => ({ url: `/rbac/platform/role-assignments/${id}/revoke/`, method: "POST", body: { reason_note } }),
      invalidatesTags: ["UserAssignments"],
    }),

    // ── Change Requests ────────────────────────────────────────────────────────
    getChangeRequests: builder.query<PaginatedResponse<ChangeRequest>, Record<string, string | number>>({
      query: (params) => ({ url: `/rbac/platform/change-requests/${generateQueryString(params)}`, method: "GET" }),
      providesTags: ["ChangeRequests"],
    }),

    createChangeRequest: builder.mutation<{ data: ChangeRequest }, { target_role_id: string; delta_items: { permission_key: string; operation: "ADD" | "REMOVE" }[]; justification: string }>({
      query: (body) => ({ url: `/rbac/platform/change-requests/`, method: "POST", body }),
      invalidatesTags: ["ChangeRequests"],
    }),

    decideChangeRequest: builder.mutation<{ data: ChangeRequest }, { id: string; decision: "APPROVED" | "DENIED"; reviewer_note?: string }>({
      query: ({ id, ...body }) => ({ url: `/rbac/platform/change-requests/${id}/decide/`, method: "POST", body }),
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
  useGetPlatformRoleDetailQuery,
  useCreatePlatformRoleMutation,
  useUpdatePlatformRoleMutation,
  useDeletePlatformRoleMutation,
  useGetPermissionGroupsQuery,
  useGetPermissionGroupDetailQuery,
  useCreatePermissionGroupMutation,
  useUpdatePermissionGroupMutation,
  useDeletePermissionGroupMutation,
  useGetPermissionsQuery,
  useGetPermissionDetailQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useGetPermissionModulesQuery,
  useGetPermissionModuleDetailQuery,
  useCreatePermissionModuleMutation,
  useUpdatePermissionModuleMutation,
  useDeletePermissionModuleMutation,
  useGetPermissionResourcesQuery,
  useGetPermissionResourceDetailQuery,
  useCreatePermissionResourceMutation,
  useUpdatePermissionResourceMutation,
  useDeletePermissionResourceMutation,
  useGetPermissionActionsQuery,
  useGetPermissionActionDetailQuery,
  useCreatePermissionActionMutation,
  useUpdatePermissionActionMutation,
  useDeletePermissionActionMutation,
  useGetPermissionDependenciesQuery,
  useCreatePermissionDependencyMutation,
  useDeletePermissionDependencyMutation,
  useGetUserAssignmentsQuery,
  useAssignRoleMutation,
  useRevokeAssignmentMutation,
  useGetChangeRequestsQuery,
  useCreateChangeRequestMutation,
  useDecideChangeRequestMutation,
  useTransferSuperAdminMutation,
} = rbacApi;
