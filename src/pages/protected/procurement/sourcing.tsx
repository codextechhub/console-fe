// Sourcing (§7.3) — RFQs and vendor quotations. Award a quotation to spawn a PO.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import {
  DataTable, Money, StatusPill, TabBar, ActionButton, FormModal, FormField,
  LineEditor, emptyLine, toApiLines, type DocLine, useActiveEntity, type Column,
} from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import {
  useGetRfqsQuery, useIssueRfqMutation, useCreateRfqMutation,
  useGetQuotationsQuery, useSubmitQuotationMutation, useAwardQuotationMutation, useCreateQuotationMutation,
} from "@/redux/services/procurement/procurement-ext-api";
import type { Quotation, Rfq } from "@/redux/services/procurement/procurement-types";
import { RfqPicker, VendorPicker } from "./pickers";

function RfqTab({ entity }: { entity: string }) {
  const { data, isLoading, isError, refetch } = useGetRfqsQuery({ entity });
  const [issue] = useIssueRfqMutation();
  const [creating, setCreating] = useState(false);
  const columns: Column<Rfq>[] = [
    { header: "RFQ", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Title", cell: (r) => r.title },
    { header: "Issued", cell: (r) => r.issue_date ?? "—" },
    { header: "Due", cell: (r) => r.response_due_date ?? "—" },
    { header: "Status", cell: (r) => <StatusPill status={r.rfq_status} /> },
    {
      header: "", cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          {r.rfq_status === "DRAFT" && (
            <ActionButton asLink label="Issue" permission={P.PROC_ISSUE_RFQ} title="Issue RFQ?"
              description={`Sends ${r.document_number} to vendors for quotation.`}
              onConfirm={async () => { const res = await issue({ id: r.id, entity }).unwrap(); toast.success(res.message || "Issued."); }} />
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Can permission={P.PROC_CREATE_RFQ}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New RFQ</Button></Can></div>
      <DataTable columns={columns} rows={data?.data ?? []} rowKey={(r) => r.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No RFQs" />
      <CreateRfqModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </>
  );
}

function CreateRfqModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [lines, setLines] = useState<DocLine[]>([emptyLine()]);
  const [create, { isLoading }] = useCreateRfqMutation();
  // RFQ lines: description + quantity + optional expense_account/tax_code (no price).
  const apiLines = lines.filter((l) => l.description.trim() || l.account)
    .map((l) => ({ description: l.description, quantity: l.quantity || 1, ...(l.account ? { expense_account: l.account } : {}), ...(l.taxCode ? { tax_code: l.taxCode } : {}) }));
  const submit = async () => {
    try {
      const r = await create({ entity, title: title.trim() || undefined, issue_date: issueDate, response_due_date: dueDate || undefined, lines: apiLines }).unwrap();
      toast.success(r.message || "RFQ created.");
      setTitle(""); setDueDate(""); setLines([emptyLine()]); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New RFQ"
      description="Request quotations from vendors. Issue it afterwards to send." onSubmit={submit}
      loading={isLoading} canSubmit={!!issueDate && apiLines.length > 0} widthClass="sm:max-w-2xl">
      <FormField label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Issue date" required><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Response due"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="pt-1">
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
        <LineEditor entity={entity} lines={lines} onChange={setLines} accountLabel="Expense account" accountType="EXPENSE" showCostCenter={false} />
      </div>
    </FormModal>
  );
}

function QuotationsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetQuotationsQuery({ entity });
  const [submit] = useSubmitQuotationMutation();
  const [award] = useAwardQuotationMutation();
  const [creating, setCreating] = useState(false);
  const columns: Column<Quotation>[] = [
    { header: "Quotation", cell: (q) => <span className="font-semibold">{q.document_number}</span> },
    { header: "Vendor", cell: (q) => q.vendor_code },
    { header: "RFQ", cell: (q) => q.rfq_number },
    { header: "Total", align: "right", cell: (q) => <Money kobo={q.total} currency={currency} align="right" /> },
    { header: "Status", cell: (q) => <StatusPill status={q.quotation_status} /> },
    {
      header: "", cell: (q) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {q.quotation_status === "DRAFT" && (
            <ActionButton asLink label="Submit" permission={P.PROC_SUBMIT_QUOTATION} title="Submit quotation?"
              description={`Records ${q.document_number} as received.`}
              onConfirm={async () => { const res = await submit({ id: q.id, entity }).unwrap(); toast.success(res.message || "Submitted."); }} />
          )}
          {q.quotation_status === "SUBMITTED" && !q.awarded_po_id && (
            <ActionButton asLink label="Award" permission={P.PROC_AWARD_QUOTATION} title="Award quotation?"
              description={`Awards ${q.document_number} and spawns a purchase order.`}
              onConfirm={async () => { const res = await award({ id: q.id, entity }).unwrap(); toast.success(res.message || "Awarded."); }} />
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Can permission={P.PROC_CREATE_QUOTATION}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New quotation</Button></Can></div>
      <DataTable columns={columns} rows={data?.data ?? []} rowKey={(q) => q.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No quotations" />
      <CreateQuotationModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function CreateQuotationModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [rfq, setRfq] = useState("");
  const [vendor, setVendor] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<DocLine[]>([emptyLine()]);
  const [create, { isLoading }] = useCreateQuotationMutation();
  const apiLines = toApiLines(lines, "expense_account");
  const submit = async () => {
    try {
      const r = await create({ entity, rfq: Number(rfq), vendor, quote_date: quoteDate, valid_until: validUntil || undefined, reference: reference.trim() || undefined, lines: apiLines }).unwrap();
      toast.success(r.message || "Quotation created.");
      setRfq(""); setVendor(""); setValidUntil(""); setReference(""); setLines([emptyLine()]); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New quotation"
      description="A vendor's response to an RFQ. Award it later to spawn a PO." onSubmit={submit}
      loading={isLoading} canSubmit={!!rfq && !!vendor && !!quoteDate && apiLines.length > 0} widthClass="sm:max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="RFQ" required><RfqPicker entity={entity} value={rfq} onChange={setRfq} /></FormField>
        <FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Quote date" required><Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Valid until"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="pt-1">
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
        <LineEditor entity={entity} lines={lines} onChange={setLines} accountLabel="Expense account" accountType="EXPENSE" currency={currency} showCostCenter={false} />
      </div>
    </FormModal>
  );
}

export default function SourcingPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const tabs = [
    can(P.PROC_VIEW_RFQS) && { key: "rfqs", label: "RFQs" },
    can(P.PROC_VIEW_QUOTATIONS) && { key: "quotations", label: "Quotations" },
  ].filter(Boolean) as { key: string; label: string }[];
  const [active, setActive] = useState(tabs[0]?.key ?? "rfqs");

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Sourcing</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">RFQs and vendor quotations. Awarding a quotation spawns a PO.</p>
        </div>
        {!entity ? <EmptyState title="Select an entity" /> : tabs.length === 0 ? <EmptyState title="No access" /> : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "rfqs" && <RfqTab entity={entity} />}
            {active === "quotations" && <QuotationsTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </ProcurementShell>
  );
}
