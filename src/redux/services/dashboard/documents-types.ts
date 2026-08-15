// Shapes for the requirements-document library. Backend:
// apps/vs_admin_console/views_documents.py, mounted at /v1/admin/documents/.

/** One .docx on the server. */
export interface DocumentVersion {
  version: string;
  filename: string;
  size_bytes: number;
}

/**
 * A logical document - one lineage, many versions.
 *
 * The list endpoint returns one of these per document, not per file, so the
 * 42 files in the docs tree arrive as 12 rows with their history attached.
 * There is no timestamp on purpose: see the list view's docstring - the only
 * date available on a deployed server is the checkout time, identical for every
 * file, so the version label is the honest recency signal.
 */
export interface RequirementsDocument {
  slug: string;
  title: string;
  kind: "MRD" | "FRD";
  /** null for the cross-module MRD, which does not belong to one module. */
  module_number: number | null;
  current_version: string;
  current_size_bytes: number;
  version_count: number;
  /** Newest first. */
  versions: DocumentVersion[];
}

export interface RequirementsDocumentList {
  count: number;
  results: RequirementsDocument[];
}

/** The house envelope: { success, message, data }. */
export interface DocumentsResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
