// Reports & month-end (§6.9) — the financial statements (with export), plus the
// fiscal periods and their close action.

import { useState } from "react";
import { FinanceShell } from "../finance-shell";
import { TabBar, useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import {
  TrialBalanceReport,
  IncomeStatementReport,
  BalanceSheetReport,
  CashFlowReport,
  EquityReport,
} from "./statements";
import { PeriodsTab } from "./periods-tab";

export default function ReportsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const canReports = can(P.FIN_VIEW_REPORTS);

  const tabs = [
    canReports && { key: "trial-balance", label: "Trial Balance" },
    canReports && { key: "income", label: "Income Statement" },
    canReports && { key: "balance-sheet", label: "Balance Sheet" },
    canReports && { key: "cash-flow", label: "Cash Flow" },
    canReports && { key: "equity", label: "Changes in Equity" },
    can(P.FIN_VIEW_PERIODS) && { key: "periods", label: "Periods & Close" },
  ].filter(Boolean) as { key: string; label: string }[];
  const [active, setActive] = useState(tabs[0]?.key ?? "trial-balance");

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Reports & Month-End</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Financial statements (exportable) and the period-close checklist.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : tabs.length === 0 ? (
          <EmptyState title="No access" message="You don’t hold finance.report.view." />
        ) : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "trial-balance" && <TrialBalanceReport entity={entity} currency={currency} />}
            {active === "income" && <IncomeStatementReport entity={entity} currency={currency} />}
            {active === "balance-sheet" && <BalanceSheetReport entity={entity} currency={currency} />}
            {active === "cash-flow" && <CashFlowReport entity={entity} currency={currency} />}
            {active === "equity" && <EquityReport entity={entity} currency={currency} />}
            {active === "periods" && <PeriodsTab entity={entity} />}
          </>
        )}
      </main>
    </FinanceShell>
  );
}
