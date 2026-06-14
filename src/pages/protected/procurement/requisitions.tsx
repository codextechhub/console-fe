// P2P → Requisitions (§7.2). List + detail (lines) + submit-for-approval.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import {
  DataTable, DetailDrawer, Money, StatusPill, ActionButton, FormModal, FormField,
  LineEditor, emptyLine, type DocLine, useActiveEntity, type Column,
} from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetRequisitionsQuery, useSubmitRequisitionMutation, useCreateRequisitionMutation } from "@/redux/services/procurement/procurement-api";
import type { Requisition } from "@/redux/services/procurement/procurement-types";

export default function RequisitionsPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Requisition | null>(null);
  const [creating, setCreating] = useState(false);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Requisitions</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Purchase requisitions — the start of the spend pipeline.</p>
          </div>
          <Can permission={P.PROC_CREATE_REQUISITION}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New requisition</Button>
          </Can>
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
      <CreateRequisitionModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </ProcurementShell>
  );
}

function CreateRequisitionModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [neededBy, setNeededBy] = useState("");
  const [justification, setJustification] = useState("");
  const [lines, setLines] = useState<DocLine[]>([emptyLine()]);
  const [create, { isLoading }] = useCreateRequisitionMutation();

  // Requisition lines use estimated_unit_price (not unit_price).
  const apiLines = lines
    .filter((l) => l.account && (l.unitPriceKobo > 0 || l.description.trim()))
    .map((l) => ({ description: l.description, quantity: l.quantity || 1, estimated_unit_price: l.unitPriceKobo, expense_account: l.account, ...(l.taxCode ? { tax_code: l.taxCode } : {}) }));

  const submit = async () => {
    try {
      const res = await create({ entity, request_date: requestDate, needed_by: neededBy || undefined, justification: justification.trim() || undefined, lines: apiLines }).unwrap();
      toast.success(res.message || "Requisition created.");
      setNeededBy(""); setJustification(""); setLines([emptyLine()]); onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New requisition"
      description="Capture the request and its lines; submit it afterwards for approval." onSubmit={submit}
      loading={isLoading} canSubmit={!!requestDate && apiLines.length > 0} widthClass="sm:max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Request date" required><Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Needed by"><Input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className="bg-white" /></FormField>
      </div>
      <FormField label="Justification"><Input value={justification} onChange={(e) => setJustification(e.target.value)} className="bg-white" /></FormField>
      <div className="pt-1">
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
        <LineEditor entity={entity} lines={lines} onChange={setLines} accountLabel="Expense account" accountType="EXPENSE" currency={currency} showCostCenter={false} />
      </div>
    </FormModal>
  );
}
