import { describe, expect, it } from "vitest";

import { fmtDate, nextFocusedNode } from "./org-helpers";

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
