import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BranchStepItem } from "../create-school";
import AddSchoolBranch from "./add-school-branch";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FILLED: BranchStepItem = {
  name: "Ikeja Branch", address: "", email: "", phone: "", country: "Nigeria", state: "Lagos",
  is_main: true, admin_first_name: "Tunde", admin_last_name: "Bello",
  admin_email: "tunde@bright-star.test", admin_phone: "",
};

describe("school creation: branch phone", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onNext = vi.fn();

  beforeEach(() => {
    onNext.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (branches: BranchStepItem[]) => act(() => root.render(
    <MemoryRouter>
      <AddSchoolBranch defaultValues={branches} onNext={onNext} onChange={vi.fn()} />
    </MemoryRouter>,
  ));
  const button = (text: string) =>
    Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes(text));

  it("asks the main branch for a phone and says a blank one uses the school's", () => {
    render([FILLED]);

    expect(container.querySelector("#phone-0")).not.toBeNull();
    expect(container.textContent).toContain("Leave blank to use the school's phone");
    expect(container.textContent).toContain("WhatsApp alerts for this branch's payment terminal go to this number.");
  });

  it("does not promise the school's phone on a branch that is not the main one", () => {
    render([FILLED, { ...FILLED, name: "Lekki Branch", is_main: false }]);

    const hints = Array.from(container.querySelectorAll('[id^="phone-"][id$="-hint"]')).map((h) => h.textContent);
    expect(hints).toHaveLength(2);
    expect(hints[0]).toContain("Leave blank to use the school's phone");
    expect(hints[1]).not.toContain("Leave blank");
  });

  it("holds the form back for a phone that is not a number", async () => {
    render([{ ...FILLED, phone: "call me" }]);

    await act(async () => button("Continue")?.click());

    expect(onNext).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Enter a valid phone number");
  });

  it("lets the form through with no phone at all, since it is optional", async () => {
    render([FILLED]);

    await act(async () => button("Continue")?.click());

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("carries a valid phone forward", async () => {
    render([{ ...FILLED, phone: "08051112222" }]);

    await act(async () => button("Continue")?.click());

    expect(onNext.mock.calls[0][0][0]).toMatchObject({ phone: "08051112222" });
  });
  it("holds the form back for a branch email the server would refuse", async () => {
    render([{ ...FILLED, email: "lekki@brightstar" }]);

    await act(async () => button("Continue")?.click());

    expect(onNext).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Enter a valid email address");
  });

  it("holds the form back for two branches with the same name", async () => {
    render([FILLED, { ...FILLED, is_main: false, name: " ikeja branch ", admin_email: "segun@bright-star.test" }]);

    await act(async () => button("Continue")?.click());

    expect(onNext).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Another branch already has this name.");
  });

  it("still asks for the admin's name and email", async () => {
    render([{ ...FILLED, admin_first_name: "", admin_email: "" }]);

    await act(async () => button("Continue")?.click());

    expect(onNext).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Admin first name is required");
    expect(container.textContent).toContain("Admin email is required");
  });
});
