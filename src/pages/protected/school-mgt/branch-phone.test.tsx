import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  branch: null as Record<string, unknown> | null,
  update: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    fieldAccess: {},
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

vi.mock("@/components/layout/dashboard-header", () => ({ useDashboardBack: () => undefined }));

vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({
  useGetBranchDetailQuery: () => ({ data: { data: mocks.branch }, isLoading: false }),
  useUpdateBranchMutation: () => [mocks.update, { isLoading: false }],
  useGetSchoolDetailQuery: () => ({ data: { data: { slug: "bright-star" } }, isLoading: false, isError: false }),
  useCreateBranchMutation: () => [mocks.create, { isLoading: false }],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import EditBranch from "./edit-branch";
import CreateBranch from "./create-branch";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BRANCH = {
  code: 2, name: "Lekki Branch", address: "5 Admiralty Way", email: "", phone: "08039876543",
  country: "Nigeria", state: "Lagos",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mocks.branch = { ...BRANCH };
  mocks.update.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({}) });
  mocks.create.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({}) });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Types into a controlled input the way a user would, so formik hears it. */
async function type(id: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function press(text: string) {
  await act(async () => {
    Array.from(container.querySelectorAll("button")).find((b) => b.textContent === text)?.click();
    for (let i = 0; i < 8; i++) await Promise.resolve();
  });
}

describe("edit branch: phone", () => {
  const render = () => act(() => root.render(
    <MemoryRouter initialEntries={["/school-management/bright-star/branches/2/edit"]}>
      <Routes>
        <Route path="/school-management/:slug/branches/:code/edit" element={<EditBranch />} />
      </Routes>
    </MemoryRouter>,
  ));

  it("shows the branch's phone with what it is for", () => {
    render();

    expect(container.querySelector<HTMLInputElement>("#phone")?.value).toBe("08039876543");
    expect(container.textContent).toContain(
      "WhatsApp alerts for this branch's payment terminal go to this number.",
    );
  });

  it("sends a changed phone", async () => {
    render();
    await type("phone", "08051112222");
    await press("Save Changes");

    expect(mocks.update.mock.calls[0][0].body).toMatchObject({ phone: "08051112222" });
  });

  it("sends an emptied phone so the number can be cleared", async () => {
    render();
    await type("phone", "");
    await press("Save Changes");

    expect(mocks.update.mock.calls[0][0].body).toHaveProperty("phone", "");
  });

  it("leaves an untouched phone out of the request", async () => {
    render();
    await press("Save Changes");

    expect(mocks.update.mock.calls[0][0].body).not.toHaveProperty("phone");
  });

  it("refuses a phone that is not a number before anything is sent", async () => {
    render();
    await type("phone", "not a number");
    await press("Save Changes");

    expect(mocks.update).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Enter a valid phone number");
  });
});

describe("add branch: phone", () => {
  const render = () => act(() => root.render(
    <MemoryRouter initialEntries={["/school-management/bright-star/branches/create"]}>
      <Routes>
        <Route path="/school-management/:slug/branches/create" element={<CreateBranch />} />
      </Routes>
    </MemoryRouter>,
  ));

  it("sends the branch phone apart from the branch admin's", async () => {
    render();
    await type("name", "Lekki Branch");
    await type("phone", "08051112222");
    await type("admin_first_name", "Tunde");
    await type("admin_last_name", "Bello");
    await type("admin_email", "tunde@bright-star.test");
    await type("admin_phone", "08099990000");
    await press("Create Branch");

    const body = mocks.create.mock.calls[0][0].body;
    expect(body.phone).toBe("08051112222");
    expect(body.primary_admin_data.phone).toBe("08099990000");
  });

  it("does not offer to use the school's phone: only a school's first main branch defaults", () => {
    render();

    expect(container.textContent).not.toContain("Leave blank to use the school's phone");
  });
});
