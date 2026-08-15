import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
import { routesPath } from "@/routes/routes-path";
// Static list, so declaring the paths does not pull in the lazy analytics chunk.
import { ANALYTICS_SECTIONS } from "@/pages/protected/procurement/analytics-sections";

const ProcurementDashboard = lazy(() => import("@/pages/protected/procurement/dashboard"));
const Vendors = lazy(() => import("@/pages/protected/procurement/vendors"));
const Requisitions = lazy(() => import("@/pages/protected/procurement/requisitions"));
const PurchaseOrders = lazy(() => import("@/pages/protected/procurement/purchase-orders"));
const GoodsReceipts = lazy(() => import("@/pages/protected/procurement/goods-receipts"));
const VendorInvoices = lazy(() => import("@/pages/protected/procurement/vendor-invoices"));
const VendorPayments = lazy(() => import("@/pages/protected/procurement/vendor-payments"));
const Approvals = lazy(() => import("@/pages/protected/procurement/approvals"));
const SourcingRfqs = lazy(() => import("@/pages/protected/procurement/sourcing/rfqs"));
const SourcingQuotations = lazy(() => import("@/pages/protected/procurement/sourcing/quotations"));
const Contracts = lazy(() => import("@/pages/protected/procurement/contracts"));
const Inventory = lazy(() => import("@/pages/protected/procurement/inventory"));
const Analytics = lazy(() => import("@/pages/protected/procurement/analytics"));
const ProcurementSettings = lazy(() => import("@/pages/protected/procurement/settings"));

const P = routesPath.PROTECTED.PROCUREMENT;

// A pathless parent owns the console-wide chrome: every screen below it
// renders the Procurement sidebar instead of the global one. The per-screen title
// still comes from the nav config via ConsoleShell (see console-shell.tsx).
export const procurementRoutes: RouteObject[] = [
  {
    handle: { sidebar: "procurement", title: "Procurement" } satisfies DashboardHandle,
    children: [
      { path: P.INDEX, element: <ProcurementDashboard /> },
      { path: P.VENDORS, element: <Vendors /> },
      { path: `${P.VENDORS}/:section`, element: <Vendors /> },
      { path: P.REQUISITIONS, element: <Requisitions /> },
      { path: P.PURCHASE_ORDERS, element: <PurchaseOrders /> },
      { path: P.GOODS_RECEIPTS, element: <GoodsReceipts /> },
      { path: P.VENDOR_INVOICES, element: <VendorInvoices /> },
      { path: P.VENDOR_PAYMENTS, element: <VendorPayments /> },
      { path: P.APPROVALS, element: <Approvals /> },
      { path: P.SOURCING, element: <SourcingRfqs /> },
      { path: `${P.SOURCING}/rfqs`, element: <SourcingRfqs /> },
      { path: `${P.SOURCING}/quotations`, element: <SourcingQuotations /> },
      { path: P.CONTRACTS, element: <Contracts /> },
      { path: P.INVENTORY, element: <Inventory /> },
      { path: `${P.INVENTORY}/:section`, element: <Inventory /> },
      { path: P.ANALYTICS, element: <Analytics /> },
      // One path per section that exists, rather than `:section` matching anything.
      // An analytics URL that is not one of these matches no route and falls through
      // to the app's 404, which is what an address for a deleted report should get.
      ...ANALYTICS_SECTIONS.map((section) => ({
        path: `${P.ANALYTICS}/${section}`,
        element: <Analytics section={section} />,
      })),
      { path: P.SETTINGS, element: <ProcurementSettings /> },
      { path: `${P.SETTINGS}/:section`, element: <ProcurementSettings /> },
    ],
  },
];
