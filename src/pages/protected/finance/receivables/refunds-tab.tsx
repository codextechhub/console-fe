// Receivables → Refunds. List + post action (finance.refund.post).
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, Money, StatusPill, ConfirmActionModal, type Column } from "@/components/finance-ui";
import { useGetRefundsQuery, usePostRefundMutation } from "@/redux/services/finance/ar-api";
import type { Refund } from "@/redux/services/finance/ar-types";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";

export function RefundsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetRefundsQuery({ entity, page });
  const [post, { isLoading: posting }] = usePostRefundMutation();
  const { can } = useCan();
  const [toPost, setToPost] = useState<Refund | null>(null);

  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const doPost = async () => {
    if (!toPost) return;
    try {
      const res = await post({ id: toPost.id, entity }).unwrap();
      toast.success(res.message || "Refund posted.");
      setToPost(null);
    } catch { /* central */ }
  };

  const columns: Column<Refund>[] = [
    { header: "Document", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Customer", cell: (r) => <span>{r.customer_name}<span className="ml-1 text-gray-05">{r.customer_code}</span></span> },
    { header: "Date", cell: (r) => r.refund_date },
    { header: "Method", cell: (r) => r.method },
    { header: "Amount", align: "right", cell: (r) => <Money kobo={r.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    {
      header: "", cell: (r) =>
        can(P.FIN_POST_REFUND) && r.status === "DRAFT" ? (
          <button onClick={(e) => { e.stopPropagation(); setToPost(r); }} className="font-mont text-xs font-semibold text-primary hover:underline">Post</button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No refunds" emptyMessage="Customer refunds will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
      />
      <ConfirmActionModal
        open={!!toPost} onOpenChange={(o) => !o && setToPost(null)}
        title="Post this refund?"
        description={`Posting ${toPost?.document_number} books the refund journal.`}
        confirmText="Post" loading={posting} onConfirm={doPost}
      />
    </>
  );
}
