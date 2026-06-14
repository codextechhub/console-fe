// Procurement console sub-navigation (spec §7). The Procure-to-Pay chain is
// surfaced as ordered areas so the user follows a document along the pipeline:
// requisition → PO → goods receipt → vendor invoice (3-way match) → payment.

import type { ConsoleNavItem } from "@/components/finance-ui/console-shell";
import { routesPath } from "@/routes/routes-path";

const P = routesPath.PROTECTED.PROCUREMENT;

export const procurementNav: ConsoleNavItem[] = [
  { title: "Dashboard", url: P.INDEX },
  { title: "Vendors & Catalog", url: P.VENDORS, prefixes: ["procurement.vendor.", "procurement.catalog_item.", "procurement.category."] },
  { title: "Requisitions", url: P.REQUISITIONS, prefixes: ["procurement.requisition."] },
  { title: "Purchase Orders", url: P.PURCHASE_ORDERS, prefixes: ["procurement.purchase_order."] },
  { title: "Goods Receipts", url: P.GOODS_RECEIPTS, prefixes: ["procurement.goods_receipt."] },
  { title: "Vendor Invoices", url: P.VENDOR_INVOICES, prefixes: ["procurement.vendor_invoice."] },
  { title: "Vendor Payments", url: P.VENDOR_PAYMENTS, prefixes: ["procurement.vendor_payment."] },
  { title: "Sourcing", url: P.SOURCING, prefixes: ["procurement.rfq.", "procurement.quotation."] },
  { title: "Contracts", url: P.CONTRACTS, prefixes: ["procurement.contract."] },
  { title: "Inventory", url: P.INVENTORY, prefixes: ["procurement.stock."] },
  { title: "Analytics", url: P.ANALYTICS, prefixes: ["procurement.report."] },
  { title: "Payouts", url: P.PAYOUTS, prefixes: ["payments.payout."] },
];
