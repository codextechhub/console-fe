// Receivables → Concessions / Waivers. Rebuilt to the Vision prototype in the house
// theme: KPIs, search + type/status filters, a type-chip table, a detail drawer that
// recaps the real journal, and a New-concession drawer with an "Enter as" amount/%
// toggle (percent is of the chosen invoice's balance).
//
// A concession reduces a specific posted invoice's balance, so the invoice is
// required (the prototype's no-invoice scholarship isn't supported by our ledger).
// Posting is Dr allowance (4910 Discounts & Allowances by default) · Cr AR.
import { useMemo, useState } from "react";
import { useActionParam } from "@/hooks/use-action-param";
import { toast } from "sonner";
import { Plus, Search, Printer, Check, Info } from "lucide-react";
import {
  DataTable, Money, MoneyInput, ConfirmActionModal, DetailDrawer, FormField, Segmented,
  CustomerPicker, AccountPicker, PostingRecap, toArray, type Column, type RecapRow,
  PostingDateField,} from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/custom/search-select";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetConcessionsQuery, useGetConcessionSummaryQuery, useCreateConcessionMutation,
  usePostConcessionMutation, useGetInvoicesQuery,
} from "@/redux/services/finance/ar-api";
import type { Concession } from "@/redux/services/finance/ar-types";

const KINDS: [string, string][] = [["WAIVER", "Waiver"], ["DISCOUNT", "Discount"], ["SCHOLARSHIP", "Scholarship"]];
const kindLabel = (k: string) => KINDS.find(([v]) => v === k)?.[1] ?? k;
const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const TYPE_CLS: Record<string, string> = {
  WAIVER: "bg-green-01/10 text-green-01", DISCOUNT: "bg-blue-50 text-blue-700", SCHOLARSHIP: "bg-indigo-50 text-indigo-700",
};

function TypeChip({ kind }: { kind: string }) {
  return <span className={cn(PILL, TYPE_CLS[kind] ?? "bg-gray-03/60 text-gray-05")}>{kindLabel(kind)}</span>;
}
function StatusPill({ status }: { status: string }) {
  const posted = status === "POSTED";
  return <span className={cn(PILL, posted ? "bg-green-01/10 text-green-01" : "bg-amber-50 text-amber-700")}>{posted ? "Posted" : "Draft"}</span>;
}
function Initials({ name }: { name: string }) {
  const init = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pry-01 font-mont text-[10px] font-semibold text-primary">{init || "—"}</span>;
}
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="flex items-center gap-1 font-mont text-xs text-gray-05">{label}{hint ? <Info className="size-3.5 text-gray-02"><title>{hint}</title></Info> : null}</p>
      <p className="mt-1 font-mont text-xl font-semibold tabular-nums text-black-01">{value}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="font-mont text-[11px] text-gray-05">{label}</p><div className="mt-1 font-mont text-sm font-semibold tabular-nums text-black-01">{children}</div></div>;
}

// Dr allowance (recognised revenue reduced) · Cr AR — the real journal a concession posts.
function concessionRecap(allowance: string | null, amount: number): { dr: RecapRow[]; cr: RecapRow[] } {
  return {
    dr: [{ code: allowance || "4910", name: "Discounts & allowances", amount }],
    cr: [{ code: "AR", name: "Accounts Receivable (control)", amount }],
  };
}

export function ConcessionsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  useActionParam("new", () => setCreating(true));
  const [selected, setSelected] = useState<Concession | null>(null);

  const params = useMemo(() => ({
    entity, page,
    ...(typeFilter ? { kind: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
  }), [entity, page, typeFilter, statusFilter, search]);
  const { data, isLoading, isFetching, isError, refetch } = useGetConcessionsQuery(params);
  const summaryQ = useGetConcessionSummaryQuery({ entity });
  const rows = useMemo(() => toArray(data?.data), [data]);
  const pg = data?.pagination;
  const summary = summaryQ.data?.data;
  const resetPage = () => setPage(1);
  const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01";

  const columns: Column<Concession>[] = [
    { header: "Ref", cell: (c) => <span className="font-semibold tabular-nums">{c.document_number}</span> },
    { header: "Customer", cell: (c) => <span className="inline-flex items-center gap-2"><Initials name={c.customer_name} /><span className="font-medium text-gray-01">{c.customer_name}</span></span> },
    { header: "Invoice", cell: (c) => <span className="tabular-nums text-gray-05">{c.invoice_number ?? "—"}</span> },
    { header: "Type", cell: (c) => <TypeChip kind={c.kind} /> },
    { header: "Amount", align: "right", cell: (c) => <Money kobo={c.amount} currency={currency} align="right" /> },
    { header: "Date", cell: (c) => <span className="tabular-nums">{c.concession_date}</span> },
    { header: "Status", cell: (c) => <StatusPill status={c.status} /> },
  ];

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Posted (YTD)" value={formatMoney(summary?.posted_ytd ?? 0, currency)} />
        <Stat label="Draft (pending)" value={formatMoney(summary?.draft_pending ?? 0, currency)} />
        <Stat label="Active concessions" value={String(summary?.active_count ?? 0)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
            <Input value={searchInput} onChange={(e) => { setSearchInput(e.target.value); resetPage(); }}
              placeholder="Search ref, customer, invoice" className="h-9 w-64 bg-white pl-8 font-mont" />
          </div>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); resetPage(); }} className={selectCls}>
            <option value="">All types</option>
            {KINDS.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }} className={selectCls}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
          </select>
        </div>
        <Can permission={P.FIN_CREATE_CONCESSION}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New concession</Button>
        </Can>
      </div>

      <DataTable
        columns={columns} rows={rows} rowKey={(c) => c.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
        emptyTitle="No concessions"
        emptyMessage="Grant a waiver, discount or scholarship with New concession."
      />

      <ConcessionDetailDrawer concession={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
      <NewConcessionDrawer open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function ConcessionDetailDrawer({ concession, entity, currency, onClose }: {
  concession: Concession | null; entity: string; currency?: string | null; onClose: () => void;
}) {
  const { can } = useCan();
  const [confirmPost, setConfirmPost] = useState(false);
  const [post, { isLoading: posting }] = usePostConcessionMutation();
  if (!concession) return null;

  const isDraft = concession.status === "DRAFT";
  const recap = concessionRecap(concession.allowance_account, concession.amount);
  const doPost = async () => {
    try {
      const res = await post({ id: concession.id, entity }).unwrap();
      toast.success(res.message || "Concession posted.");
      setConfirmPost(false); onClose();
    } catch { /* central */ }
  };

  return (
    <>
      <DetailDrawer
        open={!!concession} onOpenChange={(o) => (o ? undefined : onClose())}
        title={concession.document_number} description={`${kindLabel(concession.kind)} · ${concession.customer_name}`}
        widthClass="sm:max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="size-4" /> Print</Button>
            {isDraft && can(P.FIN_POST_CONCESSION) ? <Button onClick={() => setConfirmPost(true)} className="gap-1.5"><Check className="size-4" /> Post concession</Button> : null}
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount"><Money kobo={concession.amount} currency={currency} /></Field>
            <Field label="Status"><StatusPill status={concession.status} /></Field>
            <Field label="Against invoice">{concession.invoice_number ?? "—"}</Field>
            <Field label="Date">{concession.concession_date}</Field>
          </div>
          <Field label="Basis"><span className="font-normal">{concession.reason || "—"}</span></Field>
          <div>
            <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">GL posting</p>
            <PostingRecap
              title={`${kindLabel(concession.kind)} posting`} dr={recap.dr} cr={recap.cr} currency={currency}
              helper={isDraft
                ? "The journal that will post when this concession is posted — recognised revenue reduced, the customer's balance cleared."
                : "Recaps the journal booked when the concession was posted — recognised revenue reduced, the customer's balance cleared."}
            />
          </div>
        </div>
      </DetailDrawer>

      <ConfirmActionModal
        open={confirmPost} onOpenChange={(o) => !o && setConfirmPost(false)}
        title="Post this concession?"
        description={`Posts ${concession.document_number} — reduces ${concession.invoice_number}'s balance (Dr allowance · Cr AR).`}
        confirmText="Post" loading={posting} onConfirm={doPost}
      />
    </>
  );
}

function NewConcessionDrawer({ open, onClose, entity, currency }: {
  open: boolean; onClose: () => void; entity: string; currency?: string | null;
}) {
  const [kind, setKind] = useState("DISCOUNT");
  const [date, setDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [invoice, setInvoice] = useState("");
  const [invoiceBalance, setInvoiceBalance] = useState(0);
  const [entryMode, setEntryMode] = useState<"amount" | "pct">("amount");
  const [amount, setAmount] = useState(0);
  const [pct, setPct] = useState("");
  const [allowance, setAllowance] = useState("");
  const [reason, setReason] = useState("");
  const [create, { isLoading: creating }] = useCreateConcessionMutation();
  const [post, { isLoading: posting }] = usePostConcessionMutation();
  const saving = creating || posting;

  const invQ = useGetInvoicesQuery({ entity, search: customer, status: "POSTED" }, { skip: !customer });
  const openInvoices = useMemo(
    () => toArray(invQ.data?.data).filter((i) => i.customer_code === customer && i.balance_due > 0),
    [invQ.data, customer],
  );
  const invoiceOptions = openInvoices.map((i) => ({ value: String(i.id), label: `${i.document_number} · ${formatMoney(i.balance_due, currency)} due` }));
  // A discount cannot predate the charge it discounts — conceding before the invoice
  // date would credit AR before the invoice ever debited it.
  const selectedInvoice = openInvoices.find((i) => String(i.id) === invoice) ?? null;

  const pctToKobo = (p: string, bal: number) => Math.min(Math.round(((parseFloat(p) || 0) / 100) * bal), bal);
  const impliedPct = invoiceBalance > 0 ? (amount / invoiceBalance) * 100 : 0;

  const pickInvoice = (id: string) => {
    setInvoice(id);
    const bal = openInvoices.find((i) => String(i.id) === id)?.balance_due ?? 0;
    setInvoiceBalance(bal);
    if (entryMode === "pct" && pct) setAmount(pctToKobo(pct, bal));
  };
  const switchEntry = (m: "amount" | "pct") => {
    setEntryMode(m);
    if (m === "pct") setPct(invoiceBalance > 0 ? String(+(amount / invoiceBalance * 100).toFixed(2)) : "");
  };
  const onPct = (v: string) => { setPct(v); setAmount(pctToKobo(v, invoiceBalance)); };

  const recap = useMemo(() => concessionRecap(allowance || null, amount), [allowance, amount]);
  const canSubmit = !!customer && !!invoice && amount > 0 && reason.trim() !== "";

  const reset = () => {
    setKind("DISCOUNT"); setDate(""); setCustomer(""); setInvoice(""); setInvoiceBalance(0);
    setEntryMode("amount"); setAmount(0); setPct(""); setAllowance(""); setReason("");
  };
  const close = () => { reset(); onClose(); };

  const submit = async (asDraft: boolean) => {
    try {
      const res = await create({
        entity, customer: customer.trim().toUpperCase(), invoice: Number(invoice), kind,
        concession_date: date, amount, allowance_account: allowance || undefined, reason: reason.trim(),
      }).unwrap();
      if (!asDraft) await post({ id: res.data.id, entity }).unwrap();
      toast.success(asDraft ? "Concession saved as draft." : "Concession posted.");
      close();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="New concession" description="Waiver, discount or scholarship that reduces a customer's balance."
      widthClass="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" disabled={saving} onClick={close}>Cancel</Button>
          <Button variant="outline" disabled={saving || !canSubmit} onClick={() => submit(true)}>Save draft</Button>
          <Button disabled={saving || !canSubmit} onClick={() => submit(false)} className="gap-1.5">
            <Check className="size-4" />{saving ? "Working…" : "Post concession"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented label="Type" value={kind} onChange={setKind} options={KINDS} />

        <div className="grid grid-cols-2 gap-3">
          <PostingDateField
            label="Date" entity={entity} value={date} onChange={setDate}
            notBefore={selectedInvoice?.invoice_date}
            notBeforeLabel={selectedInvoice ? `invoice ${selectedInvoice.document_number}` : undefined}
          />
          <FormField label="Customer" required><CustomerPicker entity={entity} value={customer} onChange={(v) => { setCustomer(v); setInvoice(""); setInvoiceBalance(0); }} /></FormField>
        </div>

        <FormField label="Against invoice" required>
          <SearchSelect options={invoiceOptions} value={invoice} onChange={(e) => pickInvoice(e.target.value)}
            loading={invQ.isFetching} disabled={!customer}
            placeholder={customer ? "Select an open invoice" : "Select a customer first"} />
        </FormField>

        <div className="space-y-2">
          <Segmented label="Enter as" value={entryMode} onChange={switchEntry} options={[["amount", "Amount"], ["pct", "% of balance"]]} />
          <div className="grid grid-cols-2 items-start gap-3">
            {entryMode === "amount" ? (
              <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} disabled={!invoice} /></FormField>
            ) : (
              <FormField label="Percent" required>
                <div className="relative">
                  <Input type="number" min={0} max={100} step="0.5" value={pct} onChange={(e) => onPct(e.target.value)} disabled={!invoice}
                    placeholder="0" className="bg-white pr-7 text-right font-mont tabular-nums" />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mont text-sm text-gray-05">%</span>
                </div>
              </FormField>
            )}
            <p className="pt-6 font-mont text-xs text-gray-05">
              {invoiceBalance > 0
                ? entryMode === "amount"
                  ? <>= <span className="font-semibold tabular-nums text-gray-01">{impliedPct.toFixed(1)}%</span> of {formatMoney(invoiceBalance, currency)}</>
                  : <>= <span className="font-semibold tabular-nums text-gray-01">{formatMoney(amount, currency)}</span> of {formatMoney(invoiceBalance, currency)}</>
                : "Pick an invoice to base the amount on its balance."}
            </p>
          </div>
        </div>

        <FormField label="Allowance account">
          <AccountPicker entity={entity} value={allowance} onChange={setAllowance} accountType="INCOME" postableOnly
            placeholder="Defaults to discounts & allowances (4910)" />
        </FormField>

        <FormField label="Basis / reason" required><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sibling discount 10%" className="bg-white" /></FormField>

        <PostingRecap
          title={`${kindLabel(kind)} posting`} dr={recap.dr} cr={recap.cr} currency={currency}
          helper="A concession reduces recognised revenue and the customer's outstanding balance."
        />
      </div>
    </DetailDrawer>
  );
}
