import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

const ProcurementConsolePage = lazy(() => import("@/pages/protected/procurement/procurement-console-page"));
const ProcurementDashboard = lazy(() => import("@/pages/protected/procurement/dashboard"));
const Vendors = lazy(() => import("@/pages/protected/procurement/vendors"));
const Requisitions = lazy(() => import("@/pages/protected/procurement/requisitions"));
const PurchaseOrders = lazy(() => import("@/pages/protected/procurement/purchase-orders"));
const GoodsReceipts = lazy(() => import("@/pages/protected/procurement/goods-receipts"));
const VendorInvoices = lazy(() => import("@/pages/protected/procurement/vendor-invoices"));
const VendorPayments = lazy(() => import("@/pages/protected/procurement/vendor-payments"));

const P = routesPath.PROTECTED.PROCUREMENT;

export const procurementRoutes: RouteObject[] = [
  { path: P.INDEX, element: <ProcurementDashboard /> },
  { path: P.VENDORS, element: <Vendors /> },
  { path: P.REQUISITIONS, element: <Requisitions /> },
  { path: P.PURCHASE_ORDERS, element: <PurchaseOrders /> },
  { path: P.GOODS_RECEIPTS, element: <GoodsReceipts /> },
  { path: P.VENDOR_INVOICES, element: <VendorInvoices /> },
  { path: P.VENDOR_PAYMENTS, element: <VendorPayments /> },
  { path: P.SOURCING, element: <ProcurementConsolePage title="Sourcing" description="RFQs and vendor quotations; awarding a quotation spawns a PO." slice="slice 6" /> },
  { path: P.CONTRACTS, element: <ProcurementConsolePage title="Contracts" description="Vendor contracts with milestones and renewal radar." slice="slice 6" /> },
  { path: P.INVENTORY, element: <ProcurementConsolePage title="Inventory" description="Stock issues, count adjustments, movement ledger and valuation." slice="slice 6" /> },
  { path: P.ANALYTICS, element: <ProcurementConsolePage title="Analytics" description="Spend by vendor/category, vendor performance, cash-requirements forecast, AP aging and GR/IR." slice="slice 6" /> },
  { path: P.PAYOUTS, element: <ProcurementConsolePage title="Payouts" description="Single and bulk payouts, batches and settlement reconciliation." slice="slice 6" /> },
];
