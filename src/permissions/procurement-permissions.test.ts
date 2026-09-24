import { describe, expect, it } from "vitest";

import { P, resolvePermissionKey } from "./index";

describe("Procurement permission registry", () => {
  it("uses concrete actions throughout the frontend registry", () => {
    expect(Object.values(P).map(resolvePermissionKey).filter((key) => key.endsWith(".manage"))).toEqual([]);
    expect(resolvePermissionKey(P.TRANSITION_SCHOOL)).toBe("platform.schools.transition");
    expect(resolvePermissionKey(P.DELETE_APPROVER_GROUP)).toBe("workflow.group.delete");
    expect(resolvePermissionKey(P.FIN_UPDATE_DUNNING)).toBe("finance.dunning.update");
  });

  it("resolves action permissions used by Procurement controls", () => {
    expect(resolvePermissionKey(P.PROC_UPDATE_PURCHASE_ORDER)).toBe(
      "procurement.purchase_order.update",
    );
    expect(resolvePermissionKey(P.PROC_RENEW_CONTRACT)).toBe(
      "procurement.contract.renew",
    );
    expect(resolvePermissionKey(P.PROC_VERIFY_VENDOR)).toBe(
      "procurement.vendor.verify",
    );
    expect(resolvePermissionKey(P.PROC_OVERRIDE_VENDOR_INVOICE_VARIANCE)).toBe(
      "procurement.vendor_invoice.override_variance",
    );
    expect(resolvePermissionKey(P.PROC_VIEW_SETTINGS)).toBe("procurement.settings.view");
    expect(resolvePermissionKey(P.PROC_UPDATE_SETTINGS)).toBe("procurement.settings.update");
  });
});
