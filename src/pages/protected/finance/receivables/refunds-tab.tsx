// Receivables → Refunds. List + create + post action (finance.refund.post).
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, Money, StatusPill, ConfirmActionModal, FormModal, FormField, MoneyInput, type Column } from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetRefundsQuery, usePostRefundMutation, useCreateRefundMutation } from "@/redux/services/finance/ar-api";
import type { Refund } from "@/redux/services/finance/ar-types";
import { P } from "@/permissions";

export function RefundsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
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
      <div className="mb-4 flex justify-end">
        <Can permission={P.FIN_CREATE_REFUND}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New refund</Button>
        </Can>
      </div>
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
      <CreateRefundModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function CreateRefundModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState("");
  const [create, { isLoading }] = useCreateRefundMutation();

  const submit = async () => {
    try {
      const res = await create({ entity, customer: customer.trim().toUpperCase(), refund_date: date, method, amount, reference: reference.trim() || undefined }).unwrap();
      toast.success(res.message || "Refund created.");
      setCustomer(""); setAmount(0); setReference(""); onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New refund"
      description="Customer is resolved by code. Post it afterwards to book the journal." onSubmit={submit}
      loading={isLoading} canSubmit={!!customer.trim() && amount > 0}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Customer code" required><Input value={customer} onChange={(e) => setCustomer(e.target.value.toUpperCase())} className="bg-white font-mont" /></FormField>
        <FormField label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            {["BANK_TRANSFER", "CASH", "CARD", "CHEQUE"].map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
          </select>
        </FormField>
        <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></FormField>
      </div>
      <FormField label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white" /></FormField>
    </FormModal>
  );
}
