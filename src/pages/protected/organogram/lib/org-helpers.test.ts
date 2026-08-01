import { describe, expect, it } from "vitest";

import { nextFocusedNode } from "./org-helpers";

describe("nextFocusedNode", () => {
  it("returns only the next branch on a viewer's initial reporting path", () => {
    const path = [10, 20, 30];

    expect(nextFocusedNode(path, 10)).toBe(20);
    expect(nextFocusedNode(path, 20)).toBe(30);
    expect(nextFocusedNode(path, 30)).toBeNull();
    expect(nextFocusedNode(path, 99)).toBeNull();
  });
});
