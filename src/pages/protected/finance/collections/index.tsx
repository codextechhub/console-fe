// Collections (§6.4) — gateway cash-in and virtual accounts, as tabs.

import { useState } from "react";
import { FinanceShell } from "../finance-shell";
import { TabBar, useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { CollectionsTab } from "./collections-tab";
import { VirtualAccountsTab } from "./virtual-accounts-tab";

export default function CollectionsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();

  const tabs = [
    can(P.PAY_VIEW_COLLECTIONS) && { key: "collections", label: "Collections" },
    can(P.PAY_VIEW_COLLECTIONS) && { key: "virtual-accounts", label: "Virtual Accounts" },
  ].filter(Boolean) as { key: string; label: string }[];

  const [active, setActive] = useState("collections");

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Collections</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Receivable cash arrives through the payment gateway — initiate, then verify.</p>
        </div>

        {!entity ? (
          <EmptyState title="Select an entity" message="Choose a ledger entity to view collections." />
        ) : tabs.length === 0 ? (
          <EmptyState title="No access" message="You don’t have permission to view collections." />
        ) : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "collections" && <CollectionsTab entity={entity} currency={currency} />}
            {active === "virtual-accounts" && <VirtualAccountsTab entity={entity} />}
          </>
        )}
      </main>
    </FinanceShell>
  );
}
