// Collections (§6.4) — gateway cash-in and virtual accounts, one page per
// sub-section (route-driven).

import { useParams } from "react-router";
import { FinanceShell } from "../finance-shell";
import { useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { CollectionsTab } from "./collections-tab";
import { VirtualAccountsTab } from "./virtual-accounts-tab";

export default function CollectionsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "gateway" } = useParams();
  const isVA = section === "virtual-accounts";

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{isVA ? "Virtual Accounts" : "Collections"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Receivable cash arrives through the payment gateway.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" message="Choose a ledger entity to view collections." />
        ) : isVA ? (
          <VirtualAccountsTab entity={entity} currency={currency} />
        ) : (
          <CollectionsTab entity={entity} currency={currency} />
        )}
      </main>
    </FinanceShell>
  );
}
