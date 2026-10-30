import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Account actions on the CX team list ask first.
 *
 * Suspending Tunde signs him out of every school he supports, so the menu
 * opens a prompt that names him and says what happens, and nothing is sent
 * until the prompt is confirmed. The same holds for reactivating, unlocking
 * and resetting two-step sign-in.
 */
const mocks = vi.hoisted(() => ({
  suspend: vi.fn(),
  reactivate: vi.fn(),
  unlock: vi.fn(),
  resetTwoStep: vi.fn(),
  toastSuccess: vi.fn(),
  members: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ hasPermission: () => true }) }));
vi.mock("@/components/finance-ui/field-access", () => ({
  useFieldAccess: () => ({ isHidden: () => false }),
}));
vi.mock("@/hooks/use-all-roles", () => ({ useAllRoles: () => ({ roles: [], isLoading: false }) }));
vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({ useGetSchoolsQuery: () => ({ data: undefined }) }));
vi.mock("@/components/custom/quick-export-drawer", () => ({ QuickExportButton: () => null }));
vi.mock("@/components/custom/bulk-import-drawer", () => ({ default: () => null }));
vi.mock("react-redux", () => ({ useSelector: () => ({ id: 1 }) }));
vi.mock("@/redux/services/dashboard/team-mgt-api", () => ({
  useGetTeamMembersQuery: () => ({
    data: { data: mocks.members, pagination: { pageSize: 10, totalPages: 1, currentPage: 1 } },
    isLoading: false, isError: false, isFetching: false, refetch: vi.fn(),
  }),
  useSuspendTeamMemberMutation: () => [mocks.suspend],
  useReactivateTeamMemberMutation: () => [mocks.reactivate],
  useUnlockTeamMemberMutation: () => [mocks.unlock],
  useResetUserTwoStepMutation: () => [mocks.resetTwoStep],
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

import MembersTab from "./members";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const member = (id: number, full_name: string, status: string) => ({
  id, full_name, email: `${full_name.split(" ")[0].toLowerCase()}@codex.test`, role: "Support", status,
  created_at: "2026-10-01T00:00:00Z",
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  for (const fn of [mocks.suspend, mocks.reactivate, mocks.unlock, mocks.resetTwoStep, mocks.toastSuccess]) {
    fn.mockReset();
    fn.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const render = async () => {
  await act(async () => root.render(<MemoryRouter><MembersTab scope="cx" /></MemoryRouter>));
};
const click = async (label: string) => {
  const button = [...document.querySelectorAll("button")].filter((b) => b.textContent?.trim() === label).at(-1);
  expect(button, label).toBeTruthy();
  await act(async () => button!.click());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("account actions on the team list", () => {
  it("names the person and sends nothing until the suspension is confirmed", async () => {
    mocks.members = [member(7, "Tunde Bakare", "ACTIVE")];
    await render();

    await click("Suspend");
    expect(document.body.textContent).toContain("Suspend Tunde Bakare?");
    expect(mocks.suspend).not.toHaveBeenCalled();

    await click("Suspend");
    expect(mocks.suspend).toHaveBeenCalledWith(7);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("User suspended.");
  });

  it("asks before unlocking and before reactivating", async () => {
    mocks.members = [member(8, "Ada Obi", "LOCKED"), member(9, "Bola Ade", "SUSPENDED")];
    await render();

    await click("Unlock");
    expect(document.body.textContent).toContain("Unlock Ada Obi?");
    expect(mocks.unlock).not.toHaveBeenCalled();
    await click("Cancel");
    expect(mocks.unlock).not.toHaveBeenCalled();

    await click("Reactivate");
    expect(document.body.textContent).toContain("Reactivate Bola Ade?");
    expect(mocks.reactivate).not.toHaveBeenCalled();
  });

  it("never offers your own account a suspension or a two-step reset", async () => {
    mocks.members = [member(1, "Me Myself", "ACTIVE")];
    await render();

    const labels = [...container.querySelectorAll("button")].map((b) => b.textContent?.trim());
    expect(labels).not.toContain("Suspend");
    expect(labels).not.toContain("Reset two-step sign-in");
  });
});
