import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { InfoHint } from "./info-hint";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("InfoHint", () => {
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

  it("reveals its explanation when the info button is clicked", async () => {
    await act(async () => {
      root.render(
        <InfoHint ariaLabel="About refundable credit">
          Total customer credit available to refund.
        </InfoHint>,
      );
    });

    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-label="About refundable credit"]',
    );
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.textContent).toContain(
      "Total customer credit available to refund.",
    );
  });
});
