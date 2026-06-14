// P2P → Goods Receipts (§7.2). The first GL event in the chain. List + detail +
// post.
import { useState } from "react";
import { toast } from "sonner";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { P } from "@/permissions";
import { useGetGoodsReceiptsQuery, usePostGoodsReceiptMutation } from "@/redux/services/procurement/procurement-api";
import type { GoodsReceipt } from "@/redux/services/procurement/procurement-types";

export default function GoodsReceiptsPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<GoodsReceipt | null>(null);
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
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Goods Receipts</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Goods received notes — the first GL event in the chain.</p>
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
    </ProcurementShell>
  );
}
