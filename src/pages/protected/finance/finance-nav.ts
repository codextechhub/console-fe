// Finance console sidebar menu (§6). Areas with several screens are expand-only
// parents whose children are real routes (no in-page tabs); single-screen areas
// are plain links. Each item/child is gated by the backend key prefixes its
// screens call.

import {
  LayoutDashboard, Settings2, BookOpen, ReceiptText, CreditCard,
  Landmark, Wallet, Users, PiggyBank, FileBarChart, ScrollText,
} from "lucide-react";
import type { ConsoleNavItem } from "@/components/finance-ui/console-nav";
import { routesPath } from "@/routes/routes-path";

const F = routesPath.PROTECTED.FINANCE;

export const financeNav: ConsoleNavItem[] = [
  { title: "Dashboard", url: F.INDEX, icon: LayoutDashboard },
  {
    title: "Setup & Entity", url: F.SETUP, icon: Settings2,
    prefixes: ["finance.entity.", "finance.account.", "finance.period.", "finance.currency.", "finance.taxcode.", "finance.costcenter.", "finance.dimension."],
    children: [
      { title: "Entities", url: `${F.SETUP}/entities`, prefixes: ["finance.entity."] },
      { title: "Chart of Accounts", url: `${F.SETUP}/accounts`, prefixes: ["finance.account."] },
      { title: "Periods", url: `${F.SETUP}/periods`, prefixes: ["finance.period."] },
      { title: "Currencies & FX", url: `${F.SETUP}/currencies`, prefixes: ["finance.currency.", "finance.fxrate."] },
      { title: "Tax Codes", url: `${F.SETUP}/tax-codes`, prefixes: ["finance.taxcode."] },
      { title: "Cost Centres", url: `${F.SETUP}/cost-centers`, prefixes: ["finance.costcenter."] },
    ],
  },
  { title: "General Ledger", url: F.LEDGER, icon: BookOpen, prefixes: ["finance.journal.", "finance.directentry."] },
  {
    title: "Receivables", url: F.RECEIVABLES, icon: ReceiptText,
    prefixes: ["finance.invoice.", "finance.creditnote.", "finance.refund.", "finance.concession.", "finance.paymentplan.", "finance.dunning.", "finance.customer.", "finance.feestructure."],
    children: [
      { title: "Invoices", url: `${F.RECEIVABLES}/invoices`, prefixes: ["finance.invoice."] },
      { title: "Customers", url: `${F.RECEIVABLES}/customers`, prefixes: ["finance.customer."] },
      { title: "Fee Structures", url: `${F.RECEIVABLES}/fee-structures`, prefixes: ["finance.feestructure."] },
      { title: "Credit Notes", url: `${F.RECEIVABLES}/credit-notes`, prefixes: ["finance.creditnote."] },
      { title: "Refunds", url: `${F.RECEIVABLES}/refunds`, prefixes: ["finance.refund."] },
      { title: "Concessions", url: `${F.RECEIVABLES}/concessions`, prefixes: ["finance.concession."] },
      { title: "Payment Plans", url: `${F.RECEIVABLES}/payment-plans`, prefixes: ["finance.paymentplan."] },
      { title: "Dunning", url: `${F.RECEIVABLES}/dunning`, prefixes: ["finance.dunning."] },
    ],
  },
  {
    title: "Collections", url: F.COLLECTIONS, icon: CreditCard,
    prefixes: ["payments.collection.", "payments.virtual_account."],
    children: [
      { title: "Collections", url: `${F.COLLECTIONS}/gateway`, prefixes: ["payments.collection."] },
      { title: "Virtual Accounts", url: `${F.COLLECTIONS}/virtual-accounts`, prefixes: ["payments.collection."] },
    ],
  },
  { title: "Banking", url: F.BANKING, icon: Landmark, prefixes: ["finance.bankaccount."] },
  {
    title: "Expenses & Petty Cash", url: F.EXPENSES, icon: Wallet,
    prefixes: ["finance.expenseclaim.", "finance.pettycash."],
    children: [
      { title: "Expense Claims", url: `${F.EXPENSES}/claims`, prefixes: ["finance.expenseclaim."] },
      { title: "Petty Cash", url: `${F.EXPENSES}/petty-cash`, prefixes: ["finance.pettycash."] },
    ],
  },
  { title: "Payroll", url: F.PAYROLL, icon: Users, prefixes: ["finance.payrollrun."] },
  {
    title: "Budgets, Assets & Tax", url: F.BUDGETS, icon: PiggyBank,
    prefixes: ["finance.budget.", "finance.fixedasset.", "finance.tax."],
    children: [
      { title: "Budgets", url: `${F.BUDGETS}/budgets`, prefixes: ["finance.budget."] },
      { title: "Fixed Assets", url: `${F.BUDGETS}/assets`, prefixes: ["finance.fixedasset."] },
      { title: "Tax", url: `${F.BUDGETS}/tax`, prefixes: ["finance.tax."] },
    ],
  },
  {
    title: "Reports & Close", url: F.REPORTS, icon: FileBarChart,
    prefixes: ["finance.report.", "finance.period."],
    children: [
      { title: "Trial Balance", url: `${F.REPORTS}/trial-balance`, prefixes: ["finance.report."] },
      { title: "Income Statement", url: `${F.REPORTS}/income-statement`, prefixes: ["finance.report."] },
      { title: "Balance Sheet", url: `${F.REPORTS}/balance-sheet`, prefixes: ["finance.report."] },
      { title: "Cash Flow", url: `${F.REPORTS}/cash-flow`, prefixes: ["finance.report."] },
      { title: "Changes in Equity", url: `${F.REPORTS}/changes-in-equity`, prefixes: ["finance.report."] },
      { title: "Periods & Close", url: `${F.REPORTS}/periods`, prefixes: ["finance.period."] },
    ],
  },
  { title: "Audit Trail", url: F.AUDIT, icon: ScrollText, prefixes: ["finance.audit."] },
];
