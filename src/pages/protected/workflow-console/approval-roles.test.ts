import { describe, expect, it } from "vitest";

import {
  SEEDED_APPROVAL_ROLES, humanizeRoleKey, staffingFor, unstaffed,
} from "./approval-roles";

const role = (id: number, key: string, name: string) => ({ id, key, name });
const assignment = (role_key: string, assignment_status = "ACTIVE") => ({ role_key, assignment_status });

describe("staffingFor", () => {
  it("counts only active assignments", () => {
    // A revoked assignment leaves a row behind. Counting it would report an
    // approver who can no longer approve - the exact failure this surfaces.
    const rows = staffingFor(
      [role(13, "finance-adjustment-approver", "Finance Adjustment Approver")],
      [
        assignment("finance-adjustment-approver"),
        assignment("finance-adjustment-approver", "REVOKED"),
      ],
    );
    expect(rows.find((r) => r.key === "finance-adjustment-approver")?.holders).toBe(1);
  });

  it("reports a role the tenant does not have at all rather than dropping it", () => {
    const rows = staffingFor([], []);
    expect(rows).toHaveLength(SEEDED_APPROVAL_ROLES.length);
    expect(rows.every((r) => r.roleId === null)).toBe(true);
    expect(rows.every((r) => r.holders === 0)).toBe(true);
  });

  it("falls back to a readable name when the role is missing", () => {
    expect(staffingFor([], []).find((r) => r.key === "payout-approver")?.name)
      .toBe("Payout Approver");
  });

  it("uses the tenant's own role name when it exists", () => {
    const rows = staffingFor([role(4, "payout-approver", "Bursar sign-off")], []);
    expect(rows.find((r) => r.key === "payout-approver")?.name).toBe("Bursar sign-off");
  });

  it("ignores assignments for roles outside the seeded set", () => {
    const rows = staffingFor(
      [role(1, "school-admin", "School Admin")],
      [assignment("school-admin"), assignment("school-admin")],
    );
    expect(rows.every((r) => r.holders === 0)).toBe(true);
  });

  it("survives missing data", () => {
    expect(staffingFor(undefined, undefined)).toHaveLength(SEEDED_APPROVAL_ROLES.length);
  });

  it("keeps the seeded order, so the list does not reshuffle as people are appointed", () => {
    const rows = staffingFor([role(4, "payout-approver", "Payout Approver")], [assignment("payout-approver")]);
    expect(rows.map((r) => r.key)).toEqual(SEEDED_APPROVAL_ROLES.map((r) => r.key));
  });
});

describe("unstaffed", () => {
  it("is exactly the roles that will park a document today", () => {
    const rows = staffingFor(
      [role(4, "payout-approver", "Payout Approver"), role(5, "procurement-approver", "Procurement Approver")],
      [assignment("payout-approver")],
    );
    expect(unstaffed(rows).map((r) => r.key)).not.toContain("payout-approver");
    expect(unstaffed(rows).map((r) => r.key)).toContain("procurement-approver");
  });
});

describe("humanizeRoleKey", () => {
  it("matches the backend's own rendering", () => {
    expect(humanizeRoleKey("payout-approver")).toBe("Payout Approver");
    expect(humanizeRoleKey("finance-senior-adjustment-approver"))
      .toBe("Finance Senior Adjustment Approver");
  });
});
