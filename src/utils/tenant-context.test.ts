import { describe, expect, it } from "vitest";
import { appendTenantQuery, bindTenantStore } from "./tenant-context";

describe("appendTenantQuery", () => {
  it("adds the tenant to a direct download URL", () => {
    bindTenantStore(() => ({ auth: { tenant: { slug: "greenfield academy" } } }));

    expect(appendTenantQuery("https://api.test/import/batches/4/download/"))
      .toBe("https://api.test/import/batches/4/download/?tenant=greenfield%20academy");
  });

  it("preserves existing query parameters and prefers an impersonation tenant", () => {
    bindTenantStore(() => ({
      auth: {
        tenant: { slug: "codex" },
        impersonation: { tenantSlug: "target-school" },
      },
    }));

    expect(appendTenantQuery("https://api.test/template/download/?file_format=xlsx"))
      .toBe("https://api.test/template/download/?file_format=xlsx&tenant=target-school");
  });
});
