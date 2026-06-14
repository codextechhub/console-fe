// Setup & entity (§6.1) — ledger entities, the chart of accounts and fiscal
// periods, as tabs. Entity provisioning lives here.

import { useState } from "react";
import { FinanceShell } from "../finance-shell";
import { TabBar, useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { EntitiesTab } from "./entities-tab";
import { AccountsTab } from "./accounts-tab";
import { PeriodsTab } from "../reports/periods-tab";

export default function SetupPage() {
  const { code: entity } = useActiveEntity();
  const { can } = useCan();

  const tabs = [
    can(P.FIN_VIEW_ENTITIES) && { key: "entities", label: "Entities" },
    can(P.FIN_VIEW_ACCOUNTS) && { key: "accounts", label: "Chart of Accounts" },
    can(P.FIN_VIEW_PERIODS) && { key: "periods", label: "Periods" },
  ].filter(Boolean) as { key: string; label: string }[];
  const [active, setActive] = useState(tabs[0]?.key ?? "entities");

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Setup & Entity</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Ledger entities, the chart of accounts and fiscal periods.</p>
        </div>
        {tabs.length === 0 ? (
          <EmptyState title="No access" message="You don’t have permission to view setup." />
        ) : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "entities" && <EntitiesTab />}
            {active === "accounts" && (entity ? <AccountsTab entity={entity} /> : <EmptyState title="Select an entity" />)}
            {active === "periods" && (entity ? <PeriodsTab entity={entity} /> : <EmptyState title="Select an entity" />)}
          </>
        )}
      </main>
    </FinanceShell>
  );
}
