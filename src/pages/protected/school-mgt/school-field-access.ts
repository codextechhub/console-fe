import type { FieldAccess } from "@/components/finance-ui/field-access";

/**
 * The Field Access resource behind the commercial terms CodeX agrees with a
 * customer school and the billing contact it invoices.
 *
 * The switches are CodeX's own, evaluated against the signed-in CodeX role; a
 * school's roles never reach them. Names are the response and body names the
 * backend uses (`price_per_student`, `email`, `phone`), not the registry names.
 */
export const SCHOOLS_FIELD_RESOURCE = "platform.schools";

/**
 * The fields a school can only be created with a package for.
 *
 * Choosing a plan also sets the agreed price (a catalogue plan copies its own
 * rate over it, a quoted plan needs one typed), and the subscription needs a
 * start date. A role that may not give any one of the three cannot register a
 * school with a package at all, because the backend refuses the whole creation.
 * Such a role registers the school without one.
 */
const PACKAGE_REQUIRED_FIELDS = [
  "package_plan",
  "subscription_starts_at",
  "agreed_price_per_student",
] as const;

/** Whether the signed-in role may give a new school its package. */
export function canGivePackage(access: FieldAccess): boolean {
  return PACKAGE_REQUIRED_FIELDS.every((name) => !access.isReadOnly(name));
}
