// Authenticated file download for the finance report ?export= endpoints. The
// API is bearer-authenticated, so a plain <a href> can't carry the token — we
// fetch the attachment with the Authorization header and save the blob.

import Cookies from "js-cookie";
import { toast } from "sonner";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

/**
 * Download a report export. `path` is the report path (no query), `params`
 * carries entity + any period, and `format` is csv | xlsx | pdf.
 */
export async function downloadReportExport(
  path: string,
  params: Record<string, string | number | undefined>,
  format: "csv" | "xlsx" | "pdf",
): Promise<void> {
  const token = Cookies.get("token");
  const search = new URLSearchParams({ export: format });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  try {
    const res = await fetch(`${baseUrl}${path}?${search.toString()}`, {
      headers: { Authorization: token ? `Bearer ${token}` : "", accept: "*/*" },
    });
    if (!res.ok) {
      toast.error(res.status === 403 ? "You don't have permission to export this." : "Export failed. Please try again.");
      return;
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] || `export.${format}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Could not reach the server. Please try again.");
  }
}
