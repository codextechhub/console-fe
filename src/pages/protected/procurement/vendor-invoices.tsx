// P2P → Vendor Invoices (§7.2). Three-way match: surfaces match_status, lets the
// user run the match, submit for approval, and post (with allow-variance when an
// invoice is blocked over tolerance).
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import {
  DataTable, DetailDrawer, Money, StatusPill, ActionButton, FormModal, FormField,
  LineEditor, emptyLine, toApiLines, type DocLine, toArray, useActiveEntity, type Column,
} from "@/components/finance-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import {
  useGetVendorInvoicesQuery,
  useMatchVendorInvoiceMutation,
  useSubmitVendorInvoiceMutation,
  usePostVendorInvoiceMutation,
  useCreateVendorInvoiceMutation,
} from "@/redux/services/procurement/procurement-api";
import type { VendorInvoice } from "@/redux/services/procurement/procurement-types";
import { VendorPicker, PurchaseOrderPicker } from "./pickers";

const selectCls = "h-10 rounded-md border bg-white px-3 font-mont text-sm focus:border-primary focus:outline-none";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p><p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p></div>;
}

export default function VendorInvoicesPage() {
  const { code: entity, currency } = useActiveEntity();
  const [match, setMatch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<VendorInvoice | null>(null);
  const [allowVariance, setAllowVariance] = useState(false);
  const [creating, setCreating] = useState(false);
  const params = useMemo(() => ({ entity: entity!, page, ...(match ? { match_status: match } : {}) }), [entity, page, match]);
  const { data, isLoading, isFetching, isError, refetch } = useGetVendorInvoicesQuery(params, { skip: !entity });
  const [runMatch] = useMatchVendorInvoiceMutation();
  const [submit] = useSubmitVendorInvoiceMutation();
  const [post] = usePostVendorInvoiceMutation();
  const rows = toArray(data?.data);

  const columns: Column<VendorInvoice>[] = [
    { header: "Invoice", cell: (i) => <span className="font-semibold">{i.document_number}</span> },
    { header: "Vendor", cell: (i) => i.vendor_code },
    { header: "Date", cell: (i) => i.invoice_date },
    { header: "Total", align: "right", cell: (i) => <Money kobo={i.total} currency={currency} align="right" /> },
    { header: "Match", cell: (i) => <StatusPill status={i.match_status} /> },
    { header: "Payment", cell: (i) => <StatusPill status={i.payment_status} /> },
    { header: "Status", cell: (i) => <StatusPill status={i.status} /> },
  ];

  if (!entity) return <ProcurementShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></ProcurementShell>;

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Vendor Invoices</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Three-way match against PO and goods receipt; post when matched.</p>
          </div>
          <Can permission={P.PROC_CREATE_VENDOR_INVOICE}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New invoice</Button>
          </Can>
        </div>
        <div className="flex items-center gap-3">
          <select value={match} onChange={(e) => { setMatch(e.target.value); setPage(1); }} className={selectCls} aria-label="Match status">
            <option value="">All match states</option>
            {["UNMATCHED", "MATCHED", "OVER_TOLERANCE", "BLOCKED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(i) => i.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
          emptyTitle="No vendor invoices" emptyMessage="Vendor bills will appear here."
        />
      </main>

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "Vendor invoice"} description={selected ? `${selected.vendor_code} · ${selected.invoice_date}` : undefined}
        widthClass="sm:max-w-2xl"
        footer={selected && (
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton asLink label="Run match" permission={P.PROC_MATCH_VENDOR_INVOICE} title="Run three-way match?"
              description={`Re-checks ${selected.document_number} against its PO and goods receipt.`}
              onConfirm={async () => { const r = await runMatch({ id: selected.id, entity }).unwrap(); toast.success(r.message || "Matched."); }} />
            {selected.status === "DRAFT" && (
              <ActionButton asLink label="Submit" permission={P.PROC_SUBMIT_VENDOR_INVOICE} title="Submit for approval?"
                description={`Routes ${selected.document_number} for approval.`}
                onConfirm={async () => { const r = await submit({ id: selected.id, entity }).unwrap(); toast.success(r.message || "Submitted."); }} />
            )}
            {selected.status !== "POSTED" && (
              <ActionButton label="Post" permission={P.PROC_POST_VENDOR_INVOICE} title="Post vendor invoice?"
                description={`Books ${selected.document_number} to AP. Over-tolerance invoices need the variance override.`}
                onConfirm={async () => { const r = await post({ id: selected.id, entity, allow_variance: allowVariance }).unwrap(); toast.success(r.message || "Posted."); }}>
                <label className="flex items-center gap-2 font-mont text-sm text-gray-01">
                  <Checkbox checked={allowVariance} onCheckedChange={(v) => setAllowVariance(!!v)} /> Allow variance (override over-tolerance block)
                </label>
              </ActionButton>
            )}
          </div>
        )}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2"><StatusPill status={selected.status} /><StatusPill status={selected.match_status} /><StatusPill status={selected.payment_status} /></div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vendor reference" value={selected.vendor_reference} />
              <Field label="Due date" value={selected.due_date} />
              <Field label="Subtotal" value={<Money kobo={selected.subtotal} currency={currency} />} />
              <Field label="Tax" value={<Money kobo={selected.tax_total} currency={currency} />} />
              <Field label="Total" value={<Money kobo={selected.total} currency={currency} />} />
              <Field label="Balance due" value={<Money kobo={selected.balance_due} currency={currency} />} />
            </div>
            <div className="space-y-1.5">
              {selected.lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                  <span>{l.description}<span className="ml-2 text-gray-05">×{l.quantity}</span></span>
                  <Money kobo={l.net_amount} currency={currency} className="font-semibold" />
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>
      <CreateInvoiceModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </ProcurementShell>
  );
}

function CreateInvoiceModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [vendor, setVendor] = useState("");
  const [po, setPo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<DocLine[]>([emptyLine()]);
  const [create, { isLoading }] = useCreateVendorInvoiceMutation();
  const apiLines = toApiLines(lines, "expense_account");

  const submit = async () => {
    try {
      const r = await create({ entity, vendor, purchase_order: po ? Number(po) : undefined, invoice_date: invoiceDate, due_date: dueDate || undefined, vendor_reference: reference.trim() || undefined, lines: apiLines }).unwrap();
      toast.success(r.message || "Vendor invoice created.");
      setVendor(""); setPo(""); setDueDate(""); setReference(""); setLines([emptyLine()]); onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New vendor invoice"
      description="Capture the bill; run the three-way match and post afterwards." onSubmit={submit}
      loading={isLoading} canSubmit={!!vendor && !!invoiceDate && apiLines.length > 0} widthClass="sm:max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} /></FormField>
        <FormField label="Purchase order"><PurchaseOrderPicker entity={entity} value={po} onChange={setPo} /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Invoice date" required><Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Vendor ref"><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="pt-1">
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
        <LineEditor entity={entity} lines={lines} onChange={setLines} accountLabel="Expense account" accountType="EXPENSE" currency={currency} showCostCenter={false} />
      </div>
    </FormModal>
  );
}
