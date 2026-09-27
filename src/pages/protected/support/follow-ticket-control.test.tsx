import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FollowTicketControl } from "./follow-ticket-control";

let container: HTMLDivElement;
let root: Root;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("FollowTicketControl", () => {
  it("offers to unmute a muted ticket and sends the following state", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <FollowTicketControl following={false} busy={false} onChange={onChange} />,
      );
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Unmute");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).not.toContain("Notifications");
    expect(container.textContent).not.toContain("Commenting follows this ticket automatically");
    await act(async () => button?.click());
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("offers to mute a followed ticket without hiding it", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <FollowTicketControl following busy={false} onChange={onChange} />,
      );
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Mute");
    expect(button?.getAttribute("aria-pressed")).toBe("false");
    await act(async () => button?.click());
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("blocks repeated changes while the request is running", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(<FollowTicketControl following busy onChange={onChange} />);
    });

    const button = container.querySelector("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
    await act(async () => button?.click());
    expect(onChange).not.toHaveBeenCalled();
  });
});
