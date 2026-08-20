import { describe, expect, it } from "vitest";

import {
  branchLeaveServiceBlock,
  branchNameConfirmationRequired,
  branchReasonRequired,
  branchTransitionsFrom,
} from "./branch-lifecycle";

describe("branch lifecycle edges", () => {
  it("offers exactly the edges the backend allows", () => {
    expect(branchTransitionsFrom("PENDING")).toEqual(["ACTIVE", "INACTIVE", "CLOSED"]);
    expect(branchTransitionsFrom("ACTIVE")).toEqual(["SUSPENDED", "INACTIVE", "CLOSED"]);
    expect(branchTransitionsFrom("SUSPENDED")).toEqual(["ACTIVE", "INACTIVE", "CLOSED"]);
    expect(branchTransitionsFrom("INACTIVE")).toEqual(["ACTIVE", "CLOSED"]);
  });

  it("offers nothing from CLOSED, which is terminal", () => {
    expect(branchTransitionsFrom("CLOSED")).toEqual([]);
  });

  it("never offers a way back to PENDING, which is provisioning and cannot be undone", () => {
    for (const from of ["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE", "CLOSED"]) {
      expect(branchTransitionsFrom(from)).not.toContain("PENDING");
    }
  });

  it("treats an unknown state as offering nothing rather than everything", () => {
    expect(branchTransitionsFrom("ARCHIVED")).toEqual([]);
    expect(branchTransitionsFrom("")).toEqual([]);
  });
});

describe("what a transition demands of the operator", () => {
  it("requires a reason only when the branch leaves service", () => {
    expect(branchReasonRequired("SUSPENDED")).toBe(true);
    expect(branchReasonRequired("INACTIVE")).toBe(true);
    expect(branchReasonRequired("CLOSED")).toBe(true);
    expect(branchReasonRequired("ACTIVE")).toBe(false);
  });

  it("requires the branch name typed out only for the irreversible one", () => {
    expect(branchNameConfirmationRequired("CLOSED")).toBe(true);
    expect(branchNameConfirmationRequired("INACTIVE")).toBe(false);
    expect(branchNameConfirmationRequired("SUSPENDED")).toBe(false);
    expect(branchNameConfirmationRequired("ACTIVE")).toBe(false);
  });
});

describe("why a branch may not leave service", () => {
  it("blocks the sole branch, whether or not it is main", () => {
    expect(branchLeaveServiceBlock("CLOSED", { isMain: true, branchCount: 1 }))
      .toMatch(/only branch/);
    expect(branchLeaveServiceBlock("INACTIVE", { isMain: false, branchCount: 1 }))
      .toMatch(/only branch/);
  });

  it("blocks the main branch, and names the way out", () => {
    expect(branchLeaveServiceBlock("SUSPENDED", { isMain: true, branchCount: 3 }))
      .toMatch(/Make another branch the main branch first/);
  });

  // The sole-branch message outranks the main-branch one: a school with one
  // branch cannot follow the advice to promote a sibling, because there is none.
  it("prefers the sole-branch reason over the main-branch one", () => {
    expect(branchLeaveServiceBlock("CLOSED", { isMain: true, branchCount: 1 }))
      .not.toMatch(/main branch first/);
  });

  it("blocks nothing for an ordinary branch, or for a return to service", () => {
    expect(branchLeaveServiceBlock("CLOSED", { isMain: false, branchCount: 3 })).toBeNull();
    expect(branchLeaveServiceBlock("ACTIVE", { isMain: true, branchCount: 1 })).toBeNull();
  });
});
