import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppLogo } from "./app-logo";
import AuthLayout from "./layout/auth-layout";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("AppLogo", () => {
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

  it("uses the blue CodeX mark and keeps the hover animation structure", async () => {
    await act(async () => root.render(<AppLogo />));

    expect(container.querySelector(".app-logo__card")).not.toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/image/codex-mark-blue.png",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("CodeX");
  });

  it("uses the white CodeX mark on blue surfaces", async () => {
    await act(async () => root.render(<AppLogo surface="blue" />));

    expect(container.querySelector(".app-logo")?.classList.contains("text-white")).toBe(true);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/image/codex-mark-white.png",
    );
  });

  it("keeps the login logo animated", async () => {
    await act(async () => root.render(<AuthLayout />));

    expect(container.querySelector(".app-logo__card")).not.toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/image/codex-mark-white.png",
    );
  });
});
