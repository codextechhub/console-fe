import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createExport: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock("@/redux/store", () => ({
  useAppSelector: () => ({ id: "42" }),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: mocks.hasPermission }),
}));

vi.mock("@/redux/services/dashboard/audit-api", () => ({
  useCreateAuditExportMutation: () => [mocks.createExport, { isLoading: false }],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

import MyPrivacy from "./privacy";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("MyPrivacy", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.hasPermission.mockReturnValue(false);
    mocks.createExport.mockReturnValue({ unwrap: () => Promise.resolve({ data: {} }) });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  const render = () => act(() => root.render(<MyPrivacy />));
  const button = (label: string) => Array.from(container.querySelectorAll("button"))
    .find((candidate) => candidate.textContent?.trim() === label);

  it("states the real export boundary and removes unsupported policy claims", () => {
    render();

    expect(container.textContent).toContain("Activity CSVs require audit-export access");
    expect(button("Export access required")?.disabled).toBe(true);
    expect(container.textContent).not.toContain("packaged as a ZIP");
    expect(container.textContent).not.toContain("General audit events kept for 2 years");
    expect(button("Read")).toBeUndefined();
    expect(button("View policy")).toBeUndefined();
  });

  it("sends only the signed-in user's activity filter when export access exists", async () => {
    mocks.hasPermission.mockReturnValue(true);
    render();

    await act(async () => {
      button("Request activity CSV")?.click();
      await Promise.resolve();
    });

    expect(mocks.createExport).toHaveBeenCalledWith({
      filter_payload: { actor_user_id: "42" },
      export_format: "CSV",
    });
  });
});
