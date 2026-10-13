import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fieldAccess: {} as Record<string, unknown>,
  canConfigure: true,
  plans: [] as Array<Record<string, unknown>>,
  save: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    fieldAccess: mocks.fieldAccess,
    hasPermission: () => mocks.canConfigure,
  }),
}));

// RTK Query keeps `data` referentially stable between renders, and the panel
// resets its drafts when it changes, so the mock must do the same.
let planResponse: { data: unknown[] } | undefined;

vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({
  useGetPackagePlansQuery: () => ({
    data: (planResponse ??= { data: mocks.plans }),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpdatePackagePlanPriceMutation: () => [mocks.save, { isLoading: false }],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mocks.toastError } }));

import { SubscriptionPricing } from "./subscription-pricing";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BASIC = {
  id: 1, name: "Basic", code: "basic", billing_cycle: "YEARLY", currency: "NGN",
  price_per_student: 350000, default_depth: 10, default_depth_label: "Core", is_active: true,
};
const ENTERPRISE = {
  id: 4, name: "Enterprise", code: "enterprise", billing_cycle: "YEARLY", currency: "NGN",
  price_per_student: null, default_depth: null, default_depth_label: "Unlimited", is_active: true,
};

describe("SubscriptionPricing Field Access", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.fieldAccess = {};
    mocks.canConfigure = true;
    mocks.plans = [BASIC, ENTERPRISE];
    planResponse = undefined;
    mocks.save.mockReset();
    mocks.toastError.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = () => act(() => root.render(<SubscriptionPricing />));
  const input = () => container.querySelector<HTMLInputElement>('input[aria-label="Basic price per student"]');
  const saveButton = () => Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Save");

  it("lets a writable role edit and save a rate in naira", async () => {
    mocks.save.mockReturnValue({ unwrap: () => Promise.resolve({ price_per_student: 400000 }) });
    render();

    expect(input()?.value).toBe("3500");
    expect(input()?.disabled).toBe(false);
    expect(container.textContent).toContain("Per-school quote");

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input(), "4000");
      input()?.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      saveButton()?.click();
      await Promise.resolve();
    });

    expect(mocks.save).toHaveBeenCalledWith({ code: "basic", price_per_student: 400000 });
  });

  it("greys the rates and offers no Save when the switch is read-only", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: [], read_only: ["price_per_student"] } };
    render();

    expect(input()?.value).toBe("3500");
    expect(input()?.disabled).toBe(true);
    expect(container.querySelector('[data-field="price_per_student"]')?.hasAttribute("data-read-only")).toBe(true);
    expect(saveButton()).toBeUndefined();
  });

  it("greys the rates for a role without the configure permission", () => {
    mocks.canConfigure = false;
    render();

    expect(input()?.disabled).toBe(true);
    expect(saveButton()).toBeUndefined();
  });

  it("draws no panel when the rate is hidden", () => {
    mocks.fieldAccess = { "platform.schools": { hidden: ["price_per_student"], read_only: [] } };
    mocks.plans = [
      { ...BASIC, price_per_student: undefined },
      { ...ENTERPRISE, price_per_student: undefined },
    ].map(({ price_per_student: _omitted, ...rest }) => rest);
    render();

    expect(input()).toBeNull();
    expect(container.textContent).not.toContain("Per-school quote");
    expect(container.textContent).not.toContain("Set during school creation");
    expect(container.textContent).not.toContain("Per-student tier rates");
  });

  it("does not read a plan row without a rate as a quoted tier", () => {
    mocks.plans = [BASIC, (({ price_per_student: _omitted, ...rest }) => rest)(ENTERPRISE)];
    render();

    expect(input()).not.toBeNull();
    expect(container.textContent).not.toContain("Set during school creation");
  });

  it("shows a refused save beside the input and not as a toast", async () => {
    mocks.save.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 403,
        data: {
          error: {
            code: "field_write_denied",
            detail: { price_per_student: ["You may not change Catalogue price per student."] },
          },
        },
      }),
    });
    render();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input(), "4000");
      input()?.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      saveButton()?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    const cell = container.querySelector('[data-field="price_per_student"]');
    expect(cell?.textContent).toContain("You may not change Catalogue price per student.");
    expect(mocks.toastError).not.toHaveBeenCalled();
  });
});
