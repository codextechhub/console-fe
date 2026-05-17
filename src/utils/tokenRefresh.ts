import Cookies from "js-cookie";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export type RefreshOutcome =
  | { ok: true; access: string; refresh?: string }
  | { ok: false; reason: "no_token" | "token_invalid" | "network_error" | "server_error" };

let inFlight: Promise<RefreshOutcome> | null = null;

const doRefresh = async (refreshToken: string): Promise<RefreshOutcome> => {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/user/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    return { ok: false, reason: "network_error" };
  }

  // Only 401 means the refresh token is definitively bad — force re-auth.
  if (response.status === 401) return { ok: false, reason: "token_invalid" };
  // 5xx (and anything else non-ok) is transient: caller should keep the user signed in.
  if (!response.ok) return { ok: false, reason: "server_error" };

  let data: { data?: { access?: string; refresh?: string } };
  try {
    data = await response.json();
  } catch {
    return { ok: false, reason: "server_error" };
  }

  const access = data?.data?.access;
  if (!access) return { ok: false, reason: "server_error" };
  const refresh = data?.data?.refresh;

  // Cookie is the source of truth across all refresh callers — persist
  // immediately so the next reader sees the rotated values.
  Cookies.set("token", access);
  if (refresh) Cookies.set("refresh_token", refresh);

  return { ok: true, access, refresh };
};

/**
 * Shared single-flight refresh. All concurrent callers in the tab — RTK Query
 * 401 retries, the proactive route-change hook, and the idle "Continue" button
 * — wait on the same in-flight request, so the backend only sees one rotation
 * per window of concurrent activity.
 *
 * Reads the refresh token from the cookie, which is updated immediately on
 * every successful rotation. The Redux auth slice's `refresh` field is no
 * longer consulted by this module to avoid the stale-state bug.
 */
export const refreshTokenSingleFlight = (): Promise<RefreshOutcome> => {
  if (inFlight) return inFlight;

  const refreshToken = Cookies.get("refresh_token");
  if (!refreshToken || refreshToken === "undefined") {
    return Promise.resolve({ ok: false, reason: "no_token" });
  }

  inFlight = doRefresh(refreshToken).finally(() => {
    inFlight = null;
  });
  return inFlight;
};
