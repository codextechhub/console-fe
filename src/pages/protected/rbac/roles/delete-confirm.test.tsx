import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Deleting a platform role asks first, and says who loses it.
 *
 * "Regional Support" is held by three people. Choosing Delete from its menu
 * opens a prompt saying so, and nothing is deleted until it is confirmed.
 */
const mocks = vi.hoisted(() => ({ deleteRole: vi.fn(), toastSuccess: vi.fn() }));

vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ hasPermission: () => true }) }));
vi.mock("@/redux/services/dashboard/rbac-api", () => ({
  useGetPlatformRolesQuery: () => ({
    data: {
      data: [{
        key: "regional_support", name: "Regional Support", status: "ACTIVE",
        is_system_role: false, is_locked: false, assigned_users_count: 3,
        permissions_count: 12, created_at: "2026-10-01T00:00:00Z",
      }],
      pagination: { pageSize: 10, totalPages: 1, currentPage: 1, totalItems: 1 },
    },
    isLoading: false, isError: false, isFetching: false, refetch: vi.fn(),
  }),
  useDeletePlatformRoleMutation: () => [mocks.deleteRole, { isLoading: false }],
}));
// The row menu is a Radix dropdown; its actions are rendered as plain buttons here.
vi.mock("@/components/custom/custom-table", () => ({
  default: ({ tableBodyList, dropDownList }: {
    tableBodyList: unknown[];
    dropDownList: (item: unknown) => { label: string; onActionClick: () => void }[];
  }) => (
    <div>
      {tableBodyList.map((item, index) => (
        <div key={index}>
          {dropDownList(item).map((action) => (
            <button key={action.label} type="button" onClick={action.onActionClick}>{action.label}</button>
          ))}
        </div>
      ))}
    </div>
  ),
}));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: vi.fn() } }));

import RolesList from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mocks.deleteRole.mockReset();
  mocks.deleteRole.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const click = async (label: string) => {
  const button = [...document.querySelectorAll("button")].filter((b) => b.textContent?.trim() === label).at(-1);
  expect(button, label).toBeTruthy();
  await act(async () => button!.click());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("deleting a role", () => {
  it("says who holds it and deletes nothing until confirmed", async () => {
    await act(async () => root.render(<MemoryRouter><RolesList /></MemoryRouter>));

    await click("Delete");
    expect(document.body.textContent).toContain("Delete Regional Support?");
    expect(document.body.textContent).toContain("3 people hold this role");
    expect(mocks.deleteRole).not.toHaveBeenCalled();

    await click("Delete role");
    expect(mocks.deleteRole).toHaveBeenCalledWith("regional_support");
  });
});
