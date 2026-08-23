import { describe, expect, it } from "vitest";

import type { OrganogramNode, UserInline } from "@/redux/services/dashboard/organogram-types";
import { buildPeopleTree, countAllReports, fmtDate, nextFocusedNode } from "./org-helpers";

describe("fmtDate", () => {
  it("formats date-only and timestamp values without leaking Invalid Date", () => {
    expect(fmtDate("2026-08-21")).toBe("21 Aug 2026");
    expect(fmtDate("2026-08-21T16:30:00Z")).toBe("21 Aug 2026");
    expect(fmtDate("not-a-date")).toBe("-");
    expect(fmtDate(null)).toBe("-");
  });
});

describe("nextFocusedNode", () => {
  it("returns only the next branch on a viewer's initial reporting path", () => {
    const path = [10, 20, 30];

    expect(nextFocusedNode(path, 10)).toBe(20);
    expect(nextFocusedNode(path, 20)).toBe(30);
    expect(nextFocusedNode(path, 30)).toBeNull();
    expect(nextFocusedNode(path, 99)).toBeNull();
  });
});

// ── People tree: empty seats are transparent ─────────────────────────────────

function user(id: string, name: string): UserInline {
  return { id, email: `${id}@corona.test`, first_name: name, last_name: "", full_name: name };
}

function seat(
  id: number,
  title: string,
  holders: UserInline[],
  direct_reports: OrganogramNode[] = [],
): OrganogramNode {
  return {
    id,
    title,
    code: `P${id}`,
    org_node: null,
    holders,
    is_vacant: holders.length === 0,
    direct_reports,
  };
}

describe("buildPeopleTree", () => {
  const principal = user("u1", "Ada Principal");
  const science = user("u2", "Bola Science");
  const teacher = user("u3", "Chidi Teacher");

  it("draws no card for a vacant seat and lifts its reports to the nearest filled manager", () => {
    // Principal -> (vacant Vice Principal) -> Head of Science -> Teacher
    const tree = [
      seat(1, "Principal", [principal], [
        seat(2, "Vice Principal", [], [
          seat(3, "Head of Science", [science], [seat(4, "Teacher", [teacher])]),
        ]),
      ]),
    ];

    const roots = buildPeopleTree(tree, new Set());

    expect(roots).toHaveLength(1);
    expect(roots[0].user.id).toBe("u1");
    // The empty Vice Principal seat contributes no node of its own...
    expect(roots[0].children.map((c) => c.user.id)).toEqual(["u2"]);
    // ...and nobody below it is lost.
    expect(roots[0].children[0].children.map((c) => c.user.id)).toEqual(["u3"]);
    expect(countAllReports(roots[0].children)).toBe(2);
  });

  it("promotes the reports of a vacant root to roots rather than dropping them", () => {
    const tree = [seat(1, "Principal", [], [seat(2, "Head of Science", [science])])];

    const roots = buildPeopleTree(tree, new Set());

    expect(roots.map((r) => r.user.id)).toEqual(["u2"]);
  });

  it("keeps a fully vacant branch out of the chart entirely", () => {
    const tree = [seat(1, "Principal", [principal], [seat(2, "Vice Principal", [])])];

    const roots = buildPeopleTree(tree, new Set());

    expect(roots[0].children).toEqual([]);
  });
});
