import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SessionTimeoutModal } from "./session-timeout-modal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SessionTimeoutModal", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("renders above an already-open drawer", async () => {
    await act(async () => {
      root.render(
        <>
          <SessionTimeoutModal
            open
            secondsLeft={600}
            isExpired={false}
            onContinue={vi.fn()}
            onLogout={vi.fn()}
            goToLogin={vi.fn()}
          />
          <Sheet open onOpenChange={vi.fn()}>
            <SheetContent>Drawer content</SheetContent>
          </Sheet>
        </>,
      );
    });

    const drawer = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    const timeout = document.querySelector<HTMLElement>("[data-session-timeout]");
    const timeoutOverlay = document.querySelector<HTMLElement>(
      '[data-slot="dialog-overlay"].z-\\[70\\]',
    );

    expect(drawer).not.toBeNull();
    expect(timeout).not.toBeNull();
    expect(timeoutOverlay).not.toBeNull();
    expect(drawer?.className).toContain("z-50");
    expect(timeout?.className).toContain("z-[70]");
  });
});
