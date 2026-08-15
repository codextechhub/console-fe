import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
import { routesPath } from "@/routes/routes-path";
// Static lists, so declaring the paths does not pull in the lazy page chunks.
import {
  BUDGETS_SECTIONS, COLLECTIONS_SECTIONS, EXPENSES_SECTIONS, FINANCE_SETTINGS_SECTIONS,
  PAYMENTS_SECTIONS, RECEIVABLES_SECTIONS, REPORTS_SECTIONS, SETUP_SECTIONS,
} from "@/pages/protected/finance/console-sections";

// Route-level code splitting: each area page loads on first visit.
const FinanceDashboard = lazy(() => import("@/pages/protected/finance/dashboard"));
const GeneralLedger = lazy(() => import("@/pages/protected/finance/ledger"));
const Receivables = lazy(() => import("@/pages/protected/finance/receivables"));
const Collections = lazy(() => import("@/pages/protected/finance/collections"));
const Banking = lazy(() => import("@/pages/protected/finance/banking"));
const BankReconciliation = lazy(() => import("@/pages/protected/finance/bank-reconciliation"));
const Expenses = lazy(() => import("@/pages/protected/finance/expenses"));
const Payroll = lazy(() => import("@/pages/protected/finance/payroll"));
const BudgetsAssetsTax = lazy(() => import("@/pages/protected/finance/budgets"));
const Setup = lazy(() => import("@/pages/protected/finance/setup"));
const Payments = lazy(() => import("@/pages/protected/finance/payments"));
const Reports = lazy(() => import("@/pages/protected/finance/reports"));
const FinanceAudit = lazy(() => import("@/pages/protected/finance/audit"));
const FinanceSettings = lazy(() => import("@/pages/protected/finance/settings"));

const F = routesPath.PROTECTED.FINANCE;

// A pathless parent owns the console-wide chrome: every screen below it
// renders the Finance sidebar instead of the global one. The per-screen title
// still comes from the nav config via ConsoleShell (see console-shell.tsx).
export const financeRoutes: RouteObject[] = [
  {
    handle: { sidebar: "finance", title: "Finance" } satisfies DashboardHandle,
    children: [
      // Multi-screen areas declare one path per section they have, rather than a
      // `:section` param that would match any URL and leave the page deciding what
      // is real. An unknown section matches no route and falls through to the app's
      // 404. The bare path still renders the area's default section.
      { path: F.INDEX, element: <FinanceDashboard /> },
      { path: F.SETUP, element: <Setup /> },
      ...SETUP_SECTIONS.map((section) => ({
        path: `${F.SETUP}/${section}`, element: <Setup section={section} />,
      })),
      { path: F.LEDGER, element: <GeneralLedger /> },
      { path: F.RECEIVABLES, element: <Receivables /> },
      ...RECEIVABLES_SECTIONS.map((section) => ({
        path: `${F.RECEIVABLES}/${section}`, element: <Receivables section={section} />,
      })),
      { path: F.COLLECTIONS, element: <Collections /> },
      ...COLLECTIONS_SECTIONS.map((section) => ({
        path: `${F.COLLECTIONS}/${section}`, element: <Collections section={section} />,
      })),
      { path: F.BANKING, element: <Banking /> },
      { path: F.BANK_RECON, element: <BankReconciliation /> },
      { path: F.EXPENSES, element: <Expenses /> },
      ...EXPENSES_SECTIONS.map((section) => ({
        path: `${F.EXPENSES}/${section}`, element: <Expenses section={section} />,
      })),
      { path: F.PAYROLL, element: <Payroll /> },
      { path: F.BUDGETS, element: <BudgetsAssetsTax /> },
      ...BUDGETS_SECTIONS.map((section) => ({
        path: `${F.BUDGETS}/${section}`, element: <BudgetsAssetsTax section={section} />,
      })),
      { path: F.PAYMENTS, element: <Payments /> },
      ...PAYMENTS_SECTIONS.map((section) => ({
        path: `${F.PAYMENTS}/${section}`, element: <Payments section={section} />,
      })),
      { path: F.REPORTS, element: <Reports /> },
      ...REPORTS_SECTIONS.map((section) => ({
        path: `${F.REPORTS}/${section}`, element: <Reports section={section} />,
      })),
      { path: F.AUDIT, element: <FinanceAudit /> },
      { path: F.SETTINGS, element: <FinanceSettings /> },
      ...FINANCE_SETTINGS_SECTIONS.map((section) => ({
        path: `${F.SETTINGS}/${section}`, element: <FinanceSettings section={section} />,
      })),
    ],
  },
];
