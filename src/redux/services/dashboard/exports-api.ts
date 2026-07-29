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
  ExportCapabilities,
  ExportDownloadEntry,
  ExportItemResponse,
  ExportListResponse,
  ExportRun,
  ExportRunDetail,
  RunListParams,
} from "./exports-types";

export const exportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // What this user may do — so a screen can disable with a reason rather than
    // fail at submit.
    getExportCapabilities: builder.query<ExportItemResponse<ExportCapabilities>, void>({
      query: () => ({ url: "/exports/capabilities/", method: "GET" }),
      providesTags: ["ExportCapabilities"],
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
  useGetExportCapabilitiesQuery,
  useGetExportRunsQuery,
  useGetExportRunQuery,
  useCancelExportRunMutation,
  useRetryExportRunMutation,
  useDownloadExportFileMutation,
  useGetExportDownloadLogQuery,
} = exportsApi;
