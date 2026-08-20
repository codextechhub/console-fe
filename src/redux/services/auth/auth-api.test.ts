import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

import { authSliceReducer } from "@/redux/features/auth/auth-slice";
import { baseApi } from "../base-api";
import { authApi } from "./auth-api";

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
    // Body key, not the ?tenant= query assertion the authenticated endpoints
    // take - there is no token yet to check one against.
    expect(request.url).not.toContain("tenant=");
    expect(await new Request(request).json()).toEqual({
      email: "Admin@codexng.com",
      password: "pw",
      tenant: "codex",
    });
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
});
