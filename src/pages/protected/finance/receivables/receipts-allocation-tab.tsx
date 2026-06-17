// Receivables → Receipts & Allocation. Customer receipts (manual + gateway) and
// how much of each is applied to invoices. Prototype shape: KPIs (received today /
// this week / unallocated / count), status + method filters, an avatar table with
// each receipt's unallocated amount + status, Export, Record receipt, and a row-
// click allocation drawer.
import { useMemo, useState } from "react";
import { Search, Plus, Download } from "lucide-react";
import { DataTable, toArray, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import { useGetPaymentsQuery } from "@/redux/services/finance/ar-api";
import type { Payment } from "@/redux/services/finance/ar-types";
import { RecordReceiptModal } from "./record-receipt-modal";
import { PaymentAllocationDrawer } from "./payment-allocation-drawer";

const STATUS_TABS = [
  { key: "", label: "All" }, { key: "ALLOCATED", label: "Allocated" },
  { key: "PARTIAL", label: "Partial" }, { key: "UNALLOCATED", label: "Unallocated" },
] as const;
const STATUS_PILL: Record<string, string> = {
  ALLOCATED: "bg-green-01/10 text-green-01", PARTIAL: "bg-blue-50 text-blue-700",
  UNALLOCATED: "bg-amber-50 text-amber-700",
};
const STATUS_LABEL: Record<string, string> = { ALLOCATED: "Allocated", PARTIAL: "Partial", UNALLOCATED: "Unallocated" };
const METHODS = ["BANK_TRANSFER", "CASH", "CARD", "CHEQUE", "ONLINE", "OTHER"];
const methodLabel = (m: string) => m.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-2 font-mont text-sm focus:border-primary focus:outline-none";
const todayISO = new Date().toISOString().slice(0, 10);
const weekAgoISO = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);

function Initials({ name }: { name: string }) {
  const init = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pry-01 font-mont text-[10px] font-semibold text-primary">{init || "—"}</span>;
}
function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="font-mont text-xs text-gray-05">{label}</p>
      <p className="mt-1 font-mont text-xl font-semibold tabular-nums text-black-01">{value}</p>
      {hint && <p className="mt-0.5 font-mont text-[11px] text-gray-05">{hint}</p>}
    </div>
  );
}

export function ReceiptsAllocationTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetPaymentsQuery({ entity, search: search || undefined });
  const rows = toArray<Payment>(data?.data);

  const kpis = useMemo(() => {
    let today = 0, week = 0, unallocated = 0;
    for (const p of rows) {
      if (p.payment_date === todayISO) today += p.amount;
      if (p.payment_date >= weekAgoISO) week += p.amount;
      unallocated += p.unallocated_amount;
    }
    return { today, week, unallocated, count: rows.length };
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((p) => (!status || p.allocation_status === status) && (!method || p.method === method)),
    [rows, status, method],
  );
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of rows) m[p.allocation_status] = (m[p.allocation_status] ?? 0) + 1;
    return m;
  }, [rows]);

  const exportCsv = () => {
    const head = ["Receipt", "Date", "Customer", "Method", "Amount (kobo)", "Unallocated (kobo)", "Status"];
    const lines = filtered.map((p) => [p.document_number, p.payment_date, p.customer_name, methodLabel(p.method), String(p.amount), String(p.unallocated_amount), STATUS_LABEL[p.allocation_status]]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `receipts-${entity}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<Payment>[] = [
    { header: "Receipt No.", cell: (p) => <span className="font-semibold">{p.document_number}</span> },
    { header: "Date", cell: (p) => <span className="tabular-nums text-gray-05">{p.payment_date}</span> },
    { header: "Customer", cell: (p) => <span className="inline-flex items-center gap-2"><Initials name={p.customer_name} /><span className="font-medium text-gray-01">{p.customer_name}</span></span> },
    { header: "Method", cell: (p) => <span className="rounded bg-gray-03/40 px-2 py-0.5 font-mont text-[11px] text-gray-01">{methodLabel(p.method)}</span> },
    { header: "Amount", align: "right", cell: (p) => <span className="block text-right tabular-nums">{formatMoney(p.amount, currency)}</span> },
    { header: "Unallocated", align: "right", cell: (p) => p.unallocated_amount ? <span className="block text-right font-medium tabular-nums text-amber-700">{formatMoney(p.unallocated_amount, currency)}</span> : <span className="block text-right text-gray-05">—</span> },
    { header: "Status", cell: (p) => <span className={cn("rounded px-2 py-0.5 font-mont text-[11px] font-medium", STATUS_PILL[p.allocation_status])}>{STATUS_LABEL[p.allocation_status]}</span> },
  ];

  return (
    <div className="space-y-4">
      <p className="-mt-3 font-mont text-xs text-gray-05">Record money received and apply it to open invoices.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Received today" value={formatMoney(kpis.today, currency)} />
        <Kpi label="This week" value={formatMoney(kpis.week, currency)} hint="Last 7 days" />
        <Kpi label="Unallocated" value={formatMoney(kpis.unallocated, currency)} hint="Sitting unapplied" />
        <Kpi label="Receipts" value={String(kpis.count)} />
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-03 bg-white p-1">
        {STATUS_TABS.map((t) => (
          <button key={t.key} onClick={() => setStatus(t.key)}
            className={cn("rounded-md px-3 py-1.5 font-mont text-xs font-semibold", status === t.key ? "bg-primary text-white" : "text-gray-05 hover:bg-gray-50 hover:text-gray-01")}>
            {t.label} <span className="ml-1 opacity-70">{t.key ? (counts[t.key] ?? 0) : rows.length}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search receipt / customer / ref" className="h-9 w-64 pl-8 font-mont text-sm" />
        </div>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={selectCls} aria-label="Method">
          <option value="">All methods</option>
          {METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length} className="gap-1.5"><Download className="size-4" /> Export</Button>
          <Can permission={P.FIN_RECORD_PAYMENT}>
            <Button onClick={() => setNewOpen(true)} className="gap-1.5"><Plus className="size-4" /> Record receipt</Button>
          </Can>
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        onRowClick={(p) => setSelected(p.id)}
        emptyTitle="No receipts" emptyMessage="Recorded receipts will appear here." />

      <RecordReceiptModal open={newOpen} onOpenChange={setNewOpen} entity={entity} />
      <PaymentAllocationDrawer id={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
    </div>
  );
}
