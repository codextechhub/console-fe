/**
 * Downloading a requirements document needs the bearer token, so it cannot be an
 * <a href> - a plain navigation arrives unauthenticated and is refused. The
 * endpoint hands back an object URL (never the Blob, which RTK Query would cache
 * in the Redux store), and this hook saves it and revokes it.
 *
 * Mirrors src/pages/protected/export/use-file-download.ts. Kept separate rather
 * than generalised because the two identify a file differently - an export file
 * has a numeric id, a document is a slug plus an optional version - and folding
 * both into one hook would mean a union type at every call site to save a dozen
 * lines.
 */

import { useState } from "react";
import { toast } from "sonner";
import { useLazyDownloadRequirementsDocumentQuery } from "@/redux/services/dashboard/documents-api";
import { apiErrorMessage } from "@/utils/api-errors";
import type { RequirementsDocument } from "@/redux/services/dashboard/documents-types";

export function useDocumentDownload() {
  const [download] = useLazyDownloadRequirementsDocumentQuery();
  // Keyed per button, so the row spinner and the drawer's per-version spinners
  // never fire together: "<slug>" is the row, "<slug>@<version>" a history entry.
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const save = async (doc: RequirementsDocument, version?: string) => {
    setBusyKey(version ? `${doc.slug}@${version}` : doc.slug);
    // The filename the server will send. Resolved here too so the saved file is
    // named correctly even though the blob itself carries no name.
    const target = version
      ? doc.versions.find((v) => v.version === version)
      : doc.versions[0];
    try {
      const url = await download({ slug: doc.slug, version }).unwrap();
      const a = document.createElement("a");
      a.href = url;
      a.download = target?.filename ?? `${doc.slug}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(apiErrorMessage(error, "That document could not be downloaded."));
    } finally {
      setBusyKey(null);
    }
  };

  return { save, busyKey };
}
