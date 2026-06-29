// Transactions Log — a unified money-movement feed (Vision "Transactions Log"), house theme.
// Merges Collections (money IN) and Payouts (money OUT) into one read-only ledger: KPIs
// (money in/out 7d, pending, failed), direction/status/provider filters, and a row drawer
// with the fuller detail of each movement. Built client-side from the two existing flat
// endpoints — no new backend. (The PaymentEvent action/audit log is a separate stream.)
// Beneficiary details stay FLS-masked without payments.payout.view_sensitive.

import { useMemo, useState, type ReactNode } from "react";
import { Download, ArrowDownLeft, ArrowUpRight, Receipt, Banknote } from "lucide-react";
import { DataTable, Money, KpiCard, DetailDrawer, toArray, type Column } from "@/components/finance-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { isStripped } from "@/utils/fls";
import { LoadingState, ErrorState } from "@/components/finance-ui/states";
import { useGetCollectionsQuery } from "@/redux/services/payments/payments-api";
import { useGetPayoutsQuery } from "@/redux/services/payments/payments-api";
import type { Collection, PayoutInstruction } from "@/redux/services/payments/payments-types";

const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const MASK = "••••";
const fmtDateTime = (s?: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const PROVIDERS: Record<string, { label: string; dot: string }> = {
  PAYSTACK: { label: "Paystack", dot: "bg-blue-500" },
  OPAY: { label: "OPay", dot: "bg-green-500" },
  FAKE: { label: "Fake (test)", dot: "bg-gray-400" },
};
function ProviderTag({ provider }: { provider: string }) {
  const p = PROVIDERS[provider] ?? { label: provider || "—", dot: "bg-gray-400" };
  return <span className="inline-flex items-center gap-1.5 font-mont text-sm text-black-01"><span className={cn("size-2 rounded-sm", p.dot)} /> {p.label}</span>;
}

const STATUS_STYLE: Record<string, string> = {
  Paid: "bg-green-01/10 text-green-01",
  Settled: "bg-green-01/10 text-green-01",
  Pending: "bg-amber-50 text-amber-700",
  Failed: "bg-destructive/10 text-destructive",
  Refunded: "bg-blue-50 text-blue-700",
};
function StatusPill({ status }: { status: string }) {
  return <span className={cn(PILL, STATUS_STYLE[status] ?? "bg-gray-02 text-gray-01")}>{status}</span>;
}
function DirectionTag({ dir }: { dir: "in" | "out" }) {
  return (
    <span className={cn("inline-flex items-center gap-1", PILL, dir === "in" ? "bg-green-01/10 text-green-01" : "bg-amber-50 text-amber-700")}>
      {dir === "in" ? <ArrowDownLeft className="size-3" /> : <ArrowUpRight className="size-3" />}{dir === "in" ? "In" : "Out"}
    </span>
  );
}

function Select({ value, onChange, children, className }: { value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 rounded-md border border-gray-03 bg-white px-2.5 font-mont text-xs text-black-01 focus:border-primary focus:outline-none", className)}>
      {children}
    </select>
  );
}

const COL_STATUS: Record<string, string> = { SUCCEEDED: "Paid", PENDING: "Pending", PROCESSING: "Pending", FAILED: "Failed", ABANDONED: "Failed", REFUNDED: "Refunded" };
const PO_STATUS: Record<string, string> = { PAID: "Settled", PENDING: "Pending", PROCESSING: "Pending", FAILED: "Failed", REVERSED: "Failed" };
const colParty = (c: Collection) => c.customer_name || c.payer_name || c.customer_code || "—";
const poParty = (p: PayoutInstruction) => (isStripped(p, "beneficiary_name") ? MASK : p.beneficiary_name || "—");

type Move = {
  key: string; kind: "collection" | "payout"; direction: "in" | "out";
  reference: string; date: string; party: string; provider: string;
  amount: number; status: string; col?: Collection; po?: PayoutInstruction;
};

export function TransactionsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [picked, setPicked] = useState<Move | null>(null);

  const cq = useGetCollectionsQuery({ entity });
  const pq = useGetPayoutsQuery({ entity });

  const all = useMemo<Move[]>(() => {
    const cols = toArray<Collection>(cq.data?.data).map<Move>((c) => ({
      key: `c-${c.id}`, kind: "collection", direction: "in", reference: c.reference,
      date: c.created_at, party: colParty(c), provider: c.provider, amount: c.amount,
      status: COL_STATUS[c.status] ?? c.status, col: c,
    }));
    const pos = toArray<PayoutInstruction>(pq.data?.data).map<Move>((p) => ({
      key: `p-${p.id}`, kind: "payout", direction: "out", reference: p.reference,
      date: p.created_at, party: poParty(p), provider: p.provider, amount: p.amount,
      status: PO_STATUS[p.status] ?? p.status, po: p,
    }));
    return [...cols, ...pos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cq.data, pq.data]);

  const rows = useMemo(() => all.filter((m) =>
    (!direction || m.direction === direction) && (!status || m.status === status) && (!provider || m.provider === provider)), [all, direction, status, provider]);

  const kpis = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS;
    const cols = toArray<Collection>(cq.data?.data);
    const pos = toArray<PayoutInstruction>(pq.data?.data);
    return {
      in7d: cols.filter((c) => c.status === "SUCCEEDED" && !!c.confirmed_at && new Date(c.confirmed_at).getTime() >= cutoff).reduce((s, c) => s + c.amount, 0),
      out7d: pos.filter((p) => p.status === "PAID" && !!p.confirmed_at && new Date(p.confirmed_at).getTime() >= cutoff).reduce((s, p) => s + p.amount, 0),
      pending: all.filter((m) => m.status === "Pending").length,
      failed: all.filter((m) => m.status === "Failed").length,
    };
  }, [cq.data, pq.data, all]);

  const isLoading = cq.isLoading || pq.isLoading;
  const isError = cq.isError || pq.isError;
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => { cq.refetch(); pq.refetch(); }} />;

  const columns: Column<Move>[] = [
    { header: "Reference", cell: (m) => <span className="font-semibold tabular-nums text-gray-01">{m.reference}</span> },
    { header: "Date", cell: (m) => <span className="tabular-nums text-gray-05">{fmtDateTime(m.date)}</span> },
    { header: "Direction", cell: (m) => <DirectionTag dir={m.direction} /> },
    { header: "Party", cell: (m) => m.party },
    { header: "Provider", cell: (m) => <ProviderTag provider={m.provider} /> },
    { header: "Amount", align: "right", cell: (m) => <span className={cn(m.direction === "out" && "text-destructive")}><Money kobo={m.amount} currency={currency} align="right" /></span> },
    { header: "Status", cell: (m) => <StatusPill status={m.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Money in (7d)" value={formatMoney(kpis.in7d, currency)} foot="Settled collections" />
        <KpiCard label="Money out (7d)" value={formatMoney(kpis.out7d, currency)} foot="Paid payouts" />
        <KpiCard label="Pending" value={String(kpis.pending)} tone={kpis.pending > 0 ? "warn" : "default"} foot="Awaiting settlement" />
        <KpiCard label="Failed" value={String(kpis.failed)} tone={kpis.failed > 0 ? "warn" : "default"} foot="Rejected / failed" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={direction} onChange={setDirection} className="w-36"><option value="">All directions</option><option value="in">In</option><option value="out">Out</option></Select>
          <Select value={status} onChange={setStatus} className="w-36"><option value="">All status</option>{["Paid", "Settled", "Pending", "Failed", "Refunded"].map((s) => <option key={s} value={s}>{s}</option>)}</Select>
          <Select value={provider} onChange={setProvider} className="w-40"><option value="">All providers</option>{Object.entries(PROVIDERS).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}</Select>
        </div>
        <Button variant="outline" onClick={() => exportCsv(rows, currency)} disabled={!rows.length} className="gap-1.5"><Download className="size-4" /> Export</Button>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(m) => m.key} onRowClick={(m) => setPicked(m)}
        emptyTitle="No transactions" emptyMessage="Collections and payouts will appear here as one feed." />

      <p className="font-mont text-[11px] text-gray-05">{rows.length} transaction{rows.length === 1 ? "" : "s"} · a unified view of collections & payouts; each lives in full on its own screen.</p>

      <MovementDrawer move={picked} currency={currency} onClose={() => setPicked(null)} />
    </div>
  );
}

function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="font-mont text-[11px] text-gray-05">{label}</span>
      <span className={cn("text-right font-mont text-xs font-medium text-black-01", mono && "tabular-nums")}>{children}</span>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-gray-03 bg-white p-4">
      <p className="mb-1.5 font-mont text-[11px] font-semibold uppercase tracking-wide text-gray-05">{title}</p>
      <div className="divide-y divide-gray-02">{children}</div>
    </div>
  );
}

function MovementDrawer({ move, currency, onClose }: { move: Move | null; currency?: string | null; onClose: () => void }) {
  if (!move) return null;
  const inbound = move.direction === "in";

  return (
    <DetailDrawer open onOpenChange={(o) => (o ? undefined : onClose())}
      title={move.reference} description={`${inbound ? "Collection in" : "Payout out"} · ${PROVIDERS[move.provider]?.label ?? move.provider} · ${formatMoney(move.amount, currency)}`}
      widthClass="sm:max-w-md"
      footer={<><DirectionTag dir={move.direction} /><div className="flex-1" /><StatusPill status={move.status} /></>}>
      <div className="space-y-4">
        <Section title="Movement">
          <Field label="Reference" mono>{move.reference}</Field>
          <Field label="Direction">{inbound ? "Money in" : "Money out"}</Field>
          <Field label="Provider"><ProviderTag provider={move.provider} /></Field>
          <Field label="Amount" mono><span className={!inbound ? "text-destructive" : ""}>{formatMoney(move.amount, currency)}</span></Field>
          <Field label="Status"><StatusPill status={move.status} /></Field>
          <Field label="Created" mono>{fmtDateTime(move.date)}</Field>
        </Section>

        {move.col ? <CollectionDetail c={move.col} currency={currency} /> : null}
        {move.po ? <PayoutDetail p={move.po} currency={currency} /> : null}
      </div>
    </DetailDrawer>
  );
}

function CollectionDetail({ c, currency }: { c: Collection; currency?: string | null }) {
  return (
    <>
      <Section title="Counterparty">
        <Field label="Customer">{colParty(c)}</Field>
        {c.payer_email ? <Field label="Payer email">{c.payer_email}</Field> : null}
        {c.narration ? <Field label="Narration">{c.narration}</Field> : null}
        {c.provider_reference ? <Field label="Provider ref" mono>{c.provider_reference}</Field> : null}
      </Section>
      <Section title="Settlement">
        <Field label="Confirmed" mono>{fmtDateTime(c.confirmed_at)}</Field>
        <Field label="Deposit account" mono>{c.deposit_account_code ? `${c.deposit_account_code}` : "Bank / collections"}</Field>
        <Field label="Booked receipt">{c.payment_id ? <span className="inline-flex items-center gap-1"><Receipt className="size-3.5" /> #{c.payment_id}</span> : "—"}</Field>
      </Section>
    </>
  );
}

function PayoutDetail({ p, currency }: { p: PayoutInstruction; currency?: string | null }) {
  const acct = isStripped(p, "beneficiary_account_number") ? MASK : p.beneficiary_account_number || "—";
  return (
    <>
      <Section title="Beneficiary">
        <Field label="Name">{poParty(p)}</Field>
        <Field label="Account" mono>{p.beneficiary_bank_code ? `${p.beneficiary_bank_code} · ` : ""}{acct}</Field>
        {p.wht_amount ? <Field label="WHT withheld" mono>{formatMoney(p.wht_amount, currency)}</Field> : null}
        {p.narration ? <Field label="Narration">{p.narration}</Field> : null}
        {p.provider_reference ? <Field label="Provider ref" mono>{p.provider_reference}</Field> : null}
      </Section>
      <Section title="Settlement">
        <Field label="Confirmed" mono>{fmtDateTime(p.confirmed_at)}</Field>
        <Field label="Source account" mono>{p.source_account_code || "Cash & bank"}</Field>
        <Field label="Booked payment">{p.vendor_payment_id ? <span className="inline-flex items-center gap-1"><Banknote className="size-3.5" /> #{p.vendor_payment_id}</span> : "—"}</Field>
        {p.failure_reason ? <Field label="Failure"><span className="text-destructive">{p.failure_reason}</span></Field> : null}
      </Section>
    </>
  );
}

function exportCsv(rows: Move[], currency?: string | null) {
  const head = ["Reference", "Date", "Direction", "Party", "Provider", "Amount", "Status"];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const body = rows.map((m) => [
    m.reference, fmtDate(m.date), m.direction === "in" ? "In" : "Out", m.party,
    PROVIDERS[m.provider]?.label ?? m.provider, formatMoney(m.amount, currency), m.status,
  ].map(esc).join(","));
  const csv = [head.map(esc).join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
