/**
 * The approval roles a tenant is provisioned with, and what each one decides.
 *
 * Books, spend ladders and payout ladders are now published inside the same
 * transaction that creates a tenant's books, and they arrive **blocked, not open**:
 * the approving roles exist with nobody appointed, and the stages never auto-skip.
 * That is deliberate - money must not approve itself - but it means a brand-new
 * school's very first requisition, payout batch or adjustment parks immediately.
 *
 * So the roles are worth listing somewhere an administrator will find them on day
 * one, with the empty ones called out. This module is the list; the panel renders it.
 */

/** A seeded approving role, in the order an administrator should think about them. */
export interface ApprovalRoleSpec {
  key: string;
  /** What this role decides, in the words the console uses elsewhere. */
  approves: string;
  /** Why it exists, when that is not obvious from the name. */
  note?: string;
}

export const SEEDED_APPROVAL_ROLES: ApprovalRoleSpec[] = [
  {
    key: "procurement-approver",
    approves: "Requisitions, purchase orders, vendor invoices and vendor payments",
  },
  {
    key: "procurement-senior-approver",
    approves: "The same, at or above ₦500,000",
    note: "A second approver on larger spend only.",
  },
  {
    key: "payout-approver",
    approves: "Payout batches",
    note: "One stage. Without it, a whole salary batch could reach the bank on one person's say-so.",
  },
  {
    key: "finance-adjustment-approver",
    approves: "Refunds, write-offs, concessions and credit notes",
    note: "Refunds and write-offs always; concessions and credit notes at or above the adjustment threshold.",
  },
  {
    key: "finance-senior-adjustment-approver",
    approves: "The same, above the senior threshold",
  },
];

export interface RoleStaffing extends ApprovalRoleSpec {
  /** Null when the role itself is not present in this tenant. */
  roleId: string | null;
  name: string;
  holders: number;
}

/**
 * Join the seeded list to what this tenant actually has.
 *
 * A role that is missing entirely is reported with `roleId: null` rather than
 * dropped: on a tenant provisioned before the ladders were seeded it is the
 * absence that is the finding, and hiding the row would hide it.
 *
 * Only ACTIVE assignments count. A revoked one leaves a row behind and counting it
 * would report an approver who can no longer approve, which is the exact failure
 * this panel exists to surface.
 */
export function staffingFor(
  roles: { id: string | number; key: string; name: string }[] | undefined,
  assignments: { role_key: string; assignment_status: string }[] | undefined,
): RoleStaffing[] {
  const byKey = new Map((roles ?? []).map((role) => [role.key, role]));
  const counts = new Map<string, number>();
  for (const assignment of assignments ?? []) {
    if (assignment.assignment_status !== "ACTIVE") continue;
    counts.set(assignment.role_key, (counts.get(assignment.role_key) ?? 0) + 1);
  }
  return SEEDED_APPROVAL_ROLES.map((spec) => {
    const role = byKey.get(spec.key);
    return {
      ...spec,
      roleId: role ? String(role.id) : null,
      name: role?.name ?? humanizeRoleKey(spec.key),
      holders: counts.get(spec.key) ?? 0,
    };
  });
}

/** `payout-approver` -> `Payout Approver`, matching the backend's own helper. */
export function humanizeRoleKey(key: string): string {
  return key
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Roles nobody holds - the ones that will park a document today. */
export const unstaffed = (rows: RoleStaffing[]) => rows.filter((row) => row.holders === 0);
