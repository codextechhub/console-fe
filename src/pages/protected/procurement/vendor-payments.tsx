// P2P → Vendor Payments (§7.2). List + detail (allocations + WHT) + post (with
// auto-allocate to the vendor's open invoices).
import { useState } from "react";
import { toast } from "sonner";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { P } from "@/permissions";
import { useGetVendorPaymentsQuery, usePostVendorPaymentMutation } from "@/redux/services/procurement/procurement-api";
import type { VendorPayment } from "@/redux/services/procurement/procurement-types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p><p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p></div>;
}

export default function VendorPaymentsPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<VendorPayment | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetVendorPaymentsQuery({ entity: entity!, page }, { skip: !entity });
  const [post] = usePostVendorPaymentMutation();
  const rows = data?.data ?? [];
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
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Vendor Payments</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Vendor payments with withholding tax.</p>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(p) => p.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
          emptyTitle="No vendor payments" emptyMessage="Vendor payments will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
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
    </ProcurementShell>
  );
}
