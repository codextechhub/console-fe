import { toast } from "sonner";

/**
 * Connectivity monitor.
 *
 * Owns every message about *reaching* the backend, so a screen with six queries
 * in flight cannot fire six identical "Could not reach the server" toasts when
 * the Wi-Fi drops. The base-api interceptor reports outcomes here instead of
 * toasting per request; this module decides what (if anything) the user is told.
 *
 * ── What we can actually know ────────────────────────────────────────────────
 * `navigator.onLine === false` is trustworthy: there is no link. The reverse is
 * NOT proof of connectivity - captive portals, dead routers and dropped VPNs all
 * report "online" - so the browser's `online` event is treated as a hint to go
 * and check, never as evidence that we are back.
 *
 * Telling a dead connection from a dead API is done with a control probe. The
 * app and the API sit on different hosts (VITE_BACKEND_URL), so:
 *
 *   own origin unreachable  → the connection is the problem   → "offline"
 *   own origin fine, API not → the server is the problem       → "server-unreachable"
 *   both fine                → a one-off blip, not a state     → single toast
 *
 * A 502/503/504 needs no probe at all: an HTTP status arriving is itself proof
 * the network works, and those three are the edge telling us the app is down.
 */

export type ConnectivityStatus = "online" | "offline" | "server-unreachable";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

const BACK_ONLINE_TOAST_ID = "connectivity-restored";
const BLIP_TOAST_ID = "connectivity-blip";

const PROBE_TIMEOUT_MS = 5_000;

// Re-check ladder while we are in a bad state. The server-unreachable case
// never fires a browser `online` event, so polling is the only way it can
// recover on its own - it backs off to 30 s rather than sitting at a tight loop.
const RETRY_DELAYS_MS = [3_000, 5_000, 10_000, 20_000, 30_000];

let status: ConnectivityStatus = "online";
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export const subscribeToConnectivity = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getConnectivityStatus = (): ConnectivityStatus => status;

/** No SSR in this app; a stable value keeps useSyncExternalStore happy. */
export const getConnectivityServerSnapshot = (): ConnectivityStatus => "online";

// ── Recovery hand-off ───────────────────────────────────────────────────────
// Bound from store.ts (which owns the dispatch) so this module never imports
// the store: base-api imports this file, and the store imports base-api.
let reconnectHandler: (() => void) | null = null;

export const bindConnectivityReconnect = (handler: () => void): void => {
  reconnectHandler = handler;
};

// ── Probes ──────────────────────────────────────────────────────────────────

const fetchWithTimeout = async (
  input: string,
  init: RequestInit,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const cacheBuster = () => `_probe=${Date.now()}`;

/**
 * Can we reach the host serving this app? Same-origin, so no CORS involved and
 * a real status comes back. `no-store` plus the cache-buster stop the browser
 * answering from disk and telling us a comforting lie.
 */
const canReachOwnOrigin = async (): Promise<boolean> => {
  try {
    const base = import.meta.env.BASE_URL || "/";
    const url = new URL(base, window.location.origin);
    url.search = cacheBuster();
    await fetchWithTimeout(url.toString(), { method: "HEAD", cache: "no-store" });
    return true;
  } catch {
    return false;
  }
};

/**
 * Can we reach the API host? `mode: "no-cors"` is deliberate: the response is
 * opaque (no status, no body) but the promise still resolves for ANY HTTP reply
 * and rejects only on a transport failure, which is exactly the question being
 * asked. It needs no CORS headers, no auth, and no dedicated ping endpoint.
 *
 * The trade-off: an opaque 502 looks like a success here. That self-corrects -
 * the next real request carries a readable 502 and lands on the gateway path
 * below, which flips us straight back to server-unreachable.
 */
const canReachApi = async (): Promise<boolean> => {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/?${cacheBuster()}`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  }
};

// ── Retry ladder ────────────────────────────────────────────────────────────

let retryTimer: number | null = null;
let retryIndex = 0;

const stopRetrying = () => {
  if (retryTimer !== null) window.clearTimeout(retryTimer);
  retryTimer = null;
  retryIndex = 0;
};

const scheduleRetry = () => {
  if (retryTimer !== null) return;
  const delay = RETRY_DELAYS_MS[Math.min(retryIndex, RETRY_DELAYS_MS.length - 1)];
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    // Nobody is looking at a hidden tab, so hold the ladder rather than probing
    // into the background. The visibilitychange listener catches up on return.
    if (document.visibilityState === "hidden") {
      retryIndex = RETRY_DELAYS_MS.length - 1;
      scheduleRetry();
      return;
    }
    retryIndex += 1;
    void classify();
  }, delay);
};

// ── State transitions ───────────────────────────────────────────────────────

const setStatus = (next: ConnectivityStatus) => {
  if (next === status) {
    // Still broken: keep the ladder running so recovery is noticed without the
    // user having to do anything.
    if (next !== "online") scheduleRetry();
    return;
  }

  const wasDown = status !== "online";
  status = next;
  emit();

  if (next === "online") {
    stopRetrying();
    if (wasDown) {
      toast.dismiss(BLIP_TOAST_ID);
      toast.success("Back online", {
        id: BACK_ONLINE_TOAST_ID,
        description: "Refreshing what's on screen.",
      });
      reconnectHandler?.();
    }
    return;
  }

  // The banner supersedes anything still on screen from before - including a
  // "Back online" that has just been proven wrong.
  toast.dismiss(BLIP_TOAST_ID);
  toast.dismiss(BACK_ONLINE_TOAST_ID);
  scheduleRetry();
};

// ── Classification ──────────────────────────────────────────────────────────

let classifyInFlight: Promise<ConnectivityStatus> | null = null;

/**
 * Work out which of the three states we are in and apply it. Single-flight, so
 * a burst of parallel failures costs one pair of probes, not one per request.
 */
const classify = (): Promise<ConnectivityStatus> => {
  if (classifyInFlight) return classifyInFlight;

  const run: Promise<ConnectivityStatus> = (async () => {
    // Definitive, and free. Checked before the probes because in local dev the
    // origin probe hits loopback, which survives the Wi-Fi being switched off.
    if (!navigator.onLine) {
      setStatus("offline");
      return status;
    }

    if (!(await canReachOwnOrigin())) {
      setStatus("offline");
      return status;
    }

    setStatus((await canReachApi()) ? "online" : "server-unreachable");
    return status;
  })().finally(() => {
    if (classifyInFlight === run) classifyInFlight = null;
  });

  classifyInFlight = run;
  return run;
};

// ── Reports from the API layer ──────────────────────────────────────────────

/**
 * Any HTTP response arrived, whatever its status. That is proof the whole path
 * works, so it is the cheapest and fastest recovery signal we have - every
 * successful request in the app doubles as a heartbeat.
 */
export const reportRequestSuccess = (): void => {
  if (status === "online") return;
  setStatus("online");
};

/** 502/503/504: the edge answered, the application behind it did not. */
export const reportGatewayFailure = (): void => {
  setStatus("server-unreachable");
};

/**
 * fetch threw, or the request timed out. Needs a probe to attribute.
 *
 * `notifyOnBlip` is false for callers that own their own error UI (the auth
 * screens' inline panels) or that must never interrupt (background polls). The
 * banner still applies to them - a real outage is a real outage - but a one-off
 * failed request stays theirs to render.
 */
export const reportTransportFailure = (
  { notifyOnBlip = true }: { notifyOnBlip?: boolean } = {},
): void => {
  const wasDown = status !== "online";
  void classify().then((result) => {
    // Everything checks out, so this was a single failed request rather than a
    // state worth a banner. Say so once - a fixed toast id collapses a burst.
    if (notifyOnBlip && result === "online" && !wasDown) {
      toast.error("Couldn't complete that request. Please try again.", {
        id: BLIP_TOAST_ID,
      });
    }
  });
};

/** The banner's "Try again" button. */
export const retryConnectivityNow = async (): Promise<void> => {
  stopRetrying();
  await classify();
};

// ── Lifecycle ───────────────────────────────────────────────────────────────

let stopMonitor: (() => void) | null = null;

export const startConnectivityMonitor = (): void => {
  if (stopMonitor) return;

  // Losing the link is definitive - no probe needed, and probing would only
  // delay the banner.
  const handleOffline = () => setStatus("offline");

  // Regaining it is not. Verify before claiming we are back.
  const handleOnline = () => {
    void classify();
  };

  // Probing a hidden tab burns battery for nobody's benefit; catch up when the
  // user returns to it instead.
  const handleVisibility = () => {
    if (document.visibilityState === "visible" && status !== "online") {
      void classify();
    }
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibility);

  stopMonitor = () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibility);
  };

  if (!navigator.onLine) setStatus("offline");
};

/** Test-only: drop all state so cases cannot leak into one another. */
export const resetConnectivityForTests = (): void => {
  stopRetrying();
  stopMonitor?.();
  stopMonitor = null;
  classifyInFlight = null;
  status = "online";
  listeners.clear();
  reconnectHandler = null;
};
