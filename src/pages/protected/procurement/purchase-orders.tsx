// P2P → Purchase Orders (§7.2). List with received/invoiced progress + detail
// (lines) + submit-for-approval.
import { useState } from "react";
import { toast } from "sonner";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { P } from "@/permissions";
import { useGetPurchaseOrdersQuery, useSubmitPurchaseOrderMutation } from "@/redux/services/procurement/procurement-api";
import type { PurchaseOrder } from "@/redux/services/procurement/procurement-types";

export default function PurchaseOrdersPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
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
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Purchase Orders</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Orders raised from approved requisitions.</p>
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
    </ProcurementShell>
  );
}
