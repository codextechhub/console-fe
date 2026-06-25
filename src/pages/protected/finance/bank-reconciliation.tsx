// Bank Reconciliation (§6.5) — an account-scoped reconciliation workbench, built
// to the Vision prototype in the house theme: KPIs (statement / book / difference
// / match progress), a two-column matcher (unmatched bank statement lines vs
// unmatched book/GL lines — click one of each and Match), in-line adjusting
// entries, a matched-lines table, Auto-match, Complete reconciliation and a
// printable reconciliation report.
//
// Honest adaptations: the prototype's drag-drop is click-both-then-Match (it
// offers this itself); "SUGGESTED / auto-create" AI hints become simple
// equal-amount candidate highlighting; we reconcile the account's whole
// unmatched set rather than a single uploaded statement file.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link2, RefreshCw, CheckCircle2, Printer, FilePlus2, Unlink, Check } from "lucide-react";
import { FinanceShell } from "./finance-shell";
import { DetailDrawer, FormField, AccountPicker, InfoHint, useActiveEntity, toArray } from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { EmptyState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetBankAccountsQuery, useGetBankAccountQuery, useGetStatementLinesQuery,
  useGetBookLinesQuery, useAutoReconcileMutation, useMatchStatementLineMutation,
  useAdjustStatementLineMutation, useUnmatchStatementLineMutation, useCompleteReconciliationMutation,
} from "@/redux/services/finance/ops-api";
import type { BankAccount, BankStatementLine } from "@/redux/services/finance/ops-types";

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
const signedCls = (kobo: number) => (kobo < 0 ? "text-destructive" : "text-green-01");

function Kpi({ label, value, danger, children }: { label: string; value: string; danger?: boolean; children?: React.ReactNode }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="font-mont text-xs text-gray-05">{label}</p>
      <p className={cn("mt-1 font-mont text-xl font-semibold tabular-nums", danger ? "text-destructive" : "text-black-01")}>{value}</p>
      {children}
    </div>
  );
}

export default function BankReconciliationPage() {
  const { code: entity, currency } = useActiveEntity();
  const { data: listData } = useGetBankAccountsQuery({ entity: entity! }, { skip: !entity });
  const accounts = useMemo(() => toArray(listData?.data), [listData]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const account = useMemo<BankAccount | undefined>(() => {
    if (accountId != null) return accounts.find((a) => a.id === accountId);
    return accounts.find((a) => a.is_primary) ?? accounts[0];
  }, [accounts, accountId]);

  if (!entity) {
    return <FinanceShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></FinanceShell>;
  }

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-mont text-lg font-semibold text-gray-01">Bank Reconciliation</h1>
              <InfoHint>Reconciliation proves the GL matches reality. Auto-match pairs lines by amount and date; the rest need your eye — bank charges not yet booked, payments in transit. Click an unmatched bank line and a book line, then Match; raise an adjusting entry for charges/interest the books are missing.</InfoHint>
            </div>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Match the bank statement to the ledger, account by account.</p>
          </div>
          {accounts.length > 0 ? (
            <select
              value={account?.id ?? ""} onChange={(e) => setAccountId(Number(e.target.value))}
              className="h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.is_primary ? " · Primary" : ""}</option>)}
            </select>
          ) : null}
        </div>

        {!account ? (
          <EmptyState title="No bank accounts" message="Add a bank account to reconcile." />
        ) : (
          <Workbench account={account} entity={entity} currency={currency} />
        )}
      </main>
    </FinanceShell>
  );
}

function Workbench({ account, entity, currency }: { account: BankAccount; entity: string; currency?: string | null }) {
  const { can } = useCan();
  const [selBank, setSelBank] = useState<number | null>(null);
  const [selBook, setSelBook] = useState<number | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [viewing, setViewing] = useState<BankStatementLine | null>(null);

  const { data: detailData } = useGetBankAccountQuery({ id: account.id, entity });
  const detail = detailData?.data;
  const { data: linesData } = useGetStatementLinesQuery({ id: account.id, entity });
  const { data: bookData } = useGetBookLinesQuery({ id: account.id, entity });
  const allLines = useMemo(() => toArray(linesData?.data), [linesData]);
  const bookLines = useMemo(() => toArray(bookData?.data), [bookData]);
  const unmatched = allLines.filter((l) => l.status === "UNMATCHED");
  const matched = allLines.filter((l) => l.status === "MATCHED");

  const [match, { isLoading: matching }] = useMatchStatementLineMutation();
  const [autoReconcile, { isLoading: autoing }] = useAutoReconcileMutation();
  const [complete, { isLoading: completing }] = useCompleteReconciliationMutation();
  const [unmatch, { isLoading: unmatching }] = useUnmatchStatementLineMutation();

  const doUnmatch = async (id: number) => {
    try {
      await unmatch({ id, entity }).unwrap();
      toast.success("Line unmatched.");
      setViewing(null);
    } catch { /* central */ }
  };

  const book = detail?.metrics.book_balance ?? account.book_balance;
  const statement = detail?.metrics.statement_balance ?? 0;
  const difference = book - statement;
  const totalLines = matched.length + unmatched.length;
  const progress = totalLines ? Math.round((matched.length / totalLines) * 100) : 0;

  const selBankLine = unmatched.find((l) => l.id === selBank) ?? null;
  const selBookLine = bookLines.find((b) => b.id === selBook) ?? null;
  // Match needs the *same signed amount* (the backend enforces it too).
  const amountsEqual = selBankLine != null && selBookLine != null && selBankLine.amount === selBookLine.amount;
  const canMatch = amountsEqual;
  const mismatch = selBankLine != null && selBookLine != null && !amountsEqual;

  const doMatch = async () => {
    if (!canMatch) return;
    try {
      await match({ id: selBank!, entity, journal_line: selBook! }).unwrap();
      toast.success("Lines matched.");
      setSelBank(null); setSelBook(null);
    } catch { /* central (e.g. amount mismatch) */ }
  };
  const doAuto = async () => {
    try { const r = await autoReconcile({ id: account.id, entity }).unwrap(); toast.success(r.message || "Auto-match complete."); } catch { /* central */ }
  };
  const doComplete = async () => {
    try { const r = await complete({ id: account.id, entity }).unwrap(); toast.success(r.message || "Reconciliation recorded."); } catch { /* central */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mont text-xs text-gray-05">{account.bank_name || "—"} · {account.gl_account}{detail?.statements?.[0]?.period_label ? ` · ${detail.statements[0].period_label}` : ""}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => printReport({ account, currency, book, statement, difference, matched, unmatched })} className="gap-1.5"><Printer className="size-4" /> Reconciliation report</Button>
          <Can permission={P.FIN_RECONCILE_BANK}>
            <Button onClick={doComplete} disabled={completing} className="gap-1.5"><CheckCircle2 className="size-4" />{completing ? "Saving…" : "Complete reconciliation"}</Button>
          </Can>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Statement balance" value={formatMoney(statement, currency)} />
        <Kpi label="Book balance" value={formatMoney(book, currency)} />
        <Kpi label="Difference" value={formatMoney(difference, currency)} danger={difference !== 0} />
        <Kpi label="Match progress" value={`${matched.length} / ${totalLines}`}>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-03">
            <div className="h-full rounded-full bg-green-01" style={{ width: `${progress}%` }} />
          </div>
        </Kpi>
      </div>

      {difference !== 0 ? (
        <div className="rounded-md bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
          <p className="font-mont text-xs font-semibold text-amber-900">Unreconciled difference: {formatMoney(difference, currency)}</p>
          <p className="mt-0.5 font-mont text-[11px] text-amber-900/80">Match the remaining lines, or raise adjusting entries for bank charges / interest the books don't yet know about.</p>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Bank statement unmatched */}
        <Column title="Bank statement (unmatched)" count={`${unmatched.length} of ${totalLines}`}>
          {unmatched.length === 0 ? <ColEmpty msg="Every statement line is matched." /> : unmatched.map((l) => (
            <LineCard key={l.id} selected={selBank === l.id} onClick={() => setSelBank(selBank === l.id ? null : l.id)}
              title={l.description || "—"} sub={`${l.txn_date}${l.reference ? ` · ${l.reference}` : ""}`}
              amount={l.amount} currency={currency} />
          ))}
        </Column>

        {/* Book entries unmatched */}
        <Column title="Book entries (unmatched)" count={`${bookLines.length} of ${bookLines.length}`}>
          {bookLines.length === 0 ? <ColEmpty msg="No unmatched book entries." /> : bookLines.map((b) => {
            const candidate = selBankLine != null && b.amount === selBankLine.amount;
            return (
              <LineCard key={b.id} selected={selBook === b.id} candidate={candidate}
                onClick={() => setSelBook(selBook === b.id ? null : b.id)}
                title={b.description} sub={`${b.date}${b.reference ? ` · ${b.reference}` : ""}`}
                amount={b.amount} currency={currency} />
            );
          })}
        </Column>
      </div>

      <Can permission={P.FIN_RECONCILE_BANK}>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={doMatch} disabled={!canMatch || matching} className="gap-1.5"><Link2 className="size-4" />{matching ? "Matching…" : "Match selected"}</Button>
          <Button variant="outline" onClick={() => setAdjusting(true)} disabled={selBank == null} className="gap-1.5"><FilePlus2 className="size-4" /> Add adjusting entry</Button>
          <Button variant="outline" onClick={doAuto} disabled={autoing} className="gap-1.5"><RefreshCw className="size-4" />{autoing ? "Matching…" : "Auto-match"}</Button>
          {mismatch ? (
            <span className="font-mont text-[11px] text-destructive">Amounts differ ({formatMoney(selBankLine!.amount, currency)} vs {formatMoney(selBookLine!.amount, currency)}) — a match needs the same amount. Raise an adjusting entry for this charge/credit instead.</span>
          ) : selBankLine ? (
            <span className="font-mont text-[11px] text-gray-05">Selected bank line: {formatMoney(selBankLine.amount, currency)} — pick a book line of the same amount, or raise an adjusting entry.</span>
          ) : null}
        </div>
      </Can>

      <div>
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Matched lines · {matched.length} pair(s)</p>
        {matched.length === 0 ? <ColEmpty msg="Matched pairs will appear here." /> : (
          <div className="overflow-hidden rounded-md border border-gray-03">
            <table className="w-full border-collapse">
              <thead><tr>
                <th className={th}>Date</th><th className={th}>Bank statement</th>
                <th className={cn(th, "text-right")}>Amount</th><th className={th}>Book entry / JE</th>
                <th className={th}>Source</th><th className={cn(th, "text-right")} />
              </tr></thead>
              <tbody>
                {matched.map((l) => (
                  <tr key={l.id} onClick={() => setViewing(l)} className="cursor-pointer hover:bg-gray-03/40">
                    <td className={cn(td, "tabular-nums text-gray-05")}>{l.txn_date}</td>
                    <td className={td}>{l.description || "—"}</td>
                    <td className={cn(td, "text-right tabular-nums", signedCls(l.amount))}>{formatMoney(l.amount, currency)}</td>
                    <td className={cn(td, "tabular-nums text-gray-05")}>{l.matched_reference || (l.adjusting_journal_id ? "Adjusting entry" : "—")}</td>
                    <td className={td}><SourcePill line={l} /></td>
                    <td className={cn(td, "text-right")}>
                      <Can permission={P.FIN_RECONCILE_BANK}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); doUnmatch(l.id); }} disabled={unmatching}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 font-mont text-[11px] text-gray-05 hover:bg-destructive/5 hover:text-destructive disabled:opacity-40">
                          <Unlink className="size-3.5" /> Unmatch
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adjusting && selBankLine ? (
        <AdjustDrawer line={selBankLine} entity={entity} currency={currency} onClose={() => setAdjusting(false)} onDone={() => { setAdjusting(false); setSelBank(null); }} />
      ) : null}
      <MatchedLineDrawer line={viewing} currency={currency} onClose={() => setViewing(null)}
        onUnmatch={(id) => doUnmatch(id)} canUnmatch={can(P.FIN_RECONCILE_BANK)} unmatching={unmatching} />
    </div>
  );
}

const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
function SourcePill({ line }: { line: BankStatementLine }) {
  const cls = line.match_source === "AUTO" ? "bg-blue-50 text-blue-700"
    : line.match_source === "ADJUSTMENT" ? "bg-amber-50 text-amber-700"
    : "bg-gray-03/60 text-gray-05";
  return <span className={cn(PILL, cls)}>{line.match_source_display || "Manual"}</span>;
}

function MatchedLineDrawer({ line, currency, onClose, onUnmatch, canUnmatch, unmatching }: {
  line: BankStatementLine | null; currency?: string | null; onClose: () => void;
  onUnmatch: (id: number) => void; canUnmatch: boolean; unmatching: boolean;
}) {
  if (!line) return null;
  const isAdjustment = line.match_source === "ADJUSTMENT";
  return (
    <DetailDrawer
      open onOpenChange={(o) => (o ? undefined : onClose())}
      title="Matched line" description={line.matched_reference ? `Paired with ${line.matched_reference}` : "Reconciled statement line"}
      widthClass="sm:max-w-lg"
      footer={canUnmatch ? (
        <Button variant="outline" disabled={unmatching} onClick={() => onUnmatch(line.id)} className="gap-1.5">
          <Unlink className="size-4" />{unmatching ? "Unmatching…" : "Unmatch"}
        </Button>
      ) : undefined}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <ReconField label="Statement date">{line.txn_date}</ReconField>
          <ReconField label="Amount"><span className={signedCls(line.amount)}>{formatMoney(line.amount, currency)}</span></ReconField>
          <ReconField label="Description">{line.description || "—"}</ReconField>
          <ReconField label="Reference">{line.reference || "—"}</ReconField>
          <ReconField label="Book entry / JE">{line.matched_reference || (isAdjustment ? "Adjusting entry" : "—")}</ReconField>
          <ReconField label="Matched">{line.match_source_display || "Manual"}{line.reconciled_at ? ` · ${fmtDate(line.reconciled_at)}` : ""}</ReconField>
        </div>
        <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          {isAdjustment
            ? "This line was booked via an adjusting journal. Unmatching reverses that journal (a mirror entry that nets to zero) and returns the line to unmatched."
            : "Unmatching drops the pairing and returns the line to the unmatched column — no ledger effect."}
        </p>
      </div>
    </DetailDrawer>
  );
}

const th = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const td = "border-t border-gray-03 px-3 py-2 font-mont text-xs text-black-01";

function ReconField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="font-mont text-[11px] text-gray-05">{label}</p><p className="mt-1 font-mont text-sm font-semibold tabular-nums text-black-01">{children}</p></div>;
}

function Column({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-03 bg-white">
      <div className="flex items-center justify-between border-b border-gray-03 bg-[#F7F7F7] px-3.5 py-2.5">
        <p className="font-mont text-xs font-semibold text-gray-01">{title}</p>
        <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-mont text-[11px] font-medium text-gray-05 ring-1 ring-gray-03">{count}</span>
      </div>
      {/* Fill the viewport but cap it, so a long reconciliation scrolls inside
          the box rather than pushing the whole page down. */}
      <div className="min-h-[280px] max-h-[calc(100dvh-24rem)] divide-y divide-gray-03 overflow-y-auto">{children}</div>
    </div>
  );
}
function ColEmpty({ msg }: { msg: string }) {
  return <p className="px-3 py-10 text-center font-mont text-[11px] text-gray-05">{msg}</p>;
}
function LineCard({ title, sub, amount, currency, selected, candidate, onClick }: {
  title: string; sub: string; amount: number; currency?: string | null; selected?: boolean; candidate?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors",
        selected ? "bg-primary/[0.06]" : candidate ? "bg-green-01/[0.06]" : "hover:bg-gray-03/30")}>
      <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected ? "border-primary bg-primary text-white" : candidate ? "border-green-01" : "border-gray-05/40")}>
        {selected ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mont text-sm font-medium text-black-01">{title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 font-mont text-[11px] tabular-nums text-gray-05">
          <span className="truncate">{sub}</span>
          {candidate ? <span className="shrink-0 rounded bg-green-01/10 px-1.5 py-0.5 font-medium text-green-01">same amount</span> : null}
        </p>
      </div>
      <span className={cn("shrink-0 font-mont text-sm font-semibold tabular-nums", signedCls(amount))}>{formatMoney(amount, currency)}</span>
    </button>
  );
}

function AdjustDrawer({ line, entity, currency, onClose, onDone }: {
  line: BankStatementLine; entity: string; currency?: string | null; onClose: () => void; onDone: () => void;
}) {
  const [counter, setCounter] = useState("");
  const [narration, setNarration] = useState(line.description || "");
  const [adjust, { isLoading }] = useAdjustStatementLineMutation();

  const submit = async () => {
    try {
      await adjust({ id: line.id, entity, counter_account: counter || undefined, narration: narration.trim() || undefined }).unwrap();
      toast.success("Adjusting entry booked and matched.");
      onDone();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open onOpenChange={(o) => (o ? undefined : onClose())}
      title="Add adjusting entry" description="Book what the statement reveals, then match this line."
      widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading} onClick={submit} className="gap-1.5"><FilePlus2 className="size-4" />{isLoading ? "Posting…" : "Post & match"}</Button>
      </>}
    >
      <div className="space-y-4">
        <div className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          Raises a journal against this statement line ({formatMoney(line.amount, currency)}, {line.amount < 0 ? "outflow" : "inflow"}) and the bank's GL cash account, then marks the line matched. Use for charges, interest, or errors the books don't have yet.
        </div>
        <FormField label="Counter account">
          <AccountPicker entity={entity} value={counter} onChange={setCounter} postableOnly placeholder="Defaults to 5500 Bank Charges" />
        </FormField>
        <FormField label="Narration">
          <textarea value={narration} onChange={(e) => setNarration(e.target.value)} rows={2}
            className="w-full rounded-md border border-gray-03 bg-white px-3 py-2 font-mont text-sm" />
        </FormField>
      </div>
    </DetailDrawer>
  );
}

function printReport({ account, currency, book, statement, difference, matched, unmatched }: {
  account: BankAccount; currency?: string | null; book: number; statement: number; difference: number;
  matched: BankStatementLine[]; unmatched: BankStatementLine[];
}) {
  const money = (k: number) => formatMoney(k, currency);
  const row = (l: BankStatementLine) => `<tr><td>${l.txn_date}</td><td>${(l.description || "—")}</td><td style="text-align:right">${money(l.amount)}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bank reconciliation — ${account.name}</title>
  <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;padding:32px;max-width:760px;margin:auto}
  h1{font-size:18px;margin:0 0 4px} .sub{color:#666;font-size:12px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;margin:8px 0 20px;font-size:12px} th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:left}
  .cards{display:flex;gap:12px;margin-bottom:20px} .card{flex:1;border:1px solid #eee;border-radius:8px;padding:10px}
  .card .l{color:#666;font-size:11px} .card .v{font-size:16px;font-weight:600} .diff{color:${difference !== 0 ? "#c0392b" : "#1a1a1a"}}
  h3{font-size:13px;margin:16px 0 4px}</style></head><body>
  <h1>Bank reconciliation</h1>
  <div class="sub">${account.name} · ${account.bank_name || ""} · GL ${account.gl_account} · ${new Date().toLocaleDateString()}</div>
  <div class="cards">
    <div class="card"><div class="l">Statement balance</div><div class="v">${money(statement)}</div></div>
    <div class="card"><div class="l">Book balance</div><div class="v">${money(book)}</div></div>
    <div class="card"><div class="l">Difference</div><div class="v diff">${money(difference)}</div></div>
  </div>
  <h3>Matched lines (${matched.length})</h3>
  <table><thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${matched.map(row).join("") || '<tr><td colspan="3">None</td></tr>'}</tbody></table>
  <h3>Unmatched lines (${unmatched.length})</h3>
  <table><thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${unmatched.map(row).join("") || '<tr><td colspan="3">None</td></tr>'}</tbody></table>
  </body></html>`;
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) { toast.error("Pop-up blocked — allow pop-ups to print the report."); return; }
  w.document.write(html); w.document.close(); w.focus(); w.print();
}
