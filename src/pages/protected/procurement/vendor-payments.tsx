// P2P → Vendor Payments (§7.2). List + detail (allocations + WHT) + post (with
// auto-allocate to the vendor's open invoices).
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, FormModal, FormField, MoneyInput, AccountPicker, useActiveEntity, toArray, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetVendorPaymentsQuery, usePostVendorPaymentMutation, useCreateVendorPaymentMutation } from "@/redux/services/procurement/procurement-api";
import type { VendorPayment } from "@/redux/services/procurement/procurement-types";
import { VendorPicker } from "./pickers";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p><p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p></div>;
}

export default function VendorPaymentsPage() {
  const { code: entity, currency } = useActiveEntity();
  const [selected, setSelected] = useState<VendorPayment | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetVendorPaymentsQuery({ entity: entity!, page }, { skip: !entity });
  const [post] = usePostVendorPaymentMutation();
  const rows = toArray(data?.data);
  const pg = data?.pagination;

  const columns: Column<VendorPayment>[] = [
    { header: "Payment", cell: (p) => <span className="font-semibold">{p.document_number}</span> },
    { header: "Vendor", cell: (p) => p.vendor_code },
    { header: "Date", cell: (p) => p.payment_date },
    { header: "Gross", align: "right", cell: (p) => <Money kobo={p.gross_amount} currency={currency} align="right" /> },
    { header: "WHT", align: "right", cell: (p) => <Money kobo={p.wht_amount} currency={currency} align="right" /> },
    { header: "Net", align: "right", cell: (p) => <Money kobo={p.net_amount} currency={currency} align="right" /> },
    { header: "Status", cell: (p) => <StatusPill status={p.status} /> },
  ];

  if (!entity) return <ProcurementShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></ProcurementShell>;

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Vendor Payments</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Vendor payments with withholding tax.</p>
          </div>
          <Can permission={P.PROC_CREATE_VENDOR_PAYMENT}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New payment</Button>
          </Can>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(p) => p.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
          emptyTitle="No vendor payments" emptyMessage="Vendor payments will appear here."
        />
      </main>

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "Vendor payment"} description={selected ? `${selected.vendor_code} · ${selected.payment_date}` : undefined}
        footer={selected && selected.status !== "POSTED" && (
          <ActionButton label="Post" permission={P.PROC_POST_VENDOR_PAYMENT} title="Post vendor payment?"
            description={`Posts ${selected.document_number} and allocates to the vendor's open invoices.`}
            onConfirm={async () => { const r = await post({ id: selected.id, entity, auto_allocate: true }).unwrap(); toast.success(r.message || "Posted."); }} />
        )}>
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3"><StatusPill status={selected.status} /></div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Method" value={selected.method} />
              <Field label="Reference" value={selected.reference} />
              <Field label="Gross" value={<Money kobo={selected.gross_amount} currency={currency} />} />
              <Field label="WHT" value={<Money kobo={selected.wht_amount} currency={currency} />} />
              <Field label="Net" value={<Money kobo={selected.net_amount} currency={currency} />} />
              <Field label="Allocated" value={<Money kobo={selected.allocated_amount} currency={currency} />} />
            </div>
            {selected.allocations.length > 0 && (
              <div>
                <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Allocations</p>
                <div className="space-y-1.5">
                  {selected.allocations.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                      <span>{a.invoice_number}</span><Money kobo={a.amount} currency={currency} className="font-semibold" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
      <CreatePaymentModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </ProcurementShell>
  );
}

function CreatePaymentModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [vendor, setVendor] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [gross, setGross] = useState(0);
  const [wht, setWht] = useState(0);
  const [paymentAccount, setPaymentAccount] = useState("");
  const [reference, setReference] = useState("");
  const [create, { isLoading }] = useCreateVendorPaymentMutation();
  const submit = async () => {
    try {
      const r = await create({ entity, vendor, payment_date: paymentDate, method, gross_amount: gross, wht_amount: wht || undefined, payment_account: paymentAccount, reference: reference.trim() || undefined }).unwrap();
      toast.success(r.message || "Payment created.");
      setVendor(""); setGross(0); setWht(0); setPaymentAccount(""); setReference(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New vendor payment"
      description="Net is gross minus WHT. Post it afterwards to allocate to open invoices." onSubmit={submit}
      loading={isLoading} canSubmit={!!vendor && !!paymentDate && gross > 0 && !!paymentAccount}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} /></FormField>
        <FormField label="Payment date" required><Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            {["BANK_TRANSFER", "CASH", "CHEQUE", "CARD"].map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
          </select>
        </FormField>
        <FormField label="Gross" required><MoneyInput valueKobo={gross} onChangeKobo={setGross} currency={currency} /></FormField>
        <FormField label="WHT"><MoneyInput valueKobo={wht} onChangeKobo={setWht} currency={currency} /></FormField>
      </div>
      <FormField label="Payment account" required><AccountPicker entity={entity} value={paymentAccount} onChange={setPaymentAccount} postableOnly accountType="ASSET" /></FormField>
      <FormField label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white" /></FormField>
    </FormModal>
  );
}
