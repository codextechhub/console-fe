// RTK Query endpoints for the Export Centre. Backend: apps/vs_exports, mounted
// at /v1/exports/. Slice 1 covers the read-and-download half — runs, run detail,
// files, the download itself and its log. The builder's catalogue/preview/
// definitions endpoints land with slice 2.
//
// Polling follows the Queues page: 10 s on lists, 2 s on an open run detail,
// paused while the tab is hidden. The pages pass those options; this module
// only declares the endpoints.

import { generateQueryString } from "@/utils/helpers";
import { baseApi } from "../base-api";
import type {
  CatalogueModule,
  Dataset,
  DefinitionListParams,
  DefinitionWrite,
  ExportCapabilities,
  ExportDefinitionDetail,
  ExportDefinitionListItem,
  ExportDownloadEntry,
  ExportFormat,
  ExportItemResponse,
  ExportListResponse,
  ExportRun,
  ExportRunDetail,
  FilterSpec,
  PreviewResult,
  RunListParams,
  ValuesMode,
} from "./exports-types";

/** A configuration the preview endpoint can evaluate — not a saved export. */
export interface PreviewBody {
  dataset_key: string;
  columns: string[];
  filters: FilterSpec[];
  format: ExportFormat;
  values_mode: ValuesMode;
  /** Required for entity-scoped datasets, ignored for tenant-scoped ones. */
  entity?: string;
}

export const exportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // What this user may do — so a screen can disable with a reason rather than
    // fail at submit.
    getExportCapabilities: builder.query<ExportItemResponse<ExportCapabilities>, void>({
      query: () => ({ url: "/exports/capabilities/", method: "GET" }),
      providesTags: ["ExportCapabilities"],
    }),

    // ── Catalogue ────────────────────────────────────────────────────────────
    // Filtered server-side by what the caller may actually export, so the
    // builder never offers a dataset that would fail at run time. Modules with
    // nothing published still come back, empty — "Procurement: no datasets yet"
    // is information the step 1 chips must state rather than hide.
    getExportCatalogue: builder.query<ExportItemResponse<{ modules: CatalogueModule[] }>, void>({
      query: () => ({ url: "/exports/catalogue/", method: "GET" }),
      providesTags: ["ExportCatalogue"],
    }),

    getExportDataset: builder.query<ExportItemResponse<Dataset>, string>({
      query: (key) => ({ url: `/exports/catalogue/${key}/`, method: "GET" }),
      providesTags: (_r, _e, key) => [{ type: "ExportCatalogue" as const, id: key }],
    }),

    // Rows, size and a ten-row sample for the summary rail. A mutation rather
    // than a query because it is a POST that takes a whole configuration, and
    // because the rail wants to control exactly when it re-runs (debounced, and
    // cancellable) rather than have a cache key decide.
    previewExport: builder.mutation<ExportItemResponse<PreviewResult>, PreviewBody>({
      query: ({ entity, ...body }) => ({
        url: `/exports/preview/${generateQueryString(entity ? { entity } : {})}`,
        method: "POST",
        body,
      }),
      // No global toast. A half-built configuration is the NORMAL state of this
      // endpoint — it fires on every column and filter change, so a required
      // filter that is not set yet would toast on every keystroke. The summary
      // rail renders the same sentence inline, next to the number it is about,
      // which is where the fix belongs.
      extraOptions: { silent: true },
    }),

    // ── Definitions ──────────────────────────────────────────────────────────
    getExportDefinitions: builder.query<
      ExportListResponse<ExportDefinitionListItem>,
      DefinitionListParams | void
    >({
      query: (params) => ({
        url: `/exports/definitions/${generateQueryString((params ?? {}) as Record<string, string | number>)}`,
        method: "GET",
      }),
      providesTags: ["ExportDefinitions"],
    }),

    getExportDefinition: builder.query<ExportItemResponse<ExportDefinitionDetail>, number>({
      query: (id) => ({ url: `/exports/definitions/${id}/`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "ExportDefinitions" as const, id }],
    }),

    createExportDefinition: builder.mutation<
      ExportItemResponse<ExportDefinitionDetail>,
      DefinitionWrite & { entity?: string }
    >({
      query: ({ entity, ...body }) => ({
        url: `/exports/definitions/${generateQueryString(entity ? { entity } : {})}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExportDefinitions"],
    }),

    updateExportDefinition: builder.mutation<
      ExportItemResponse<ExportDefinitionDetail>,
      { id: number; body: Partial<DefinitionWrite> }
    >({
      query: ({ id, body }) => ({ url: `/exports/definitions/${id}/`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        "ExportDefinitions",
        { type: "ExportDefinitions" as const, id },
      ],
    }),

    // "Delete" archives: runs reference the definition with SET_NULL, so a hard
    // delete would orphan them. Files it produced stay until they expire.
    archiveExportDefinition: builder.mutation<ExportItemResponse<null>, number>({
      query: (id) => ({ url: `/exports/definitions/${id}/`, method: "DELETE" }),
      invalidatesTags: ["ExportDefinitions"],
    }),

    duplicateExportDefinition: builder.mutation<ExportItemResponse<ExportDefinitionDetail>, number>({
      query: (id) => ({ url: `/exports/definitions/${id}/duplicate/`, method: "POST" }),
      invalidatesTags: ["ExportDefinitions"],
    }),

    // 201 = a new run; 200 = an identical run is already in flight and this IS
    // that run. The caller must not treat 200 as an error — it is the
    // concurrency notice, and the point of the client key.
    runExportDefinition: builder.mutation<
      ExportItemResponse<ExportRunDetail>,
      { id: number; client_key?: string }
    >({
      query: ({ id, client_key }) => ({
        url: `/exports/definitions/${id}/run/`,
        method: "POST",
        body: { client_key: client_key ?? "" },
      }),
      invalidatesTags: ["ExportRuns", "ExportDefinitions"],
    }),

    // The Files list. One row per RUN, because a run that produced no file is
    // still something the user needs to see and act on.
    getExportRuns: builder.query<ExportListResponse<ExportRun>, RunListParams | void>({
      query: (params) => ({
        url: `/exports/runs/${generateQueryString((params ?? {}) as Record<string, string | number>)}`,
        method: "GET",
      }),
      providesTags: ["ExportRuns"],
    }),

    getExportRun: builder.query<ExportItemResponse<ExportRunDetail>, number>({
      query: (id) => ({ url: `/exports/runs/${id}/`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "ExportRuns" as const, id }],
    }),

    cancelExportRun: builder.mutation<ExportItemResponse<ExportRunDetail>, number>({
      query: (id) => ({ url: `/exports/runs/${id}/cancel/`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => ["ExportRuns", { type: "ExportRuns" as const, id }],
    }),

    retryExportRun: builder.mutation<ExportItemResponse<ExportRunDetail>, number>({
      query: (id) => ({ url: `/exports/runs/${id}/retry/`, method: "POST" }),
      // A retry is a NEW run, so the list changes as well as this row.
      invalidatesTags: (_r, _e, id) => ["ExportRuns", { type: "ExportRuns" as const, id }],
    }),

    // Downloading is a mutation, not a query: the server authorises it against
    // the downloader, writes an audit event and increments the count. Returns
    // the bytes; the caller saves them. Invalidating the run is what makes
    // "Downloaded 3 times" correct the moment you take a copy.
    downloadExportFile: builder.mutation<string, { fileId: number; runId?: number }>({
      query: ({ fileId }) => ({
        url: `/exports/files/${fileId}/download/`,
        method: "GET",
        // Bytes on success, parsed envelope on failure. A blanket .blob() would
        // hand the error path a Blob and lose the refusal sentence — and that
        // sentence ("this file passed its availability date on 25 Aug — run the
        // export again") is the most useful text in the whole feature.
        responseHandler: (response) => (response.ok ? response.blob() : response.json()),
      }),
      // Hand back an object URL, never the Blob itself: RTK Query caches what a
      // mutation returns, and parking a whole export file in the Redux store
      // holds it in memory and trips the serializability check. Matches the
      // other download endpoints in this app. The caller revokes the URL.
      transformResponse: (blob: Blob) => URL.createObjectURL(blob),
      invalidatesTags: (_r, _e, { runId }) => [
        "ExportRuns",
        "ExportDownloadLog",
        ...(runId ? [{ type: "ExportRuns" as const, id: runId }] : []),
      ],
    }),

    // Who took the file, and who was refused. Refusals are logged too — "who
    // tried and was told no" is the question a compliance review actually asks.
    getExportDownloadLog: builder.query<
      ExportListResponse<ExportDownloadEntry>,
      { fileId: number; page?: number }
    >({
      query: ({ fileId, page }) => ({
        url: `/exports/files/${fileId}/downloads/${generateQueryString(page ? { page } : {})}`,
        method: "GET",
      }),
      providesTags: ["ExportDownloadLog"],
    }),
  }),
});

export const {
  useGetExportCatalogueQuery,
  useGetExportDatasetQuery,
  usePreviewExportMutation,
  useGetExportDefinitionsQuery,
  useGetExportDefinitionQuery,
  useCreateExportDefinitionMutation,
  useUpdateExportDefinitionMutation,
  useArchiveExportDefinitionMutation,
  useDuplicateExportDefinitionMutation,
  useRunExportDefinitionMutation,
  useGetExportCapabilitiesQuery,
  useGetExportRunsQuery,
  useGetExportRunQuery,
  useCancelExportRunMutation,
  useRetryExportRunMutation,
  useDownloadExportFileMutation,
  useGetExportDownloadLogQuery,
} = exportsApi;
