import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type {
  SchoolsRes,
  SchoolDetailRes,
  SchoolStatsRes,
  BranchesRes,
  BranchDetailRes,
  PackagePlansRes,
  ModulesRes,
} from "./school-types";

export const schoolMgtApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchools: builder.query<SchoolsRes, Record<string, string | number>>({
      query: (params) => ({
        url: `/i/${generateQueryString(params)}`,
        method: "GET",
      }),
      providesTags: ["Schools"],
    }),

    getSchoolStats: builder.query<SchoolStatsRes, void>({
      query: () => ({ url: `/i/stats/`, method: "GET" }),
      providesTags: ["Schools"],
    }),

    getSchoolDetail: builder.query<SchoolDetailRes, string>({
      query: (slug) => ({ url: `/i/${slug}/`, method: "GET" }),
      providesTags: (_res, _err, slug) => [{ type: "Schools", id: slug }],
    }),

    createSchool: builder.mutation<SchoolDetailRes, Record<string, unknown>>({
      query: (body) => ({ url: `/i/create/`, method: "POST", body }),
      invalidatesTags: ["Schools"],
    }),

    updateSchool: builder.mutation<SchoolDetailRes, { slug: string; body: Record<string, unknown> }>({
      query: ({ slug, body }) => ({
        url: `/i/${slug}/update/`,
        method: "PATCH",
        body,
      }),
      // The form renders field-level refusals under the field they belong to
      // (a reserved or taken sign-in address), so the global 400 toast would be
      // the same sentence twice. Anything without a field of its own is still
      // surfaced by the form, from the same error.
      extraOptions: { inlineValidation: true },
      invalidatesTags: (_res, _err, { slug }) => [
        "Schools",
        { type: "Schools", id: slug },
      ],
    }),

    // ── Branches ──────────────────────────────────────────────────────────────

    getBranches: builder.query<BranchesRes, { slug: string; params?: Record<string, string | number> }>({
      query: ({ slug, params = {} }) => ({
        url: `/i/${slug}/branches/${generateQueryString(params)}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { slug }) => [{ type: "Branches", id: slug }],
    }),

    getBranchDetail: builder.query<BranchDetailRes, { slug: string; code: number }>({
      query: ({ slug, code }) => ({
        url: `/i/${slug}/branches/${code}/detail/`,
        method: "GET",
      }),
      providesTags: (_res, _err, { slug, code }) => [{ type: "Branches", id: `${slug}-${code}` }],
    }),

    createBranch: builder.mutation<BranchDetailRes, { slug: string; body: Record<string, unknown> }>({
      query: ({ slug, body }) => ({
        url: `/i/${slug}/branches/create/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { slug }) => [
        { type: "Schools", id: slug },
        { type: "Branches", id: slug },
      ],
    }),

    updateBranch: builder.mutation<BranchDetailRes, { slug: string; code: number; body: Record<string, unknown> }>({
      query: ({ slug, code, body }) => ({
        url: `/i/${slug}/branches/${code}/update/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { slug, code }) => [
        { type: "Schools", id: slug },
        { type: "Branches", id: `${slug}-${code}` },
        { type: "Branches", id: slug },
      ],
    }),

    transitionBranch: builder.mutation<BranchDetailRes, { slug: string; code: number; to_state: string; reason?: string }>({
      query: ({ slug, code, to_state, reason }) => ({
        url: `/i/${slug}/branches/${code}/transition/`,
        method: "POST",
        body: { to_state, ...(reason ? { reason } : {}) },
      }),
      invalidatesTags: (_res, _err, { slug, code }) => [
        { type: "Schools", id: slug },
        { type: "Branches", id: `${slug}-${code}` },
        { type: "Branches", id: slug },
      ],
    }),

    // ── Package Plans & Modules ───────────────────────────────────────────────

    getPackagePlans: builder.query<PackagePlansRes, void>({
      query: () => ({ url: `/i/package-plans/`, method: "GET" }),
    }),

    getModules: builder.query<ModulesRes, void>({
      query: () => ({ url: `/i/modules/`, method: "GET" }),
    }),
  }),
});

export const {
  useGetSchoolsQuery,
  useGetSchoolStatsQuery,
  useGetSchoolDetailQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useGetBranchesQuery,
  useGetBranchDetailQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useTransitionBranchMutation,
  useGetPackagePlansQuery,
  useGetModulesQuery,
} = schoolMgtApi;
