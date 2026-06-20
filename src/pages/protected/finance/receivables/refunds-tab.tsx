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
import { Plus, Info } from "lucide-react";
import {
  DataTable, Money, MoneyInput, ConfirmActionModal, DetailDrawer, FormField,
  CustomerPicker, AccountPicker, BankAccountPicker, PostingRecap, toArray,
  type Column, type RecapRow,
} from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/custom/search-select";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetRefundsQuery, useCreateRefundMutation, usePostRefundMutation,
  useGetWriteOffsQuery, useWriteOffInvoiceMutation, useGetInvoicesQuery, useGetCustomersQuery,
} from "@/redux/services/finance/ar-api";
import type { Refund } from "@/redux/services/finance/ar-types";

const todayISO = new Date().toISOString().slice(0, 10);
const thisYear = todayISO.slice(0, 4);
type Mode = "REFUND" | "WRITEOFF";

type Row = {
  key: string; kind: Mode; reference: string; date: string;
  customer: string; reason: string; amount: number; status: "POSTED" | "DRAFT";
  refundId?: number;
};

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

export function RefundsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [filter, setFilter] = useState<"" | Mode>("");
  const [creating, setCreating] = useState(false);
  const [toPost, setToPost] = useState<Refund | null>(null);

  const refundsQ = useGetRefundsQuery({ entity });
  const writeOffsQ = useGetWriteOffsQuery({ entity });
  const customersQ = useGetCustomersQuery({ entity, is_active: "true" });
  const [post, { isLoading: posting }] = usePostRefundMutation();

  const refunds = useMemo(() => toArray(refundsQ.data?.data), [refundsQ.data]);
  const writeOffs = useMemo(() => toArray(writeOffsQ.data?.data), [writeOffsQ.data]);

  const refundableCredit = useMemo(
    () => toArray(customersQ.data?.data).reduce((s, c) => s + (c.balance < 0 ? -c.balance : 0), 0),
    [customersQ.data],
  );
  const writtenOffYtd = useMemo(
    () => writeOffs.filter((w) => (w.date || "").startsWith(thisYear)).reduce((s, w) => s + w.amount, 0),
    [writeOffs],
  );
  const pendingCount = useMemo(() => refunds.filter((r) => r.status === "DRAFT").length, [refunds]);

  const rows: Row[] = useMemo(() => {
    const r1: Row[] = refunds.map((r) => ({
      key: `R${r.id}`, kind: "REFUND", reference: r.document_number, date: r.refund_date,
      customer: r.customer_name, reason: r.narration || "Customer refund", amount: r.amount,
      status: r.status === "POSTED" ? "POSTED" : "DRAFT", refundId: r.id,
    }));
    const r2: Row[] = writeOffs.map((w) => ({
      key: `W${w.id}`, kind: "WRITEOFF", reference: w.reference, date: w.date,
      customer: w.customer_name, reason: w.reason, amount: w.amount, status: "POSTED",
    }));
    return [...r1, ...r2].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [refunds, writeOffs]);

  const filtered = useMemo(() => rows.filter((r) => !filter || r.kind === filter), [rows, filter]);

  const loading = refundsQ.isLoading || writeOffsQ.isLoading || refundsQ.isFetching || writeOffsQ.isFetching;
  const isError = refundsQ.isError || writeOffsQ.isError;
  const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01";

  const doPost = async () => {
    if (!toPost) return;
    try {
      const res = await post({ id: toPost.id, entity }).unwrap();
      toast.success(res.message || "Refund posted.");
      setToPost(null);
    } catch { /* central */ }
  };

  const columns: Column<Row>[] = [
    { header: "Ref", cell: (r) => <span className="font-semibold tabular-nums">{r.reference || "—"}</span> },
    { header: "Type", cell: (r) => <TypeChip kind={r.kind} /> },
    { header: "Date", cell: (r) => <span className="tabular-nums">{r.date}</span> },
    { header: "Customer", cell: (r) => <span className="text-gray-01">{r.customer}</span> },
    { header: "Reason", cell: (r) => <span className="block max-w-[260px] truncate text-gray-01" title={r.reason}>{r.reason || "—"}</span> },
    { header: "Amount", align: "right", cell: (r) => <Money kobo={r.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Refundable credit" hint="Total customer credit available to refund." value={formatMoney(refundableCredit, currency)} />
        <Stat label="Written off (YTD)" value={formatMoney(writtenOffYtd, currency)} />
        <Stat label="Pending approval" value={String(pendingCount)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value as "" | Mode)} className={selectCls}>
          <option value="">All</option>
          <option value="REFUND">Refunds</option>
          <option value="WRITEOFF">Write-offs</option>
        </select>
        <Can permission={P.FIN_CREATE_REFUND}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New action</Button>
        </Can>
      </div>

      <DataTable
        columns={columns} rows={filtered} rowKey={(r) => r.key}
        loading={loading} error={isError} onRetry={() => { refundsQ.refetch(); writeOffsQ.refetch(); }}
        onRowClick={(r) => { if (r.kind === "REFUND" && r.status === "DRAFT") { const m = refunds.find((x) => x.id === r.refundId); if (m) setToPost(m); } }}
        emptyTitle="No refunds or write-offs"
        emptyMessage="Refund a credit balance, or write off bad debt, with New action."
      />

      <ConfirmActionModal
        open={!!toPost} onOpenChange={(o) => !o && setToPost(null)}
        title="Post this refund?"
        description={`Posting ${toPost?.document_number} books the refund journal (Dr AR · Cr bank).`}
        confirmText="Post" loading={posting} onConfirm={doPost}
      />
      <NewActionDrawer open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
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
      dr: [{ code: "AR", name: "Accounts Receivable (control)", amount }],
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
        <FormField label="Action">
          <div className="inline-flex rounded-md border border-gray-03 bg-white p-0.5">
            {([["REFUND", "Refund to bank"], ["WRITEOFF", "Write off to expense"]] as [Mode, string][]).map(([v, lbl]) => (
              <button key={v} type="button" onClick={() => changeMode(v)}
                disabled={v === "WRITEOFF" && !canWriteOff}
                className={cn("rounded px-3 py-1.5 font-mont text-sm font-medium transition-colors disabled:opacity-40",
                  mode === v ? "bg-pry-01 text-primary" : "text-gray-05 hover:text-gray-01")}>
                {lbl}
              </button>
            ))}
          </div>
        </FormField>

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
