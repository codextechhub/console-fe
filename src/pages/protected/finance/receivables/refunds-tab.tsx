// Receivables → Refunds & Write-offs. Rebuilt to the Vision prototype in the house
// theme: 3 KPIs, a type filter, and a UNIFIED table of refunds + write-offs, plus
// a single "New action" drawer that toggles between refunding a credit balance to
// the bank and writing off bad debt to expense — each with a live posting preview.
//
// Honest adaptations vs the mockup:
//   • a refund's real journal is Dr AR control · Cr Bank (we hold customer credit
//     as a credit balance on AR — there's no separate "customer credit" account);
//   • a write-off is per-invoice in our ledger, so the write-off form picks one of
//     the customer's open invoices (amount defaults to / caps at its balance);
//   • write-offs post immediately (no approval engine) → always "Posted"; the
//     Pending KPI counts DRAFT refunds. A refund posts on issue unless "Save as
//     draft" is ticked.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Info, Search, Printer, Check } from "lucide-react";
import {
  DataTable, Money, MoneyInput, DetailDrawer, FormField, Segmented,
  CustomerPicker, AccountPicker, BankAccountPicker, PostingRecap, toArray,
  type Column, type RecapRow,
} from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/custom/search-select";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetArAdjustmentsQuery, useCreateRefundMutation, usePostRefundMutation,
  useWriteOffInvoiceMutation, useGetInvoicesQuery, useGetCustomersQuery,
} from "@/redux/services/finance/ar-api";
import type { ArAdjustment } from "@/redux/services/finance/ar-types";

const todayISO = new Date().toISOString().slice(0, 10);
type Mode = "REFUND" | "WRITEOFF";

function TypeChip({ kind }: { kind: Mode }) {
  const wo = kind === "WRITEOFF";
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium",
      wo ? "bg-destructive/10 text-destructive" : "bg-blue-50 text-blue-700")}>
      {wo ? "Write-off" : "Refund"}
    </span>
  );
}
function StatusPill({ status }: { status: "POSTED" | "DRAFT" }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium",
      status === "POSTED" ? "bg-green-01/10 text-green-01" : "bg-amber-50 text-amber-700")}>
      {status === "POSTED" ? "Posted" : "Pending"}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="flex items-center gap-1 font-mont text-xs text-gray-05">
        {label}{hint ? <Info className="size-3.5 text-gray-02"><title>{hint}</title></Info> : null}
      </p>
      <p className="mt-1 font-mont text-xl font-semibold tabular-nums text-black-01">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mont text-[11px] text-gray-05">{label}</p>
      <div className="mt-1 font-mont text-sm font-semibold tabular-nums text-black-01">{children}</div>
    </div>
  );
}

export function RefundsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [filter, setFilter] = useState<"" | Mode>("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ArAdjustment | null>(null);

  // Unified, server-paginated refunds + write-offs; KPI totals ride in the envelope.
  const params = useMemo(() => ({
    entity, page,
    ...(filter ? { type: filter.toLowerCase() } : {}),
    ...(search ? { search } : {}),
  }), [entity, page, filter, search]);
  const { data, isLoading, isFetching, isError, refetch } = useGetArAdjustmentsQuery(params);
  const customersQ = useGetCustomersQuery({ entity, is_active: "true" });

  const rows = useMemo(() => toArray(data?.data), [data]);
  const pg = data?.pagination;
  const refundableCredit = useMemo(
    () => toArray(customersQ.data?.data).reduce((s, c) => s + (c.balance < 0 ? -c.balance : 0), 0),
    [customersQ.data],
  );
  const resetPage = () => setPage(1);
  const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01";

  const columns: Column<ArAdjustment>[] = [
    { header: "Ref", cell: (r) => <span className="font-semibold tabular-nums">{r.reference || "—"}</span> },
    { header: "Type", cell: (r) => <TypeChip kind={r.kind} /> },
    { header: "Date", cell: (r) => <span className="tabular-nums">{r.date}</span> },
    { header: "Customer", cell: (r) => <span className="text-gray-01">{r.customer_name}</span> },
    { header: "Reason", cell: (r) => <span className="block max-w-[260px] truncate text-gray-01" title={r.reason}>{r.reason || "—"}</span> },
    { header: "Amount", align: "right", cell: (r) => <Money kobo={r.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <StatusPill status={r.status === "POSTED" ? "POSTED" : "DRAFT"} /> },
  ];

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Refundable credit" hint="Total customer credit available to refund." value={formatMoney(refundableCredit, currency)} />
        <Stat label="Written off (YTD)" value={formatMoney(data?.kpis.written_off_ytd ?? 0, currency)} />
        <Stat label="Pending approval" value={String(data?.kpis.pending ?? 0)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
            <Input value={searchInput} onChange={(e) => { setSearchInput(e.target.value); resetPage(); }}
              placeholder="Search ref, customer, reason" className="h-9 w-64 bg-white pl-8 font-mont" />
          </div>
          <select value={filter} onChange={(e) => { setFilter(e.target.value as "" | Mode); resetPage(); }} className={selectCls}>
            <option value="">All</option>
            <option value="REFUND">Refunds</option>
            <option value="WRITEOFF">Write-offs</option>
          </select>
        </div>
        <Can permission={P.FIN_CREATE_REFUND}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New action</Button>
        </Can>
      </div>

      <DataTable
        columns={columns} rows={rows} rowKey={(r) => r.key}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
        emptyTitle="No refunds or write-offs"
        emptyMessage="Refund a credit balance, or write off bad debt, with New action."
      />

      <AdjustmentDetailDrawer row={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
      <NewActionDrawer open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function AdjustmentDetailDrawer({ row, entity, currency, onClose }: {
  row: ArAdjustment | null; entity: string; currency?: string | null; onClose: () => void;
}) {
  const { can } = useCan();
  const [post, { isLoading: posting }] = usePostRefundMutation();
  if (!row) return null;

  const wo = row.kind === "WRITEOFF";
  const posted = row.status === "POSTED";
  const isDraftRefund = !wo && !posted;
  const recap = wo
    ? { dr: [{ code: "5300", name: "Bad debt expense", amount: row.amount }], cr: [{ code: "AR", name: "Accounts Receivable (control)", amount: row.amount }] }
    : { dr: [{ code: "2140", name: "Customer credit", amount: row.amount }], cr: [{ code: "Bank", name: "cash out", amount: row.amount }] };
  const helper = wo
    ? "Recaps the bad-debt journal — expense recognised, the receivable cleared."
    : posted
      ? "Recaps the refund journal — the customer's credit is paid out and cash leaves the bank."
      : "The journal that will post when this draft refund is posted — draws down the customer's credit, cash out.";

  const doPost = async () => {
    if (!row.refund_id) return;
    try {
      const res = await post({ id: row.refund_id, entity }).unwrap();
      toast.success(res.message || "Refund posted.");
      onClose();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={!!row} onOpenChange={(o) => (o ? undefined : onClose())}
      title={row.reference || (wo ? "Write-off" : "Refund")}
      description={`${wo ? "Write-off" : "Refund"} · ${row.customer_name}`}
      widthClass="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="size-4" /> Print</Button>
          {isDraftRefund && can(P.FIN_POST_REFUND) ? (
            <Button onClick={doPost} disabled={posting} className="gap-1.5"><Check className="size-4" />{posting ? "Posting…" : "Post refund"}</Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount"><Money kobo={row.amount} currency={currency} /></Field>
          <Field label="Status"><StatusPill status={posted ? "POSTED" : "DRAFT"} /></Field>
          <Field label={wo ? "Against invoice" : "Reference"}>{row.reference || "—"}</Field>
          <Field label="Date">{row.date}</Field>
        </div>
        <Field label="Reason"><span className="font-normal">{row.reason || "—"}</span></Field>
        <div>
          <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">GL posting</p>
          <PostingRecap title={wo ? "Write-off posting" : "Refund posting"} dr={recap.dr} cr={recap.cr} currency={currency} helper={helper} />
        </div>
      </div>
    </DetailDrawer>
  );
}

function NewActionDrawer({ open, onClose, entity, currency }: {
  open: boolean; onClose: () => void; entity: string; currency?: string | null;
}) {
  const { can } = useCan();
  const [mode, setMode] = useState<Mode>("REFUND");
  const [date, setDate] = useState(todayISO);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [invoice, setInvoice] = useState("");
  const [expenseAccount, setExpenseAccount] = useState("");
  const [draft, setDraft] = useState(false);

  const [createRefund, { isLoading: creatingR }] = useCreateRefundMutation();
  const [postRefund, { isLoading: postingR }] = usePostRefundMutation();
  const [writeOff, { isLoading: writingOff }] = useWriteOffInvoiceMutation();
  const saving = creatingR || postingR || writingOff;
  const wo = mode === "WRITEOFF";

  // Open invoices (with a balance due) for the chosen customer — write-off targets.
  const invQ = useGetInvoicesQuery({ entity, search: customer, status: "POSTED" }, { skip: !customer || !wo });
  const openInvoices = useMemo(
    () => toArray(invQ.data?.data).filter((i) => i.customer_code === customer && i.balance_due > 0),
    [invQ.data, customer],
  );
  const invoiceOptions = openInvoices.map((i) => ({ value: String(i.id), label: `${i.document_number} · ${formatMoney(i.balance_due, currency)} due` }));

  const recap = useMemo<{ dr: RecapRow[]; cr: RecapRow[] }>(() => {
    if (wo) {
      return {
        dr: [{ code: expenseAccount || "5300", name: "Bad debt expense", amount }],
        cr: [{ code: "AR", name: "Accounts Receivable (control)", amount }],
      };
    }
    return {
      dr: [{ code: "2140", name: "Customer credit", amount }],
      cr: [{ code: "Bank", name: "cash out", amount }],
    };
  }, [wo, expenseAccount, amount]);

  const canSubmit = wo
    ? !!customer && !!invoice && amount > 0
    : !!customer && !!bankAccount && amount > 0;

  const reset = () => {
    setMode("REFUND"); setDate(todayISO); setCustomer(""); setAmount(0); setReason("");
    setBankAccount(""); setInvoice(""); setExpenseAccount(""); setDraft(false);
  };
  const close = () => { reset(); onClose(); };
  const changeMode = (m: Mode) => { setMode(m); setInvoice(""); setAmount(0); if (m === "WRITEOFF") setDraft(false); };
  const pickInvoice = (id: string) => {
    setInvoice(id);
    const inv = openInvoices.find((i) => String(i.id) === id);
    if (inv) setAmount(inv.balance_due); // default to the outstanding balance
  };

  const submit = async () => {
    try {
      if (wo) {
        const res = await writeOff({ id: Number(invoice), entity, amount, write_off_account: expenseAccount || undefined, narration: reason.trim() || undefined }).unwrap();
        toast.success(res.message || "Write-off posted.");
      } else {
        const res = await createRefund({
          entity, customer: customer.trim().toUpperCase(), refund_date: date, method: "BANK_TRANSFER",
          amount, bank_account: bankAccount ? Number(bankAccount) : undefined, narration: reason.trim() || undefined,
        }).unwrap();
        if (!draft) await postRefund({ id: res.data.id, entity }).unwrap();
        toast.success(draft ? "Refund saved as draft." : "Refund processed.");
      }
      close();
    } catch { /* central */ }
  };

  const canWriteOff = can(P.FIN_WRITE_OFF_INVOICE);

  return (
    <DetailDrawer
      open={open} onOpenChange={(o) => (o ? undefined : close())}
      title={wo ? "Write off bad debt" : "Process refund"}
      description="Choose the action and see the resulting posting."
      widthClass="sm:max-w-3xl"
      footer={
        <>
          <Button variant="outline" disabled={saving} onClick={close}>Cancel</Button>
          <Button disabled={saving || !canSubmit} onClick={submit} className="gap-1.5">
            <Plus className="size-4" />
            {saving ? "Working…" : wo ? "Post write-off" : draft ? "Save draft" : "Process refund"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented
          label="Action" value={mode} onChange={changeMode}
          options={[["REFUND", "Refund to bank"], ["WRITEOFF", "Write off to expense"]]}
          isDisabled={(v) => v === "WRITEOFF" && !canWriteOff}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></FormField>
          <FormField label="Customer" required><CustomerPicker entity={entity} value={customer} onChange={(v) => { setCustomer(v); setInvoice(""); }} /></FormField>
        </div>

        {wo ? (
          <FormField label="Against invoice" required>
            <SearchSelect options={invoiceOptions} value={invoice} onChange={(e) => pickInvoice(e.target.value)}
              loading={invQ.isFetching} disabled={!customer}
              placeholder={customer ? "Select an open invoice" : "Select a customer first"} />
          </FormField>
        ) : (
          <FormField label="Refund to bank account" required>
            <BankAccountPicker entity={entity} value={bankAccount} onChange={setBankAccount} />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></FormField>
          {wo ? (
            <FormField label="Write-off expense account">
              <AccountPicker entity={entity} value={expenseAccount} onChange={setExpenseAccount} accountType="EXPENSE" postableOnly
                placeholder="Defaults to bad debt (5300)" />
            </FormField>
          ) : null}
        </div>

        <FormField label="Reason"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this action?" className="bg-white" /></FormField>

        <PostingRecap
          title={wo ? "Write-off posting" : "Refund posting"} dr={recap.dr} cr={recap.cr} currency={currency}
          helper={wo
            ? "A write-off recognises the loss as expense and clears the receivable."
            : "A refund pays out a credit balance — cash leaves the bank."}
        />

        {!wo ? (
          <label className="flex items-center gap-2 font-mont text-sm text-gray-01">
            <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} className="accent-primary" />
            Save as draft (post later for approval)
          </label>
        ) : null}
      </div>
    </DetailDrawer>
  );
}
