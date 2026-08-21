import { afterEach, describe, expect, it, vi } from "vitest";

import { preventWalkthroughDismiss } from "./walkthrough-interaction";

afterEach(() => {
  document.body.replaceChildren();
});

describe("walkthrough layer interactions", () => {
  it("prevents an open layer from dismissing when the coach is clicked", () => {
    const walkthrough = document.createElement("div");
    walkthrough.dataset.walkthroughActive = "walkthrough.finance.journal";
    const next = document.createElement("button");
    walkthrough.append(next);
    document.body.append(walkthrough);
    const preventDefault = vi.fn();

    preventWalkthroughDismiss({ target: next, preventDefault });

    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("leaves ordinary outside interactions unchanged", () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const preventDefault = vi.fn();

    preventWalkthroughDismiss({ target: outside, preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
