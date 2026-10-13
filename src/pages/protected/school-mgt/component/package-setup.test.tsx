import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FieldAccessMap } from "@/components/finance-ui/field-access";
import type { PackagePlan } from "@/redux/services/dashboard/school-types";

const mocks = vi.hoisted(() => ({
  fieldAccess: {} as Record<string, unknown>,
  plans: [] as unknown[],
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ fieldAccess: mocks.fieldAccess }),
}));

vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({
  useGetPackagePlansQuery: () => ({ data: { data: mocks.plans }, isLoading: false }),
}));

import PackageSetup from "./package-setup";

function plan(overrides: Partial<PackagePlan>): PackagePlan {
  return {
    id: "1",
    name: "Basic",
    code: "basic",
    description: "",
    billing_cycle: "YEARLY",
    currency: "NGN",
    price_per_student: 350000,
    default_depth: 10,
    default_depth_label: "Core",
    max_students: null,
    max_teachers: null,
    max_admins: null,
    max_branch: null,
    is_active: true,
    ...overrides,
  };
}

const VALUES = {
  package_plan: "basic",
  subscription_starts_at: "2026-10-12",
  subscription_expires_at: "",
  agreed_price_per_student: "",
  minimum_billable_students: "0",
};

function access(entry: { hidden?: string[]; read_only?: string[] }): FieldAccessMap {
  return { "platform.schools": entry };
}

function render(fieldErrors?: Record<string, string> | null, values = VALUES) {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <PackageSetup
        defaultValues={values}
        onSubmit={vi.fn()}
        onChange={vi.fn()}
        isSubmitting={false}
        fieldErrors={fieldErrors}
      />
    </MemoryRouter>,
  );
  return new DOMParser().parseFromString(html, "text/html");
}

describe("package step Field Access", () => {
  beforeEach(() => {
    mocks.fieldAccess = {};
    mocks.plans = [
      plan({}),
      plan({ id: "4", name: "Enterprise", code: "enterprise", price_per_student: null }),
    ];
  });

  it("draws every term for a role with full access", () => {
    const document = render();

    for (const id of ["package_plan", "subscription_starts_at", "subscription_expires_at", "minimum_billable_students"]) {
      expect(document.querySelector(`#${id}`), id).not.toBeNull();
    }
    expect(document.querySelector("[data-read-only]")).toBeNull();
    expect(document.querySelector('[data-testid="package-not-allowed"]')).toBeNull();
  });

  it("removes a hidden term with its label", () => {
    mocks.fieldAccess = access({ hidden: ["minimum_billable_students", "subscription_expires_at"] });
    const document = render();

    expect(document.querySelector("#minimum_billable_students")).toBeNull();
    expect(document.querySelector("#subscription_expires_at")).toBeNull();
    expect(document.body.textContent).not.toContain("Minimum Billable Students");
    expect(document.body.textContent).not.toContain("Subscription Expires");
    expect(document.querySelector("#subscription_starts_at")).not.toBeNull();
  });

  it("greys a read-only term and disables its control", () => {
    mocks.fieldAccess = access({ read_only: ["minimum_billable_students"] });
    const document = render();

    const cell = document.querySelector('[data-field="minimum_billable_students"]');
    expect(cell?.hasAttribute("data-read-only")).toBe(true);
    expect(cell?.hasAttribute("disabled")).toBe(true);
    expect(document.querySelector('[data-field="subscription_expires_at"]')?.hasAttribute("disabled")).toBe(false);
  });

  it("asks for the agreed rate of a quoted plan, and drops it when hidden", () => {
    const quoted = { ...VALUES, package_plan: "enterprise" };
    expect(render(null, quoted).querySelector("#agreed_price_per_student")).not.toBeNull();

    mocks.fieldAccess = access({ hidden: ["agreed_price_per_student"] });
    const hiddenRate = render(null, quoted);
    expect(hiddenRate.querySelector("#agreed_price_per_student")).toBeNull();
  });

  it.each([
    ["package_plan", "hidden"],
    ["package_plan", "read_only"],
    ["subscription_starts_at", "hidden"],
    ["agreed_price_per_student", "read_only"],
  ])("registers the school without a package when %s is %s", (name, state) => {
    mocks.fieldAccess = access({ [state]: [name] });
    const document = render();

    expect(document.querySelector('[data-testid="package-not-allowed"]')).not.toBeNull();
    expect(document.querySelector("#package_plan")).toBeNull();
    expect(document.querySelector("#subscription_starts_at")).toBeNull();
    expect(document.body.textContent).not.toContain("Agreed Price");
    const submit = Array.from(document.querySelectorAll("button")).find((b) => b.textContent === "Submit");
    expect(submit?.disabled).toBe(false);
  });

  it("shows a refusal beside the control it names", () => {
    const document = render({ subscription_starts_at: "You may not change Subscription start date." });

    const cell = document.querySelector('[data-field="subscription_starts_at"]');
    expect(cell?.textContent).toContain("You may not change Subscription start date.");
  });

  it("shows a refusal about an undrawn field under the plan", () => {
    const document = render({ agreed_price_per_student: "You may not change Agreed price per student." });

    const cell = document.querySelector('[data-field="package_plan"]');
    expect(cell?.textContent).toContain("Agreed price per student");
  });
});
