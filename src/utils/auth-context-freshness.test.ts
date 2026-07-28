// The risk this guards: skipping /me one time too many. Permissions and tenant
// come from the login response, so a marker that survived past the post-login
// mount would let a stale persisted context through without ever re-syncing.

import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAuthContextFromLogin,
  isAuthContextFromLogin,
  markAuthContextFromLogin,
} from "./auth-context-freshness";

beforeEach(() => {
  clearAuthContextFromLogin();
});

describe("auth context freshness", () => {
  it("is unset by default, so a persisted session still syncs /me", () => {
    expect(isAuthContextFromLogin()).toBe(false);
  });

  it("is set once a login response has written the context", () => {
    markAuthContextFromLogin();
    expect(isAuthContextFromLogin()).toBe(true);
  });

  it("reads the same answer twice — StrictMode double-invokes initialisers", () => {
    markAuthContextFromLogin();
    expect(isAuthContextFromLogin()).toBe(true);
    expect(isAuthContextFromLogin()).toBe(true);
  });

  it("stops applying once cleared, so later mounts sync again", () => {
    markAuthContextFromLogin();
    clearAuthContextFromLogin();
    expect(isAuthContextFromLogin()).toBe(false);
  });
});
