import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveFieldAccess, type FieldAccessMap } from "@/components/finance-ui/field-access";
import type { PackagePlan, PackageSetup } from "@/redux/services/dashboard/school-types";

const mocks = vi.hoisted(() => ({
  plans: [] as unknown[],
  change: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/redux/services/dashboard/school-mgt-api", () => ({
  useGetPackagePlansQuery: () => ({ data: { data: mocks.plans }, isLoading: false }),
  useChangeSchoolPlanMutation: () => [mocks.change, { isLoading: false }],
}));

vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: vi.fn() } }));

// The searchable picker is a popover; a native select stands in so a test can choose.
vi.mock("@/components/custom/search-select", () => ({
  SearchSelect: ({ id, options, value, onChange }: {
    id: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (event: { target: { value: string } }) => void;
  }) => (
    <select id={id} value={value} onChange={(event) => onChange({ target: { value: event.target.value } })}>
      <option value="" />
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  ),
}));

import { ChangePlanDialog } from "./change-plan-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const plan = (code: string, name: string, price: number | null): PackagePlan => ({
  id: code, name, code, description: "", billing_cycle: "YEARLY", currency: "NGN",
  price_per_student: price, default_depth: 20, default_depth_label: "Plus",
  max_students: null, max_teachers: null, max_admins: null, max_branch: null, is_active: true,
});

const BASIC = plan("basic", "Basic", 350000);
const STANDARD = plan("standard", "Standard", 500000);
const ENTERPRISE = plan("enterprise", "Enterprise", null);

const SETUP: PackageSetup = {
  id: "19", package_plan: BASIC, enabled_modules: [], subscription_expires_at: "2027-10-28",
  agreed_price_per_student: 350000, is_active: true,
  created_at: "2026-10-28T09:00:00Z", updated_at: "2026-10-28T09:00:00Z",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mocks.plans = [BASIC, STANDARD, ENTERPRISE];
  mocks.change.mockReset().mockReturnValue({
    unwrap: () => Promise.resolve({ message: "Bright Star School moved from Basic to Enterprise." }),
  });
  mocks.toastSuccess.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (fieldAccess: FieldAccessMap = {}) => act(() => root.render(
  <ChangePlanDialog
    open
    onOpenChange={vi.fn()}
    slug="bright-star"
    schoolName="Bright Star School"
    setup={SETUP}
    access={resolveFieldAccess(fieldAccess, "platform.schools", SETUP)}
  />,
));

async function fill(id: string, value: string) {
  const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  await act(async () => {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}

const changeButton = () =>
  Array.from(document.querySelectorAll("button")).find((b) => b.textContent === "Change plan")!;

const choosePlan = (code: string) => fill("change-plan", code);

describe("change plan dialog", () => {
  it("does not offer the plan the school is already on", () => {
    render();

    const offered = Array.from(document.querySelectorAll("#change-plan option")).map((o) => o.textContent);
    expect(offered).toEqual(["", "Standard", "Enterprise"]);
    expect(document.body.textContent).toContain("It is on Basic.");
  });

  it("asks a quoted plan for its price and sends it in kobo, with the reason", async () => {
    render();
    await choosePlan("enterprise");
    await fill("change-plan-price", "1");
    await fill("change-plan-reason", "Agreed with the proprietor for the production test.");
    await act(async () => {
      changeButton().click();
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });

    expect(mocks.change).toHaveBeenCalledWith({
      slug: "bright-star",
      body: {
        package_plan: "enterprise",
        agreed_price_per_student: 100,
        reason: "Agreed with the proprietor for the production test.",
      },
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Bright Star School moved from Basic to Enterprise.");
  });

  it("holds the change back until a reason is given", async () => {
    render();
    await choosePlan("standard");

    expect(changeButton().disabled).toBe(true);
  });

  it("never sends an expiry the role may not change", async () => {
    render({ "platform.schools": { hidden: [], read_only: ["subscription_expires_at"] } });
    await choosePlan("standard");
    await fill("change-plan-reason", "Moving up a tier.");
    await act(async () => {
      changeButton().click();
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });

    expect(mocks.change.mock.calls[0][0].body).not.toHaveProperty("subscription_expires_at");
  });

  it("shows a refused price beside the field it concerns", async () => {
    mocks.change.mockReturnValue({
      unwrap: () => Promise.reject({
        status: 403,
        data: {
          success: false,
          message: "You may not change these fields.",
          error: {
            code: "field_write_denied",
            detail: { agreed_price_per_student: ["You may not change the agreed price."] },
          },
        },
      }),
    });
    render();
    await choosePlan("standard");
    await fill("change-plan-reason", "Moving up a tier.");
    await act(async () => {
      changeButton().click();
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });

    expect(document.querySelector('[data-field="package_plan"]')?.textContent).toContain(
      "Agreed price per student: You may not change the agreed price.",
    );
  });
});
