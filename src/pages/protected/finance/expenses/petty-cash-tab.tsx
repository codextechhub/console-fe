// Expenses → Petty cash. Funds (with float/balance/shortfall + replenish) and
// vouchers (with post). Replenish takes a date and optional amount.

import { useState } from "react";
import { toast } from "sonner";
import { DataTable, Money, StatusPill, ActionButton, MoneyInput, type Column } from "@/components/finance-ui";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import {
  useGetPettyCashFundsQuery,
  useReplenishPettyCashMutation,
  useGetPettyCashVouchersQuery,
  usePostPettyCashVoucherMutation,
} from "@/redux/services/finance/ops-api";
import type { PettyCashFund, PettyCashVoucher } from "@/redux/services/finance/ops-types";

export function PettyCashTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const funds = useGetPettyCashFundsQuery({ entity, page: 1 });
  const vouchers = useGetPettyCashVouchersQuery({ entity, page: 1 });
  const [replenish] = useReplenishPettyCashMutation();
  const [postVoucher] = usePostPettyCashVoucherMutation();

  // Replenish form state, keyed per-fund row.
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(0);

  const fundCols: Column<PettyCashFund>[] = [
    { header: "Fund", cell: (f) => <span className="font-semibold">{f.name}</span> },
    { header: "Custodian", cell: (f) => f.custodian_label || "—" },
    { header: "Float", align: "right", cell: (f) => <Money kobo={f.float_amount} currency={currency} align="right" /> },
    { header: "Balance", align: "right", cell: (f) => <Money kobo={f.current_balance} currency={currency} align="right" /> },
    { header: "Shortfall", align: "right", cell: (f) => <Money kobo={f.shortfall} currency={currency} align="right" /> },
    { header: "Status", cell: (f) => <StatusPill status={f.is_active ? "ACTIVE" : "INACTIVE"} /> },
    {
      header: "", cell: (f) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionButton asLink label="Replenish" permission={P.FIN_REPLENISH_PETTY_CASH}
            title={`Replenish ${f.name}?`} description="Tops the fund back up to its float (Dr petty cash, Cr bank)."
            onConfirm={async () => { const r = await replenish({ id: f.id, entity, date, amount: amount || undefined }).unwrap(); toast.success(r.message || "Replenished."); }}>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Date</span>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></label>
              <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Amount (optional)</span>
                <MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></label>
            </div>
          </ActionButton>
        </div>
      ),
    },
  ];

  const voucherCols: Column<PettyCashVoucher>[] = [
    { header: "Voucher", cell: (v) => <span className="font-semibold">{v.document_number}</span> },
    { header: "Payee", cell: (v) => v.payee || "—" },
    { header: "Date", cell: (v) => v.voucher_date },
    { header: "Total", align: "right", cell: (v) => <Money kobo={v.total} currency={currency} align="right" /> },
    { header: "Status", cell: (v) => <StatusPill status={v.status} /> },
    {
      header: "", cell: (v) => (
        <div onClick={(e) => e.stopPropagation()}>
          {v.status === "DRAFT" && (
            <ActionButton asLink label="Post" permission={P.FIN_POST_PETTY_CASH} title="Post voucher?"
              description={`Posts ${v.document_number} (Dr expense, Cr petty cash).`}
              onConfirm={async () => { const r = await postVoucher({ id: v.id, entity }).unwrap(); toast.success(r.message || "Posted."); }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 font-mont text-sm font-semibold text-gray-01">Funds</p>
        <DataTable columns={fundCols} rows={funds.data?.data ?? []} rowKey={(f) => f.id}
          loading={funds.isLoading} error={funds.isError} onRetry={funds.refetch}
          emptyTitle="No petty cash funds" emptyMessage="Funds will appear here once established." />
      </div>
      <div>
        <p className="mb-2 font-mont text-sm font-semibold text-gray-01">Vouchers</p>
        <DataTable columns={voucherCols} rows={vouchers.data?.data ?? []} rowKey={(v) => v.id}
          loading={vouchers.isLoading} error={vouchers.isError} onRetry={vouchers.refetch}
          emptyTitle="No vouchers" emptyMessage="Petty cash vouchers will appear here." />
      </div>
    </div>
  );
}
