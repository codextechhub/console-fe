import { describe, expect, it } from "vitest";

import { P, resolvePermissionKey } from "./index";

describe("Procurement permission registry", () => {
  it("resolves action permissions used by Procurement controls", () => {
    expect(resolvePermissionKey(P.PROC_UPDATE_PURCHASE_ORDER)).toBe(
      "procurement.purchase_order.update",
    );
    expect(resolvePermissionKey(P.PROC_RENEW_CONTRACT)).toBe(
      "procurement.contract.renew",
    );
    expect(resolvePermissionKey(P.PROC_MANAGE_VENDOR)).toBe(
      "procurement.vendor.manage",
    );
    expect(resolvePermissionKey(P.PROC_OVERRIDE_VENDOR_INVOICE_VARIANCE)).toBe(
      "procurement.vendor_invoice.override_variance",
    );
  });
});
