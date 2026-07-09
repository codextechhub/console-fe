import Cookies from "js-cookie";

const baseUrl = import.meta.env.VITE_BACKEND_URL || "";

function buildUrl(path: string, params: Record<string, string | number | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}${query ? `?${query}` : ""}`;
}

async function openAuthenticatedDocument(path: string, params: Record<string, string | number | undefined>) {
  const token = Cookies.get("token");
  const res = await fetch(buildUrl(path, params), {
    headers: {
      ...(token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let message = "Could not open the document.";
    try {
      const data = await res.json();
      message = data?.detail || data?.message || message;
    } catch {
      // Non-JSON document errors fall through to the generic message.
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const openInvoiceDocument = (id: number, entity: string, format: "html" | "pdf" = "pdf") =>
  openAuthenticatedDocument(
    `/finance/invoices/${id}/${format === "pdf" ? "document.pdf" : "document/"}`,
    { entity },
  );

export const openPaymentReceipt = (id: number, entity: string, format: "html" | "pdf" = "pdf") =>
  openAuthenticatedDocument(
    `/finance/payments/${id}/${format === "pdf" ? "receipt.pdf" : "receipt/"}`,
    { entity },
  );
