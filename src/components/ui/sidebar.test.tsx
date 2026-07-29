import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Link, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function LocationPath() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe("mobile Sidebar", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("closes after a navigation link is selected", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <SidebarProvider>
            <Sidebar>
              <Link to="/destination">Destination</Link>
            </Sidebar>
            <SidebarTrigger />
            <LocationPath />
          </SidebarProvider>
        </MemoryRouter>,
      );
    });

    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-slot="sidebar-trigger"]',
    );
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const mobileSidebar = document.body.querySelector<HTMLElement>(
      '[data-mobile="true"]',
    );
    expect(mobileSidebar?.getAttribute("data-state")).toBe("open");

    const destination = mobileSidebar?.querySelector<HTMLAnchorElement>(
      'a[href="/destination"]',
    );
    expect(destination).not.toBeNull();

    await act(async () => {
      destination?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mobileSidebar?.getAttribute("data-state")).toBe("closed");
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(
      "/destination",
    );
  });
});
