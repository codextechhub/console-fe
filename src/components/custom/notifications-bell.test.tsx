import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const notificationMocks = vi.hoisted(() => ({
  markAll: vi.fn(),
  markRead: vi.fn(),
  useNotifications: vi.fn(),
}));

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: notificationMocks.useNotifications,
}));

vi.mock("@/redux/services/notifications-api", () => ({
  useMarkAllNotificationsReadMutation: () => [
    notificationMocks.markAll,
    { isLoading: false },
  ],
  useMarkNotificationsReadMutation: () => [
    notificationMocks.markRead,
    { isLoading: false },
  ],
}));

import { NotificationsBell } from "./notifications-bell";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("NotificationsBell clearing", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    notificationMocks.useNotifications.mockReturnValue({
      count: 2,
      isLoading: false,
      items: [
        {
          id: "6a8794c5-177f-4380-838b-62268f487269",
          event_type_key: "workflow.final_approved",
          event_type_label: "Workflow fully approved",
          channel: "in_app",
          subject: "Vendor Payment Approved",
          body: "VP-0042 was approved by Ada Approver.",
          action_url: "/workflow/approvals/abc123",
          is_read: false,
          created_at: "2026-08-11T10:00:00Z",
        },
      ],
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("clears one notification without opening it and can clear all unread items", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <NotificationsBell />
        </MemoryRouter>,
      );
    });

    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-label="2 unread notifications"]',
    );
    await act(async () => {
      trigger?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      trigger?.click();
      await Promise.resolve();
    });

    const clearOne = document.querySelector<HTMLButtonElement>(
      '[aria-label="Clear Vendor Payment Approved"]',
    );
    expect(clearOne).not.toBeNull();
    expect(document.body.textContent).not.toContain("Workflow fully approved");
    expect(clearOne?.className).toContain("sm:opacity-0");
    expect(clearOne?.className).toContain("sm:group-hover:opacity-100");

    await act(async () => clearOne?.click());
    expect(notificationMocks.markRead).toHaveBeenCalledWith({
      ids: ["6a8794c5-177f-4380-838b-62268f487269"],
    });

    const clearAll = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Clear all"),
    );
    await act(async () => clearAll?.click());
    expect(notificationMocks.markAll).toHaveBeenCalledOnce();
  });
});
