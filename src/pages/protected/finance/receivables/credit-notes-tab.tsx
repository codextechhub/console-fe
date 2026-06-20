// Receivables → Credit / Debit Notes. Rebuilt to the Vision-Finance-Board
// prototype in the house theme: a filter-dropdown list (no KPIs), a single-panel
// detail drawer that recaps the REAL journal as a DR/CR card, and an "Issue note"
// drawer whose live posting preview mirrors what will post.
//
// Honest adaptations vs the mockup:
//   • our credit/debit note is line-based and requires a GL account, so the
//     single-amount form carries an explicit Revenue/Income account picker and
//     submits one line under the hood;
//   • a debit note increases the receivable and cannot be allocated, so
//     "Apply to balance" and the auto-allocate toggle show only for credit notes;
//   • "Issue note" creates then posts — the auto-allocate toggle chooses whether
//     it lands "Issued" (auto_allocate:false) or is applied oldest-first ("Applied").
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Printer, Check } from "lucide-react";
import {
  DataTable, Money, MoneyInput, ConfirmActionModal, DetailDrawer, FormField,
  CustomerPicker, AccountPicker, toArray, type Column,
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
const DRAWER_W = "sm:max-w-3xl";

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

/** Two-button segmented control (note type · apply-on-issue). */
function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: [T, string][];
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-03 bg-white p-0.5">
      {options.map(([v, lbl]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={cn("rounded px-3 py-1.5 font-mont text-sm font-medium transition-colors",
            value === v ? "bg-pry-01 text-primary" : "text-gray-05 hover:text-gray-01")}>
          {lbl}
        </button>
      ))}
    </div>
  );
}

// ── DR/CR posting recap (prototype design) ────────────────────────────────────
type RecapRow = { code: string; name: string; amount: number };

function RecapColumn({ label, totalLabel, rows, currency }: {
  label: string; totalLabel: string; rows: RecapRow[]; currency?: string | null;
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="flex flex-col px-4 py-3">
      <p className="mb-2.5 font-mont text-[10px] font-semibold uppercase tracking-wider text-gray-01">{label}</p>
      <div className="flex-1 space-y-3">
        {rows.map((r, i) => (
          <div key={i}>
            <p className="font-mont text-[13px] text-gray-01">
              <span className="font-semibold text-black-01">{r.code}</span>{r.name ? ` ${r.name}` : ""}
            </p>
            <p className="mt-0.5 font-mont text-sm font-semibold tabular-nums text-black-01">{formatMoney(r.amount, currency)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-03 pt-2.5">
        <span className="font-mont text-[10px] font-semibold uppercase tracking-wider text-gray-01">{totalLabel}</span>
        <span className="font-mont text-sm font-semibold tabular-nums text-black-01">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}

function PostingRecap({ title, dr, cr, currency, helper }: {
  title: string; dr: RecapRow[]; cr: RecapRow[]; currency?: string | null; helper?: string;
}) {
  const totalDr = dr.reduce((s, r) => s + r.amount, 0);
  const totalCr = cr.reduce((s, r) => s + r.amount, 0);
  const balanced = totalDr === totalCr;
  return (
    <div className="overflow-hidden rounded-lg border border-gray-03 bg-white">
      <div className="flex items-center justify-between border-b border-gray-03 bg-gray-03 px-4 py-2.5">
        <p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-01">{title}</p>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mont text-[11px] font-semibold",
          balanced ? "bg-green-01/10 text-green-01" : "bg-amber-50 text-amber-700")}>
          {balanced ? <Check className="size-3" /> : null} Debits = Credits
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-03">
        <RecapColumn label="Debit (DR)" totalLabel="Total Dr" rows={dr} currency={currency} />
        <RecapColumn label="Credit (CR)" totalLabel="Total Cr" rows={cr} currency={currency} />
      </div>
      {helper ? (
        <p className="border-t border-gray-03 bg-gray-03 px-4 py-2.5 font-mont text-[11px] text-gray-05">{helper}</p>
      ) : null}
    </div>
  );
}

// Recap the journal a posted note raises, from the note's own lines (so it shows
// the real revenue accounts) — credit: Dr revenue/returns (+ tax), Cr AR; debit:
// Dr AR, Cr revenue (+ tax).
function noteRecap(n: CreditNote): { dr: RecapRow[]; cr: RecapRow[] } {
  const debit = n.kind === "DEBIT";
  const lines = n.lines.length
    ? n.lines
    : [{ revenue_account: "—", net_amount: n.total, tax_amount: 0 } as CreditNote["lines"][number]];
  const rev: RecapRow[] = [];
  for (const l of lines) {
    rev.push({ code: l.revenue_account || "—", name: debit ? "Revenue" : "Revenue / returns", amount: l.net_amount });
    if (l.tax_amount) rev.push({ code: "TAX", name: debit ? "Output tax" : "Output tax reversal", amount: l.tax_amount });
  }
  const ar: RecapRow = { code: "AR", name: "Accounts Receivable (control)", amount: n.total };
  return debit ? { dr: [ar], cr: rev } : { dr: rev, cr: [ar] };
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
  const recap = noteRecap(note);

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
        widthClass={DRAWER_W}
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
              <PostingRecap
                title={`${kindLabel(note.kind)} posting`} dr={recap.dr} cr={recap.cr} currency={currency}
                helper="Recaps the journal already booked when this note was posted — applying it to the balance is a sub-ledger act with no further GL posting."
              />
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
  const [applyNow, setApplyNow] = useState(false); // credit notes only

  const [create, { isLoading: creating }] = useCreateCreditNoteMutation();
  const [post, { isLoading: posting }] = usePostCreditNoteMutation();
  const saving = creating || posting;
  const debit = kind === "DEBIT";

  // Posted invoices that still owe money, for the chosen customer — a searchable
  // list. A credit note applies against an outstanding balance, so fully-paid /
  // fully-credited invoices (balance_due = 0) are excluded.
  const invQ = useGetInvoicesQuery({ entity, search: customer, status: "POSTED" }, { skip: !customer });
  const invoiceOptions = useMemo(() =>
    toArray(invQ.data?.data)
      .filter((i) => i.customer_code === customer && i.balance_due > 0)
      .map((i) => ({ value: String(i.id), label: `${i.document_number} · ${formatMoney(i.balance_due, currency)} due` })),
  [invQ.data, customer, currency]);

  const recap = useMemo(() => {
    const rev: RecapRow = { code: account || "—", name: debit ? "Income" : "Revenue (reversed)", amount };
    const ar: RecapRow = { code: "AR", name: "Accounts Receivable (control)", amount };
    return debit ? { dr: [ar], cr: [rev] } : { dr: [rev], cr: [ar] };
  }, [debit, account, amount]);

  const canSubmit = !!customer && !!account && amount > 0 && reason.trim() !== "";

  const reset = () => { setKind("CREDIT"); setDate(todayISO); setCustomer(""); setAccount(""); setInvoice(""); setAmount(0); setReason(""); setApplyNow(false); };
  const close = () => { reset(); onClose(); };
  const changeKind = (k: string) => { setKind(k); if (k === "DEBIT") setApplyNow(false); };

  const submit = async () => {
    try {
      const res = await create({
        entity, customer: customer.trim().toUpperCase(), kind, note_date: date,
        invoice: invoice ? Number(invoice) : undefined, reason: reason.trim(),
        lines: [{ revenue_account: account, description: reason.trim(), quantity: 1, unit_price: amount }],
      }).unwrap();
      // Post immediately. For credit notes the toggle decides: auto-allocate
      // oldest-first ("Applied") or leave the credit unapplied ("Issued").
      const auto = !debit && applyNow;
      await post({ id: res.data.id, entity, auto_allocate: auto }).unwrap();
      toast.success(auto ? `${kindLabel(kind)} issued and applied.` : `${kindLabel(kind)} issued.`);
      close();
    } catch { /* central — a create that posts-failed leaves a draft, surfaced as the error */ }
  };

  return (
    <DetailDrawer
      open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="Issue credit / debit note"
      description="Reduce (credit) or increase (debit) the customer balance."
      widthClass={DRAWER_W}
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
          <Segmented value={kind} onChange={changeKind} options={[["CREDIT", "Credit note"], ["DEBIT", "Debit note"]]} />
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
            placeholder={customer ? "Optional — search this customer's invoices" : "Select a customer first"} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></FormField>
        </div>

        <FormField label="Reason" required><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this adjustment?" className="bg-white" /></FormField>

        <PostingRecap
          title={`${kindLabel(kind)} posting`} dr={recap.dr} cr={recap.cr} currency={currency}
          helper={debit
            ? "A debit note raises an additional charge and increases the customer's balance."
            : "A credit note lowers the customer's balance and reverses recognised revenue."}
        />

        {!debit ? (
          <FormField label="Apply on issue?">
            <Segmented
              value={applyNow ? "apply" : "keep"} onChange={(v) => setApplyNow(v === "apply")}
              options={[["keep", "Leave as credit (Issued)"], ["apply", "Apply to oldest invoices (Applied)"]]}
            />
          </FormField>
        ) : null}
      </div>
    </DetailDrawer>
  );
}
