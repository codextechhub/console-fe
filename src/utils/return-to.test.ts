import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { captureReturnTo, consumeReturnTo } from "./return-to";

const setLocation = (pathname: string, search = "", hash = "") => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, search, hash },
  });
};

beforeEach(() => sessionStorage.clear());
afterEach(() => sessionStorage.clear());

describe("captureReturnTo / consumeReturnTo", () => {
  it("round-trips a safe deep link with query and hash", () => {
    setLocation("/organogram/manage", "?tab=positions", "#row-3");
    captureReturnTo();
    expect(consumeReturnTo()).toBe("/organogram/manage?tab=positions#row-3");
  });

  it("consume clears the value (single use)", () => {
    setLocation("/team-management");
    captureReturnTo();
    expect(consumeReturnTo()).toBe("/team-management");
    expect(consumeReturnTo()).toBeNull();
  });

  it("does not capture auth routes", () => {
    for (const p of ["/login", "/signup", "/forgot-password", "/reset-password/abc", "/activate/xyz", "/jane%40x.com/login"]) {
      sessionStorage.clear();
      setLocation(p);
      captureReturnTo();
      expect(consumeReturnTo()).toBeNull();
    }
  });

  it("rejects open-redirect attempts injected into storage", () => {
    for (const evil of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)"]) {
      sessionStorage.setItem("_auth_return_to", evil);
      expect(consumeReturnTo()).toBeNull();
    }
  });
});
