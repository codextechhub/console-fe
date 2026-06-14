// Receivables → Invoices. Read list + filters + detail drawer; the write-off
// action (finance.invoice.writeoff) for posted invoices with a balance due.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, DetailDrawer, Money, StatusPill, ConfirmActionModal, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetInvoicesQuery, useWriteOffInvoiceMutation } from "@/redux/services/finance/ar-api";
import type { Invoice, InvoiceStatus, PaymentStatus } from "@/redux/services/finance/ar-types";

const selectCls = "h-10 rounded-md border bg-white px-3 font-mont text-sm focus:border-primary focus:outline-none";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p>
      <p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p>
    </div>
  );
}

export function InvoicesTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [payment, setPayment] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [writeOff, setWriteOff] = useState(false);
  const [reason, setReason] = useState("");

  const params = useMemo(() => ({ entity, page, ...(status ? { status } : {}), ...(payment ? { payment_status: payment } : {}) }), [entity, page, status, payment]);
  const { data, isLoading, isFetching, isError, refetch } = useGetInvoicesQuery(params);
  const [doWriteOff, { isLoading: writingOff }] = useWriteOffInvoiceMutation();

  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const submitWriteOff = async () => {
    if (!selected) return;
    try {
      const res = await doWriteOff({ id: selected.id, entity, reason }).unwrap();
      toast.success(res.message || "Invoice written off.");
      setWriteOff(false); setReason(""); setSelected(null);
    } catch { /* central */ }
  };

  const columns: Column<Invoice>[] = [
    { header: "Invoice", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Customer", cell: (r) => <span>{r.customer_name}<span className="ml-1 text-gray-05">{r.customer_code}</span></span> },
    { header: "Date", cell: (r) => r.invoice_date },
    { header: "Due", cell: (r) => r.due_date ?? "—" },
    { header: "Total", align: "right", cell: (r) => <Money kobo={r.total} currency={currency} align="right" /> },
    { header: "Balance", align: "right", cell: (r) => <Money kobo={r.balance_due} currency={currency} align="right" /> },
    { header: "Payment", cell: (r) => <StatusPill status={r.payment_status} /> },
    { header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value as InvoiceStatus | ""); setPage(1); }} className={selectCls} aria-label="Status">
          <option value="">All statuses</option>
          {(["DRAFT", "POSTED", "REVERSED", "CANCELLED"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={payment} onChange={(e) => { setPayment(e.target.value as PaymentStatus | ""); setPage(1); }} className={selectCls} aria-label="Payment status">
          <option value="">All payment states</option>
          {(["UNPAID", "PARTIAL", "PAID"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        onRowClick={setSelected}
        emptyTitle="No invoices" emptyMessage="No invoices match these filters."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "Invoice"}
        description={selected ? `${selected.customer_name} · ${selected.invoice_date}` : undefined}
        footer={
          selected && selected.status === "POSTED" && selected.balance_due > 0 ? (
            <Can permission={P.FIN_WRITE_OFF_INVOICE}>
              <Button variant="outline" onClick={() => setWriteOff(true)} className="border-destructive/40 text-destructive hover:bg-destructive/5">
                Write off balance
              </Button>
            </Can>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3"><StatusPill status={selected.status} /><StatusPill status={selected.payment_status} /></div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer" value={`${selected.customer_name} (${selected.customer_code})`} />
              <Field label="Reference" value={selected.reference} />
              <Field label="Subtotal" value={<Money kobo={selected.subtotal} currency={currency} />} />
              <Field label="Tax" value={<Money kobo={selected.tax_total} currency={currency} />} />
              <Field label="Total" value={<Money kobo={selected.total} currency={currency} />} />
              <Field label="Paid" value={<Money kobo={selected.amount_paid} currency={currency} />} />
              <Field label="Balance due" value={<Money kobo={selected.balance_due} currency={currency} />} />
              <Field label="Due date" value={selected.due_date} />
            </div>
            {selected.narration && <Field label="Narration" value={selected.narration} />}
          </div>
        )}
      </DetailDrawer>

      <ConfirmActionModal
        open={writeOff}
        onOpenChange={setWriteOff}
        title="Write off invoice balance?"
        description={`Books the outstanding balance of ${selected?.document_number} as bad debt.`}
        confirmText="Write off"
        destructive
        loading={writingOff}
        confirmDisabled={!reason.trim()}
        onConfirm={submitWriteOff}
      >
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for write-off (required)" className="bg-white" />
      </ConfirmActionModal>
    </>
  );
}
