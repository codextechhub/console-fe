import { describe, expect, it } from "vitest";
import { getAuthContextGateState } from "./auth-context-gate";

describe("getAuthContextGateState", () => {
  it("holds protected routes while a legacy session hydrates its tenant", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: true,
      isFetching: true,
      isError: false,
    })).toBe("loading");
  });

  it("releases protected routes after tenant context is available", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: true,
      tenantKind: "PLATFORM",
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("ready");
  });

  it("offers a retry when /me fails (likely transient)", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
      isError: true,
    })).toBe("retry");
  });

  it("logs out when /me succeeds but there is no tenant", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("logout");
  });

  it("keeps expired sessions on the redirect path", () => {
    expect(getAuthContextGateState({
      shouldRedirect: true,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("redirect");
  });
  it("turns away a customer tenant instead of mounting the console shell", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: true,
      tenantKind: "SCHOOL",
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("forbidden");
  });

  it("turns away an organisation tenant too", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: true,
      tenantKind: "ORGANIZATION",
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("forbidden");
  });

  it("keeps an impersonating operator in, though the tenant reads SCHOOL", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: true,
      tenantKind: "SCHOOL",
      isImpersonating: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("ready");
  });

  it("does not lock out a session whose tenant predates the kind field", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("ready");
  });

  it("expiry still wins over the platform check", () => {
    expect(getAuthContextGateState({
      shouldRedirect: true,
      hasTenant: true,
      tenantKind: "SCHOOL",
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("redirect");
  });
});
