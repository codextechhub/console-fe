// Reports & month-end (§6.9) — one page per statement / the period-close list,
// driven by the :section route param.

import { useParams } from "react-router";
import { FinanceShell } from "../finance-shell";
import { useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import {
  BalanceSheetReport, CashFlowReport, EquityReport,
} from "./statements";
import { IncomeStatementReport } from "./income-statement-tab";
import { TrialBalanceReport } from "./trial-balance-tab";
import { AnalyticsSliceReport } from "./analytics-slice-tab";
import { PeriodsTab } from "./periods-tab";

const LABELS: Record<string, string> = {
  "trial-balance": "Trial Balance", "income-statement": "Income Statement",
  "balance-sheet": "Balance Sheet", "cash-flow": "Cash Flow",
  "changes-in-equity": "Changes in Equity", analytics: "Cost & Dimension Analysis",
  periods: "Periods & Close",
};

export default function ReportsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "trial-balance" } = useParams();

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{LABELS[section] ?? "Reports & Month-End"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Financial statements (exportable) and the period-close checklist.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : section === "income-statement" ? (
          <IncomeStatementReport entity={entity} currency={currency} />
        ) : section === "balance-sheet" ? (
          <BalanceSheetReport entity={entity} currency={currency} />
        ) : section === "cash-flow" ? (
          <CashFlowReport entity={entity} currency={currency} />
        ) : section === "changes-in-equity" ? (
          <EquityReport entity={entity} currency={currency} />
        ) : section === "analytics" ? (
          <AnalyticsSliceReport entity={entity} currency={currency} />
        ) : section === "periods" ? (
          <PeriodsTab entity={entity} />
        ) : (
          <TrialBalanceReport entity={entity} currency={currency} />
        )}
      </main>
    </FinanceShell>
  );
}
