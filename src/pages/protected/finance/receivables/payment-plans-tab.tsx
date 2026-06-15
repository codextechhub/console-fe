// Receivables → Payment plans. List + create (installments auto-built) + a
// detail drawer showing the schedule.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  DataTable, DetailDrawer, Money, StatusPill, FormModal, FormField, MoneyInput, type Column,
} from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetPaymentPlansQuery, useCreatePaymentPlanMutation } from "@/redux/services/finance/ar-api";
import type { PaymentPlan } from "@/redux/services/finance/ar-types";

export function PaymentPlansTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<PaymentPlan | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetPaymentPlansQuery({ entity, page });
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<PaymentPlan>[] = [
    { header: "Document", cell: (p) => <span className="font-semibold">{p.document_number}</span> },
    { header: "Customer", cell: (p) => <span>{p.customer_name}<span className="ml-1 text-gray-05">{p.customer_code}</span></span> },
    { header: "Invoice", cell: (p) => p.invoice_number ?? "—" },
    { header: "Frequency", cell: (p) => p.frequency },
    { header: "Installments", align: "right", cell: (p) => p.installment_count },
    { header: "Total", align: "right", cell: (p) => <Money kobo={p.total_amount} currency={currency} align="right" /> },
    { header: "Outstanding", align: "right", cell: (p) => <Money kobo={p.outstanding_total} currency={currency} align="right" /> },
    { header: "Status", cell: (p) => <StatusPill status={p.plan_status} /> },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.FIN_CREATE_PAYMENT_PLAN}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New plan</Button></Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(p) => p.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        emptyTitle="No payment plans" emptyMessage="Installment plans will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "Payment plan"} description={selected ? `${selected.customer_name} · ${selected.frequency}` : undefined}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><StatusPill status={selected.plan_status} /><span className="font-mont text-sm text-gray-05">Total <Money kobo={selected.total_amount} currency={currency} className="font-semibold text-black-01" /></span></div>
            <div className="space-y-1.5">
              {selected.installments.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                  <span>#{inst.seq_no}<span className="ml-2 text-gray-05">{inst.due_date}</span></span>
                  <span className="flex items-center gap-2"><Money kobo={inst.amount} currency={currency} className="font-semibold" /><StatusPill status={inst.status} /></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>

      <CreateModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function CreateModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [customer, setCustomer] = useState("");
  const [invoice, setInvoice] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState("MONTHLY");
  const [count, setCount] = useState("3");
  const [total, setTotal] = useState(0);
  const [create, { isLoading }] = useCreatePaymentPlanMutation();
  const submit = async () => {
    try {
      const r = await create({ entity, customer: customer.trim().toUpperCase(), invoice: invoice.trim() ? Number(invoice) : undefined, start_date: startDate, frequency, installment_count: Number(count) || 1, total_amount: total || undefined }).unwrap();
      toast.success(r.message || "Payment plan created.");
      setCustomer(""); setInvoice(""); setTotal(0); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New payment plan"
      description="Spreads a balance into installments. Total defaults to the invoice balance when an invoice id is given." onSubmit={submit}
      loading={isLoading} canSubmit={!!customer.trim() && !!startDate && Number(count) > 0}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Customer code" required><Input value={customer} onChange={(e) => setCustomer(e.target.value.toUpperCase())} className="bg-white font-mont" /></FormField>
        <FormField label="Invoice id"><Input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="Optional" className="bg-white font-mont" /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Start date" required><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Frequency">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            {["WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </FormField>
        <FormField label="Installments" required><Input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} className="bg-white" /></FormField>
      </div>
      <FormField label="Total amount"><MoneyInput valueKobo={total} onChangeKobo={setTotal} currency={currency} placeholder="Defaults to invoice balance" /></FormField>
    </FormModal>
  );
}
