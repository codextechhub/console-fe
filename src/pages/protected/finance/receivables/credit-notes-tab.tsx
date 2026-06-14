// Receivables → Credit & debit notes. List + post action (finance.creditnote.post).
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, Money, StatusPill, ConfirmActionModal, type Column } from "@/components/finance-ui";
import { useGetCreditNotesQuery, usePostCreditNoteMutation } from "@/redux/services/finance/ar-api";
import type { CreditNote } from "@/redux/services/finance/ar-types";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";

export function CreditNotesTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
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
    </>
  );
}
