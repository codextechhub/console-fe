import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

const ProcurementDashboard = lazy(() => import("@/pages/protected/procurement/dashboard"));
const Vendors = lazy(() => import("@/pages/protected/procurement/vendors"));
const Requisitions = lazy(() => import("@/pages/protected/procurement/requisitions"));
const PurchaseOrders = lazy(() => import("@/pages/protected/procurement/purchase-orders"));
const GoodsReceipts = lazy(() => import("@/pages/protected/procurement/goods-receipts"));
const VendorInvoices = lazy(() => import("@/pages/protected/procurement/vendor-invoices"));
const VendorPayments = lazy(() => import("@/pages/protected/procurement/vendor-payments"));
const Sourcing = lazy(() => import("@/pages/protected/procurement/sourcing"));
const Contracts = lazy(() => import("@/pages/protected/procurement/contracts"));
const Inventory = lazy(() => import("@/pages/protected/procurement/inventory"));
const Analytics = lazy(() => import("@/pages/protected/procurement/analytics"));
const Payouts = lazy(() => import("@/pages/protected/procurement/payouts"));

const P = routesPath.PROTECTED.PROCUREMENT;

export const procurementRoutes: RouteObject[] = [
  { path: P.INDEX, element: <ProcurementDashboard /> },
  { path: P.VENDORS, element: <Vendors /> },
  { path: `${P.VENDORS}/:section`, element: <Vendors /> },
  { path: P.REQUISITIONS, element: <Requisitions /> },
  { path: P.PURCHASE_ORDERS, element: <PurchaseOrders /> },
  { path: P.GOODS_RECEIPTS, element: <GoodsReceipts /> },
  { path: P.VENDOR_INVOICES, element: <VendorInvoices /> },
  { path: P.VENDOR_PAYMENTS, element: <VendorPayments /> },
  { path: P.SOURCING, element: <Sourcing /> },
  { path: `${P.SOURCING}/:section`, element: <Sourcing /> },
  { path: P.CONTRACTS, element: <Contracts /> },
  { path: P.INVENTORY, element: <Inventory /> },
  { path: `${P.INVENTORY}/:section`, element: <Inventory /> },
  { path: P.ANALYTICS, element: <Analytics /> },
  { path: `${P.ANALYTICS}/:section`, element: <Analytics /> },
  { path: P.PAYOUTS, element: <Payouts /> },
  { path: `${P.PAYOUTS}/:section`, element: <Payouts /> },
];
