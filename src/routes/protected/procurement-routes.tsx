import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

const ProcurementConsolePage = lazy(() => import("@/pages/protected/procurement/procurement-console-page"));

const P = routesPath.PROTECTED.PROCUREMENT;

export const procurementRoutes: RouteObject[] = [
  { path: P.INDEX, element: <ProcurementConsolePage title="Procurement Dashboard" description="Spend, open requisitions and POs, AP due and GR/IR balance for the selected entity." slice="slice 5" /> },
  { path: P.VENDORS, element: <ProcurementConsolePage title="Vendors & Catalog" description="Vendors (bank details FLS-masked), categories and the item catalog." slice="slice 5" /> },
  { path: P.REQUISITIONS, element: <ProcurementConsolePage title="Requisitions" description="Purchase requisitions and approval routing — the start of the spend pipeline." slice="slice 5" /> },
  { path: P.PURCHASE_ORDERS, element: <ProcurementConsolePage title="Purchase Orders" description="Purchase orders raised from approved requisitions." slice="slice 5" /> },
  { path: P.GOODS_RECEIPTS, element: <ProcurementConsolePage title="Goods Receipts" description="Goods received notes — the first GL event in the chain." slice="slice 5" /> },
  { path: P.VENDOR_INVOICES, element: <ProcurementConsolePage title="Vendor Invoices" description="Vendor bills with three-way match, variance and over-tolerance blocking." slice="slice 5" /> },
  { path: P.VENDOR_PAYMENTS, element: <ProcurementConsolePage title="Vendor Payments" description="Vendor payments with withholding tax." slice="slice 5" /> },
  { path: P.SOURCING, element: <ProcurementConsolePage title="Sourcing" description="RFQs and vendor quotations; awarding a quotation spawns a PO." slice="slice 6" /> },
  { path: P.CONTRACTS, element: <ProcurementConsolePage title="Contracts" description="Vendor contracts with milestones and renewal radar." slice="slice 6" /> },
  { path: P.INVENTORY, element: <ProcurementConsolePage title="Inventory" description="Stock issues, count adjustments, movement ledger and valuation." slice="slice 6" /> },
  { path: P.ANALYTICS, element: <ProcurementConsolePage title="Analytics" description="Spend by vendor/category, vendor performance, cash-requirements forecast, AP aging and GR/IR." slice="slice 6" /> },
  { path: P.PAYOUTS, element: <ProcurementConsolePage title="Payouts" description="Single and bulk payouts, batches and settlement reconciliation." slice="slice 6" /> },
];
