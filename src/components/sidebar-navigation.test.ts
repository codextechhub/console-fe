import { describe, expect, it } from "vitest";

import { revealActiveSidebarItem } from "./sidebar-navigation";

function rect(top: number, bottom: number): DOMRect {
  return {
    top,
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

describe("revealActiveSidebarItem", () => {
  it("scrolls to the active submenu leaf rather than stopping at its parent", () => {
    const sidebar = document.createElement("div");
    const parent = document.createElement("button");
    const child = document.createElement("a");
    parent.dataset.active = "true";
    child.dataset.active = "true";
    sidebar.append(parent, child);

    Object.defineProperty(sidebar, "clientHeight", { value: 100 });
    sidebar.getBoundingClientRect = () => rect(0, 100);
    parent.getBoundingClientRect = () => rect(60, 80);
    child.getBoundingClientRect = () => rect(130, 150);

    revealActiveSidebarItem(sidebar, 40);

    expect(sidebar.scrollTop).toBe(98);
  });
});
