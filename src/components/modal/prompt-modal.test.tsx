import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PromptModal from "./prompt-modal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("PromptModal", () => {
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

  const open = async (props: Partial<React.ComponentProps<typeof PromptModal>> = {}) =>
    act(async () => {
      root.render(
        <PromptModal
          isOpen
          onConfirm={props.onConfirm ?? (() => {})}
          onClose={props.onClose}
          title="Log Out?"
          description="Are you sure?"
          onConfirmText="Log Out"
          canCancel
          {...props}
        />,
      );
    });

  const dialog = () => document.querySelector('[role="dialog"]');

  it("parks focus on the dialog itself, not on a button", async () => {
    await open();
    // A confirmation must not be answerable by the keystroke that opened it: if
    // focus lands on a button, the Enter still travelling from the palette
    // presses it. Anything focusable is fine except the buttons.
    expect(dialog()?.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.tagName).not.toBe("BUTTON");
  });

  it("keeps both buttons reachable once focus is inside", async () => {
    await open();
    const labels = [...(dialog()?.querySelectorAll("button") ?? [])].map((b) => b.textContent);
    expect(labels).toEqual(["Cancel", "Log Out"]);
  });

  it("runs onConfirm when the confirm button is pressed", async () => {
    const onConfirm = vi.fn();
    await open({ onConfirm });
    const confirm = [...(dialog()?.querySelectorAll("button") ?? [])].find(
      (b) => b.textContent === "Log Out",
    );
    await act(async () => confirm?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes on cancel", async () => {
    const onClose = vi.fn();
    await open({ onClose });
    const cancel = [...(dialog()?.querySelectorAll("button") ?? [])].find(
      (b) => b.textContent === "Cancel",
    );
    await act(async () => cancel?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not treat an open signal as a reason to close", async () => {
    // onOpenChange reports both directions; only false means "shut".
    const onClose = vi.fn();
    await open({ onClose });
    expect(onClose).not.toHaveBeenCalled();
  });
});
