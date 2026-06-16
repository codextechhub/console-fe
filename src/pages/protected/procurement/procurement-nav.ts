// Procurement console sidebar menu (§7). The P2P chain stays as ordered plain
// links; multi-screen areas (vendors, sourcing, inventory, analytics, payouts)
// are expand-only parents with child routes.

import {
  LayoutDashboard, Store, FileText, ShoppingCart, PackageCheck,
  ReceiptText, Banknote, Send, FileSignature, Boxes, BarChart3, ClipboardCheck,
} from "lucide-react";
import type { ConsoleNavItem } from "@/components/finance-ui/console-nav";
import { routesPath } from "@/routes/routes-path";

const P = routesPath.PROTECTED.PROCUREMENT;

export const procurementNav: ConsoleNavItem[] = [
  { title: "Dashboard", url: P.INDEX, icon: LayoutDashboard },
  {
    title: "Vendors & Catalog", url: P.VENDORS, icon: Store,
    prefixes: ["procurement.vendor.", "procurement.catalog_item.", "procurement.category."],
    children: [
      { title: "Vendors", url: `${P.VENDORS}/vendors`, prefixes: ["procurement.vendor."] },
      { title: "Categories", url: `${P.VENDORS}/categories`, prefixes: ["procurement.category."] },
      { title: "Catalog", url: `${P.VENDORS}/catalog`, prefixes: ["procurement.catalog_item."] },
    ],
  },
  { title: "Requisitions", url: P.REQUISITIONS, icon: FileText, prefixes: ["procurement.requisition."] },
  { title: "Purchase Orders", url: P.PURCHASE_ORDERS, icon: ShoppingCart, prefixes: ["procurement.purchase_order."] },
  { title: "Goods Receipts", url: P.GOODS_RECEIPTS, icon: PackageCheck, prefixes: ["procurement.goods_receipt."] },
  { title: "Vendor Invoices", url: P.VENDOR_INVOICES, icon: ReceiptText, prefixes: ["procurement.vendor_invoice."] },
  { title: "Vendor Payments", url: P.VENDOR_PAYMENTS, icon: Banknote, prefixes: ["procurement.vendor_payment."] },
  // Approvals live in the Workflow module — link out to its queue.
  { title: "Approvals", url: routesPath.PROTECTED.WORKFLOW.APPROVALS, icon: ClipboardCheck, prefixes: ["procurement.approval."] },
  {
    title: "Sourcing", url: P.SOURCING, icon: Send,
    prefixes: ["procurement.rfq.", "procurement.quotation."],
    children: [
      { title: "RFQs", url: `${P.SOURCING}/rfqs`, prefixes: ["procurement.rfq."] },
      { title: "Quotations", url: `${P.SOURCING}/quotations`, prefixes: ["procurement.quotation."] },
    ],
  },
  { title: "Contracts", url: P.CONTRACTS, icon: FileSignature, prefixes: ["procurement.contract."] },
  {
    title: "Inventory", url: P.INVENTORY, icon: Boxes,
    prefixes: ["procurement.stock."],
    children: [
      { title: "Stock Items", url: `${P.INVENTORY}/items`, prefixes: ["procurement.stock."] },
      { title: "Movements", url: `${P.INVENTORY}/movements`, prefixes: ["procurement.stock."] },
    ],
  },
  {
    title: "Analytics", url: P.ANALYTICS, icon: BarChart3,
    prefixes: ["procurement.report."],
    children: [
      { title: "AP Aging", url: `${P.ANALYTICS}/ap-aging`, prefixes: ["procurement.report."] },
      { title: "GR/IR & Control", url: `${P.ANALYTICS}/grir`, prefixes: ["procurement.report."] },
      { title: "Spend", url: `${P.ANALYTICS}/spend`, prefixes: ["procurement.report."] },
      { title: "Vendor Performance", url: `${P.ANALYTICS}/performance`, prefixes: ["procurement.report."] },
    ],
  },
  {
    title: "Payouts", url: P.PAYOUTS, icon: Send,
    prefixes: ["payments.payout.", "payments.report."],
    children: [
      { title: "Payouts", url: `${P.PAYOUTS}/payouts`, prefixes: ["payments.payout."] },
      { title: "Batches", url: `${P.PAYOUTS}/batches`, prefixes: ["payments.payout."] },
      { title: "Settlement", url: `${P.PAYOUTS}/settlement`, prefixes: ["payments.report."] },
      { title: "Transactions Log", url: `${P.PAYOUTS}/transactions`, prefixes: ["payments.report."] },
    ],
  },
];
