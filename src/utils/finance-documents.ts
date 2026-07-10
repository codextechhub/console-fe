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

// The backend serves print-ready HTML documents (@media print / @page A4); there
// is no server-side PDF. We fetch the HTML (the endpoint needs the Bearer token,
// so a plain navigation won't authenticate), open it in a new tab, and trigger
// the browser's print dialog — from which the user saves as PDF.
async function openPrintableDocument(path: string, params: Record<string, string | number | undefined>) {
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
  // No `noopener` — we need the window handle to call print() on our own blob.
  const win = window.open(url, "_blank");
  if (win) win.addEventListener("load", () => { win.focus(); win.print(); }, { once: true });
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const openInvoiceDocument = (id: number, entity: string) =>
  openPrintableDocument(`/finance/invoices/${id}/document/`, { entity });

export const openPaymentReceipt = (id: number, entity: string) =>
  openPrintableDocument(`/finance/payments/${id}/receipt/`, { entity });
