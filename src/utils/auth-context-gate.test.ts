import { describe, expect, it } from "vitest";
import { getAuthContextGateState } from "./auth-context-gate";

describe("getAuthContextGateState", () => {
  it("holds protected routes while a legacy session hydrates its tenant", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: true,
      isFetching: true,
    })).toBe("loading");
  });

  it("releases protected routes after tenant context is available", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: true,
      isLoading: false,
      isFetching: false,
    })).toBe("ready");
  });

  it("shows a recoverable error when tenant hydration fails", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
    })).toBe("error");
  });

  it("keeps expired sessions on the redirect path", () => {
    expect(getAuthContextGateState({
      shouldRedirect: true,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
    })).toBe("redirect");
  });
});
