// P2P → Goods Receipts (§7.2). The first GL event in the chain. List + detail +
// post.
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, FormModal, FormField, MoneyInput, AccountPicker, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetGoodsReceiptsQuery, usePostGoodsReceiptMutation, useCreateGoodsReceiptMutation } from "@/redux/services/procurement/procurement-api";
import type { GoodsReceipt } from "@/redux/services/procurement/procurement-types";
import { VendorPicker, PurchaseOrderPicker } from "./pickers";

export default function GoodsReceiptsPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<GoodsReceipt | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetGoodsReceiptsQuery({ entity: entity!, page }, { skip: !entity });
  const [post] = usePostGoodsReceiptMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<GoodsReceipt>[] = [
    { header: "GRN", cell: (g) => <span className="font-semibold">{g.document_number}</span> },
    { header: "Vendor", cell: (g) => g.vendor_code },
    { header: "Received", cell: (g) => g.received_date },
    { header: "Value", align: "right", cell: (g) => <Money kobo={g.total_value} currency={currency} align="right" /> },
    { header: "Status", cell: (g) => <StatusPill status={g.status} /> },
    {
      header: "", cell: (g) => (
        <div onClick={(e) => e.stopPropagation()}>
          {g.status === "DRAFT" && (
            <ActionButton asLink label="Post" permission={P.PROC_POST_GOODS_RECEIPT} title="Post goods receipt?"
              description={`Posts ${g.document_number} (Dr GR/IR clearing, Cr accruals).`}
              onConfirm={async () => { const res = await post({ id: g.id, entity: entity! }).unwrap(); toast.success(res.message || "Posted."); }} />
          )}
        </div>
      ),
    },
  ];

  if (!entity) return <ProcurementShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></ProcurementShell>;

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Goods Receipts</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Goods received notes — the first GL event in the chain.</p>
          </div>
          <Can permission={P.PROC_CREATE_GOODS_RECEIPT}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New GRN</Button>
          </Can>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(g) => g.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
          emptyTitle="No goods receipts" emptyMessage="GRNs will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "GRN"} description={selected ? `${selected.vendor_code} · ${selected.received_date}` : undefined}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><StatusPill status={selected.status} /><span className="font-mont text-sm text-gray-05">Value <Money kobo={selected.total_value} currency={currency} className="font-semibold text-black-01" /></span></div>
            <div className="space-y-1.5">
              {selected.lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                  <span>{l.description}<span className="ml-2 text-gray-05">acc {l.accepted_qty} · rej {l.rejected_qty}</span></span>
                  <Money kobo={l.value_amount} currency={currency} className="font-semibold" />
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>
      <CreateGRNModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </ProcurementShell>
  );
}

interface GRNRow { description: string; expense_account: string; accepted_qty: number; rejected_qty: number; unitPriceKobo: number }
const emptyGRNRow = (): GRNRow => ({ description: "", expense_account: "", accepted_qty: 0, rejected_qty: 0, unitPriceKobo: 0 });

function CreateGRNModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [vendor, setVendor] = useState("");
  const [po, setPo] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<GRNRow[]>([emptyGRNRow()]);
  const [create, { isLoading }] = useCreateGoodsReceiptMutation();
  const setRow = (i: number, patch: Partial<GRNRow>) => setLines((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const apiLines = lines.filter((l) => l.expense_account && (l.accepted_qty > 0 || l.rejected_qty > 0))
    .map((l) => ({ description: l.description, expense_account: l.expense_account, accepted_qty: l.accepted_qty, rejected_qty: l.rejected_qty, unit_price: l.unitPriceKobo }));

  const submit = async () => {
    try {
      const r = await create({ entity, vendor, purchase_order: po ? Number(po) : undefined, received_date: receivedDate, reference: reference.trim() || undefined, lines: apiLines }).unwrap();
      toast.success(r.message || "Goods receipt created.");
      setVendor(""); setPo(""); setReference(""); setLines([emptyGRNRow()]); onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New goods receipt"
      description="Record what was received. Posting it books the first GL event." onSubmit={submit}
      loading={isLoading} canSubmit={!!vendor && !!receivedDate && apiLines.length > 0} widthClass="sm:max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} /></FormField>
        <FormField label="Purchase order"><PurchaseOrderPicker entity={entity} value={po} onChange={setPo} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Received date" required><Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="pt-1">
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="space-y-2 rounded-md border border-gray-03 p-3">
              <div className="flex items-center gap-2">
                <Input value={l.description} onChange={(e) => setRow(i, { description: e.target.value })} placeholder="Description" className="flex-1 bg-white" />
                <button type="button" onClick={() => setLines((rs) => rs.filter((_, idx) => idx !== i))} disabled={lines.length <= 1} className="text-gray-05 hover:text-destructive disabled:opacity-30"><Trash2 className="size-4" /></button>
              </div>
              <AccountPicker entity={entity} value={l.expense_account} onChange={(v) => setRow(i, { expense_account: v })} placeholder="Expense account" postableOnly accountType="EXPENSE" />
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" min={0} step="any" value={l.accepted_qty} onChange={(e) => setRow(i, { accepted_qty: Number(e.target.value) })} placeholder="Accepted" className="bg-white" aria-label="Accepted qty" />
                <Input type="number" min={0} step="any" value={l.rejected_qty} onChange={(e) => setRow(i, { rejected_qty: Number(e.target.value) })} placeholder="Rejected" className="bg-white" aria-label="Rejected qty" />
                <MoneyInput valueKobo={l.unitPriceKobo} onChangeKobo={(k) => setRow(i, { unitPriceKobo: k })} currency={currency} placeholder="Unit price" />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines((rs) => [...rs, emptyGRNRow()])} className="gap-1.5"><Plus className="size-4" /> Add line</Button>
        </div>
      </div>
    </FormModal>
  );
}
