import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fieldAccess: {} as Record<string, unknown>,
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    fieldAccess: mocks.fieldAccess,
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

// Every config hook answers "nothing loaded yet": the overview reads none of them.
vi.mock("@/redux/services/config-api", () => new Proxy({}, {
  has: () => true,
  get: (_target, name) => {
    if (name === "then") return undefined;
    if (typeof name === "string" && name.startsWith("use")) {
      return () => Object.assign([vi.fn(), { isFetching: false }], {
        data: undefined, isLoading: false, isFetching: false, isError: false, refetch: vi.fn(),
      });
    }
    return undefined;
  },
}));

vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({
  useGetBranchesQuery: () => ({ data: undefined, isLoading: false }),
  useGetSchoolsQuery: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("./subscription-pricing", () => ({ SubscriptionPricing: () => <p>pricing panel</p> }));

import Settings from "./index";

function render(section: "overview" | "subscription-pricing") {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <Settings section={section} />
    </MemoryRouter>,
  );
  return new DOMParser().parseFromString(html, "text/html");
}

describe("Subscription pricing and Field Access", () => {
  beforeEach(() => {
    mocks.fieldAccess = {};
  });

  it("lists the section and its overview card for a role that reads the catalogue rate", () => {
    const document = render("overview");

    expect(document.body.textContent).toContain("Subscription pricing");
    expect(document.querySelector('a[href$="/subscription-pricing"]')).not.toBeNull();
  });

  it("drops the section and its card when the catalogue rate is hidden", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: ["price_per_student"], read_only: [] } };
    const document = render("overview");

    expect(document.body.textContent).not.toContain("Subscription pricing");
    expect(document.querySelector('a[href$="/subscription-pricing"]')).toBeNull();
  });

  it("falls back to the overview when the hidden section is opened by address", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: ["price_per_student"], read_only: [] } };
    const document = render("subscription-pricing");

    expect(document.body.textContent).not.toContain("pricing panel");
    expect(document.body.textContent).toContain("Configuration overview");
  });

  it("keeps the section when only the write switch is closed", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: [], read_only: ["price_per_student"] } };
    const document = render("subscription-pricing");

    expect(document.body.textContent).toContain("pricing panel");
  });
});
