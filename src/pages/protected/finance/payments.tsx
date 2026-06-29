// Payments (§6.Payments) — single payouts, payout batches, settlement
// reconciliation (gateway vs bank), and the gateway transactions log.
// Beneficiary details are FLS-masked unless payments.payout.view_sensitive.
import { useParams } from "react-router";
import { FinanceShell } from "./finance-shell";
import { PayoutsTab } from "./payouts-tab";
import { BatchesTab } from "./batches-tab";
import { SettlementTab } from "./settlement-tab";
import { DataTable, StatusPill, toArray, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useGetTransactionsLogQuery } from "@/redux/services/payments/payments-api";
import type { TransactionLogEntry } from "@/redux/services/payments/payments-types";

// The append-only gateway action log (PaymentEvent): every collection, payout,
// virtual-account and webhook action, including failed/rejected attempts.
function TransactionsTab({ entity }: { entity: string }) {
  const { data, isLoading, isFetching, isError, refetch } = useGetTransactionsLogQuery({ entity });
  const rows = toArray<TransactionLogEntry>(data?.data);
  const columns: Column<TransactionLogEntry>[] = [
    { header: "When", cell: (t) => <span className="text-gray-05">{new Date(t.created_at).toLocaleString()}</span> },
    { header: "Action", cell: (t) => <span className="font-semibold">{t.action_display || t.action}</span> },
    { header: "Provider", cell: (t) => t.provider || "—" },
    { header: "Reference", cell: (t) => <span className="font-mono text-xs">{t.reference || "—"}</span> },
    { header: "Result", cell: (t) => <StatusPill status={t.succeeded ? "SUCCESS" : "FAILED"} /> },
    { header: "Message", cell: (t) => <span className="text-gray-05">{t.message || "—"}</span> },
    { header: "Actor", cell: (t) => t.actor_email || "System" },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(t) => t.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No transactions" emptyMessage="Gateway actions (collections, payouts, webhooks) will appear here." />
  );
}

export default function PaymentsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "payouts" } = useParams();
  const { label, subtitle } = section === "batches"
    ? { label: "Payout Batches", subtitle: "Assemble a batch of payouts and submit them in one run." }
    : section === "settlement"
    ? { label: "Settlement", subtitle: "Reconcile gateway settlements against the bank." }
    : section === "transactions"
    ? { label: "Transactions Log", subtitle: "Every gateway action — collections, payouts and webhooks." }
    : { label: "Payouts", subtitle: "Money out — single disbursements to recipients." };

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{label}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">{subtitle}</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : section === "batches" ? (
          <BatchesTab entity={entity} currency={currency} />
        ) : section === "settlement" ? (
          <SettlementTab entity={entity} currency={currency} />
        ) : section === "transactions" ? (
          <TransactionsTab entity={entity} />
        ) : (
          <PayoutsTab entity={entity} currency={currency} />
        )}
      </main>
    </FinanceShell>
  );
}
