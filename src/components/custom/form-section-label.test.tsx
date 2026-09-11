import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FormSectionLabel } from "./form-section-label";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("FormSectionLabel", () => {
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
    vi.restoreAllMocks();
  });

  it("renders the form label with valid inline icon markup and no React warnings", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await act(async () => root.render(<FormSectionLabel>User Group</FormSectionLabel>));

    const label = container.querySelector("p");
    expect(label?.textContent).toBe("User Group");
    expect(label?.querySelector("span[aria-hidden='true'] svg")).not.toBeNull();
    expect(label?.querySelector("figure")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});
