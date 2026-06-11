 
import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../baseApi";
import type { AllRolesRes } from "./type";

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllRoles: builder.query<AllRolesRes, Record<string, string | number>>({
      query: (payload) => ({
        url: `/rbac/platform/roles/${generateQueryString(payload)}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetAllRolesQuery } = roleApi;
