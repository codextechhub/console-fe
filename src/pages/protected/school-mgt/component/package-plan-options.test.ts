import { describe, expect, it } from "vitest";
import type { PackagePlan } from "@/redux/services/dashboard/school-types";
import { packagePlanOptions } from "./package-plan-options";

function plan(overrides: Partial<PackagePlan>): PackagePlan {
  return {
    id: "plan-1",
    name: "Basic",
    code: "BASIC",
    description: "",
    billing_cycle: "MONTHLY",
    currency: "NGN",
    price_per_student: 350000,
    default_depth: 1,
    default_depth_label: "Basic",
    max_students: null,
    max_teachers: null,
    max_admins: null,
    max_branch: null,
    is_active: true,
    ...overrides,
  };
}

describe("packagePlanOptions", () => {
  it("shows only plan names while retaining the plan code", () => {
    const options = packagePlanOptions([
      plan({ name: "Basic", code: "BASIC", price_per_student: 350000 }),
      plan({ name: "Enterprise", code: "ENTERPRISE", price_per_student: null }),
      plan({ name: "Premium", code: "PREMIUM", price_per_student: 750000 }),
      plan({ name: "Standard", code: "STANDARD", price_per_student: 500000 }),
    ]);

    expect(options).toEqual([
      { label: "Basic", value: "BASIC" },
      { label: "Enterprise", value: "ENTERPRISE" },
      { label: "Premium", value: "PREMIUM" },
      { label: "Standard", value: "STANDARD" },
    ]);
  });
});
