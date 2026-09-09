import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

import { authSliceReducer } from "@/redux/features/auth/auth-slice";
import { baseApi } from "../base-api";
import { authApi } from "./auth-api";
import { clearAccessToken, getAccessToken } from "@/utils/access-token";

const makeStore = () =>
  configureStore({
    reducer: { auth: authSliceReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  clearAccessToken();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("auth endpoints assert the tenant they sign in to", () => {
  it("sends the platform tenant slug on login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, data: { access: "a", refresh: "r" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const store = makeStore();
    await store.dispatch(
      authApi.endpoints.login.initiate({ email: "Admin@codexng.com", password: "pw" }),
    );

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toContain("/user/auth/login/");
    expect(request.credentials).toBe("include");
    expect(request.headers.get("X-Auth-Mode")).toBe("cookie");
    // Body key, not the ?tenant= query assertion the authenticated endpoints
    // take - there is no token yet to check one against.
    expect(request.url).not.toContain("tenant=");
    expect(await new Request(request).json()).toEqual({
      email: "Admin@codexng.com",
      password: "pw",
      tenant: "codex",
    });
    expect(getAccessToken()).toBe("a");
    expect(store.getState().auth).not.toHaveProperty("access");
    expect(store.getState().auth).not.toHaveProperty("refresh");
  });

  it("sends a card identifier without putting an email in the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, data: { access: "card-access" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const store = makeStore();
    await store.dispatch(
      authApi.endpoints.specialLogin.initiate({
        card_id: "a5ba2bb1-48fc-44ef-9914-2f29ae5182b7",
        password: "pw",
      }),
    );

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toContain("/user/auth/login/");
    expect(await new Request(request).json()).toEqual({
      card_id: "a5ba2bb1-48fc-44ef-9914-2f29ae5182b7",
      password: "pw",
    });
    expect(getAccessToken()).toBe("card-access");
  });

  it("previews a card identifier without placing an email in the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, data: { full_name: "Ada Okoye" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const store = makeStore();
    await store.dispatch(
      authApi.endpoints.specialLoginPreview.initiate(
        "a5ba2bb1-48fc-44ef-9914-2f29ae5182b7",
      ),
    );

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toContain(
      "card_id=a5ba2bb1-48fc-44ef-9914-2f29ae5182b7",
    );
    expect(request.url).not.toContain("email=");
  });

  it("sends the platform tenant slug on a password reset request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, message: "Sent." }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const store = makeStore();
    await store.dispatch(
      authApi.endpoints.forgotPassword.initiate({ email: "admin@codexng.com" }),
    );

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toContain("/user/auth/password/reset/request/");
    expect(await new Request(request).json()).toEqual({
      email: "admin@codexng.com",
      tenant: "codex",
    });
  });

  it("sends no credential in the logout body", async () => {
    document.cookie = "csrftoken=csrf-value; Path=/";
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const store = makeStore();
    await store.dispatch(authApi.endpoints.logout.initiate());

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.credentials).toBe("include");
    expect(request.headers.get("X-CSRFToken")).toBe("csrf-value");
    expect(await new Request(request).json()).toEqual({});
  });
});
