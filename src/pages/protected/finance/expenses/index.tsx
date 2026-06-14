// Expenses & petty cash (§6.6) — claims and petty-cash funds/vouchers, as tabs.

import { useState } from "react";
import { FinanceShell } from "../finance-shell";
import { TabBar, useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { ExpenseClaimsTab } from "./expense-claims-tab";
import { PettyCashTab } from "./petty-cash-tab";

export default function ExpensesPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();

  const tabs = [
    can(P.FIN_VIEW_EXPENSE_CLAIMS) && { key: "claims", label: "Expense Claims" },
    can(P.FIN_VIEW_PETTY_CASH) && { key: "petty-cash", label: "Petty Cash" },
  ].filter(Boolean) as { key: string; label: string }[];
  const [active, setActive] = useState(tabs[0]?.key ?? "claims");

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Expenses & Petty Cash</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Staff expense claims and petty-cash floats for the selected entity.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : tabs.length === 0 ? (
          <EmptyState title="No access" message="You don’t have permission to view this area." />
        ) : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "claims" && <ExpenseClaimsTab entity={entity} currency={currency} />}
            {active === "petty-cash" && <PettyCashTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </FinanceShell>
  );
}
