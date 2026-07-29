const DRAWER_ERROR_EVENT = "console:drawer-error";

/**
 * Close any currently open drawer after an API error has unwound back to its
 * caller. The next-task delay lets form loading guards clear before Sheet asks
 * the owning screen to close.
 */
export function dismissOpenDrawerForError() {
  if (typeof window === "undefined") return;

  window.setTimeout(() => {
    window.dispatchEvent(new Event(DRAWER_ERROR_EVENT));
  }, 0);
}

export function onDrawerError(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(DRAWER_ERROR_EVENT, callback);
  return () => window.removeEventListener(DRAWER_ERROR_EVENT, callback);
}
