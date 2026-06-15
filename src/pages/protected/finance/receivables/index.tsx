// Receivables (§6.3). One page per sub-section, driven by the :section route
// param (the sidebar navigates between them — no in-page tabs).

import { useParams } from "react-router";
import { FinanceShell } from "../finance-shell";
import { useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { InvoicesTab } from "./invoices-tab";
import { CreditNotesTab } from "./credit-notes-tab";
import { RefundsTab } from "./refunds-tab";
import { ConcessionsTab } from "./concessions-tab";
import { PaymentPlansTab } from "./payment-plans-tab";

const LABELS: Record<string, string> = {
  invoices: "Invoices", "credit-notes": "Credit Notes", refunds: "Refunds",
  concessions: "Concessions", "payment-plans": "Payment Plans",
};

export default function ReceivablesPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "invoices" } = useParams();

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{LABELS[section] ?? "Receivables"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Accounts receivable for the selected entity.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" message="Choose a ledger entity to view receivables." />
        ) : section === "credit-notes" ? (
          <CreditNotesTab entity={entity} currency={currency} />
        ) : section === "refunds" ? (
          <RefundsTab entity={entity} currency={currency} />
        ) : section === "concessions" ? (
          <ConcessionsTab entity={entity} currency={currency} />
        ) : section === "payment-plans" ? (
          <PaymentPlansTab entity={entity} currency={currency} />
        ) : (
          <InvoicesTab entity={entity} currency={currency} />
        )}
      </main>
    </FinanceShell>
  );
}
