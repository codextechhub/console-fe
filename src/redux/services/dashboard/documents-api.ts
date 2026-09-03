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

    // A query, not a mutation: downloading a document changes nothing on the
    // server, so there is no cache to invalidate. Declared with
    // `forceRefetch`-free defaults but read through `lazy` at the call site, so
    // the bytes are fetched on click rather than on render.
    downloadRequirementsDocument: builder.query<
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
      // Hand back an object URL rather than the Blob: RTK Query caches what a
      // query returns, and parking a 1.3 MB file in the Redux store holds it in
      // memory and trips the serializability check. The caller revokes it.
      transformResponse: (blob: Blob) => URL.createObjectURL(blob),
      // Never cached: the object URL is revoked by the caller straight after the
      // save, so a cached entry would be a dead `blob:` string on the next click.
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useGetRequirementsDocumentsQuery,
  useLazyDownloadRequirementsDocumentQuery,
} = documentsApi;
