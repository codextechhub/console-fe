import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dismissOpenDrawerForError } from "@/utils/drawer-errors";
import { Sheet } from "./sheet";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Sheet error handling", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("asks its owning screen to close when a visible API error occurs", async () => {
    const onOpenChange = vi.fn();
    await act(async () => {
      root.render(<Sheet open onOpenChange={onOpenChange} />);
    });

    dismissOpenDrawerForError();
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not retain an error listener after the drawer closes", async () => {
    const onOpenChange = vi.fn();
    await act(async () => {
      root.render(<Sheet open={false} onOpenChange={onOpenChange} />);
    });

    dismissOpenDrawerForError();
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
