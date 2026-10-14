import { describe, expect, it } from "vitest";

import { getSchoolProfileName, getSchoolProfileTenantSlug } from "./school-user-profile";

describe("school-user profile", () => {
  it("uses the detail response tenant name when the list alias is absent", () => {
    expect(getSchoolProfileName({ tenant_name: "Lagoon View Academy" })).toBe(
      "Lagoon View Academy",
    );
  });

  it("keeps the list response school alias when it is available", () => {
    expect(
      getSchoolProfileName({
        school_name: "Bright Star School",
        tenant_name: "Tenant fallback",
      }),
    ).toBe("Bright Star School");
  });

  it("uses the detail response tenant slug for access management", () => {
    expect(
      getSchoolProfileTenantSlug(
        { tenant_slug: "lagoon-view" },
        [{ id: 12, slug: "list-fallback" }],
      ),
    ).toBe("lagoon-view");
  });
});
