import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const freshModule = async () => {
  vi.resetModules();
  const refresh = await import("./token-refresh");
  const access = await import("./access-token");
  return { ...refresh, ...access };
};

const okResponse = (data: { access?: string; session_id?: number }) =>
  new Response(JSON.stringify({ data }), { status: 200 });

beforeEach(() => {
  sessionStorage.clear();
  document.cookie = "csrftoken=test-csrf; Path=/";
});

afterEach(() => {
  document.cookie = "csrftoken=; Max-Age=0; Path=/";
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("refreshTokenSingleFlight", () => {
  it("lets the server decide whether an opaque refresh cookie exists", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    const mod = await freshModule();
    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "token_invalid" });
  });

  it("stores only the returned access token in memory", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ access: "new-access", session_id: 42 }));
    vi.stubGlobal("fetch", fetchMock);
    const mod = await freshModule();

    const outcome = await mod.refreshTokenSingleFlight();

    expect(outcome).toEqual({ ok: true, access: "new-access", sessionId: 42 });
    expect(mod.getAccessToken()).toBe("new-access");
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.credentials).toBe("include");
    expect(request.body).toBe("{}");
    expect(request.headers).toMatchObject({ "X-CSRFToken": "test-csrf" });
  });

  it("shares one request among concurrent callers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ access: "a" }));
    vi.stubGlobal("fetch", fetchMock);
    const mod = await freshModule();

    const [a, b, c] = await Promise.all([
      mod.refreshTokenSingleFlight(),
      mod.refreshTokenSingleFlight(),
      mod.refreshTokenSingleFlight(),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("maps 5xx to server_error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 503 })));
    const mod = await freshModule();
    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "server_error" });
  });

  it("maps network failure to network_error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const mod = await freshModule();
    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "network_error" });
  });

  it("refuses to run after the session is invalidated", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const mod = await freshModule();
    mod.markSessionInvalidated();

    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "no_token" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("discards an in-flight result when the session is torn down", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    ));
    const mod = await freshModule();
    const pending = mod.refreshTokenSingleFlight();

    mod.markSessionInvalidated();
    resolveFetch(okResponse({ access: "zombie-access" }));

    expect((await pending).ok).toBe(false);
    expect(mod.getAccessToken()).toBe("");
  });

  it("resetSessionInvalidation re-enables refresh for a new login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ access: "a2" })));
    const mod = await freshModule();
    mod.markSessionInvalidated();
    mod.resetSessionInvalidation();

    expect((await mod.refreshTokenSingleFlight()).ok).toBe(true);
  });
});
