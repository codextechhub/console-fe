import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  handleLogout: vi.fn(),
  auth: {
    user: { id: "42", email: "ada@codexng.com", password_changed_at: null },
    impersonation: null as null | { target: { full_name: string } },
  },
}));

vi.mock("@/redux/store", () => ({
  useAppSelector: (select: (state: { auth: typeof mocks.auth }) => unknown) => select({ auth: mocks.auth }),
}));

vi.mock("@/redux/services/dashboard/security-api", () => ({
  useChangeMyPasswordMutation: () => [mocks.changePassword, { isLoading: false }],
  useGetMyPasswordResetsQuery: () => ({ data: undefined }),
}));

// The two-step card reads its own request and has its own tests.
vi.mock("./two-step-card", () => ({ TwoStepCard: () => null }));

vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({ handleLogout: mocks.handleLogout, isLoggingOut: false }),
}));

import MyPassword, { SIGNED_OUT_EVERYWHERE_MESSAGE } from "./password";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GOOD = "Correct-Horse-9-Battery";

describe("MyPassword", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.auth.impersonation = null;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  const render = () => act(() => root.render(<MyPassword />));
  const button = (label: string) => Array.from(container.querySelectorAll("button"))
    .find((candidate) => candidate.textContent?.trim() === label);
  const fieldError = (id: string) =>
    container.querySelector(`#${id}`)?.closest(".grid")?.querySelector("p.text-destructive\\/70")
      ?.textContent ?? null;

  /** Types into a controlled input the way React listens for it. */
  const type = (id: string, value: string) => {
    const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => {
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  const fillAndSave = async () => {
    type("old_password", "Old-Password-1!");
    type("new_password", GOOD);
    type("confirm_password", GOOD);
    await act(async () => {
      button("Update password")!.click();
    });
  };

  it("says before saving that this device is signed out too", () => {
    render();

    expect(container.textContent).toContain("Updating signs you out on every device, this one included.");
    expect(container.textContent).not.toContain("all other devices");
  });

  it("after a change, says every device is signed out and offers to sign in again", async () => {
    mocks.changePassword.mockReturnValue({ unwrap: () => Promise.resolve({ message: "ok" }) });
    render();

    await fillAndSave();

    expect(mocks.changePassword).toHaveBeenCalledWith({
      current_password: "Old-Password-1!",
      password: GOOD,
      confirm_password: GOOD,
    });
    expect(container.querySelector("[role=status]")?.textContent).toContain(SIGNED_OUT_EVERYWHERE_MESSAGE);
    expect(container.textContent).not.toContain("other devices");
    expect(container.querySelector<HTMLInputElement>("#old_password")!.value).toBe("");

    act(() => button("Sign in again now")!.click());
    expect(mocks.handleLogout).toHaveBeenCalledTimes(1);
  });

  it("shows a wrong current password under Current password", async () => {
    mocks.changePassword.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 400,
        data: { success: false, message: "Invalid request.", error: { current_password: ["Current password is incorrect."] } },
      }),
    });
    render();

    await fillAndSave();

    expect(fieldError("old_password")).toBe("Current password is incorrect.");
    expect(fieldError("new_password")).toBeNull();
    expect(container.querySelector("[role=status]")).toBeNull();
    expect(container.querySelector("[role=alert]")).toBeNull();
  });

  it("shows a policy refusal under New password and a mismatch under Confirm", async () => {
    mocks.changePassword.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 400,
        data: {
          success: false,
          message: "Invalid request.",
          error: {
            password: ["This password is too common."],
            confirm_password: ["Passwords do not match."],
          },
        },
      }),
    });
    render();

    await fillAndSave();

    expect(fieldError("new_password")).toBe("This password is too common.");
    expect(fieldError("confirm_password")).toBe("Passwords do not match.");
  });

  it("clears a box's refusal once the reader edits that box", async () => {
    mocks.changePassword.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 400,
        data: { error: { current_password: ["Current password is incorrect."] } },
      }),
    });
    render();

    await fillAndSave();
    type("old_password", "Another-Try-2!");

    expect(fieldError("old_password")).toBeNull();
  });

  it("shows a refusal that names no box in the form itself", async () => {
    mocks.changePassword.mockReturnValue({
      unwrap: () => Promise.reject({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }),
    });
    render();

    await fillAndSave();

    expect(container.querySelector("[role=alert]")?.textContent).toBe(
      "Could not reach the server. Please check your connection and try again.",
    );
  });

  it("withholds the form while proxying and says how to reach the operator's own", () => {
    mocks.auth.impersonation = { target: { full_name: "Tunde Bakare" } };
    render();

    expect(container.querySelector("#old_password")).toBeNull();
    expect(button("Update password")).toBeUndefined();
    expect(container.textContent).toContain("Exit proxy to change your password");
    expect(container.textContent).toContain(
      "You are proxying as Tunde Bakare, and only they can change their password.",
    );
    expect(container.textContent).toContain("Password reset history");
  });

  it("flags a mismatch before anything is sent and keeps Update off", () => {
    render();

    type("old_password", "Old-Password-1!");
    type("new_password", GOOD);
    type("confirm_password", `${GOOD}x`);

    expect(fieldError("confirm_password")).toBe("Passwords do not match.");
    expect(button("Update password")!.disabled).toBe(true);
  });
});
