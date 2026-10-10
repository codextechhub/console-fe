import type { PackagePlan } from "@/redux/services/dashboard/school-types";

/**
 * Package choices show only their commercial names. Billing rates and depth
 * remain part of the selected plan and do not need to be repeated in the form.
 */
export function packagePlanOptions(plans: PackagePlan[]) {
  return plans.map((plan) => ({
    label: plan.name,
    value: plan.code,
  }));
}
