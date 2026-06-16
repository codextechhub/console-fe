// Receivables → Concessions (discounts / waivers / scholarships). List + create
// + post action (finance.concession.post).
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  DataTable, Money, StatusPill, ActionButton, FormModal, FormField, MoneyInput, AccountPicker, CustomerPicker, type Column,
} from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetConcessionsQuery, useCreateConcessionMutation, usePostConcessionMutation } from "@/redux/services/finance/ar-api";
import type { Concession } from "@/redux/services/finance/ar-types";

export function ConcessionsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetConcessionsQuery({ entity, page });
  const [post] = usePostConcessionMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<Concession>[] = [
    { header: "Document", cell: (c) => <span className="font-semibold">{c.document_number}</span> },
    { header: "Kind", cell: (c) => c.kind },
    { header: "Customer", cell: (c) => <span>{c.customer_name}<span className="ml-1 text-gray-05">{c.customer_code}</span></span> },
    { header: "Invoice", cell: (c) => c.invoice_number ?? "—" },
    { header: "Date", cell: (c) => c.concession_date },
    { header: "Amount", align: "right", cell: (c) => <Money kobo={c.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (c) => <StatusPill status={c.status} /> },
    {
      header: "", cell: (c) =>
        c.status === "DRAFT" ? (
          <ActionButton asLink label="Post" permission={P.FIN_POST_CONCESSION} title="Post concession?"
            description={`Posts ${c.document_number} (Dr discounts & allowances, Cr AR).`}
            onConfirm={async () => { const r = await post({ id: c.id, entity }).unwrap(); toast.success(r.message || "Posted."); }} />
        ) : null,
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.FIN_CREATE_CONCESSION}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New concession</Button></Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(c) => c.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No concessions" emptyMessage="Discounts, waivers and scholarships will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      <CreateModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function CreateModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [customer, setCustomer] = useState("");
  const [invoice, setInvoice] = useState("");
  const [kind, setKind] = useState("DISCOUNT");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(0);
  const [allowance, setAllowance] = useState("");
  const [reason, setReason] = useState("");
  const [create, { isLoading }] = useCreateConcessionMutation();
  const submit = async () => {
    try {
      const r = await create({ entity, customer: customer.trim().toUpperCase(), invoice: invoice.trim() || undefined, kind, concession_date: date, amount, allowance_account: allowance || undefined, reason: reason.trim() || undefined }).unwrap();
      toast.success(r.message || "Concession created.");
      setCustomer(""); setInvoice(""); setAmount(0); setAllowance(""); setReason(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New concession"
      description="Customer/invoice resolved by code. Post it afterwards to book it." onSubmit={submit}
      loading={isLoading} canSubmit={!!customer.trim() && amount > 0}>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Customer" required><CustomerPicker entity={entity} value={customer} onChange={setCustomer} /></FormField>
        <FormField label="Invoice"><Input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="Optional" className="bg-white font-mont" /></FormField>
        <FormField label="Kind">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            {["DISCOUNT", "WAIVER", "SCHOLARSHIP"].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></FormField>
      </div>
      <FormField label="Allowance account"><AccountPicker entity={entity} value={allowance} onChange={setAllowance} accountType="INCOME" /></FormField>
      <FormField label="Reason"><Input value={reason} onChange={(e) => setReason(e.target.value)} className="bg-white" /></FormField>
    </FormModal>
  );
}
