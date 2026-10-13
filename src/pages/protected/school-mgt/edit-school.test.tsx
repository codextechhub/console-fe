import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fieldAccess: {} as Record<string, unknown>,
  school: null as Record<string, unknown> | null,
  update: vi.fn(),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ fieldAccess: mocks.fieldAccess }),
}));

vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({
  useGetSchoolDetailQuery: () => ({ data: { data: mocks.school }, isLoading: false }),
  useUpdateSchoolMutation: () => [mocks.update, { isLoading: false }],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import EditSchool from "./edit-school";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SCHOOL = {
  id: 7,
  name: "Bright Star School",
  slug: "bright-star",
  status: "PENDING",
  activated_at: null,
  email: "billing@bright-star.test",
  phone: "08031234567",
  ownership_type: "PRIVATE",
  address: "14 Lantern Road",
  website: "",
  motto: "",
  term_structure: "3_TERMS",
  currency: "NGN",
  registration_id: "",
  _read_only_fields: [] as string[],
};

describe("edit school Field Access", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.fieldAccess = {};
    mocks.school = { ...SCHOOL };
    mocks.update.mockReset();
    mocks.update.mockReturnValue({ unwrap: () => Promise.resolve({ data: { slug: "bright-star" } }) });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = () => act(() => root.render(
    <MemoryRouter initialEntries={["/school-management/bright-star/edit"]}>
      <Routes>
        <Route path="/school-management/:slug/edit" element={<EditSchool />} />
      </Routes>
    </MemoryRouter>,
  ));
  const field = (id: string) => container.querySelector<HTMLInputElement>(`#${id}`);
  // A control is greyed by the disabled fieldset around it.
  const greyed = (id: string) => field(id)?.closest("fieldset")?.disabled === true;
  const save = async () => {
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((b) => b.textContent === "Save Changes")?.click();
      for (let i = 0; i < 6; i++) await Promise.resolve();
    });
  };

  it("lets a writable role edit and send both billing fields", async () => {
    render();

    expect(greyed("email")).toBe(false);
    expect(greyed("phone")).toBe(false);
    await save();

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[0][0].body).toMatchObject({
      email: "billing@bright-star.test",
      phone: "08031234567",
    });
  });

  it("greys a read-only phone and never sends it", async () => {
    mocks.school = { ...SCHOOL, _read_only_fields: ["phone"] };
    render();

    expect(greyed("phone")).toBe(true);
    expect(container.querySelector('[data-field="phone"]')?.hasAttribute("data-read-only")).toBe(true);
    expect(greyed("email")).toBe(false);
    await save();

    const body = mocks.update.mock.calls[0][0].body;
    expect(body).toHaveProperty("email");
    expect(body).not.toHaveProperty("phone");
  });

  it("removes a hidden email, does not require it, and never sends it", async () => {
    mocks.fieldAccess = { "platform.schools": { hidden: ["email"], read_only: [] } };
    const { email: _hidden, ...withoutEmail } = SCHOOL;
    mocks.school = withoutEmail;
    render();

    expect(field("email")).toBeNull();
    expect(container.textContent).not.toContain("School Email");
    expect(field("phone")).not.toBeNull();
    await save();

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[0][0].body).not.toHaveProperty("email");
  });

  it("shows a refusal under the field it names instead of a toast", async () => {
    mocks.update.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 403,
        data: {
          error: {
            code: "field_write_denied",
            detail: { email: ["You may not change School billing email."] },
          },
        },
      }),
    });
    render();
    await save();

    expect(container.querySelector('[data-field="email"]')?.textContent)
      .toContain("You may not change School billing email.");
  });
});
