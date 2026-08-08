import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import rootReducer from "@/redux/features/root-reducer";
import { Can } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import {
  ContractRenewButton,
  InvoiceVarianceOverrideAction,
} from "./procurement-action-gates";
import { isBlockingInvoiceVariance } from "./invoice-action-model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const makeStore = (permissions: string[]) => configureStore({
  reducer: rootReducer,
  preloadedState: {
    auth: {
      access: "",
      refresh: "",
      session_id: 0,
      user: null,
      school: null,
      tenant: { slug: "codex", name: "Codex" },
      impersonation: null,
      permissions,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  },
});

async function mount(permissions: string[], onOverride = vi.fn().mockResolvedValue(undefined)) {
  await act(async () => {
    root.render(
      <Provider store={makeStore(permissions)}>
        <ContractRenewButton onClick={() => undefined} />
        <Can permission={P.PROC_UPDATE_PURCHASE_ORDER}>
          <span>Edit Purchase Order</span>
        </Can>
        <InvoiceVarianceOverrideAction reference="VI-100" onConfirm={onOverride} />
      </Provider>,
    );
  });
  return onOverride;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("Procurement action permission gates", () => {
  it("shows purchase-order edit only with the restored update mapping", async () => {
    await mount(["procurement.purchase_order.view"]);
    expect(container.textContent).not.toContain("Edit Purchase Order");

    await mount(["procurement.purchase_order.update"]);
    expect(container.textContent).toContain("Edit Purchase Order");
  });

  it("hides contract renewal without the dedicated permission", async () => {
    await mount(["procurement.contract.update"]);

    expect(container.textContent).not.toContain("Renew");
  });

  it("shows contract renewal with the dedicated permission", async () => {
    await mount(["procurement.contract.renew"]);

    expect(container.textContent).toContain("Renew");
  });

  it("requires both post and override permissions for the override action", async () => {
    await mount(["procurement.vendor_invoice.override_variance"]);
    expect(container.textContent).not.toContain("Post with Variance Override");

    await mount([
      "procurement.vendor_invoice.post",
      "procurement.vendor_invoice.override_variance",
    ]);
    expect(container.textContent).toContain("Post with Variance Override");
  });

  it("requires explicit confirmation before running the override", async () => {
    const onOverride = await mount([
      "procurement.vendor_invoice.post",
      "procurement.vendor_invoice.override_variance",
    ]);
    const openButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Post with Variance Override",
    );

    await act(async () => openButton!.click());
    expect(document.body.textContent).toContain("Override the blocking match variance?");
    expect(document.body.textContent).toContain("finance audit trail");
    expect(onOverride).not.toHaveBeenCalled();

    const confirm = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent === "Override & Post",
    );
    await act(async () => confirm!.click());
    expect(onOverride).toHaveBeenCalledTimes(1);
  });
});

describe("blocking invoice variance", () => {
  it("matches only the backend blocking states", () => {
    expect(isBlockingInvoiceVariance("UNDER_RECEIVED")).toBe(true);
    expect(isBlockingInvoiceVariance("OVER_BILLED")).toBe(true);
    expect(isBlockingInvoiceVariance("AUTO_MATCHED")).toBe(false);
    expect(isBlockingInvoiceVariance("NOT_MATCHED")).toBe(false);
  });
});
