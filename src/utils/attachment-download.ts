import Cookies from "js-cookie";

// Two things make an attachment URL not directly openable in an <a href>:
//
// 1. `core.views.MediaView` authenticates the caller, so a plain navigation arrives
//    with no Authorization header and gets a 401. We have to fetch it ourselves and
//    hand the browser a blob.
// 2. The API base ends in /v1, but MEDIA_URL is mounted at the host root, so the
//    stored `/media/<name>` path must be resolved against the origin rather than
//    appended to the API prefix.
//
// The stored name is a capability URL: unguessable, and only ever handed to a caller
// already allowed to read the owning document. That is what authorises the read; the
// media endpoint itself can only tell that you are logged in.

const apiBase = import.meta.env.VITE_BACKEND_URL || "";

/** Strip a trailing /v1 (or /v2, …) so a root-mounted path resolves correctly. */
export function mediaOrigin(base: string = apiBase): string {
  return base.replace(/\/$/, "").replace(/\/v\d+$/, "");
}

export function buildAttachmentUrl(storedUrl: string, base: string = apiBase): string {
  if (/^https?:\/\//i.test(storedUrl)) return storedUrl;  // already absolute
  const path = storedUrl.startsWith("/") ? storedUrl : `/${storedUrl}`;
  return `${mediaOrigin(base)}${path}`;
}

/**
 * Fetch an attachment with the caller's token and open it in a new tab.
 *
 * The tab is opened synchronously inside the click gesture; opening it after the
 * await would look non-user-initiated to a popup blocker and be swallowed.
 */
export async function openAttachment(storedUrl: string, filename: string) {
  const win = window.open("", "_blank");
  if (!win) throw new Error("Allow pop-ups for this site to open the file.");
  try {
    const token = Cookies.get("token");
    const response = await fetch(buildAttachmentUrl(storedUrl), {
      headers: token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "That file is no longer available."
          : "Could not open the file.",
      );
    }
    const url = URL.createObjectURL(await response.blob());
    win.location.href = url;
    // Long enough for the tab to load it; the browser holds its own reference after.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    win.close();  // don't leave a blank tab behind on failure
    throw error;
  }
  return filename;
}
