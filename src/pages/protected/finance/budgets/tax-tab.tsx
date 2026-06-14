// Budgets, Assets & Tax → Tax. Obligations + filings; create obligation, prepare
// filing, file + pay (VAT/PAYE/WHT).
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, Money, StatusPill, ActionButton, FormModal, FormField, AccountPicker, TaxObligationPicker, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import {
  useGetTaxFilingsQuery, useFileTaxFilingMutation, usePayTaxFilingMutation,
  useCreateTaxObligationMutation, useCreateTaxFilingMutation,
} from "@/redux/services/finance/ops-api";
import type { TaxFiling } from "@/redux/services/finance/ops-types";

export function TaxTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const [newObligation, setNewObligation] = useState(false);
  const [newFiling, setNewFiling] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetTaxFilingsQuery({ entity, page });
  const [file] = useFileTaxFilingMutation();
  const [pay] = usePayTaxFilingMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<TaxFiling>[] = [
    { header: "Filing", cell: (t) => <span className="font-semibold">{t.document_number}</span> },
    { header: "Obligation", cell: (t) => <span>{t.obligation_code}<span className="ml-1 text-gray-05">{t.obligation_type}</span></span> },
    { header: "Period", cell: (t) => `${t.period_start} → ${t.period_end}` },
    { header: "Due", align: "right", cell: (t) => <Money kobo={t.amount_due} currency={currency} align="right" /> },
    { header: "Balance", align: "right", cell: (t) => <Money kobo={t.balance_due} currency={currency} align="right" /> },
    { header: "Filing", cell: (t) => <StatusPill status={t.filing_status} /> },
    { header: "Payment", cell: (t) => <StatusPill status={t.payment_status} /> },
    {
      header: "", cell: (t) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {t.filing_status !== "FILED" && (
            <ActionButton asLink label="File" permission={P.FIN_FILE_TAX} title="File this return?"
              description={`Files ${t.document_number} with ${t.authority_name}.`}
              onConfirm={async () => { const r = await file({ id: t.id, entity }).unwrap(); toast.success(r.message || "Filed."); }} />
          )}
          {t.payment_status !== "PAID" && (
            <ActionButton asLink label="Pay" permission={P.FIN_PAY_TAX} title="Pay this filing?"
              description={`Pays the balance due on ${t.document_number}.`}
              onConfirm={async () => { const r = await pay({ id: t.id, entity }).unwrap(); toast.success(r.message || "Paid."); }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Can permission={P.FIN_VIEW_TAX}>
          <Button variant="outline" onClick={() => setNewObligation(true)} className="gap-1.5"><Plus className="size-4" /> New obligation</Button>
          <Button onClick={() => setNewFiling(true)} className="gap-1.5"><Plus className="size-4" /> New filing</Button>
        </Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(t) => t.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No tax filings" emptyMessage="VAT/PAYE/WHT filings will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      <CreateObligationModal open={newObligation} onClose={() => setNewObligation(false)} entity={entity} />
      <CreateFilingModal open={newFiling} onClose={() => setNewFiling(false)} entity={entity} />
    </>
  );
}

function CreateObligationModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("VAT");
  const [liability, setLiability] = useState("");
  const [authority, setAuthority] = useState("");
  const [create, { isLoading }] = useCreateTaxObligationMutation();
  const submit = async () => {
    try {
      const res = await create({ entity, code: code.trim(), name: name.trim() || undefined, obligation_type: type, liability_account: liability, authority_name: authority.trim() || undefined }).unwrap();
      toast.success(res.message || "Obligation created.");
      setCode(""); setName(""); setLiability(""); setAuthority(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New tax obligation"
      description="Defines a recurring tax (VAT, PAYE, WHT…) and its liability account." onSubmit={submit} loading={isLoading} canSubmit={!!code.trim() && !!type && !!liability}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} className="bg-white font-mont" /></FormField>
        <FormField label="Type" required>
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            {["VAT", "PAYE", "WHT", "OTHER"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
      <FormField label="Liability account" required><AccountPicker entity={entity} value={liability} onChange={setLiability} postableOnly accountType="LIABILITY" /></FormField>
      <FormField label="Authority"><Input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="FIRS, LIRS…" className="bg-white" /></FormField>
    </FormModal>
  );
}

function CreateFilingModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [obligation, setObligation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [due, setDue] = useState("");
  const [create, { isLoading }] = useCreateTaxFilingMutation();
  const submit = async () => {
    try {
      const res = await create({ entity, obligation: Number(obligation), period_start: start, period_end: end, due_date: due || undefined }).unwrap();
      toast.success(res.message || "Filing prepared.");
      setObligation(""); setStart(""); setEnd(""); setDue(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="Prepare tax filing"
      description="Prepares a filing for an obligation over a period; the amount is computed from the ledger." onSubmit={submit} loading={isLoading} canSubmit={!!obligation && !!start && !!end}>
      <FormField label="Obligation" required><TaxObligationPicker entity={entity} value={obligation} onChange={setObligation} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Period start" required><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Period end" required><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-white" /></FormField>
      </div>
      <FormField label="Due date"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="bg-white" /></FormField>
    </FormModal>
  );
}
