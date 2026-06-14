import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each area page loads on first visit.
const FinanceDashboard = lazy(() => import("@/pages/protected/finance/dashboard"));
const GeneralLedger = lazy(() => import("@/pages/protected/finance/ledger"));
const Receivables = lazy(() => import("@/pages/protected/finance/receivables"));
const Collections = lazy(() => import("@/pages/protected/finance/collections"));
const Banking = lazy(() => import("@/pages/protected/finance/banking"));
const Expenses = lazy(() => import("@/pages/protected/finance/expenses"));
const Payroll = lazy(() => import("@/pages/protected/finance/payroll"));
const BudgetsAssetsTax = lazy(() => import("@/pages/protected/finance/budgets"));
const Setup = lazy(() => import("@/pages/protected/finance/setup"));
const Reports = lazy(() => import("@/pages/protected/finance/reports"));
const FinanceAudit = lazy(() => import("@/pages/protected/finance/audit"));

const F = routesPath.PROTECTED.FINANCE;

export const financeRoutes: RouteObject[] = [
  { path: F.INDEX, element: <FinanceDashboard /> },
  { path: F.SETUP, element: <Setup /> },
  { path: F.LEDGER, element: <GeneralLedger /> },
  { path: F.RECEIVABLES, element: <Receivables /> },
  { path: F.COLLECTIONS, element: <Collections /> },
  { path: F.BANKING, element: <Banking /> },
  { path: F.EXPENSES, element: <Expenses /> },
  { path: F.PAYROLL, element: <Payroll /> },
  { path: F.BUDGETS, element: <BudgetsAssetsTax /> },
  { path: F.REPORTS, element: <Reports /> },
  { path: F.AUDIT, element: <FinanceAudit /> },
];
