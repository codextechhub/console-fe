// Receivables → Refunds & Write-offs. Rebuilt to the Vision prototype in the house
// theme: 3 KPIs, a type filter, and a UNIFIED table of refunds + write-offs, plus
// a single "New action" drawer that toggles between refunding a credit balance to
// the bank and writing off bad debt to expense — each with a live posting preview.
//
// Honest adaptations vs the mockup:
//   • a refund's real journal is Dr customer credit (2140) · Cr Bank — it pays out
//     the customer's stored credit balance (not an open receivable), capped at the
//     available credit;
//   • a write-off is per-invoice in our ledger, so the write-off form picks one of
//     the customer's open invoices (amount defaults to / caps at its balance);
//   • refunds and write-offs can either post directly or be submitted into the
//     shared approval workflow, depending on the school's published templates.
import { useMemo, useState } from "react";
import { useActionParam } from "@/hooks/use-action-param";
import { toast } from "sonner";
import { Plus, Search, Printer, Check, Send } from "lucide-react";
import {
  DataTable, Money, MoneyInput, DetailDrawer, FormField, Segmented,
  CustomerPicker, AccountPicker, BankAccountPicker, PostingRecap, toArray,
  type Column, type RecapRow,
  PostingDateField, InfoHint,} from "@/components/finance-ui";
import { useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/custom/search-select";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import { refundAmountIsWithinAvailableCredit } from "./refund-validation";
import {
  useGetArAdjustmentsQuery, useCreateRefundMutation, usePostRefundMutation,
  useSubmitRefundMutation, useCreateWriteOffRequestMutation, usePostWriteOffRequestMutation,
  useSubmitWriteOffRequestMutation, useGetInvoicesQuery, useGetRefundAvailabilityQuery,
} from "@/redux/services/finance/ar-api";
import type { ArAdjustment, RefundAvailabilityCustomer } from "@/redux/services/finance/ar-types";

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
function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const label = normalized.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium",
      normalized === "POSTED" ? "bg-green-01/10 text-green-01"
        : normalized === "PENDING_APPROVAL" ? "bg-blue-50 text-blue-700"
          : "bg-amber-50 text-amber-700")}>
      {label}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="flex items-center gap-1 font-mont text-xs text-gray-05">
        {label}
        {hint ? (
          <InfoHint ariaLabel={`About ${label}`} className="size-4 text-gray-02">
            {hint}
          </InfoHint>
        ) : null}
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
  const { can } = useCan();
  const [filter, setFilter] = useState<"" | Mode>("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  useActionParam("new", () => setCreating(true));
  const [selected, setSelected] = useState<ArAdjustment | null>(null);

  // Unified, server-paginated refunds + write-offs; KPI totals ride in the envelope.
  const params = useMemo(() => ({
    entity, page,
    ...(filter ? { type: filter.toLowerCase() } : {}),
    ...(search ? { search } : {}),
  }), [entity, page, filter, search]);
  const { data, isLoading, isFetching, isError, refetch } = useGetArAdjustmentsQuery(params);

  const rows = useMemo(() => toArray(data?.data), [data]);
  const pg = data?.pagination;
  const resetPage = () => setPage(1);
  const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01";

  const columns: Column<ArAdjustment>[] = [
    { header: "Ref", cell: (r) => <span className="font-semibold tabular-nums">{r.reference || "—"}</span> },
    { header: "Type", cell: (r) => <TypeChip kind={r.kind} /> },
    { header: "Date", cell: (r) => <span className="tabular-nums">{r.date}</span> },
    { header: "Customer", cell: (r) => <span className="text-gray-01">{r.customer_name}</span> },
    { header: "Reason", cell: (r) => <span className="block max-w-[260px] truncate text-gray-01" title={r.reason}>{r.reason || "—"}</span> },
    { header: "Amount", align: "right", cell: (r) => <Money kobo={r.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <StatusPill status={r.status || "DRAFT"} /> },
  ];

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Refundable credit" hint="Total customer credit available to refund." value={formatMoney(data?.kpis.refundable_credit ?? 0, currency)} />
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
        {can(P.FIN_CREATE_REFUND) || can(P.FIN_CREATE_WRITE_OFF) || can(P.FIN_WRITE_OFF_INVOICE) ? (
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New action</Button>
        ) : null}
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
  const [submitRefund, { isLoading: submittingRefund }] = useSubmitRefundMutation();
  const [postWriteOff, { isLoading: postingWriteOff }] = usePostWriteOffRequestMutation();
  const [submitWriteOff, { isLoading: submittingWriteOff }] = useSubmitWriteOffRequestMutation();
  if (!row) return null;

  const wo = row.kind === "WRITEOFF";
  const posted = row.status === "POSTED";
  const isDraft = !posted && row.status !== "PENDING_APPROVAL";
  const recap = wo
    ? { dr: [{ code: "5300", name: "Bad debt expense", amount: row.amount }], cr: [{ code: "AR", name: "Accounts Receivable (control)", amount: row.amount }] }
    : { dr: [{ code: "2140", name: "Customer credit", amount: row.amount }], cr: [{ code: "Bank", name: "cash out", amount: row.amount }] };
  const helper = wo
    ? "Recaps the bad-debt journal — expense recognised, the receivable cleared."
    : posted
      ? "Recaps the refund journal — the customer's credit is paid out and cash leaves the bank."
      : "The journal that will post when this draft refund is posted — draws down the customer's credit, cash out.";

  const doPost = async () => {
    if (wo && !row.write_off_id) return;
    if (!wo && !row.refund_id) return;
    try {
      const res = wo
        ? await postWriteOff({ id: row.write_off_id!, entity }).unwrap()
        : await post({ id: row.refund_id!, entity }).unwrap();
      toast.success(res.message || (wo ? "Write-off posted." : "Refund posted."));
      onClose();
    } catch { /* central */ }
  };
  const doSubmit = async () => {
    if (wo && !row.write_off_id) return;
    if (!wo && !row.refund_id) return;
    try {
      const res = wo
        ? await submitWriteOff({ id: row.write_off_id!, entity }).unwrap()
        : await submitRefund({ id: row.refund_id!, entity }).unwrap();
      toast.success(res.message || `${wo ? "Write-off" : "Refund"} submitted for approval.`);
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
          {isDraft && can(wo ? P.FIN_SUBMIT_WRITE_OFF : P.FIN_SUBMIT_REFUND) ? (
            <Button variant="outline" onClick={doSubmit} disabled={submittingRefund || submittingWriteOff} className="gap-1.5">
              <Send className="size-4" />{submittingRefund || submittingWriteOff ? "Submitting…" : "Submit"}
            </Button>
          ) : null}
          {isDraft && can(wo ? P.FIN_POST_WRITE_OFF : P.FIN_POST_REFUND) ? (
            <Button onClick={doPost} disabled={posting || postingWriteOff} className="gap-1.5"><Check className="size-4" />{posting || postingWriteOff ? "Posting…" : "Post"}</Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Amount"><Money kobo={row.amount} currency={currency} /></Field>
          <Field label="Status"><StatusPill status={row.status || "DRAFT"} /></Field>
          <Field label={wo ? "Against invoice" : "Reference"}>{row.reference || "—"}</Field>
          <Field label="Date">{row.date}</Field>
        </div>
        <Field label="Reason"><span className="font-normal">{row.reason || "—"}</span></Field>
        <div>
          <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">GL posting</p>
          <PostingRecap title={wo ? "Write-off posting" : "Refund posting"} dr={recap.dr} cr={recap.cr} currency={currency} helper={helper} stackOnMobile />
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
  const [date, setDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [invoice, setInvoice] = useState("");
  const [expenseAccount, setExpenseAccount] = useState("");
  const [nextAction, setNextAction] = useState<"post" | "submit" | "draft">("post");
  const [refundCustomerSearch, setRefundCustomerSearch] = useState("");
  const [selectedRefundCustomer, setSelectedRefundCustomer] = useState<RefundAvailabilityCustomer | null>(null);

  const [createRefund, { isLoading: creatingR }] = useCreateRefundMutation();
  const [postRefund, { isLoading: postingR }] = usePostRefundMutation();
  const [submitRefund, { isLoading: submittingR }] = useSubmitRefundMutation();
  const [createWriteOff, { isLoading: creatingW }] = useCreateWriteOffRequestMutation();
  const [postWriteOff, { isLoading: postingW }] = usePostWriteOffRequestMutation();
  const [submitWriteOff, { isLoading: submittingW }] = useSubmitWriteOffRequestMutation();
  const saving = creatingR || postingR || submittingR || creatingW || postingW || submittingW;
  const wo = mode === "WRITEOFF";
  const refundSearch = useDebounce(refundCustomerSearch.trim(), 250);
  const refundAvailabilityQ = useGetRefundAvailabilityQuery(
    {
      entity,
      page_size: 100,
      ...(refundSearch ? { search: refundSearch } : {}),
    },
    { skip: !open || wo },
  );
  const refundCustomers = useMemo(
    () => toArray(refundAvailabilityQ.data?.data),
    [refundAvailabilityQ.data],
  );
  const refundCustomerOptions = useMemo(() => {
    const rows = selectedRefundCustomer
      && !refundCustomers.some((item) => item.customer_code === selectedRefundCustomer.customer_code)
      ? [selectedRefundCustomer, ...refundCustomers]
      : refundCustomers;
    return rows.map((item) => ({
      value: item.customer_code,
      label: `${item.customer_code} — ${item.customer_name} · ${formatMoney(item.refundable_credit, currency)} available`,
    }));
  }, [refundCustomers, selectedRefundCustomer, currency]);
  const refundableAmount = selectedRefundCustomer?.refundable_credit ?? 0;
  const refundAmountIsValid = refundAmountIsWithinAvailableCredit(amount, refundableAmount);
  const refundAmountOverLimit = !wo && !!customer && amount > refundableAmount;

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
    ? !!customer && !!invoice && amount > 0 && !!date
    : !!customer && !!bankAccount && refundAmountIsValid && !!date;

  const reset = () => {
    setMode("REFUND"); setDate(""); setCustomer(""); setAmount(0); setReason("");
    setBankAccount(""); setInvoice(""); setExpenseAccount(""); setNextAction("post");
    setRefundCustomerSearch(""); setSelectedRefundCustomer(null);
  };
  const close = () => { reset(); onClose(); };
  const changeMode = (m: Mode) => {
    setMode(m); setCustomer(""); setInvoice(""); setAmount(0); setNextAction("post");
    setRefundCustomerSearch(""); setSelectedRefundCustomer(null);
  };
  const pickRefundCustomer = (code: string) => {
    const selected = refundCustomers.find((item) => item.customer_code === code)
      ?? (selectedRefundCustomer?.customer_code === code ? selectedRefundCustomer : null);
    setCustomer(code);
    setInvoice("");
    setSelectedRefundCustomer(selected);
    setAmount(selected?.refundable_credit ?? 0);
    setRefundCustomerSearch("");
  };
  const pickInvoice = (id: string) => {
    setInvoice(id);
    const inv = openInvoices.find((i) => String(i.id) === id);
    if (inv) setAmount(inv.balance_due); // default to the outstanding balance
  };

  const submit = async () => {
    try {
      if (wo) {
        const res = await createWriteOff({
          entity, invoice: Number(invoice), amount, write_off_account: expenseAccount || undefined,
          write_off_date: date, narration: reason.trim() || undefined, reason: reason.trim() || undefined,
        }).unwrap();
        if (nextAction === "submit") {
          const submitted = await submitWriteOff({ id: res.data.id, entity }).unwrap();
          toast.success(submitted.message || "Write-off submitted for approval.");
        } else if (nextAction === "post") {
          const postedRes = await postWriteOff({ id: res.data.id, entity }).unwrap();
          toast.success(postedRes.message || "Write-off posted.");
        } else {
          toast.success(res.message || "Write-off request saved as draft.");
        }
      } else {
        const res = await createRefund({
          entity, customer: customer.trim().toUpperCase(), refund_date: date, method: "BANK_TRANSFER",
          amount, bank_account: bankAccount ? Number(bankAccount) : undefined, narration: reason.trim() || undefined,
        }).unwrap();
        if (nextAction === "submit") {
          const submitted = await submitRefund({ id: res.data.id, entity }).unwrap();
          toast.success(submitted.message || "Refund submitted for approval.");
        } else if (nextAction === "post") {
          const postedRes = await postRefund({ id: res.data.id, entity }).unwrap();
          toast.success(postedRes.message || "Refund processed.");
        } else {
          toast.success("Refund saved as draft.");
        }
      }
      close();
    } catch { /* central */ }
  };

  const canWriteOff = can(P.FIN_CREATE_WRITE_OFF) || can(P.FIN_WRITE_OFF_INVOICE);

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
            {saving ? "Working…" : nextAction === "submit" ? "Submit for approval" : nextAction === "draft" ? "Save draft" : wo ? "Post write-off" : "Process refund"}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PostingDateField label="Date" entity={entity} value={date} onChange={setDate} />
          <FormField label="Customer" required>
            {wo ? (
              <CustomerPicker entity={entity} value={customer} onChange={(v) => { setCustomer(v); setInvoice(""); }} />
            ) : (
              <SearchSelect
                options={refundCustomerOptions}
                value={customer}
                onChange={(e) => pickRefundCustomer(e.target.value)}
                onSearchChange={setRefundCustomerSearch}
                loading={refundAvailabilityQ.isFetching}
                placeholder="Search customers with refundable credit"
                revealOnSearch
              />
            )}
          </FormField>
        </div>
        {!wo && refundAvailabilityQ.isError ? (
          <p className="font-mont text-xs text-destructive">Refundable customers could not be loaded. Try again.</p>
        ) : null}
        {!wo && !refundAvailabilityQ.isFetching && !refundAvailabilityQ.isError
          && refundAvailabilityQ.data && refundCustomers.length === 0 && !refundSearch ? (
            <p className="font-mont text-xs text-gray-05">No customers currently have credit available to refund.</p>
          ) : null}

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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Amount" required>
            <div className="space-y-1">
              <MoneyInput
                valueKobo={amount}
                onChangeKobo={setAmount}
                currency={currency}
                disabled={!wo && !customer}
              />
              {!wo && customer ? (
                <p className={cn(
                  "font-mont text-[11px]",
                  refundAmountOverLimit ? "text-destructive" : "text-gray-05",
                )}>
                  {refundAmountOverLimit
                    ? `Amount cannot exceed ${formatMoney(refundableAmount, currency)}.`
                    : `${formatMoney(refundableAmount, currency)} available to refund.`}
                </p>
              ) : null}
            </div>
          </FormField>
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
          stackOnMobile
          helper={wo
            ? "A write-off recognises the loss as expense and clears the receivable."
            : "A refund pays out a credit balance — cash leaves the bank."}
        />

        <FormField label="Next action">
          <select value={nextAction} onChange={(e) => setNextAction(e.target.value as "post" | "submit" | "draft")} className="h-9 w-full rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-black-01 focus:border-primary focus:outline-none">
            <option value="post">Post now</option>
            <option value="submit">Submit for approval</option>
            <option value="draft">Save as draft</option>
          </select>
        </FormField>
      </div>
    </DetailDrawer>
  );
}
