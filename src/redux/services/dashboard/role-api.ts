
import { generateQueryString } from "@/utils/helpers";
import { getTenantSlug } from "@/utils/tenant-context";
import { baseApi } from "../base-api";
import type { AllRolesRes } from "./dashboard-types";

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Tenant-scoped role list (was /rbac/platform/roles/). The `?tenant=`
    // assertion is added centrally; the path slug is the same asserted tenant.
    getAllRoles: builder.query<AllRolesRes, Record<string, string | number>>({
      query: (payload) => ({
        url: `/rbac/tenants/${getTenantSlug()}/roles/${generateQueryString(payload)}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetAllRolesQuery } = roleApi;
