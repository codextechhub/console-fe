// Per-user permission overrides ("permission exceptions").
//
// One override is one exception layered on top of what the user's ROLES grant:
//   DENY  — carve a key out of their access (beats every role grant)
//   ALLOW — hand them a key no role of theirs grants
// Both apply instantly (no approval workflow); expiry is optional and lazy.
//
// Tenant scoping: unlike most endpoints, the tenant here is the TARGET's, not
// the caller's — a CX actor administering a school user asserts the school's
// slug. The backend requires `?tenant=<slug>` to equal the slug in the path
// (non-enumerating 404 otherwise), so every endpoint sets `params.tenant`
// explicitly. base-api's central injector leaves requests that already assert a
// tenant untouched (`hasTenantParam`), so nothing here is double-stamped.

import { baseApi } from "../base-api";

export type OverrideMode = "DENY" | "ALLOW";

export interface PermissionOverride {
  id: number;
  user_id: string;
  /** Dotted permission key (the FK's to_field). */
  permission: string;
  permission_key: string;
  permission_description: string | null;
  permission_sensitivity: "NORMAL" | "SENSITIVE" | "CRITICAL" | null;
  mode: OverrideMode;
  reason: string;
  expires_at: string | null;
  is_expired: boolean;
  /**
   * Does any of the target's active roles currently grant this key? The context
   * flag: true on a DENY means the exception is carving real access out; false
   * means their roles do not grant it anyway (a pre-emptive deny).
   */
  granted_by_role: boolean;
  created_by_id: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionOverrideListRes {
  success: boolean;
  message: string;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    next: string | null;
    previous: string | null;
  };
  data: PermissionOverride[];
}

export interface OverrideScope {
  /** Tenant slug that OWNS the target user (school slug for a school user). */
  tenantSlug: string;
  userId: string | number;
}

export interface CreateOverrideBody {
  permission: string;
  mode: OverrideMode;
  reason: string;
  expires_at: string | null;
}

const listUrl = ({ tenantSlug, userId }: OverrideScope) =>
  `/rbac/tenants/${encodeURIComponent(String(tenantSlug))}/users/${encodeURIComponent(
    String(userId),
  )}/permission-overrides/`;

export const overrideApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissionOverrides: builder.query<
      PermissionOverrideListRes,
      OverrideScope & { mode?: OverrideMode; page?: number; page_size?: number }
    >({
      query: ({ tenantSlug, userId, ...params }) => ({
        url: listUrl({ tenantSlug, userId }),
        method: "GET",
        params: { ...params, tenant: tenantSlug },
      }),
      // Cache per (tenant, user): lifting an exception on one user must not
      // blow away another user's list.
      providesTags: (_res, _err, { tenantSlug, userId }) => [
        { type: "UserPermissionOverrides" as const, id: `${tenantSlug}:${userId}` },
      ],
    }),

    createPermissionOverride: builder.mutation<
      { data: PermissionOverride },
      OverrideScope & { body: CreateOverrideBody }
    >({
      query: ({ tenantSlug, userId, body }) => ({
        url: listUrl({ tenantSlug, userId }),
        method: "POST",
        body,
        params: { tenant: tenantSlug },
      }),
      invalidatesTags: (_res, _err, { tenantSlug, userId }) => [
        { type: "UserPermissionOverrides" as const, id: `${tenantSlug}:${userId}` },
      ],
    }),

    deletePermissionOverride: builder.mutation<
      { success: boolean; message: string },
      OverrideScope & { id: number }
    >({
      query: ({ tenantSlug, userId, id }) => ({
        url: `${listUrl({ tenantSlug, userId })}${id}/`,
        method: "DELETE",
        params: { tenant: tenantSlug },
      }),
      invalidatesTags: (_res, _err, { tenantSlug, userId }) => [
        { type: "UserPermissionOverrides" as const, id: `${tenantSlug}:${userId}` },
      ],
    }),
  }),
});

export const {
  useGetPermissionOverridesQuery,
  useCreatePermissionOverrideMutation,
  useDeletePermissionOverrideMutation,
} = overrideApi;
