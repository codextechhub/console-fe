import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolDetail } from "@/redux/services/dashboard/school-types";

const mocks = vi.hoisted(() => ({
  fieldAccess: {} as Record<string, unknown>,
  school: null as unknown,
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    fieldAccess: mocks.fieldAccess,
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

vi.mock("@/hooks/use-log-recent-open", () => ({ useLogRecentOpen: () => undefined }));

vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({
  useGetSchoolDetailQuery: () => ({
    data: { data: mocks.school },
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useSetSchoolServiceStateMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock("@/redux/services/dashboard/onboarding-api", () => ({
  useReinstateSchoolMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock("@/components/custom/bulk-import-drawer", () => ({ default: () => null }));

import ViewSchool from "./view-school";

const MODULE = {
  id: "m1", key: "finance", label: "Finance", description: "", dependencies: [],
  is_active: true, depth: 30, depth_label: "Advanced",
};

const FULL: SchoolDetail = {
  id: 7,
  name: "Bright Star School",
  slug: "bright-star",
  code: "BSS",
  ownership_type: "PRIVATE",
  status: "ACTIVE",
  activated_at: "2026-09-01T09:00:00Z",
  total_students: 0,
  main_branch: null,
  logo: "",
  email: "billing@bright-star.test",
  phone: "08031234567",
  address: "14 Lantern Road",
  website: "",
  app_url: "",
  motto: "",
  term_structure: "3_TERMS",
  currency: "NGN",
  registration_id: "REG-14",
  deactivated_at: null,
  branches: [],
  branding: null,
  primary_admin: null,
  _read_only_fields: [],
  package_setup: {
    id: "19",
    package_plan: {
      id: "1", name: "Standard Plus", code: "standard", description: "", billing_cycle: "YEARLY",
      currency: "NGN", price_per_student: 500000, default_depth: 20, default_depth_label: "Plus",
      max_students: null, max_teachers: null, max_admins: null, max_branch: null, is_active: true,
    },
    enabled_modules: [MODULE],
    subscription_starts_at: "2026-09-01",
    subscription_expires_at: "2027-08-31",
    agreed_price_per_student: 500000,
    minimum_billable_students: 25,
    is_active: true,
    notes: "",
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
  },
};

function without<T extends object>(source: T, ...keys: string[]): T {
  const copy = { ...source } as Record<string, unknown>;
  for (const key of keys) delete copy[key];
  return copy as T;
}

function render(school: SchoolDetail) {
  mocks.school = school;
  const html = renderToStaticMarkup(
    <MemoryRouter initialEntries={["/school-management/bright-star/view"]}>
      <Routes>
        <Route path="/school-management/:slug/view" element={<ViewSchool />} />
      </Routes>
    </MemoryRouter>,
  );
  return new DOMParser().parseFromString(html, "text/html");
}

const labels = (document: Document) =>
  Array.from(document.querySelectorAll("p")).map((p) => p.textContent);

describe("school detail Field Access", () => {
  beforeEach(() => {
    mocks.fieldAccess = {};
  });

  it("shows the billing contact, plan, billing cycle and expiry to a role with full access", () => {
    const document = render(FULL);
    const text = document.body.textContent ?? "";

    expect(labels(document)).toContain("School email");
    expect(labels(document)).toContain("School phone");
    expect(text).toContain("billing@bright-star.test");
    expect(text).toContain("Standard Plus");
    expect(labels(document)).toContain("Billing cycle");
    expect(labels(document)).toContain("Subscription expires");
    expect(labels(document)).toContain("Modules and depth");
    expect(text).toContain("Finance");
    expect(text).toContain("Advanced");
  });

  it("removes a hidden billing email and phone with their labels", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: ["email", "phone"], read_only: [] } };
    const document = render(without(FULL, "email", "phone"));

    expect(labels(document)).not.toContain("School email");
    expect(labels(document)).not.toContain("School phone");
    expect(document.body.textContent).not.toContain("billing@bright-star.test");
    expect(labels(document)).toContain("School name");
  });

  it("removes a hidden plan: the Package card, the plan rows and the depth beside each module", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: ["package_plan"], read_only: [] } };
    const school = {
      ...FULL,
      package_setup: without(FULL.package_setup!, "package_plan"),
    };
    const document = render(school);
    const text = document.body.textContent ?? "";

    expect(labels(document)).not.toContain("Package");
    expect(labels(document)).not.toContain("Plan");
    expect(labels(document)).not.toContain("Billing cycle");
    expect(text).not.toContain("Standard Plus");
    expect(labels(document)).toContain("Modules");
    expect(labels(document)).not.toContain("Modules and depth");
    expect(text).toContain("Finance");
    expect(text).not.toContain("Advanced");
    expect(labels(document)).toContain("Subscription expires");
  });

  it("removes a hidden subscription expiry and keeps the plan", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: ["subscription_expires_at"], read_only: [] } };
    const school = {
      ...FULL,
      package_setup: without(FULL.package_setup!, "subscription_expires_at"),
    };
    const document = render(school);

    expect(labels(document)).not.toContain("Subscription expires");
    expect(labels(document)).toContain("Plan");
    expect(document.body.textContent).not.toContain("No expiry set");
  });

  it("keeps a read-only record visible and offers no control for the contact", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: [], read_only: ["email", "phone", "notes"] } };
    const document = render({ ...FULL, _read_only_fields: ["email", "phone"] });

    expect(document.body.textContent).toContain("billing@bright-star.test");
    expect(document.querySelector('input[type="email"]')).toBeNull();
  });
});
