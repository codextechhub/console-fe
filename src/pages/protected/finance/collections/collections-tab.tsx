// Collections (§6.4) — gateway cash-in. Initiate returns a checkout_url; Verify
// polls the PSP and books the receipt when settled. No "record receipt" form.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus } from "lucide-react";
import { DataTable, Money, StatusPill, MoneyInput, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { P } from "@/permissions";
import { useGetCollectionsQuery, useInitiateCollectionMutation, useVerifyCollectionMutation } from "@/redux/services/payments/payments-api";
import type { Collection } from "@/redux/services/payments/payments-types";

const selectCls = "h-10 rounded-md border bg-white px-3 font-mont text-sm focus:border-primary focus:outline-none";

export function CollectionsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [initiating, setInitiating] = useState(false);

  const params = useMemo(() => ({ entity, page, ...(status ? { status } : {}) }), [entity, page, status]);
  const { data, isLoading, isFetching, isError, refetch } = useGetCollectionsQuery(params);
  const [verify, { isLoading: verifying }] = useVerifyCollectionMutation();

  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const doVerify = async (c: Collection) => {
    try {
      const res = await verify({ id: c.id, entity }).unwrap();
      toast.success(res.message || "Collection verified.");
    } catch { /* central */ }
  };

  const columns: Column<Collection>[] = [
    { header: "Reference", cell: (c) => <span className="font-semibold">{c.reference}</span> },
    { header: "Provider", cell: (c) => <span className="capitalize">{c.provider}</span> },
    { header: "Payer", cell: (c) => c.payer_name || c.payer_email || "—" },
    { header: "Amount", align: "right", cell: (c) => <Money kobo={c.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (c) => <StatusPill status={c.status} /> },
    {
      header: "", cell: (c) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {c.checkout_url && (
            <a href={c.checkout_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mont text-xs font-semibold text-primary hover:underline">
              Checkout <ExternalLink className="size-3" />
            </a>
          )}
          {(c.status === "PENDING" || c.status === "PROCESSING") && (
            <button onClick={() => doVerify(c)} disabled={verifying} className="font-mont text-xs font-semibold text-primary hover:underline disabled:opacity-50">Verify</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls} aria-label="Status">
          <option value="">All statuses</option>
          {["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "ABANDONED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Can permission={P.PAY_CREATE_COLLECTION}>
          <Button onClick={() => setInitiating(true)} className="gap-1.5"><Plus className="size-4" /> Initiate collection</Button>
        </Can>
      </div>

      <DataTable
        columns={columns} rows={rows} rowKey={(c) => c.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No collections" emptyMessage="Initiated gateway collections will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
      />

      <InitiateModal open={initiating} onClose={() => setInitiating(false)} entity={entity} currency={currency} />
    </>
  );
}

function InitiateModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [amount, setAmount] = useState(0);
  const [customer, setCustomer] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerName, setPayerName] = useState("");
  const [narration, setNarration] = useState("");
  const [initiate, { isLoading }] = useInitiateCollectionMutation();

  const submit = async () => {
    try {
      const res = await initiate({
        entity, amount,
        customer: customer.trim() || undefined,
        payer_email: payerEmail.trim() || undefined,
        payer_name: payerName.trim() || undefined,
        narration: narration.trim() || undefined,
      }).unwrap();
      const url = res.data?.checkout_url;
      toast.success(res.message || "Collection initiated.");
      if (url) window.open(url, "_blank", "noopener");
      setAmount(0); setCustomer(""); setPayerEmail(""); setPayerName(""); setNarration("");
      onClose();
    } catch { /* central */ }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mont text-base font-semibold">Initiate collection</DialogTitle>
          <DialogDescription className="font-mont text-sm text-gray-05">Creates a gateway checkout. The receipt books only once the payment is verified.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="block space-y-1"><span className="font-mont text-xs text-gray-05">Amount</span>
            <MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></label>
          <label className="block space-y-1"><span className="font-mont text-xs text-gray-05">Customer code (optional)</span>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} className="bg-white" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Payer name</span>
              <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} className="bg-white" /></label>
            <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Payer email</span>
              <Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} className="bg-white" /></label>
          </div>
          <label className="block space-y-1"><span className="font-mont text-xs text-gray-05">Narration</span>
            <Input value={narration} onChange={(e) => setNarration(e.target.value)} className="bg-white" /></label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
          <Button disabled={isLoading || amount <= 0} onClick={submit}>{isLoading ? "Initiating…" : "Initiate"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
