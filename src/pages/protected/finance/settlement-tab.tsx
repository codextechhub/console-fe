// Settlement — gateway settlement reconciliation (Vision "Settlement Recon"), house theme.
// A READ-ONLY PSP lens: confirmed collections (in) + paid payouts (out) matched against the
// entity's imported bank statement lines, by reference then exact amount. Three tabs
// (Matched / Unsettled / Unmatched bank lines) + KPIs. "Re-run match" just refetches (the
// reconciliation recomputes server-side; nothing is posted). The Fees column surfaces the
// PSP fee (gross − net settled) as an OBSERVATION — the authoritative book-vs-bank close
// lives in Finance → Bank Reconciliation, which is where such a fee gets an adjusting entry.

import { useMemo, useState, type ReactNode } from "react";
import { Download, RefreshCw, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Money, KpiCard } from "@/components/finance-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { useGetSettlementReconciliationQuery } from "@/redux/services/payments/payments-api";
import type { SettlementRow, UnmatchedBankLine } from "@/redux/services/payments/payments-types";
import { LoadingState, ErrorState } from "@/components/finance-ui/states";

const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

const PROVIDERS: Record<string, { label: string; dot: string }> = {
  PAYSTACK: { label: "Paystack", dot: "bg-blue-500" },
  OPAY: { label: "OPay", dot: "bg-green-500" },
  FAKE: { label: "Fake (test)", dot: "bg-gray-400" },
};
function ProviderTag({ provider }: { provider: string }) {
  const p = PROVIDERS[provider] ?? { label: provider || "—", dot: "bg-gray-400" };
  return <span className="inline-flex items-center gap-1.5 font-mont text-xs text-black-01"><span className={cn("size-2 rounded-sm", p.dot)} /> {p.label}</span>;
}

function TypeTag({ kind }: { kind: string }) {
  const inbound = kind === "COLLECTION";
  return (
    <span className={cn("inline-flex items-center gap-1 font-mont text-[11px] font-medium", inbound ? "text-green-01" : "text-gray-01")}>
      {inbound ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}{inbound ? "Collection" : "Payout"}
    </span>
  );
}

function BasisPill({ basis }: { basis: string }) {
  if (!basis) return <span className="text-gray-05">—</span>;
  return <span className={cn(PILL, "bg-blue-50 text-blue-700")}>By {basis}</span>;
}

function Select({ value, onChange, children, className }: { value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 rounded-md border border-gray-03 bg-white px-2.5 font-mont text-xs text-black-01 focus:border-primary focus:outline-none", className)}>
      {children}
    </select>
  );
}

type Tab = "matched" | "unsettled" | "unmatched";

export function SettlementTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [provider, setProvider] = useState("");
  const [tab, setTab] = useState<Tab>("matched");
  const { data, isLoading, isFetching, isError, refetch } = useGetSettlementReconciliationQuery({ entity, ...(provider ? { provider } : {}) });
  const recon = data?.data;

  const rows = useMemo(() => recon?.rows ?? [], [recon]);
  const matched = useMemo(() => rows.filter((r) => r.settled), [rows]);
  const unsettled = useMemo(() => rows.filter((r) => !r.settled), [rows]);
  const unmatched = recon?.unmatched_bank_lines ?? [];
  const s = recon?.summary;

  if (isLoading) return <LoadingState />;
  if (isError || !recon) return <ErrorState onRetry={refetch} />;

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "matched", label: "Matched", n: s?.settled_count ?? matched.length },
    { id: "unsettled", label: "Unsettled", n: s?.unsettled_count ?? unsettled.length },
    { id: "unmatched", label: "Unmatched bank lines", n: s?.unmatched_bank_count ?? unmatched.length },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Settled (matched)" value={String(s?.settled_count ?? 0)} foot="Gateway ↔ bank" tone={recon.is_reconciled ? "live" : "default"} />
        <KpiCard label="Unsettled" value={String(s?.unsettled_count ?? 0)} tone={(s?.unsettled_count ?? 0) > 0 ? "warn" : "default"} foot="No bank line yet" />
        <KpiCard label="Unmatched bank lines" value={String(s?.unmatched_bank_count ?? 0)} tone={(s?.unmatched_bank_count ?? 0) > 0 ? "warn" : "default"} foot="No gateway record" />
        <KpiCard label="Unexplained bank total" value={formatMoney(Math.abs(s?.unmatched_bank_total ?? 0), currency)} foot="Bank lines left over" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-[#ECECEC] p-1">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn("whitespace-nowrap rounded-md px-3 py-1.5 font-mont text-xs transition-colors",
                tab === t.id ? "bg-white font-semibold text-black-01 shadow-sm ring-1 ring-black/5" : "font-medium text-gray-05 hover:text-gray-01")}>
              {t.label} <span className="ml-1 tabular-nums text-gray-05">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select value={provider} onChange={setProvider} className="w-40">
            <option value="">All providers</option>
            {Object.entries(PROVIDERS).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}
          </Select>
          <Button variant="outline" onClick={() => exportCsv(tab, matched, unsettled, unmatched, currency)} className="gap-1.5"><Download className="size-4" /> Export</Button>
          <Button variant="outline" disabled={isFetching} onClick={() => refetch()} className="gap-1.5"><RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Re-run match</Button>
        </div>
      </div>

      <p className="font-mont text-[11px] text-gray-05">
        A read-only gateway-settlement view. The authoritative book-vs-bank close lives in <span className="font-medium text-gray-01">Bank Reconciliation</span>; fees here are shown as an observation, not posted.
      </p>

      {tab === "unmatched" ? (
        <UnmatchedTable lines={unmatched} currency={currency} />
      ) : (
        <SettlementTable rows={tab === "matched" ? matched : unsettled} matched={tab === "matched"} currency={currency} />
      )}
    </div>
  );
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return <th className={cn("px-3 py-2 font-medium", right && "text-right")}>{children}</th>;
}

function SettlementTable({ rows, matched, currency }: { rows: SettlementRow[]; matched: boolean; currency?: string | null }) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-03 bg-white">
      <table className="w-full font-mont text-xs">
        <thead>
          <tr className="border-b border-gray-03 text-left text-[11px] uppercase tracking-wide text-gray-05">
            <Th>Date</Th><Th>Type</Th><Th>Provider</Th><Th>Reference</Th>
            <Th right>Gross</Th>
            {matched ? <><Th right>Fees</Th><Th right>Net settled</Th><Th>Settlement ref</Th><Th>Match basis</Th></> : <Th>Status</Th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.kind}-${r.gateway_id}`} className="border-b border-gray-02 last:border-0">
              <td className="px-3 py-2 tabular-nums text-gray-05">{fmtDate(r.confirmed_at)}</td>
              <td className="px-3 py-2"><TypeTag kind={r.kind} /></td>
              <td className="px-3 py-2"><ProviderTag provider={r.provider} /></td>
              <td className="px-3 py-2 tabular-nums text-gray-01">{r.reference}</td>
              <td className="px-3 py-2 text-right tabular-nums font-medium"><Money kobo={Math.abs(r.amount)} currency={currency} align="right" /></td>
              {matched ? (
                <>
                  <td className="px-3 py-2 text-right tabular-nums text-destructive">{r.fee_amount ? formatMoney(r.fee_amount, currency) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(Math.abs(r.settled_amount ?? r.amount), currency)}</td>
                  <td className="px-3 py-2 tabular-nums text-gray-05">{r.settlement_reference || "—"}</td>
                  <td className="px-3 py-2"><BasisPill basis={r.match_basis} /></td>
                </>
              ) : (
                <td className="px-3 py-2"><span className={cn(PILL, "bg-amber-50 text-amber-700")}>Awaiting bank</span></td>
              )}
            </tr>
          ))}
          {!rows.length ? <tr><td colSpan={matched ? 9 : 6} className="px-3 py-8 text-center text-gray-05">{matched ? "No matched settlements in range." : "Everything is settled — nothing awaiting the bank."}</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

function UnmatchedTable({ lines, currency }: { lines: UnmatchedBankLine[]; currency?: string | null }) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-03 bg-white">
      <table className="w-full font-mont text-xs">
        <thead>
          <tr className="border-b border-gray-03 text-left text-[11px] uppercase tracking-wide text-gray-05">
            <Th>Date</Th><Th>Description</Th><Th>Reference</Th><Th right>Amount</Th>
          </tr>
        </thead>
        <tbody>
          {lines.map((b) => (
            <tr key={b.bank_line_id} className="border-b border-gray-02 last:border-0">
              <td className="px-3 py-2 tabular-nums text-gray-05">{fmtDate(b.txn_date)}</td>
              <td className="px-3 py-2 text-gray-01">{b.description || "—"}</td>
              <td className="px-3 py-2 tabular-nums text-gray-05">{b.reference || "—"}</td>
              <td className={cn("px-3 py-2 text-right tabular-nums font-medium", b.amount < 0 ? "text-destructive" : "text-black-01")}>{b.amount < 0 ? "−" : ""}{formatMoney(Math.abs(b.amount), currency)}</td>
            </tr>
          ))}
          {!lines.length ? <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-05">No unexplained bank lines — every line maps to a gateway record.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

function exportCsv(tab: Tab, matched: SettlementRow[], unsettled: SettlementRow[], unmatched: UnmatchedBankLine[], currency?: string | null) {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  let head: string[]; let body: string[];
  if (tab === "unmatched") {
    head = ["Date", "Description", "Reference", "Amount"];
    body = unmatched.map((b) => [fmtDate(b.txn_date), b.description, b.reference, formatMoney(b.amount, currency)].map(esc).join(","));
  } else {
    const rows = tab === "matched" ? matched : unsettled;
    head = tab === "matched"
      ? ["Date", "Type", "Provider", "Reference", "Gross", "Fees", "Net settled", "Settlement ref", "Match basis"]
      : ["Date", "Type", "Provider", "Reference", "Gross", "Status"];
    body = rows.map((r) => {
      const base = [fmtDate(r.confirmed_at), r.kind === "COLLECTION" ? "Collection" : "Payout", PROVIDERS[r.provider]?.label ?? r.provider, r.reference, formatMoney(Math.abs(r.amount), currency)];
      const extra = tab === "matched"
        ? [formatMoney(r.fee_amount, currency), formatMoney(Math.abs(r.settled_amount ?? r.amount), currency), r.settlement_reference, r.match_basis ? `By ${r.match_basis}` : ""]
        : ["Awaiting bank"];
      return [...base, ...extra].map(esc).join(",");
    });
  }
  const csv = [head.map(esc).join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `settlement-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
