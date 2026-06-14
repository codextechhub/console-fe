// Receivables → Credit & debit notes. List + create + post.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  DataTable, Money, StatusPill, ConfirmActionModal, FormModal, FormField,
  LineEditor, emptyLine, toApiLines, type DocLine, type Column,
} from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCreditNotesQuery, usePostCreditNoteMutation, useCreateCreditNoteMutation } from "@/redux/services/finance/ar-api";
import type { CreditNote } from "@/redux/services/finance/ar-types";
import { P } from "@/permissions";

export function CreditNotesTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetCreditNotesQuery({ entity, page });
  const [post, { isLoading: posting }] = usePostCreditNoteMutation();
  const { can } = useCan();
  const [toPost, setToPost] = useState<CreditNote | null>(null);

  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const doPost = async () => {
    if (!toPost) return;
    try {
      const res = await post({ id: toPost.id, entity }).unwrap();
      toast.success(res.message || "Credit note posted.");
      setToPost(null);
    } catch { /* central */ }
  };

  const columns: Column<CreditNote>[] = [
    { header: "Document", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Kind", cell: (r) => r.kind },
    { header: "Customer", cell: (r) => <span>{r.customer_name}<span className="ml-1 text-gray-05">{r.customer_code}</span></span> },
    { header: "Date", cell: (r) => r.note_date },
    { header: "Total", align: "right", cell: (r) => <Money kobo={r.total} currency={currency} align="right" /> },
    { header: "Unallocated", align: "right", cell: (r) => <Money kobo={r.unallocated_amount} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    {
      header: "", cell: (r) =>
        can(P.FIN_POST_CREDIT_NOTE) && r.status === "DRAFT" ? (
          <button onClick={(e) => { e.stopPropagation(); setToPost(r); }} className="font-mont text-xs font-semibold text-primary hover:underline">Post</button>
        ) : null,
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.FIN_CREATE_CREDIT_NOTE}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New credit note</Button>
        </Can>
      </div>
      <DataTable
        columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No credit notes" emptyMessage="Credit and debit notes will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
      />
      <ConfirmActionModal
        open={!!toPost} onOpenChange={(o) => !o && setToPost(null)}
        title="Post this credit note?"
        description={`Posting ${toPost?.document_number} books its journal and makes it allocatable.`}
        confirmText="Post" loading={posting} onConfirm={doPost}
      />
      <CreateCreditNoteModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function CreateCreditNoteModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [customer, setCustomer] = useState("");
  const [kind, setKind] = useState("CREDIT");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<DocLine[]>([emptyLine()]);
  const [create, { isLoading }] = useCreateCreditNoteMutation();
  const apiLines = toApiLines(lines, "revenue_account");

  const submit = async () => {
    try {
      const res = await create({ entity, customer: customer.trim().toUpperCase(), kind, note_date: date, reason: reason.trim() || undefined, lines: apiLines }).unwrap();
      toast.success(res.message || "Credit note created.");
      setCustomer(""); setReason(""); setLines([emptyLine()]); onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New credit / debit note"
      description="Customer is resolved by code. Post the note afterwards to book it." onSubmit={submit}
      loading={isLoading} canSubmit={!!customer.trim() && apiLines.length > 0} widthClass="sm:max-w-2xl">
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Customer code" required><Input value={customer} onChange={(e) => setCustomer(e.target.value.toUpperCase())} className="bg-white font-mont" /></FormField>
        <FormField label="Kind">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            <option value="CREDIT">Credit (reduces AR)</option>
            <option value="DEBIT">Debit (increases AR)</option>
          </select>
        </FormField>
        <FormField label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></FormField>
      </div>
      <FormField label="Reason"><Input value={reason} onChange={(e) => setReason(e.target.value)} className="bg-white" /></FormField>
      <div className="pt-1">
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
        <LineEditor entity={entity} lines={lines} onChange={setLines} accountLabel="Revenue account" accountType="INCOME" currency={currency} />
      </div>
    </FormModal>
  );
}
