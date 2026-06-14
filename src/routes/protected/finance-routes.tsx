import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each area page loads on first visit. Areas not yet
// built render the console shell with a placeholder body.
const FinanceConsolePage = lazy(() => import("@/pages/protected/finance/finance-console-page"));
const FinanceDashboard = lazy(() => import("@/pages/protected/finance/dashboard"));
const GeneralLedger = lazy(() => import("@/pages/protected/finance/ledger"));
const Receivables = lazy(() => import("@/pages/protected/finance/receivables"));
const Collections = lazy(() => import("@/pages/protected/finance/collections"));
const Banking = lazy(() => import("@/pages/protected/finance/banking"));
const Expenses = lazy(() => import("@/pages/protected/finance/expenses"));
const Payroll = lazy(() => import("@/pages/protected/finance/payroll"));
const BudgetsAssetsTax = lazy(() => import("@/pages/protected/finance/budgets"));

const F = routesPath.PROTECTED.FINANCE;

export const financeRoutes: RouteObject[] = [
  { path: F.INDEX, element: <FinanceDashboard /> },
  { path: F.SETUP, element: <FinanceConsolePage title="Setup & Entity" description="Ledger entities, chart of accounts, periods, currencies, tax codes and cost centres." slice="slice 2" /> },
  { path: F.LEDGER, element: <GeneralLedger /> },
  { path: F.RECEIVABLES, element: <Receivables /> },
  { path: F.COLLECTIONS, element: <Collections /> },
  { path: F.BANKING, element: <Banking /> },
  { path: F.EXPENSES, element: <Expenses /> },
  { path: F.PAYROLL, element: <Payroll /> },
  { path: F.BUDGETS, element: <BudgetsAssetsTax /> },
  { path: F.REPORTS, element: <FinanceConsolePage title="Reports & Month-End" description="Trial balance, income statement, balance sheet, cash flow, statutory pack and period close." slice="slice 4" /> },
  { path: F.AUDIT, element: <FinanceConsolePage title="Audit Trail" description="The finance audit log for the selected entity." slice="slice 4" /> },
];
