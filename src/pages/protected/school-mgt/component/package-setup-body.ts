import type { FieldAccess, FieldErrors } from "@/components/finance-ui/field-access";
import { canGivePackage } from "../school-field-access";

/** What the package step collects, as the wizard holds it (all strings from inputs). */
export interface PackageStepValues {
  package_plan: string;
  subscription_starts_at: string;
  subscription_expires_at: string;
  agreed_price_per_student: string;
  minimum_billable_students: string;
}

/**
 * The `package_setup_data` a new school is created with, or undefined when it is
 * created without a package.
 *
 * A package needs a plan, which also sets the agreed price, and a start date. A
 * role that may not give any of those (see {@link canGivePackage}) registers the
 * school without one, because the backend refuses the whole creation otherwise.
 * Every other field passes through `writableOnly`, so a term the role may not
 * change is never sent, whatever the form held.
 */
export function packageSetupBody(
  values: PackageStepValues,
  access: FieldAccess,
): Record<string, unknown> | undefined {
  if (!values.package_plan || !canGivePackage(access)) return undefined;
  return access.writableOnly({
    package_plan: values.package_plan,
    subscription_starts_at: values.subscription_starts_at,
    ...(values.subscription_expires_at
      ? { subscription_expires_at: values.subscription_expires_at }
      : {}),
    ...(values.agreed_price_per_student
      ? { agreed_price_per_student: Math.round(Number(values.agreed_price_per_student) * 100) }
      : {}),
    minimum_billable_students: Number(values.minimum_billable_students || 0),
  });
}

/** How the step names each term when a refusal about it has to be placed elsewhere. */
const TERM_LABELS: Readonly<Record<string, string>> = {
  package_plan: "Package plan",
  subscription_starts_at: "Subscription start date",
  subscription_expires_at: "Subscription expiry date",
  agreed_price_per_student: "Agreed price per student",
  minimum_billable_students: "Minimum billable students",
};

/**
 * Refusals from a rejected creation, gathered onto the controls the step draws.
 *
 * A refusal can name a field the step does not draw (the agreed price when a
 * catalogue plan would have set it), so those messages are folded into the plan
 * field's, where the choice that caused them is made, each beginning with the
 * name of the term it concerns because the backend's per-field message does not
 * say. Returns the map the step hands to each control.
 */
export function placeRefusals(
  refusals: FieldErrors | null | undefined,
  drawn: readonly string[],
): FieldErrors {
  if (!refusals) return {};
  const placed: Record<string, string> = {};
  const unplaced: string[] = [];
  for (const [name, message] of Object.entries(refusals)) {
    if (drawn.includes(name)) placed[name] = message;
    else unplaced.push(TERM_LABELS[name] ? `${TERM_LABELS[name]}: ${message}` : message);
  }
  if (unplaced.length) {
    placed.package_plan = [placed.package_plan, ...unplaced].filter(Boolean).join(" ");
  }
  return placed;
}
