// Finance console sub-navigation (spec §6). Each area is gated by the backend
// key prefixes its screens call, so a user only sees areas they can use. The
// dashboard landing is always visible to anyone with finance/payments access.

import type { ConsoleNavItem } from "@/components/finance-ui/console-shell";
import { routesPath } from "@/routes/routes-path";

const F = routesPath.PROTECTED.FINANCE;

export const financeNav: ConsoleNavItem[] = [
  { title: "Dashboard", url: F.INDEX },
  { title: "Setup & Entity", url: F.SETUP, prefixes: ["finance.entity.", "finance.account.", "finance.currency.", "finance.taxcode.", "finance.costcenter.", "finance.dimension."] },
  { title: "General Ledger", url: F.LEDGER, prefixes: ["finance.journal.", "finance.directentry."] },
  { title: "Receivables", url: F.RECEIVABLES, prefixes: ["finance.invoice.", "finance.creditnote.", "finance.refund.", "finance.concession.", "finance.paymentplan.", "finance.dunning."] },
  { title: "Collections", url: F.COLLECTIONS, prefixes: ["payments.collection.", "payments.virtual_account."] },
  { title: "Banking", url: F.BANKING, prefixes: ["finance.bankaccount."] },
  { title: "Expenses & Petty Cash", url: F.EXPENSES, prefixes: ["finance.expenseclaim.", "finance.pettycash."] },
  { title: "Payroll", url: F.PAYROLL, prefixes: ["finance.payrollrun."] },
  { title: "Budgets, Assets & Tax", url: F.BUDGETS, prefixes: ["finance.budget.", "finance.fixedasset.", "finance.tax."] },
  { title: "Reports & Close", url: F.REPORTS, prefixes: ["finance.report.", "finance.period."] },
  { title: "Audit Trail", url: F.AUDIT, prefixes: ["finance.audit."] },
];
