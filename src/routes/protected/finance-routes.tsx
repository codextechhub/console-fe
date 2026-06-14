import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: the console shell loads on first visit. Each area
// route renders the same shell with its own title; slices replace the body.
const FinanceConsolePage = lazy(() => import("@/pages/protected/finance/finance-console-page"));

const F = routesPath.PROTECTED.FINANCE;

export const financeRoutes: RouteObject[] = [
  { path: F.INDEX, element: <FinanceConsolePage title="Finance Dashboard" description="Cash position, receivables, payables and recent activity for the selected entity." slice="slice 2" /> },
  { path: F.SETUP, element: <FinanceConsolePage title="Setup & Entity" description="Ledger entities, chart of accounts, periods, currencies, tax codes and cost centres." slice="slice 2" /> },
  { path: F.LEDGER, element: <FinanceConsolePage title="General Ledger" description="Journals (read-only), Direct Entry and journal reversal." slice="slice 2" /> },
  { path: F.RECEIVABLES, element: <FinanceConsolePage title="Receivables" description="Invoices, credit notes, refunds, write-offs, concessions, payment plans and dunning." slice="slice 2" /> },
  { path: F.COLLECTIONS, element: <FinanceConsolePage title="Collections" description="Gateway collections and virtual accounts — receivable cash arrives here." slice="slice 2" /> },
  { path: F.BANKING, element: <FinanceConsolePage title="Banking & Reconciliation" description="Bank accounts, statement import, auto-reconcile and manual matching." slice="slice 3" /> },
  { path: F.EXPENSES, element: <FinanceConsolePage title="Expenses & Petty Cash" description="Expense claims and petty-cash floats, vouchers and replenishment." slice="slice 3" /> },
  { path: F.PAYROLL, element: <FinanceConsolePage title="Payroll" description="Payroll runs, posting and payment. Salary figures are field-level secured." slice="slice 3" /> },
  { path: F.BUDGETS, element: <FinanceConsolePage title="Budgets, Assets & Tax" description="Budgets and variance, fixed-asset register, VAT/PAYE/WHT filing and payment." slice="slice 3" /> },
  { path: F.REPORTS, element: <FinanceConsolePage title="Reports & Month-End" description="Trial balance, income statement, balance sheet, cash flow, statutory pack and period close." slice="slice 4" /> },
  { path: F.AUDIT, element: <FinanceConsolePage title="Audit Trail" description="The finance audit log for the selected entity." slice="slice 4" /> },
];
