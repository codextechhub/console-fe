import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../baseApi";
import type {
  PaginatedResponse,
  Permission,
  PermissionDetail,
  PermissionGroupDetail,
  PermissionGroupList,
  PermissionModule,
  PlatformRole,
  PlatformRoleDetail,
} from "./rbacTypes";

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
  useCreatePermissionModuleMutation,
  useUpdatePermissionModuleMutation,
  useDeletePermissionModuleMutation,
} = rbacApi;
