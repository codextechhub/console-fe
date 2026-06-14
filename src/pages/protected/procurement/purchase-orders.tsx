// P2P → Purchase Orders (§7.2). List with received/invoiced progress + detail
// (lines) + submit-for-approval.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, FormModal, FormField, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetPurchaseOrdersQuery, useSubmitPurchaseOrderMutation, useCreatePurchaseOrderMutation } from "@/redux/services/procurement/procurement-api";
import type { PurchaseOrder } from "@/redux/services/procurement/procurement-types";
import { RequisitionPicker, VendorPicker } from "./pickers";

export default function PurchaseOrdersPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetPurchaseOrdersQuery({ entity: entity!, page }, { skip: !entity });
  const [submit] = useSubmitPurchaseOrderMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<PurchaseOrder>[] = [
    { header: "PO", cell: (o) => <span className="font-semibold">{o.document_number}</span> },
    { header: "Vendor", cell: (o) => o.vendor_code },
    { header: "Order date", cell: (o) => o.order_date },
    { header: "Total", align: "right", cell: (o) => <Money kobo={o.total} currency={currency} align="right" /> },
    { header: "Received", cell: (o) => `${o.received_pct}%` },
    { header: "Invoiced", cell: (o) => `${o.invoiced_pct}%` },
    { header: "Status", cell: (o) => <StatusPill status={o.status} /> },
    {
      header: "", cell: (o) => (
        <div onClick={(e) => e.stopPropagation()}>
          {o.status === "DRAFT" && (
            <ActionButton asLink label="Submit" permission={P.PROC_SUBMIT_PURCHASE_ORDER} title="Submit PO for approval?"
              description={`Routes ${o.document_number} for approval.`}
              onConfirm={async () => { const res = await submit({ id: o.id, entity: entity! }).unwrap(); toast.success(res.message || "Submitted."); }} />
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
            <h1 className="font-mont text-lg font-semibold text-gray-01">Purchase Orders</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Orders raised from approved requisitions.</p>
          </div>
          <Can permission={P.PROC_CREATE_PURCHASE_ORDER}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New PO</Button>
          </Can>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(o) => o.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
          emptyTitle="No purchase orders" emptyMessage="Purchase orders will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "PO"} description={selected ? `${selected.vendor_code} · ${selected.order_date}` : undefined} widthClass="sm:max-w-2xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><StatusPill status={selected.status} /><span className="font-mont text-sm text-gray-05">Total <Money kobo={selected.total} currency={currency} className="font-semibold text-black-01" /></span></div>
            <div className="space-y-1.5">
              {selected.lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                  <span>{l.description}<span className="ml-2 text-gray-05">×{l.quantity} · recv {l.received_qty} · inv {l.invoiced_qty}</span></span>
                  <Money kobo={l.net_amount} currency={currency} className="font-semibold" />
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>
      <CreatePOModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </ProcurementShell>
  );
}

function CreatePOModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [requisition, setRequisition] = useState("");
  const [vendor, setVendor] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState("");
  const [create, { isLoading }] = useCreatePurchaseOrderMutation();
  const submit = async () => {
    try {
      const r = await create({ entity, requisition: Number(requisition), vendor, order_date: orderDate, expected_date: expectedDate || undefined }).unwrap();
      toast.success(r.message || "Purchase order created.");
      setRequisition(""); setVendor(""); setExpectedDate(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New purchase order"
      description="Raised from an approved requisition; its lines are carried over." onSubmit={submit}
      loading={isLoading} canSubmit={!!requisition && !!vendor && !!orderDate}>
      <FormField label="Requisition" required><RequisitionPicker entity={entity} value={requisition} onChange={setRequisition} /></FormField>
      <FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Order date" required><Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Expected date"><Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="bg-white" /></FormField>
      </div>
    </FormModal>
  );
}
