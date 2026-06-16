// Receivables → Customer Invoices. Design topology in the house theme: KPI cards
// (invoiced / collected / collection rate / overdue), status tabs with counts,
// search, a Customer-avatar table with a derived status pill, and a totals footer.
// Keeps the detail drawer + the write-off action.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { DataTable, DetailDrawer, Money, StatusPill, ConfirmActionModal, Sparkline, InfoHint, CHART_COLORS, toArray, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import { useGetInvoicesQuery, useGetInvoiceSummaryQuery, useWriteOffInvoiceMutation } from "@/redux/services/finance/ar-api";
import type { Invoice } from "@/redux/services/finance/ar-types";

const TABS = [
  { key: "", label: "All" }, { key: "draft", label: "Draft" }, { key: "issued", label: "Issued" },
  { key: "partial", label: "Partial" }, { key: "paid", label: "Paid" }, { key: "overdue", label: "Overdue" },
] as const;
const STATUS_PILL: Record<string, string> = {
  DRAFT: "bg-gray-03/60 text-gray-05", ISSUED: "bg-blue-50 text-blue-700",
  PARTIAL: "bg-amber-50 text-amber-700", PAID: "bg-green-01/10 text-green-01",
  OVERDUE: "bg-destructive/10 text-destructive",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", ISSUED: "Issued", PARTIAL: "Partially Paid", PAID: "Paid", OVERDUE: "Overdue",
};
const todayISO = new Date().toISOString().slice(0, 10);

function derivedStatus(i: Invoice): string {
  if (i.status === "DRAFT") return "DRAFT";
  if (i.status !== "POSTED") return i.status;
  if (i.payment_status === "PAID") return "PAID";
  if (i.due_date && i.due_date < todayISO) return "OVERDUE";
  if (i.payment_status === "PARTIAL") return "PARTIAL";
  return "ISSUED";
}
const pctChange = (arr: number[]) => {
  const a = arr[arr.length - 1], b = arr[arr.length - 2];
  return b ? ((a - b) / Math.abs(b)) * 100 : null;
};

function Initials({ name }: { name: string }) {
  const init = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pry-01 font-mont text-[10px] font-semibold text-primary">{init || "—"}</span>;
}

function Kpi({ label, value, spark, delta, color, deltaIsPoints }: {
  label: string; value: string; spark?: number[]; delta: number | null; color: string; deltaIsPoints?: boolean;
}) {
  const up = (delta ?? 0) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="font-mont text-xs text-gray-05">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-mont text-xl font-semibold tabular-nums text-black-01">{value}</p>
        {spark && spark.length > 1 && <Sparkline data={spark} color={color} />}
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {delta == null ? <span className="font-mont text-xs text-gray-05">—</span> : (
          <span className={cn("inline-flex items-center gap-0.5 font-mont text-xs font-semibold", up ? "text-green-01" : "text-destructive")}>
            <Icon className="size-3.5" />{up ? "+" : ""}{delta.toFixed(1)}{deltaIsPoints ? "pp" : "%"}
          </span>
        )}
        <span className="font-mont text-[11px] text-gray-05">vs prior month</span>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p>
      <p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p>
    </div>
  );
}

export function InvoicesTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [bucket, setBucket] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [writeOff, setWriteOff] = useState(false);
  const [reason, setReason] = useState("");

  const params = useMemo(() => ({ entity, page, ...(bucket ? { bucket } : {}), ...(search ? { search } : {}) }), [entity, page, bucket, search]);
  const { data, isLoading, isFetching, isError, refetch } = useGetInvoicesQuery(params);
  const summaryQ = useGetInvoiceSummaryQuery({ entity, ...(search ? { search } : {}) });
  const summary = summaryQ.data?.data;
  const [doWriteOff, { isLoading: writingOff }] = useWriteOffInvoiceMutation();

  const rows = toArray<Invoice>(data?.data);
  const pg = data?.pagination;
  const count = (key: string) => key ? (summary?.by_status?.[key as "draft"] ?? 0) : (summary?.total ?? summary?.by_status?.total ?? 0);

  const inv = summary?.monthly.map((m) => m.invoiced) ?? [];
  const col = summary?.monthly.map((m) => m.collected) ?? [];
  const rate = summary?.monthly.map((m) => (m.invoiced ? (m.collected / m.invoiced) * 100 : 0)) ?? [];

  const submitWriteOff = async () => {
    if (!selected) return;
    try {
      const res = await doWriteOff({ id: selected.id, entity, reason }).unwrap();
      toast.success(res.message || "Invoice written off.");
      setWriteOff(false); setReason(""); setSelected(null);
    } catch { /* central */ }
  };

  const columns: Column<Invoice>[] = [
    { header: "Invoice No.", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Customer", cell: (r) => (
      <span className="inline-flex items-center gap-2">
        <Initials name={r.customer_name} />
        <span><span className="font-medium text-gray-01">{r.customer_name}</span><span className="ml-1 text-gray-05">{r.customer_code}</span></span>
      </span>
    ) },
    { header: "Invoice date", cell: (r) => <span className="tabular-nums">{r.invoice_date}</span> },
    { header: "Due date", cell: (r) => <span className="tabular-nums">{r.due_date ?? "—"}</span> },
    { header: "Total", align: "right", cell: (r) => <Money kobo={r.total} currency={currency} align="right" /> },
    { header: "Paid", align: "right", cell: (r) => r.amount_paid ? <Money kobo={r.amount_paid} currency={currency} align="right" /> : <span className="text-gray-05">—</span> },
    { header: "Balance", align: "right", cell: (r) => <Money kobo={r.balance_due} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => { const s = derivedStatus(r); return <span className={cn("rounded px-2 py-0.5 font-mont text-[11px] font-medium", STATUS_PILL[s] ?? "bg-gray-03/60 text-gray-05")}>{STATUS_LABEL[s] ?? s}</span>; } },
  ];

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total invoiced" value={formatMoney(summary?.kpis.total_invoiced.kobo ?? 0, currency)} spark={inv} delta={pctChange(inv)} color={CHART_COLORS.primary} />
        <Kpi label="Total collected" value={formatMoney(summary?.kpis.total_collected.kobo ?? 0, currency)} spark={col} delta={pctChange(col)} color={CHART_COLORS.green} />
        <Kpi label="Collection rate" value={`${(summary?.kpis.collection_rate ?? 0).toFixed(1)}%`} spark={rate} delta={rate.length > 1 ? rate[rate.length - 1] - rate[rate.length - 2] : null} deltaIsPoints color={CHART_COLORS.violet} />
        <Kpi label="Overdue balance" value={formatMoney(summary?.kpis.overdue_balance.kobo ?? 0, currency)} delta={null} color={CHART_COLORS.red} />
      </div>

      {/* status tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-03 bg-white p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setBucket(t.key); setPage(1); }}
            className={cn("rounded-md px-3 py-1.5 font-mont text-xs font-semibold", bucket === t.key ? "bg-primary text-white" : "text-gray-05 hover:bg-gray-50 hover:text-gray-01")}>
            {t.label} <span className="ml-1 opacity-70">{count(t.key)}</span>
          </button>
        ))}
      </div>

      {/* search */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <Input value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} placeholder="Search invoice no / customer" className="h-9 w-64 pl-8 font-mont text-sm" />
        </div>
        <InfoHint>Customer invoices debit Accounts Receivable and credit revenue on posting. A payment is recorded against the invoice; the AR control account must equal the sum of open invoice balances — a tie reconciled at period close.</InfoHint>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        onRowClick={setSelected}
        emptyTitle="No invoices" emptyMessage="No invoices match these filters."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />

      {summary && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-4 py-2.5 font-mont text-xs text-gray-05">
          <span>{summary.totals.count} invoices</span>
          <span className="flex gap-4">
            <span>Total <span className="font-semibold text-black-01">{formatMoney(summary.totals.total.kobo, currency)}</span></span>
            <span>Outstanding <span className="font-semibold text-black-01">{formatMoney(summary.totals.outstanding.kobo, currency)}</span></span>
          </span>
        </div>
      )}

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.document_number ?? "Invoice"}
        description={selected ? `${selected.customer_name} · ${selected.invoice_date}` : undefined}
        footer={
          selected && selected.status === "POSTED" && selected.balance_due > 0 ? (
            <Can permission={P.FIN_WRITE_OFF_INVOICE}>
              <Button variant="outline" onClick={() => setWriteOff(true)} className="border-destructive/40 text-destructive hover:bg-destructive/5">Write off balance</Button>
            </Can>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3"><StatusPill status={selected.status} /><StatusPill status={selected.payment_status} /></div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer" value={`${selected.customer_name} (${selected.customer_code})`} />
              <Field label="Reference" value={selected.reference} />
              <Field label="Subtotal" value={<Money kobo={selected.subtotal} currency={currency} />} />
              <Field label="Tax" value={<Money kobo={selected.tax_total} currency={currency} />} />
              <Field label="Total" value={<Money kobo={selected.total} currency={currency} />} />
              <Field label="Paid" value={<Money kobo={selected.amount_paid} currency={currency} />} />
              <Field label="Balance due" value={<Money kobo={selected.balance_due} currency={currency} />} />
              <Field label="Due date" value={selected.due_date} />
            </div>
            {selected.narration && <Field label="Narration" value={selected.narration} />}
          </div>
        )}
      </DetailDrawer>

      <ConfirmActionModal
        open={writeOff}
        onOpenChange={setWriteOff}
        title="Write off invoice balance?"
        description={`Books the outstanding balance of ${selected?.document_number} as bad debt.`}
        confirmText="Write off"
        destructive
        loading={writingOff}
        confirmDisabled={!reason.trim()}
        onConfirm={submitWriteOff}
      >
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for write-off (required)" className="bg-white" />
      </ConfirmActionModal>
    </div>
  );
}
