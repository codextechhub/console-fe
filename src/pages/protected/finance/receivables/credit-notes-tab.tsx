// Receivables → Credit / Debit Notes. Rebuilt to the Vision-Finance-Board
// prototype in the house theme: a filter-dropdown list (no KPIs), a single-panel
// detail drawer that recaps the REAL journal, and an "Issue note" drawer whose
// live posting preview mirrors what will post.
//
// Honest adaptations vs the mockup:
//   • our credit/debit note is line-based and requires a GL account, so the
//     single-amount form carries an explicit Revenue/Income account picker and
//     submits one line under the hood;
//   • a debit note increases the receivable and cannot be allocated, so
//     "Apply to balance" shows only for credit notes with credit still unapplied;
//   • "Issue note" = create then post with auto_allocate:false, so it lands
//     "Issued"; applying is the explicit second step (Issued → Apply → Applied).
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Printer, Check } from "lucide-react";
import {
  DataTable, Money, MoneyInput, ConfirmActionModal, DetailDrawer, FormField,
  JournalTable, CustomerPicker, AccountPicker, toArray,
  type Column, type JournalLineView,
} from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/custom/search-select";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetCreditNotesQuery, useCreateCreditNoteMutation, usePostCreditNoteMutation,
  useAllocateCreditNoteMutation, useGetInvoicesQuery,
} from "@/redux/services/finance/ar-api";
import type { CreditNote } from "@/redux/services/finance/ar-types";

const todayISO = new Date().toISOString().slice(0, 10);
const kindLabel = (k: string) => (k === "DEBIT" ? "Debit note" : "Credit note");

// Posted credit note fully applied → "Applied"; otherwise "Issued". Debit notes
// can't be allocated, so a posted debit note is always "Issued". Unposted → "Draft".
function noteStatus(n: CreditNote): "DRAFT" | "ISSUED" | "APPLIED" {
  if (n.status !== "POSTED") return "DRAFT";
  if (n.kind === "CREDIT" && n.allocated_amount > 0 && n.unallocated_amount <= 0) return "APPLIED";
  return "ISSUED";
}
const STATUS_PILL: Record<string, string> = {
  DRAFT: "bg-gray-03/60 text-gray-05",
  ISSUED: "bg-blue-50 text-blue-700",
  APPLIED: "bg-green-01/10 text-green-01",
};
const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", ISSUED: "Issued", APPLIED: "Applied" };

function TypeChip({ kind }: { kind: string }) {
  const debit = kind === "DEBIT";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 font-mont text-[11px] font-semibold",
      debit ? "bg-amber-50 text-amber-700" : "bg-green-01/10 text-green-01")}>
      {kindLabel(kind)}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const init = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pry-01 font-mont text-[10px] font-semibold text-primary">{init || "—"}</span>;
}

// Recap the journal a posted note raises — credit: Dr revenue/returns (+ output
// tax), Cr AR; debit: Dr AR, Cr revenue (+ tax). Built from the note's own lines
// so it shows the real revenue accounts, never a fabricated posting.
function noteJournalLines(n: CreditNote): JournalLineView[] {
  const debit = n.kind === "DEBIT";
  const rev: JournalLineView[] = [];
  const lines = n.lines.length
    ? n.lines
    : [{ revenue_account: "—", description: n.reason, net_amount: n.total, tax_amount: 0 } as CreditNote["lines"][number]];
  for (const l of lines) {
    rev.push({
      account_code: l.revenue_account || "—",
      account_name: debit ? "Revenue" : "Revenue / returns",
      description: l.description || n.reason || null,
      debit: debit ? 0 : l.net_amount,
      credit: debit ? l.net_amount : 0,
    });
    if (l.tax_amount) {
      rev.push({
        account_code: "TAX",
        account_name: debit ? "Output tax" : "Output tax reversal",
        description: null,
        debit: debit ? 0 : l.tax_amount,
        credit: debit ? l.tax_amount : 0,
      });
    }
  }
  const ar: JournalLineView = {
    account_code: "AR", account_name: "Accounts Receivable (control)",
    description: n.customer_code,
    debit: debit ? n.total : 0, credit: debit ? 0 : n.total,
  };
  return debit ? [ar, ...rev] : [...rev, ar];
}

export function CreditNotesTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [typeFilter, setTypeFilter] = useState("");   // "" | CREDIT | DEBIT
  const [statusFilter, setStatusFilter] = useState(""); // "" | ISSUED | APPLIED
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<CreditNote | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetCreditNotesQuery({ entity });
  const all = useMemo(() => toArray(data?.data), [data]);
  const rows = useMemo(() => all.filter((n) =>
    (!typeFilter || n.kind === typeFilter) && (!statusFilter || noteStatus(n) === statusFilter),
  ), [all, typeFilter, statusFilter]);

  const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01";

  const columns: Column<CreditNote>[] = [
    { header: "Note no.", cell: (r) => <span className="font-mont font-semibold text-black-01">{r.document_number}</span> },
    { header: "Type", cell: (r) => <TypeChip kind={r.kind} /> },
    { header: "Date", cell: (r) => <span className="font-mont text-sm text-gray-01">{r.note_date}</span> },
    { header: "Customer", cell: (r) => (
      <span className="flex items-center gap-2"><Initials name={r.customer_name} /><span className="font-mont text-sm text-gray-01">{r.customer_name}</span></span>
    ) },
    { header: "Against invoice", cell: (r) => <span className="font-mont text-xs text-gray-05">{r.invoice_number ?? "—"}</span> },
    { header: "Reason", cell: (r) => <span className="block max-w-[240px] truncate font-mont text-sm text-gray-01" title={r.reason}>{r.reason || "—"}</span> },
    { header: "Amount", align: "right", cell: (r) => <Money kobo={r.total} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => {
      const s = noteStatus(r);
      return <span className={cn("inline-flex rounded-full px-2 py-0.5 font-mont text-[11px] font-semibold", STATUS_PILL[s])}>{STATUS_LABEL[s]}</span>;
    } },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
            <option value="">All notes</option>
            <option value="CREDIT">Credit notes</option>
            <option value="DEBIT">Debit notes</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">All status</option>
            <option value="ISSUED">Issued</option>
            <option value="APPLIED">Applied</option>
          </select>
        </div>
        <Can permission={P.FIN_CREATE_CREDIT_NOTE}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> Issue note</Button>
        </Can>
      </div>

      <DataTable
        columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        emptyTitle="No credit / debit notes"
        emptyMessage="Issue a credit note to reduce — or a debit note to increase — a customer's balance."
      />

      <NoteDetailDrawer note={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
      <IssueNoteDrawer open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function NoteDetailDrawer({ note, entity, currency, onClose }: {
  note: CreditNote | null; entity: string; currency?: string | null; onClose: () => void;
}) {
  const { can } = useCan();
  const [confirmApply, setConfirmApply] = useState(false);
  const [allocate, { isLoading: applying }] = useAllocateCreditNoteMutation();

  if (!note) return null;
  const status = noteStatus(note);
  const canApply =
    can(P.FIN_ALLOCATE_CREDIT_NOTE) && note.kind === "CREDIT" && status === "ISSUED" && note.unallocated_amount > 0;

  const doApply = async () => {
    try {
      const body = note.invoice_id
        ? { id: note.id, entity, allocations: [{ invoice: note.invoice_id, amount: note.unallocated_amount }] }
        : { id: note.id, entity, auto_allocate: true };
      const res = await allocate(body).unwrap();
      toast.success(res.message || "Credit applied to the customer's balance.");
      setConfirmApply(false);
      onClose();
    } catch { /* central */ }
  };

  return (
    <>
      <DetailDrawer
        open={!!note} onOpenChange={(o) => (o ? undefined : onClose())}
        title={note.document_number}
        description={`${kindLabel(note.kind)} · ${note.customer_name}`}
        widthClass="sm:max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="size-4" /> Print</Button>
            {canApply ? (
              <Button onClick={() => setConfirmApply(true)} className="gap-1.5"><Check className="size-4" /> Apply to balance</Button>
            ) : null}
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount"><Money kobo={note.total} currency={currency} /></Field>
            <Field label="Status"><span className={cn("inline-flex rounded-full px-2 py-0.5 font-mont text-[11px] font-semibold", STATUS_PILL[status])}>{STATUS_LABEL[status]}</span></Field>
            <Field label="Against invoice"><span className="font-mont text-sm text-gray-01">{note.invoice_number ?? "—"}</span></Field>
            <Field label="Date"><span className="font-mont text-sm text-gray-01">{note.note_date}</span></Field>
          </div>
          <Field label="Reason"><span className="font-mont text-sm text-gray-01">{note.reason || "—"}</span></Field>

          {note.kind === "CREDIT" && note.allocated_amount > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Applied"><Money kobo={note.allocated_amount} currency={currency} /></Field>
              <Field label="Unapplied"><Money kobo={note.unallocated_amount} currency={currency} /></Field>
            </div>
          ) : null}

          {status !== "DRAFT" ? (
            <div>
              <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">GL posting</p>
              <JournalTable lines={noteJournalLines(note)} currency={currency} />
              <p className="mt-2 font-mont text-[11px] text-gray-05">
                Recaps the journal already booked when this note was posted — applying it to the balance is a sub-ledger act with no further GL posting.
              </p>
            </div>
          ) : null}
        </div>
      </DetailDrawer>

      <ConfirmActionModal
        open={confirmApply} onOpenChange={(o) => !o && setConfirmApply(false)}
        title="Apply this credit to the customer's balance?"
        description={note.invoice_id
          ? `Applies ${formatMoney(note.unallocated_amount, currency)} of credit against ${note.invoice_number}.`
          : `Applies ${formatMoney(note.unallocated_amount, currency)} of credit to the customer's open invoices, oldest first.`}
        confirmText="Apply" loading={applying} onConfirm={doApply}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mont text-[11px] uppercase tracking-wide text-gray-05">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function IssueNoteDrawer({ open, onClose, entity, currency }: {
  open: boolean; onClose: () => void; entity: string; currency?: string | null;
}) {
  const [kind, setKind] = useState("CREDIT");
  const [date, setDate] = useState(todayISO);
  const [customer, setCustomer] = useState("");
  const [account, setAccount] = useState("");
  const [invoice, setInvoice] = useState(""); // invoice id, optional
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  const [create, { isLoading: creating }] = useCreateCreditNoteMutation();
  const [post, { isLoading: posting }] = usePostCreditNoteMutation();
  const saving = creating || posting;

  // Posted invoices for the chosen customer, as optional "against invoice" targets.
  const invQ = useGetInvoicesQuery({ entity, search: customer, status: "POSTED" }, { skip: !customer });
  const invoiceOptions = useMemo(() =>
    toArray(invQ.data?.data)
      .filter((i) => i.customer_code === customer)
      .map((i) => ({ value: String(i.id), label: `${i.document_number} · ${formatMoney(i.balance_due, currency)} due` })),
  [invQ.data, customer, currency]);

  const debit = kind === "DEBIT";
  const previewLines: JournalLineView[] = useMemo(() => {
    const rev: JournalLineView = {
      account_code: account || "—",
      account_name: debit ? "Income" : "Revenue (reversed)",
      description: reason || null,
      debit: debit ? 0 : amount, credit: debit ? amount : 0,
    };
    const ar: JournalLineView = {
      account_code: "AR", account_name: "Accounts Receivable (control)",
      description: customer || null,
      debit: debit ? amount : 0, credit: debit ? 0 : amount,
    };
    return debit ? [ar, rev] : [rev, ar];
  }, [debit, account, amount, reason, customer]);

  const canSubmit = !!customer && !!account && amount > 0 && reason.trim() !== "";

  const reset = () => { setKind("CREDIT"); setDate(todayISO); setCustomer(""); setAccount(""); setInvoice(""); setAmount(0); setReason(""); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    try {
      const res = await create({
        entity, customer: customer.trim().toUpperCase(), kind, note_date: date,
        invoice: invoice ? Number(invoice) : undefined, reason: reason.trim(),
        lines: [{ revenue_account: account, description: reason.trim(), quantity: 1, unit_price: amount }],
      }).unwrap();
      // Post immediately, without auto-allocation, so it lands as "Issued".
      await post({ id: res.data.id, entity, auto_allocate: false }).unwrap();
      toast.success(`${kindLabel(kind)} issued.`);
      close();
    } catch { /* central — a create that posts-failed leaves a draft, surfaced as the error */ }
  };

  return (
    <DetailDrawer
      open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="Issue credit / debit note"
      description="Reduce (credit) or increase (debit) the customer balance."
      footer={
        <>
          <Button variant="outline" disabled={saving} onClick={close}>Cancel</Button>
          <Button disabled={saving || !canSubmit} onClick={submit} className="gap-1.5">
            <Plus className="size-4" />{saving ? "Issuing…" : "Issue note"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Note type">
          <div className="inline-flex rounded-md border border-gray-03 bg-white p-0.5">
            {[["CREDIT", "Credit note"], ["DEBIT", "Debit note"]].map(([v, lbl]) => (
              <button key={v} type="button" onClick={() => setKind(v)}
                className={cn("rounded px-3 py-1.5 font-mont text-sm font-medium transition-colors",
                  kind === v ? "bg-pry-01 text-primary" : "text-gray-05 hover:text-gray-01")}>
                {lbl}
              </button>
            ))}
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></FormField>
          <FormField label="Customer" required><CustomerPicker entity={entity} value={customer} onChange={(v) => { setCustomer(v); setInvoice(""); }} /></FormField>
        </div>

        <FormField label={debit ? "Income account" : "Revenue account"} required>
          <AccountPicker entity={entity} value={account} onChange={setAccount} accountType="INCOME" postableOnly
            placeholder={debit ? "Account to credit" : "Revenue account to reverse"} />
        </FormField>

        <FormField label="Against invoice">
          <SearchSelect options={invoiceOptions} value={invoice} onChange={(e) => setInvoice(e.target.value)}
            loading={invQ.isFetching} disabled={!customer}
            placeholder={customer ? "Optional" : "Select a customer first"} revealOnSearch />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></FormField>
        </div>

        <FormField label="Reason" required><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this adjustment?" className="bg-white" /></FormField>

        <div className="rounded-md border border-gray-03 bg-gray-06/40 p-3">
          <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">{kindLabel(kind)} posting</p>
          <JournalTable lines={previewLines} currency={currency} />
          <p className="mt-2 font-mont text-[11px] text-gray-05">
            {debit
              ? "A debit note raises an additional charge and increases the customer's balance."
              : "A credit note lowers the customer's balance and reverses recognised revenue."}
          </p>
        </div>
      </div>
    </DetailDrawer>
  );
}
