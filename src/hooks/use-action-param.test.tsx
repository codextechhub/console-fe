import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useActionParam } from "./use-action-param";

let container: HTMLDivElement;
let root: Root;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ onOpen }: { onOpen: () => void }) {
  const location = useLocation();
  useActionParam("new", onOpen);
  return <output data-search={location.search}>{location.search}</output>;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("useActionParam create-drawer contract", () => {
  it("opens once and removes the action instruction from the URL", async () => {
    const onOpen = vi.fn();
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/procurement/requisitions?action=new&from=palette"]}>
          <Probe onOpen={onOpen} />
        </MemoryRouter>,
      );
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(container.querySelector("output")?.getAttribute("data-search"))
      .toBe("?from=palette");
  });

  it("ignores a different action value", async () => {
    const onOpen = vi.fn();
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/procurement/requisitions?action=receive"]}>
          <Probe onOpen={onOpen} />
        </MemoryRouter>,
      );
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(container.querySelector("output")?.getAttribute("data-search"))
      .toBe("?action=receive");
  });
});
