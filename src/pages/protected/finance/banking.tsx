// Banking & reconciliation (§6.5), redesigned to the Vision prototype in the
// house theme: KPIs, a bank-accounts table (account number FLS-masked, Primary
// badge, book balance, last reconciled), and a tabbed detail drawer
// (Transactions · Statement lines · Statements · Reconciliations · Settings)
// with Book/Statement/Unreconciled metric cards, Import statement and
// Auto-reconcile.
//
// Honest adaptations: the prototype's "Cash books / petty cash" lives on the
// separate Petty Cash screen; USD-position / cash-on-hand KPIs (FX + petty cash)
// are dropped. We store statement *lines*, grouped under imported Statements.

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { Plus, Search, Trash2, Upload, RefreshCw, ListChecks, FileText, History, Settings as SettingsIcon, ArrowLeftRight } from "lucide-react";
import { FinanceShell } from "./finance-shell";
import { DataTable, DetailDrawer, Money, StatusPill, FormField, AccountPicker, CurrencyPicker, InfoHint, useActiveEntity, toArray, type Column } from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { EmptyState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import { isStripped } from "@/utils/fls";
import {
  useGetBankAccountsQuery, useGetBankAccountQuery, useCreateBankAccountMutation,
  useUpdateBankAccountMutation, useGetStatementLinesQuery, useImportStatementMutation,
  useAutoReconcileMutation,
} from "@/redux/services/finance/ops-api";
import type { BankAccount } from "@/redux/services/finance/ops-types";

const todayISO = new Date().toISOString().slice(0, 10);
const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const thCls = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const tdCls = "border-t border-gray-03 px-3 py-2 font-mont text-xs text-black-01";
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
const partialMask = (n: string) => {
  const s = n.replace(/\s+/g, "");
  return s.length <= 4 ? s : `${s.slice(0, 4)} **** ${s.slice(-4)}`;
};
// Detail-drawer subtitle keeps the full (sensitive) number; the list uses partial.
const maskedNumber = (a: { account_number?: string; _stripped_fields?: string[] }) =>
  isStripped(a, "account_number") ? "••••" : (a.account_number || "—");
const listAcctNo = (a: { account_number?: string; _stripped_fields?: string[] }) =>
  isStripped(a, "account_number") ? "••••" : (a.account_number ? partialMask(a.account_number) : "—");

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="font-mont text-xs text-gray-05">{label}</p>
      <p className="mt-1 font-mont text-xl font-semibold tabular-nums text-black-01">{value}</p>
      {hint && <p className="mt-0.5 font-mont text-[11px] text-gray-05">{hint}</p>}
    </div>
  );
}

export default function BankingPage() {
  const { code: entity, currency } = useActiveEntity();
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim().toLowerCase(), 250);

  const { data, isLoading, isFetching, isError, refetch } = useGetBankAccountsQuery(
    { entity: entity! }, { skip: !entity });
  const rows = useMemo(() => toArray(data?.data), [data]);
  const filtered = useMemo(() => !search ? rows : rows.filter((a) =>
    a.name.toLowerCase().includes(search) || (a.bank_name || "").toLowerCase().includes(search)
    || (a.gl_account || "").toLowerCase().includes(search)
    || (a.account_number || "").toLowerCase().includes(search)), [rows, search]);

  const kpis = useMemo(() => {
    const total = rows.reduce((s, a) => s + (a.book_balance || 0), 0);
    const active = rows.filter((a) => a.is_active).length;
    const unrec = rows.reduce((s, a) => s + (a.unreconciled_count || 0), 0);
    const last = rows.map((a) => a.last_reconciled_at).filter(Boolean).sort().pop() ?? null;
    return { total, active, unrec, last };
  }, [rows]);

  const columns: Column<BankAccount>[] = [
    { header: "Account", cell: (a) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-01">{a.name}</span>
          {a.is_primary ? <span className={cn(PILL, "bg-blue-50 text-blue-700")}>Primary</span> : null}
        </div>
        <div className="mt-0.5 font-mont text-[11px] tabular-nums text-gray-05">A/C {listAcctNo(a)}</div>
      </div>
    ) },
    { header: "GL", cell: (a) => <span className="tabular-nums text-gray-05">{a.gl_account}</span> },
    { header: "Currency", cell: (a) => a.currency ?? "—" },
    { header: "Book balance", align: "right", cell: (a) => <Money kobo={a.book_balance} currency={currency} align="right" /> },
    { header: "Last reconciled", cell: (a) => <span className="tabular-nums text-gray-05">{fmtDate(a.last_reconciled_at)}</span> },
    { header: "Status", cell: (a) => <StatusPill status={a.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  if (!entity) {
    return <FinanceShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></FinanceShell>;
  }

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-mont text-lg font-semibold text-gray-01">Bank Accounts</h1>
              <InfoHint>Each bank account maps 1:1 to a GL cash account — the ledger's book balance. Import the bank's statement and reconcile to explain every difference (in-flight items, charges); auto-reconcile pairs lines by amount and date.</InfoHint>
            </div>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Bank accounts, statement import and reconciliation.</p>
          </div>
          <Can permission={P.FIN_CREATE_BANK_ACCOUNT}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New bank account</Button>
          </Can>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total bank balance" value={formatMoney(kpis.total, currency)} hint="Across active accounts" />
          <Kpi label="Active accounts" value={String(kpis.active)} />
          <Kpi label="Unreconciled lines" value={String(kpis.unrec)} hint="Awaiting a match" />
          <Kpi label="Last reconciled" value={fmtDate(kpis.last)} />
        </div>

        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, bank or GL" className="h-9 bg-white pl-8 font-mont" />
        </div>

        <DataTable
          columns={columns} rows={filtered} rowKey={(a) => a.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch}
          onRowClick={setSelected}
          emptyTitle={search ? "No matching accounts" : "No bank accounts"}
          emptyMessage={search ? "Try a different search." : "Add a bank account to import statements and reconcile."}
        />
      </main>

      <BankAccountDrawer account={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
      <CreateBankAccountModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </FinanceShell>
  );
}

const TABS = [
  { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { key: "lines", label: "Statement lines", icon: ListChecks },
  { key: "statements", label: "Statements", icon: FileText },
  { key: "reconciliations", label: "Reconciliations", icon: History },
  { key: "settings", label: "Settings", icon: SettingsIcon },
] as const;

function MetricCard({ label, kobo, currency, danger }: { label: string; kobo: number; currency?: string | null; danger?: boolean }) {
  return (
    <div className="rounded-md border border-gray-03 bg-white p-3">
      <p className="font-mont text-[11px] text-gray-05">{label}</p>
      <p className={cn("mt-1 font-mont text-base font-semibold tabular-nums", danger && kobo !== 0 ? "text-destructive" : "text-black-01")}>{formatMoney(kobo, currency)}</p>
    </div>
  );
}

function BankAccountDrawer({ account, entity, currency, onClose }: { account: BankAccount | null; entity: string; currency?: string | null; onClose: () => void }) {
  const { can } = useCan();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("transactions");
  const [importing, setImporting] = useState(false);
  const { data } = useGetBankAccountQuery(account ? { id: account.id, entity } : skipToken);
  const detail = data?.data;
  const [reconcile, { isLoading: reconciling }] = useAutoReconcileMutation();
  if (!account) return null;

  const m = detail?.metrics;
  const doReconcile = async () => {
    try {
      const res = await reconcile({ id: account.id, entity }).unwrap();
      toast.success(res.message || "Auto-reconcile complete.");
    } catch { /* central */ }
  };

  return (
    <>
      <DetailDrawer
        open={!!account} onOpenChange={(o) => (o ? undefined : onClose())}
        title={account.name}
        description={`${account.bank_name || "—"} · ${account.gl_account} · ${maskedNumber(account)}`}
        widthClass="sm:max-w-3xl"
        footer={
          <>
            <StatusPill status={account.is_active ? "ACTIVE" : "INACTIVE"} />
            <div className="flex-1" />
            <Can permission={P.FIN_IMPORT_BANK}>
              <Button variant="outline" onClick={() => setImporting(true)} className="gap-1.5"><Upload className="size-4" /> Import statement</Button>
            </Can>
            <Can permission={P.FIN_RECONCILE_BANK}>
              <Button onClick={doReconcile} disabled={reconciling} className="gap-1.5"><RefreshCw className="size-4" />{reconciling ? "Reconciling…" : "Auto-reconcile"}</Button>
            </Can>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Book balance" kobo={m?.book_balance ?? account.book_balance} currency={currency} />
            <MetricCard label="Statement balance" kobo={m?.statement_balance ?? 0} currency={currency} />
            <MetricCard label="Unreconciled diff" kobo={m?.unreconciled_diff ?? 0} currency={currency} danger />
          </div>

          <div className="flex flex-wrap gap-1 border-b border-gray-03">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 font-mont text-xs font-semibold",
                  tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-05 hover:text-gray-01")}>
                <t.icon className="size-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {tab === "transactions" && <TransactionsTab detail={detail} currency={currency} />}
          {tab === "lines" && <StatementLinesTab id={account.id} entity={entity} currency={currency} />}
          {tab === "statements" && <StatementsTab detail={detail} currency={currency} />}
          {tab === "reconciliations" && <ReconciliationsTab detail={detail} currency={currency} />}
          {tab === "settings" && <SettingsTab account={account} entity={entity} canEdit={can(P.FIN_UPDATE_BANK_ACCOUNT)} />}
        </div>
      </DetailDrawer>

      {importing ? <ImportStatementDrawer id={account.id} entity={entity} onClose={() => setImporting(false)} /> : null}
    </>
  );
}

function TransactionsTab({ detail, currency }: { detail?: { transactions: import("@/redux/services/finance/ops-types").BankTransaction[] }; currency?: string | null }) {
  const txns = detail?.transactions ?? [];
  if (txns.length === 0) return <EmptyState title="No transactions" message="Posted movements on this account's GL appear here." />;
  return (
    <div className="overflow-hidden rounded-md border border-gray-03">
      <table className="w-full border-collapse">
        <thead><tr>
          <th className={thCls}>Date</th><th className={thCls}>Description</th><th className={thCls}>Reference</th>
          <th className={cn(thCls, "text-right")}>Debit</th><th className={cn(thCls, "text-right")}>Credit</th>
          <th className={cn(thCls, "text-right")}>Balance</th><th className={thCls} />
        </tr></thead>
        <tbody>
          {txns.map((t) => (
            <tr key={t.id}>
              <td className={cn(tdCls, "tabular-nums text-gray-05")}>{fmtDate(t.date)}</td>
              <td className={tdCls}>{t.description}</td>
              <td className={cn(tdCls, "tabular-nums text-gray-05")}>{t.reference || "—"}</td>
              <td className={cn(tdCls, "text-right tabular-nums")}>{t.debit ? <span className="text-black-01">{formatMoney(t.debit, currency)}</span> : <span className="text-gray-05">—</span>}</td>
              <td className={cn(tdCls, "text-right tabular-nums text-green-01")}>{t.credit ? formatMoney(t.credit, currency) : <span className="text-gray-05">—</span>}</td>
              <td className={cn(tdCls, "text-right tabular-nums font-medium")}>{formatMoney(t.running_balance, currency)}</td>
              <td className={cn(tdCls, "text-center")}>{t.matched ? <span title="Reconciled" className="text-green-01">✓</span> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatementLinesTab({ id, entity, currency }: { id: number; entity: string; currency?: string | null }) {
  const { data, isFetching } = useGetStatementLinesQuery({ id, entity });
  const lines = useMemo(() => toArray(data?.data), [data]);
  if (isFetching && lines.length === 0) return <p className="font-mont text-sm text-gray-05">Loading…</p>;
  if (lines.length === 0) return <EmptyState title="No statement lines" message="Import a statement to begin reconciling." />;
  return (
    <div className="overflow-hidden rounded-md border border-gray-03">
      <table className="w-full border-collapse">
        <thead><tr>
          <th className={thCls}>Date</th><th className={thCls}>Description</th><th className={thCls}>Reference</th>
          <th className={cn(thCls, "text-right")}>Amount</th><th className={thCls}>Status</th>
        </tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td className={cn(tdCls, "tabular-nums text-gray-05")}>{l.txn_date}</td>
              <td className={tdCls}>{l.description || "—"}</td>
              <td className={cn(tdCls, "tabular-nums text-gray-05")}>{l.reference || "—"}</td>
              <td className={cn(tdCls, "text-right tabular-nums", l.amount < 0 ? "text-destructive" : "text-black-01")}>{formatMoney(l.amount, currency)}</td>
              <td className={tdCls}><StatusPill status={l.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatementsTab({ detail, currency }: { detail?: { statements: import("@/redux/services/finance/ops-types").BankStatement[] }; currency?: string | null }) {
  const sts = detail?.statements ?? [];
  if (sts.length === 0) return <EmptyState title="No statements" message="Imported statement batches appear here." />;
  return (
    <div className="overflow-hidden rounded-md border border-gray-03">
      <table className="w-full border-collapse">
        <thead><tr>
          <th className={thCls}>Statement date</th><th className={thCls}>Period</th>
          <th className={cn(thCls, "text-right")}>Opening</th><th className={cn(thCls, "text-right")}>Closing</th>
          <th className={cn(thCls, "text-right")}>Lines</th><th className={thCls}>Status</th>
        </tr></thead>
        <tbody>
          {sts.map((s) => (
            <tr key={s.id}>
              <td className={cn(tdCls, "tabular-nums")}>{fmtDate(s.statement_date)}</td>
              <td className={tdCls}>{s.period_label || "—"}</td>
              <td className={cn(tdCls, "text-right tabular-nums")}>{formatMoney(s.opening_balance, currency)}</td>
              <td className={cn(tdCls, "text-right tabular-nums font-medium")}>{formatMoney(s.closing_balance, currency)}</td>
              <td className={cn(tdCls, "text-right tabular-nums text-gray-05")}>{s.line_count}</td>
              <td className={tdCls}><span className={cn(PILL, s.status === "RECONCILED" ? "bg-green-01/10 text-green-01" : "bg-amber-50 text-amber-700")}>{s.status_display}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReconciliationsTab({ detail, currency }: { detail?: { reconciliations: import("@/redux/services/finance/ops-types").BankReconciliationRun[] }; currency?: string | null }) {
  const recs = detail?.reconciliations ?? [];
  if (recs.length === 0) return <EmptyState title="No reconciliations yet" message="Each Auto-reconcile run is recorded here for audit." />;
  return (
    <div className="overflow-hidden rounded-md border border-gray-03">
      <table className="w-full border-collapse">
        <thead><tr>
          <th className={thCls}>Date</th><th className={cn(thCls, "text-right")}>Book</th>
          <th className={cn(thCls, "text-right")}>Statement</th><th className={cn(thCls, "text-right")}>Diff</th>
          <th className={cn(thCls, "text-right")}>Matched</th><th className={thCls}>Status</th><th className={thCls}>By</th>
        </tr></thead>
        <tbody>
          {recs.map((r) => (
            <tr key={r.id}>
              <td className={cn(tdCls, "tabular-nums")}>{fmtDate(r.created_at)}</td>
              <td className={cn(tdCls, "text-right tabular-nums")}>{formatMoney(r.book_balance, currency)}</td>
              <td className={cn(tdCls, "text-right tabular-nums")}>{formatMoney(r.statement_balance, currency)}</td>
              <td className={cn(tdCls, "text-right tabular-nums", r.difference !== 0 ? "text-destructive" : "")}>{formatMoney(r.difference, currency)}</td>
              <td className={cn(tdCls, "text-right tabular-nums text-gray-05")}>{r.matched_count}</td>
              <td className={tdCls}><span className={cn(PILL, r.status === "BALANCED" ? "bg-green-01/10 text-green-01" : "bg-amber-50 text-amber-700")}>{r.status_display}</span></td>
              <td className={cn(tdCls, "text-gray-05")}>{r.performed_by_name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab({ account, entity, canEdit }: { account: BankAccount; entity: string; canEdit: boolean }) {
  const [name, setName] = useState(account.name);
  const [bankName, setBankName] = useState(account.bank_name);
  const [accountNumber, setAccountNumber] = useState(account.account_number ?? "");
  const [currency, setCurrency] = useState(account.currency ?? "");
  const [active, setActive] = useState(account.is_active);
  const [primary, setPrimary] = useState(account.is_primary);
  const [update, { isLoading }] = useUpdateBankAccountMutation();
  const numberStripped = isStripped(account, "account_number");

  const save = async () => {
    try {
      const res = await update({
        id: account.id, entity, name: name.trim(), bank_name: bankName.trim(),
        ...(numberStripped ? {} : { account_number: accountNumber.trim() }),
        currency: currency || undefined, is_active: active, is_primary: primary,
      }).unwrap();
      toast.success(res.message || "Bank account updated.");
    } catch { /* central */ }
  };

  return (
    <div className="space-y-4">
      <FormField label="Account name" required><Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} className="bg-white" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Bank name"><Input value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={!canEdit} className="bg-white" /></FormField>
        <FormField label="Account number">
          <Input value={numberStripped ? "••••" : accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={!canEdit || numberStripped} className="bg-white font-mont" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Currency"><CurrencyPicker value={currency} onChange={setCurrency} disabled={!canEdit} /></FormField>
        <div className="flex items-end gap-4 pb-2">
          <label className="flex items-center gap-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} disabled={!canEdit} className="accent-primary" /> Active</label>
          <label className="flex items-center gap-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} disabled={!canEdit} className="accent-primary" /> Primary</label>
        </div>
      </div>
      {canEdit ? (
        <div className="flex justify-end"><Button disabled={isLoading || !name.trim()} onClick={save}>{isLoading ? "Saving…" : "Save changes"}</Button></div>
      ) : null}
    </div>
  );
}

type ImportRow = { txn_date: string; description: string; amount: string; reference: string };
const emptyRow = (): ImportRow => ({ txn_date: todayISO, description: "", amount: "", reference: "" });

function ImportStatementDrawer({ id, entity, onClose }: { id: number; entity: string; onClose: () => void }) {
  const [periodLabel, setPeriodLabel] = useState("");
  const [opening, setOpening] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([emptyRow()]);
  const [doImport, { isLoading }] = useImportStatementMutation();

  const setRow = (i: number, patch: Partial<ImportRow>) => setRows((s) => s.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const valid = rows.filter((r) => r.txn_date && r.amount.trim() !== "" && !Number.isNaN(Number(r.amount)));

  const submit = async () => {
    try {
      const res = await doImport({
        id, entity,
        period_label: periodLabel.trim() || undefined,
        opening_balance: opening.trim() ? Math.round(Number(opening) * 100) : undefined,
        lines: valid.map((r) => ({
          txn_date: r.txn_date, description: r.description.trim() || undefined,
          reference: r.reference.trim() || undefined, amount: Math.round(Number(r.amount) * 100),
        })),
      }).unwrap();
      toast.success(res.message || "Statement imported.");
      onClose();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open onOpenChange={(o) => (o ? undefined : onClose())}
      title="Import statement" description="Add statement lines for this account, then Auto-reconcile."
      widthClass="sm:max-w-3xl"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading || valid.length === 0} onClick={submit} className="gap-1.5"><Upload className="size-4" />{isLoading ? "Importing…" : `Import ${valid.length} line(s)`}</Button>
      </>}
    >
      <div className="space-y-4">
        <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          Amount is signed in naira from your side: <span className="font-medium">positive = money in</span>, negative = money out. Lines group under one statement (closing = opening + Σ amounts).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Period label"><Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="e.g. Apr 2026" className="bg-white" /></FormField>
          <FormField label="Opening balance (₦)"><Input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0.00" className="bg-white font-mont" /></FormField>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
            <Button variant="outline" size="sm" onClick={() => setRows((s) => [...s, emptyRow()])} className="gap-1.5"><Plus className="size-3.5" /> Add line</Button>
          </div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-end gap-2 rounded-md border border-gray-03 bg-white p-2.5">
                <div className="grid flex-1 grid-cols-12 gap-2">
                  <div className="col-span-3"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Date</p><Input type="date" value={r.txn_date} onChange={(e) => setRow(i, { txn_date: e.target.value })} className="bg-white font-mont text-sm" /></div>
                  <div className="col-span-4"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Description</p><Input value={r.description} onChange={(e) => setRow(i, { description: e.target.value })} className="bg-white text-sm" /></div>
                  <div className="col-span-2"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Reference</p><Input value={r.reference} onChange={(e) => setRow(i, { reference: e.target.value })} className="bg-white font-mont text-sm" /></div>
                  <div className="col-span-3"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Amount (₦)</p><Input type="number" value={r.amount} onChange={(e) => setRow(i, { amount: e.target.value })} placeholder="0.00" className="bg-white font-mont text-sm" /></div>
                </div>
                <button type="button" onClick={() => setRows((s) => s.filter((_, idx) => idx !== i))} disabled={rows.length <= 1} className="mb-0.5 shrink-0 rounded p-1.5 text-gray-05 hover:bg-destructive/5 hover:text-destructive disabled:opacity-30" aria-label="Remove line"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}

function CreateBankAccountModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [glAccount, setGlAccount] = useState("");
  const [currency, setCurrency] = useState("");
  const [active, setActive] = useState(true);
  const [primary, setPrimary] = useState(false);
  const [create, { isLoading }] = useCreateBankAccountMutation();

  const reset = () => { setName(""); setBankName(""); setAccountNumber(""); setGlAccount(""); setCurrency(""); setActive(true); setPrimary(false); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    try {
      const res = await create({
        entity, name: name.trim(), bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined, gl_account: glAccount,
        currency: currency || undefined, is_active: active, is_primary: primary,
      }).unwrap();
      toast.success(res.message || "Bank account created.");
      close();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="New bank account" description="Link a real bank account to a GL cash account for statement import and reconciliation."
      widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
        <Button disabled={isLoading || !name.trim() || !glAccount} onClick={submit} className="gap-1.5"><Plus className="size-4" />{isLoading ? "Creating…" : "Create account"}</Button>
      </>}
    >
      <div className="space-y-4">
        <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          The GL cash account is the ledger's book balance for this bank account (1:1). Money still only moves through journals — this adds the banking metadata and anchors reconciliation.
        </p>
        <FormField label="Account name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GTBank Operations" className="bg-white" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Bank name"><Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" className="bg-white" /></FormField>
          <FormField label="Account number"><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0123456789" className="bg-white font-mont" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="GL cash account" required><AccountPicker entity={entity} value={glAccount} onChange={setGlAccount} postableOnly accountType="ASSET" placeholder="Cash / bank account" /></FormField>
          <FormField label="Currency"><CurrencyPicker value={currency} onChange={setCurrency} /></FormField>
        </div>
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-primary" /> Active</label>
          <label className="flex items-center gap-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} className="accent-primary" /> Primary operating account</label>
        </div>
      </div>
    </DetailDrawer>
  );
}
