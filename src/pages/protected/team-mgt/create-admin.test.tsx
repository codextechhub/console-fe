import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fieldAccess: {} as Record<string, unknown>,
  draft: null as Record<string, unknown> | null,
  create: vi.fn(),
  update: vi.fn(),
  submitDraft: vi.fn(),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ fieldAccess: mocks.fieldAccess }),
}));

vi.mock("@/hooks/use-all-roles", () => ({
  useAllRoles: () => ({ roles: [{ name: "Support Agent", key: "support_agent" }] }),
}));

vi.mock("@/redux/services/dashboard/team-mgt-api", () => ({
  useCreateTeamMemberMutation: () => [mocks.create, { isLoading: false }],
  useUpdateTeamMemberMutation: () => [mocks.update],
  useSubmitDraftUserMutation: () => [mocks.submitDraft],
  useGetTeamMembersDetailsQuery: () => ({ data: mocks.draft ? { data: mocks.draft } : undefined }),
}));

vi.mock("@/redux/services/dashboard/organogram-api", () => ({
  useGetPositionsQuery: () => ({
    data: { data: [{ id: 4, title: "Support Engineer", code: "SUP-ENG", org_node: null }] },
  }),
  useGetOrgNodesQuery: () => ({ data: { data: [] } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// The combobox is a base-ui widget; a native select keeps the same
// value/name/onChange contract and lets the test drive it.
vi.mock("@/components/custom/search-select", () => ({
  SearchSelect: ({ id, name, value, onChange, options, label }: {
    id?: string; name?: string; value?: string; label?: string;
    options: { value: string; label: string }[];
    onChange?: (e: unknown) => void;
  }) => (
    <label>
      {label}
      <select id={id} name={name} value={value ?? ""} onChange={onChange as never}>
        <option value="" />
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  ),
}));

import CreateAdmin from "./create-admin";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const RESOURCE = "platform.staff_profile";
// Formik validates on a later turn, and the submit button stays disabled until it has.
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10));
};

describe("add CX staff Field Access", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.fieldAccess = {};
    mocks.draft = null;
    mocks.create.mockReset();
    mocks.create.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mocks.update.mockReset();
    mocks.update.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mocks.submitDraft.mockReset();
    mocks.submitDraft.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (path = "/team-mgt/cx/create") => act(() => root.render(
    <MemoryRouter initialEntries={[path]}>
      <CreateAdmin />
    </MemoryRouter>,
  ));
  const field = (id: string) => container.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
  // A control is greyed by the disabled fieldset around it.
  const greyed = (id: string) => field(id)?.closest("fieldset")?.disabled === true;

  const type = async (id: string, value: string) => {
    const input = field(id) as HTMLInputElement | HTMLSelectElement;
    const proto = input instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    await act(async () => {
      Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
      await settle();
    });
  };
  const fillIdentity = async () => {
    await type("first_name", "Emeka");
    await type("last_name", "Osegbo");
    await type("email", "emeka.osegbo@codexng.test");
    await type("role", "support_agent");
    await type("phone", "08031234567");
    await type("gender", "MALE");
    await type("position", "4");
  };
  const press = async (label: string) => {
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((b) => b.textContent?.trim() === label)?.click();
      await settle();
    });
  };

  it("draws every detail and sends them all for a role with full access", async () => {
    render();
    await fillIdentity();
    // Choosing the seat validates the form as a whole, so submitting is open.
    expect(container.querySelector<HTMLButtonElement>("button[type=submit]")?.disabled).toBe(false);
    await type("employee_id", "CX-0042");
    await type("employment_type", "FULL_TIME");

    for (const id of ["first_name", "last_name", "employee_id", "job_title", "employment_type", "date_joined"]) {
      expect(field(id), id).not.toBeNull();
      expect(greyed(id), id).toBe(false);
    }
    await press("Submit for Approval");

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      first_name: "Emeka",
      last_name: "Osegbo",
      employee_id: "CX-0042",
      employment_type: "FULL_TIME",
      job_title: "Support Engineer",
    });
  });

  it("removes a hidden detail and never sends it, in a submission or a draft", async () => {
    mocks.fieldAccess = { [RESOURCE]: { hidden: ["employee_id", "employment_type", "date_joined"] } };
    render();

    expect(field("employee_id")).toBeNull();
    expect(field("employment_type")).toBeNull();
    expect(field("date_joined")).toBeNull();
    expect(container.textContent).not.toContain("Employee ID");
    expect(field("job_title")).not.toBeNull();

    await fillIdentity();
    await press("Submit for Approval");
    await press("Save as draft");

    expect(mocks.create).toHaveBeenCalledTimes(2);
    for (const [body] of mocks.create.mock.calls) {
      expect(body).not.toHaveProperty("employee_id");
      expect(body).not.toHaveProperty("employment_type");
      expect(body).not.toHaveProperty("date_joined");
      expect(body).toHaveProperty("job_title", "Support Engineer");
    }
    expect(mocks.create.mock.calls[1][0]).toHaveProperty("save_as_draft", true);
  });

  it("greys a read-only detail and leaves it out of the body", async () => {
    mocks.fieldAccess = { [RESOURCE]: { read_only: ["employee_id", "job_title"] } };
    render();

    expect(greyed("employee_id")).toBe(true);
    expect(greyed("job_title")).toBe(true);
    expect(container.querySelector('[data-field="employee_id"]')?.hasAttribute("data-read-only")).toBe(true);
    expect(greyed("employment_type")).toBe(false);

    await fillIdentity();
    await type("employment_type", "CONTRACT");
    await press("Submit for Approval");

    const body = mocks.create.mock.calls[0][0];
    expect(body).not.toHaveProperty("employee_id");
    expect(body).not.toHaveProperty("job_title");
    expect(body).toHaveProperty("employment_type", "CONTRACT");
  });

  it("keeps the names open on create even when their switches are closed", async () => {
    mocks.fieldAccess = {
      [RESOURCE]: {
        hidden: ["first_name", "last_name"],
        read_only: ["first_name", "last_name"],
        open_on_create: ["first_name", "last_name"],
      },
    };
    render();

    expect(field("first_name")).not.toBeNull();
    expect(greyed("first_name")).toBe(false);
    expect(greyed("last_name")).toBe(false);

    await fillIdentity();
    await press("Submit for Approval");

    expect(mocks.create.mock.calls[0][0]).toMatchObject({ first_name: "Emeka", last_name: "Osegbo" });
  });

  it("shows a refused detail beside its field instead of a toast", async () => {
    mocks.create.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 403,
        data: {
          error: {
            code: "field_write_denied",
            detail: { employee_id: ["You may not set Employee ID."] },
          },
        },
      }),
    });
    render();
    await fillIdentity();
    await type("employee_id", "CX-0042");
    await press("Submit for Approval");

    const beside = container.querySelector('[data-field="employee_id"]');
    expect(beside?.textContent).toContain("You may not set Employee ID.");
    expect(container.querySelector('[data-field="employment_type"]')?.textContent ?? "")
      .not.toContain("You may not");
  });

  it("lists a refusal for a detail the form does not draw above the buttons", async () => {
    mocks.create.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 403,
        data: {
          error: {
            code: "field_write_denied",
            detail: { date_of_birth: ["You may not set Date of birth."] },
          },
        },
      }),
    });
    render();
    await fillIdentity();
    await press("Submit for Approval");

    const alert = container.querySelector('form [role="alert"]');
    expect(alert?.textContent).toContain("You may not set Date of birth.");
  });

  it("asks the existing-record answers when resuming a draft", async () => {
    mocks.fieldAccess = { [RESOURCE]: { read_only: ["last_name"] } };
    mocks.draft = {
      first_name: "Emeka", last_name: "Osegbo", email: "emeka.osegbo@codexng.test",
      role: "Support Agent", phone: "08031234567", gender: "MALE",
      position_id: 4, position_title: "Support Engineer",
    };
    render("/team-mgt/cx/create?draft=9");
    await settle();

    expect(greyed("last_name")).toBe(true);
    expect(greyed("first_name")).toBe(false);
    await press("Save as draft");

    expect(mocks.update).toHaveBeenCalledTimes(1);
    const body = mocks.update.mock.calls[0][0].body;
    expect(body).toHaveProperty("first_name", "Emeka");
    expect(body).not.toHaveProperty("last_name");
  });
});
