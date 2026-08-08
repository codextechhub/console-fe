import { describe, expect, it } from "vitest";

import { filterActionsForPermissions } from "./gate";
import { scoreAction } from "./match";
import { ACTIONS } from "./registry";
import type { ActionDef } from "./types";
import { P, resolvePermissionKey } from "@/permissions";
import { procurementNav } from "@/pages/protected/procurement/procurement-nav";
import { routesPath } from "@/routes/routes-path";

const PR = routesPath.PROTECTED.PROCUREMENT;
const procurementActions = ACTIONS.filter((action) => action.console === "Procurement");

function byId(id: string): ActionDef {
  const action = procurementActions.find((candidate) => candidate.id === id);
  if (!action) throw new Error(`Missing Procurement action: ${id}`);
  return action;
}

function matchedIds(query: string, permissions: readonly string[] = []): string[] {
  return filterActionsForPermissions(procurementActions, permissions)
    .filter((action) => scoreAction(action, query))
    .map((action) => action.id);
}

describe("Procurement action-palette destinations", () => {
  it("covers every Procurement sidebar destination", () => {
    const viewDestinations = new Set(
      procurementActions
        .flatMap((action) => action.kind === "view" && "to" in action.run ? [action.run.to] : []),
    );
    const navDestinations = procurementNav.flatMap((group) =>
      group.items.map((item) => item.url),
    );

    expect(navDestinations.filter((url) => !viewDestinations.has(url))).toEqual([]);
  });

  it.each([
    ["create-requisition", `${PR.REQUISITIONS}?action=new`],
    ["create-purchase-order", `${PR.PURCHASE_ORDERS}?action=new`],
    ["post-goods-receipt", `${PR.GOODS_RECEIPTS}?action=new`],
    ["create-vendor-invoice", `${PR.VENDOR_INVOICES}?action=new`],
    ["new-vendor-payment", `${PR.VENDOR_PAYMENTS}?action=new`],
    ["create-vendor", `${PR.VENDORS}/vendors?action=new`],
    ["create-category", `${PR.VENDORS}/categories?action=new`],
    ["add-catalog-item", `${PR.VENDORS}/catalog?action=new`],
    ["create-rfq", `${PR.SOURCING}/rfqs?action=new`],
    ["create-quotation", `${PR.SOURCING}/quotations?action=new`],
    ["create-contract", `${PR.CONTRACTS}?action=new`],
    ["create-stock-item", `${PR.INVENTORY}/items?action=new`],
    ["create-vendor-assessment", `${PR.ANALYTICS}/performance?action=new`],
  ])("launches %s through its screen's create-drawer contract", (id, to) => {
    expect(byId(id).run).toEqual({ to });
  });
});

describe("Procurement search vocabulary", () => {
  const allProcurementPermissions = [
    P.PROC_VIEW_REQUISITIONS,
    P.PROC_CREATE_REQUISITION,
    P.PROC_VIEW_PURCHASE_ORDERS,
    P.PROC_CREATE_PURCHASE_ORDER,
    P.PROC_VIEW_GOODS_RECEIPTS,
    P.PROC_CREATE_GOODS_RECEIPT,
    P.PROC_VIEW_VENDOR_INVOICES,
    P.PROC_CREATE_VENDOR_INVOICE,
    P.PROC_VIEW_VENDOR_PAYMENTS,
    P.PROC_CREATE_VENDOR_PAYMENT,
    P.PROC_VIEW_VENDORS,
    P.PROC_CREATE_VENDOR,
    P.PROC_VIEW_CATEGORIES,
    P.PROC_CREATE_CATEGORY,
    P.PROC_VIEW_CATALOG,
    P.PROC_CREATE_CATALOG_ITEM,
    P.PROC_VIEW_RFQS,
    P.PROC_CREATE_RFQ,
    P.PROC_VIEW_QUOTATIONS,
    P.PROC_CREATE_QUOTATION,
    P.PROC_VIEW_CONTRACTS,
    P.PROC_CREATE_CONTRACT,
    P.PROC_VIEW_STOCK,
    P.PROC_MANAGE_STOCK,
    P.PROC_VIEW_PROC_REPORTS,
    P.PROC_CREATE_VENDOR_ASSESSMENT,
    P.PROC_VIEW_SETTINGS,
  ].map(resolvePermissionKey);

  it.each([
    ["pr", "view-requisitions"],
    ["new pr", "create-requisition"],
    ["po", "view-purchase-orders"],
    ["new po", "create-purchase-order"],
    ["grn", "view-goods-receipts"],
    ["receive goods", "post-goods-receipt"],
    ["supplier", "view-vendors"],
    ["new supplier", "create-vendor"],
    ["request for quotation", "view-rfqs"],
    ["new rfq", "create-rfq"],
    ["quote", "view-quotations"],
    ["new quote", "create-quotation"],
    ["inventory", "view-stock-items"],
    ["new inventory item", "create-stock-item"],
    ["ap invoice", "view-vendor-invoices"],
    ["new ap invoice", "create-vendor-invoice"],
    ["ap payment", "view-vendor-payments"],
    ["new ap payment", "new-vendor-payment"],
    ["procurement contracts", "view-contracts"],
    ["procurement analytics", "view-procurement-analytics"],
    ["supplier performance", "view-vendor-performance"],
    ["new supplier assessment", "create-vendor-assessment"],
    ["purchase approvals", "view-procurement-approvals"],
    ["procurement defaults", "view-procurement-settings"],
  ])("finds %s as %s", (query, expectedId) => {
    expect(matchedIds(query, allProcurementPermissions)).toContain(expectedId);
  });
});

describe("Procurement action visibility", () => {
  it("shows a permitted create action and hides it from a view-only user", () => {
    const createKey = resolvePermissionKey(P.PROC_CREATE_REQUISITION);
    const viewKey = resolvePermissionKey(P.PROC_VIEW_REQUISITIONS);

    expect(matchedIds("new pr", [createKey])).toContain("create-requisition");
    expect(matchedIds("new pr", [viewKey])).not.toContain("create-requisition");
  });

  it("does not confuse stock viewing with stock management", () => {
    const viewKey = resolvePermissionKey(P.PROC_VIEW_STOCK);
    const manageKey = resolvePermissionKey(P.PROC_MANAGE_STOCK);

    expect(matchedIds("new inventory item", [viewKey])).not.toContain("create-stock-item");
    expect(matchedIds("new inventory item", [manageKey])).toContain("create-stock-item");
  });

  it("shows the Procurement dashboard with any Procurement key, not unrelated keys", () => {
    expect(matchedIds("procurement", [resolvePermissionKey(P.PROC_VIEW_VENDORS)]))
      .toContain("view-procurement-dashboard");
    expect(matchedIds("procurement", [resolvePermissionKey(P.FIN_VIEW_REPORTS)]))
      .not.toContain("view-procurement-dashboard");
  });

  it("keeps delegated Procurement approvals searchable without a source RBAC key", () => {
    expect(matchedIds("purchase approvals", [])).toContain("view-procurement-approvals");
  });
});
