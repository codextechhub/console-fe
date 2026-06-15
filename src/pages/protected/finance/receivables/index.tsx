// Receivables (§6.3) — invoices and the AR adjustment documents, grouped as
// tabs. Each tab gates on its own backend view permission.

import { useState } from "react";
import { FinanceShell } from "../finance-shell";
import { TabBar, useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { InvoicesTab } from "./invoices-tab";
import { CreditNotesTab } from "./credit-notes-tab";
import { RefundsTab } from "./refunds-tab";
import { ConcessionsTab } from "./concessions-tab";
import { PaymentPlansTab } from "./payment-plans-tab";

export default function ReceivablesPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();

  const tabs = [
    can(P.FIN_VIEW_INVOICES) && { key: "invoices", label: "Invoices" },
    can(P.FIN_VIEW_CREDIT_NOTES) && { key: "credit-notes", label: "Credit Notes" },
    can(P.FIN_VIEW_REFUNDS) && { key: "refunds", label: "Refunds" },
    can(P.FIN_VIEW_CONCESSIONS) && { key: "concessions", label: "Concessions" },
    can(P.FIN_VIEW_PAYMENT_PLANS) && { key: "payment-plans", label: "Payment Plans" },
  ].filter(Boolean) as { key: string; label: string }[];

  const [active, setActive] = useState(tabs[0]?.key ?? "invoices");

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Receivables</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Invoices, credit notes and refunds for the selected entity.</p>
        </div>

        {!entity ? (
          <EmptyState title="Select an entity" message="Choose a ledger entity to view receivables." />
        ) : tabs.length === 0 ? (
          <EmptyState title="No access" message="You don’t have permission to view receivables." />
        ) : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "invoices" && <InvoicesTab entity={entity} currency={currency} />}
            {active === "credit-notes" && <CreditNotesTab entity={entity} currency={currency} />}
            {active === "refunds" && <RefundsTab entity={entity} currency={currency} />}
            {active === "concessions" && <ConcessionsTab entity={entity} currency={currency} />}
            {active === "payment-plans" && <PaymentPlansTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </FinanceShell>
  );
}
