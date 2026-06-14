// P2P → Requisitions (§7.2). List + detail (lines) + submit-for-approval.
import { useState } from "react";
import { toast } from "sonner";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { P } from "@/permissions";
import { useGetRequisitionsQuery, useSubmitRequisitionMutation } from "@/redux/services/procurement/procurement-api";
import type { Requisition } from "@/redux/services/procurement/procurement-types";

export default function RequisitionsPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Requisition | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetRequisitionsQuery({ entity: entity!, page }, { skip: !entity });
  const [submit] = useSubmitRequisitionMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<Requisition>[] = [
    { header: "Document", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Requested", cell: (r) => r.request_date },
    { header: "Needed by", cell: (r) => r.needed_by ?? "—" },
    { header: "Est. total", align: "right", cell: (r) => <Money kobo={r.estimated_total} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    {
      header: "", cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          {r.status === "DRAFT" && (
            <ActionButton asLink label="Submit" permission={P.PROC_SUBMIT_REQUISITION} title="Submit requisition?"
              description={`Routes ${r.document_number} for approval.`}
              onConfirm={async () => { const res = await submit({ id: r.id, entity: entity! }).unwrap(); toast.success(res.message || "Submitted."); }} />
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
          <h1 className="font-mont text-lg font-semibold text-gray-01">Requisitions</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Purchase requisitions — the start of the spend pipeline.</p>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
          emptyTitle="No requisitions" emptyMessage="Requisitions will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "Requisition"} description={selected ? `Requested ${selected.request_date}` : undefined}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><StatusPill status={selected.status} /><span className="font-mont text-sm text-gray-05">Est. <Money kobo={selected.estimated_total} currency={currency} className="font-semibold text-black-01" /></span></div>
            {selected.justification && <p className="font-mont text-sm text-gray-01">{selected.justification}</p>}
            <div className="space-y-1.5">
              {selected.lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                  <span>{l.description}<span className="ml-2 text-gray-05">×{l.quantity}</span></span>
                  <Money kobo={l.estimated_line_total} currency={currency} className="font-semibold" />
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>
    </ProcurementShell>
  );
}
