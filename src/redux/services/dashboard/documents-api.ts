/**
 * RTK Query endpoints for the requirements-document library. Backend:
 * apps/vs_admin_console/views_documents.py, mounted at /v1/admin/documents/.
 *
 * Read-only by design. The documents are generated artefacts committed to the
 * backend repo, so git is their version store - there is no create/update/delete
 * endpoint to call, and adding a document is a commit rather than an upload.
 *
 * No polling: the library changes only when the backend is redeployed, so a
 * timer here would be pure background traffic for an answer that cannot have
 * changed.
 */

import { baseApi } from "../base-api";
import type {
  DocumentsResponse,
  RequirementsDocumentList,
} from "./documents-types";

export const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRequirementsDocuments: builder.query<
      DocumentsResponse<RequirementsDocumentList>,
      void
    >({
      query: () => ({ url: "/admin/documents/", method: "GET" }),
      providesTags: ["RequirementsDocuments"],
    }),

    /**
     * Fetches one document's bytes and returns them as an object URL.
     *
     * A mutation although it changes nothing on the server, because every call
     * must own its own URL. A query deduplicates concurrent calls with the same
     * arguments and hands each caller the same URL, so the first caller to revoke
     * it breaks the others: close and reopen the viewer before the file arrives
     * and the second viewer is left holding a dead `blob:` string. A mutation
     * sends one request per call, and each caller revokes only what it received.
     *
     * The URL rather than the Blob, because RTK Query keeps results in the Redux
     * store and a 1.3 MB Blob there holds the file in memory and trips the
     * serializability check.
     */
    downloadRequirementsDocument: builder.mutation<
      string,
      { slug: string; version?: string }
    >({
      query: ({ slug, version }) => ({
        url: `/admin/documents/${slug}/download/${version ? `?version=${encodeURIComponent(version)}` : ""}`,
        method: "GET",
        // Bytes on success, the parsed envelope on failure - a blanket .blob()
        // would hand the error path a Blob and lose the refusal sentence.
        responseHandler: (response: Response) =>
          response.ok ? response.blob() : response.json(),
      }),
      transformResponse: (blob: Blob) => URL.createObjectURL(blob),
    }),
  }),
});

export const {
  useGetRequirementsDocumentsQuery,
  useDownloadRequirementsDocumentMutation,
} = documentsApi;
