/**
 * The payroll bank fields of a CX staff profile, as Field Access governs them.
 *
 * They are the registered fields of `platform.staff_profile`. Whether a viewer
 * sees them is decided per record, never from the viewer's map alone: a staff
 * member always reads and writes their own bank details whatever their roles
 * say, and only the record carries that rule. A field the viewer may not read
 * is absent from the payload, so a read view shows exactly the fields the
 * record carries, and a Payroll section with none of them is not drawn at all.
 */

import { useMemo } from "react";
import { useFieldAccess } from "@/components/finance-ui/field-access";
import type { StaffProfile } from "@/redux/services/dashboard/organogram-types";

export const STAFF_PROFILE_RESOURCE = "platform.staff_profile";

export const PAYROLL_FIELDS = [
  { name: "bank_name", label: "Bank name" },
  { name: "account_name", label: "Account name" },
  { name: "account_number", label: "Account number" },
] as const;

export type PayrollFieldName = (typeof PAYROLL_FIELDS)[number]["name"];

export interface VisiblePayrollField {
  name: PayrollFieldName;
  label: string;
  value: string;
}

/** The payroll fields this viewer may read on this profile, in display order. */
export function useVisiblePayrollFields(profile: StaffProfile): VisiblePayrollField[] {
  const access = useFieldAccess(STAFF_PROFILE_RESOURCE, profile);
  return useMemo(
    () => PAYROLL_FIELDS
      .filter(({ name }) => name in profile && !access.isHidden(name))
      .map(({ name, label }) => ({ name, label, value: profile[name] ?? "" })),
    [access, profile],
  );
}
