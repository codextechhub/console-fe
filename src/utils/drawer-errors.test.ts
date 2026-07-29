import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dismissOpenDrawerForError,
  onDrawerError,
} from "./drawer-errors";

afterEach(() => {
  vi.useRealTimers();
});

describe("drawer error dismissal", () => {
  it("notifies open drawers on the next task so loading guards can clear", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    const unsubscribe = onDrawerError(dismiss);

    dismissOpenDrawerForError();

    expect(dismiss).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(dismiss).toHaveBeenCalledOnce();

    unsubscribe();
  });

  it("removes a drawer listener when it closes", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    const unsubscribe = onDrawerError(dismiss);
    unsubscribe();

    dismissOpenDrawerForError();
    vi.runOnlyPendingTimers();

    expect(dismiss).not.toHaveBeenCalled();
  });
});
