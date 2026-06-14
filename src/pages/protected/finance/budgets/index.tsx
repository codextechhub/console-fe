// Budgets, fixed assets & tax (§6.8) — three related areas as tabs.

import { useState } from "react";
import { FinanceShell } from "../finance-shell";
import { TabBar, useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { BudgetsTab } from "./budgets-tab";
import { AssetsTab } from "./assets-tab";
import { TaxTab } from "./tax-tab";

export default function BudgetsAssetsTaxPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();

  const tabs = [
    can(P.FIN_VIEW_BUDGETS) && { key: "budgets", label: "Budgets" },
    can(P.FIN_VIEW_FIXED_ASSETS) && { key: "assets", label: "Fixed Assets" },
    can(P.FIN_VIEW_TAX) && { key: "tax", label: "Tax" },
  ].filter(Boolean) as { key: string; label: string }[];
  const [active, setActive] = useState(tabs[0]?.key ?? "budgets");

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Budgets, Assets & Tax</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Budgets and variance, the fixed-asset register, and tax filing/remittance.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : tabs.length === 0 ? (
          <EmptyState title="No access" message="You don’t have permission to view this area." />
        ) : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "budgets" && <BudgetsTab entity={entity} />}
            {active === "assets" && <AssetsTab entity={entity} currency={currency} />}
            {active === "tax" && <TaxTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </FinanceShell>
  );
}
