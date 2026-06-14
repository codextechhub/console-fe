// Payments at scale (§7.6) — single payouts, payout batches (submit), and
// settlement reconciliation (gateway vs bank). Beneficiary details are
// FLS-masked unless payments.payout.view_sensitive.
import { useState } from "react";
import { toast } from "sonner";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, Money, StatusPill, TabBar, ActionButton, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState, LoadingState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { isStripped } from "@/utils/fls";
import {
  useGetPayoutsQuery, useGetPayoutBatchesQuery, useSubmitPayoutBatchMutation, useGetSettlementReconciliationQuery,
} from "@/redux/services/payments/payments-api";
import type { PayoutBatchSummary, PayoutInstruction } from "@/redux/services/payments/payments-types";

function PayoutsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetPayoutsQuery({ entity, page });
  const rows = data?.data ?? [];
  const pg = data?.pagination;
  const columns: Column<PayoutInstruction>[] = [
    { header: "Reference", cell: (p) => <span className="font-semibold">{p.reference}</span> },
    { header: "Beneficiary", cell: (p) => isStripped(p, "beneficiary_name") ? <span className="text-gray-05">••••</span> : p.beneficiary_name || "—" },
    { header: "Account", cell: (p) => isStripped(p, "beneficiary_account_number") ? <span className="text-gray-05">••••</span> : p.beneficiary_account_number || "—" },
    { header: "Amount", align: "right", cell: (p) => <Money kobo={p.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (p) => <StatusPill status={p.status} /> },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(p) => p.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No payouts" emptyMessage="Single payouts will appear here."
      page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
  );
}

function BatchesTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetPayoutBatchesQuery({ entity, page });
  const [submit] = useSubmitPayoutBatchMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;
  const columns: Column<PayoutBatchSummary>[] = [
    { header: "Reference", cell: (b) => <span className="font-semibold">{b.reference}</span> },
    { header: "Title", cell: (b) => b.title },
    { header: "Items", align: "right", cell: (b) => b.item_count },
    { header: "Total", align: "right", cell: (b) => <Money kobo={b.total_amount} currency={currency} align="right" /> },
    { header: "Status", cell: (b) => <StatusPill status={b.status} /> },
    {
      header: "", cell: (b) => (
        <div onClick={(e) => e.stopPropagation()}>
          {(b.status === "DRAFT" || b.status === "PENDING") && (
            <ActionButton asLink label="Submit" permission={P.PAY_CREATE_PAYOUT} title="Submit payout batch?"
              description={`Submits ${b.reference}'s pending instructions to the gateway. Only settled items book.`}
              onConfirm={async () => { const r = await submit({ id: b.id, entity }).unwrap(); toast.success(r.message || "Submitted."); }} />
          )}
        </div>
      ),
    },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(b) => b.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No payout batches" emptyMessage="Payout batches will appear here."
      page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
  );
}

function SettlementTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading } = useGetSettlementReconciliationQuery({ entity });
  if (isLoading) return <LoadingState />;
  const d = (data?.data ?? {}) as { unmatched_bank_total?: number; unmatched_bank_count?: number };
  return (
    <div className="rounded-md bg-white p-5 font-mont text-sm">
      <p className="mb-3 font-semibold text-gray-01">Settlement reconciliation (gateway vs bank)</p>
      <div className="flex flex-wrap gap-8">
        <div><p className="text-xs text-gray-05">Unmatched bank lines</p><p className="mt-1 text-lg font-semibold">{d.unmatched_bank_count ?? 0}</p></div>
        <div><p className="text-xs text-gray-05">Unmatched bank total</p><p className="mt-1 text-lg font-semibold"><Money kobo={d.unmatched_bank_total ?? 0} currency={currency} /></p></div>
      </div>
    </div>
  );
}

export default function PayoutsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const tabs = can(P.PAY_VIEW_PAYOUTS) ? [
    { key: "payouts", label: "Payouts" },
    { key: "batches", label: "Batches" },
    { key: "settlement", label: "Settlement" },
  ] : [];
  const [active, setActive] = useState("payouts");

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Payouts</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Single and bulk payouts, batches and settlement reconciliation.</p>
        </div>
        {!entity ? <EmptyState title="Select an entity" /> : tabs.length === 0 ? <EmptyState title="No access" message="You don’t hold payments.payout.view." /> : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "payouts" && <PayoutsTab entity={entity} currency={currency} />}
            {active === "batches" && <BatchesTab entity={entity} currency={currency} />}
            {active === "settlement" && <SettlementTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </ProcurementShell>
  );
}
