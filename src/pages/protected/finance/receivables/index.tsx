// Receivables (§6.3). One page per sub-section, driven by the :section route
// param (the sidebar navigates between them — no in-page tabs).

import { useParams } from "react-router";
import { FinanceShell } from "../finance-shell";
import { useActiveEntity, InfoHint } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { InvoicesTab } from "./invoices-tab";
import { CreditNotesTab } from "./credit-notes-tab";
import { RefundsTab } from "./refunds-tab";
import { ConcessionsTab } from "./concessions-tab";
import { PaymentPlansTab } from "./payment-plans-tab";
import { DunningTab } from "./dunning-tab";
import { CustomersTab } from "./customers-tab";
import { FeeStructuresTab } from "./fee-structures-tab";
import { ReceiptsAllocationTab } from "./receipts-allocation-tab";

const LABELS: Record<string, string> = {
  invoices: "Customer Invoices", "credit-notes": "Credit / Debit Notes", refunds: "Refunds & Write-offs",
  concessions: "Concessions / Fee Waivers", "payment-plans": "Payment Plans", dunning: "Dunning / Reminders",
  customers: "Customers", "fee-structures": "Fee Structures", receipts: "Receipts & Allocation",
};
const SUBTITLES: Record<string, string> = {
  receipts: "Record money received and apply it to open invoices.",
  "credit-notes": "Adjust customer balances against issued invoices.",
  refunds: "Return credit balances to the bank, or write off bad debt to expense.",
  "payment-plans": "Spread invoice balances into scheduled installments.",
  concessions: "Waivers, discounts and scholarships that reduce customer balances.",
  dunning: "Overdue follow-up — aging buckets, reminder queue and policies.",
  "fee-structures": "Billing templates that drive invoice generation.",
};
const HINTS: Record<string, string> = {
  "fee-structures": "A fee structure is a billing template. When you generate invoices, each line builds an invoice line from its GL account, amount and tax — so revenue posts to the right place automatically. Only customer structures generate AR invoices.",
};

export default function ReceivablesPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "invoices" } = useParams();

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mont text-lg font-semibold text-gray-01">{LABELS[section] ?? "Receivables"}</h1>
            {HINTS[section] && <InfoHint>{HINTS[section]}</InfoHint>}
          </div>
          <p className="mt-0.5 font-mont text-xs text-gray-05">{SUBTITLES[section] ?? "Accounts receivable for the selected entity."}</p>
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
        ) : section === "dunning" ? (
          <DunningTab entity={entity} currency={currency} />
        ) : section === "customers" ? (
          <CustomersTab entity={entity} currency={currency} />
        ) : section === "fee-structures" ? (
          <FeeStructuresTab entity={entity} currency={currency} />
        ) : section === "receipts" ? (
          <ReceiptsAllocationTab entity={entity} currency={currency} />
        ) : (
          <InvoicesTab entity={entity} currency={currency} />
        )}
      </main>
    </FinanceShell>
  );
}
