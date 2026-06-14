// Expenses → Expense claims. List + detail (lines) + post + settle actions.
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, type Column } from "@/components/finance-ui";
import { P } from "@/permissions";
import { useGetExpenseClaimsQuery, usePostExpenseClaimMutation, useSettleExpenseClaimMutation } from "@/redux/services/finance/ops-api";
import type { ExpenseClaim } from "@/redux/services/finance/ops-types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p><p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p></div>;
}

export function ExpenseClaimsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ExpenseClaim | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetExpenseClaimsQuery({ entity, page });
  const [post] = usePostExpenseClaimMutation();
  const [settle] = useSettleExpenseClaimMutation();

  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<ExpenseClaim>[] = [
    { header: "Document", cell: (c) => <span className="font-semibold">{c.document_number}</span> },
    { header: "Claimant", cell: (c) => c.claimant_name || "—" },
    { header: "Title", cell: (c) => <span className="block max-w-xs truncate">{c.title || "—"}</span> },
    { header: "Date", cell: (c) => c.claim_date },
    { header: "Total", align: "right", cell: (c) => <Money kobo={c.total} currency={currency} align="right" /> },
    { header: "Balance", align: "right", cell: (c) => <Money kobo={c.balance_due} currency={currency} align="right" /> },
    { header: "Status", cell: (c) => <StatusPill status={c.status} /> },
    {
      header: "", cell: (c) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {c.status === "DRAFT" && (
            <ActionButton asLink label="Post" permission={P.FIN_POST_EXPENSE_CLAIM} title="Post expense claim?"
              description={`Posts ${c.document_number} to the ledger.`}
              onConfirm={async () => { const r = await post({ id: c.id, entity }).unwrap(); toast.success(r.message || "Posted."); }} />
          )}
          {c.status === "POSTED" && c.payment_status !== "PAID" && (
            <ActionButton asLink label="Settle" permission={P.FIN_SETTLE_EXPENSE_CLAIM} title="Settle expense claim?"
              description={`Pays out the balance of ${c.document_number}.`}
              onConfirm={async () => { const r = await settle({ id: c.id, entity }).unwrap(); toast.success(r.message || "Settled."); }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} rows={rows} rowKey={(c) => c.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        emptyTitle="No expense claims" emptyMessage="Expense claims will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "Expense claim"} description={selected?.title}>
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3"><StatusPill status={selected.status} /><StatusPill status={selected.payment_status} /></div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Claimant" value={selected.claimant_name} />
              <Field label="Date" value={selected.claim_date} />
              <Field label="Subtotal" value={<Money kobo={selected.subtotal} currency={currency} />} />
              <Field label="Tax" value={<Money kobo={selected.tax_total} currency={currency} />} />
              <Field label="Total" value={<Money kobo={selected.total} currency={currency} />} />
              <Field label="Balance due" value={<Money kobo={selected.balance_due} currency={currency} />} />
            </div>
            {selected.narration && <Field label="Narration" value={selected.narration} />}
            <div>
              <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
              <div className="space-y-1.5">
                {selected.lines.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                    <span>{l.description}<span className="ml-2 text-gray-05">{l.expense_account}</span></span>
                    <Money kobo={l.line_total} currency={currency} className="font-semibold" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
