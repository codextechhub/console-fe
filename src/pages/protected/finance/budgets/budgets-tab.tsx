// Budgets & Forecasts, rebuilt to the Vision prototype in the house theme: a budget
// list (Budgeted / Actual YTD / Consumed / Status), a per-account × per-month variance
// heatmap for a selected budget, and a detail drawer with the account-level variance
// lines + an inline line editor + approve.
//
// Honest adaptations to our model: Budget has no code/scope/currency (New budget = Name
// + Fiscal year only); actuals live in AccountBalance per (account, period) with no
// cost-centre split, so variance and the heatmap are per GL account (the budget
// definition still stores cost centres per line). Copy-from-prior / CSV import aren't
// modelled and are omitted. No stored FY forecast — only real budget/actual/variance.

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, Lock } from "lucide-react";
import { DataTable, Money, MoneyInput, DetailDrawer, FormField, AccountPicker, CostCenterPicker, InfoHint, toArray, type Column } from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetBudgetsQuery, useGetBudgetVarianceQuery, useGetBudgetHeatmapQuery,
  useCreateBudgetMutation, useAddBudgetLineMutation, useApproveBudgetMutation,
} from "@/redux/services/finance/ops-api";
import type { Budget } from "@/redux/services/finance/ops-types";

const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const thCls = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const tdCls = "border-t border-gray-03 px-3 py-2 font-mont text-xs text-black-01";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-03/60 text-gray-05", APPROVED: "bg-green-01/10 text-green-01",
    LOCKED: "bg-blue-50 text-blue-700",
  };
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return <span className={cn(PILL, map[status] ?? map.DRAFT)}>{label}</span>;
}

// Compact naira for dense heatmap cells: ₦53.22M / ₦640k / ₦0.
function compactNaira(kobo: number) {
  const n = (kobo || 0) / 100;
  const a = Math.abs(n);
  if (a >= 1e6) return `₦${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `₦${(n / 1e3).toFixed(0)}k`;
  return `₦${n.toFixed(0)}`;
}

// Heat colour by consumed ratio (actual / budget), spend-centric like the prototype.
function heatClass(ratio: number | null) {
  if (ratio == null) return "bg-white text-gray-05";
  if (ratio <= 0.9) return "bg-emerald-50 text-emerald-700";
  if (ratio <= 1.0) return "bg-amber-50 text-amber-700";
  if (ratio <= 1.2) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function ConsumedBar({ pct }: { pct: number | null }) {
  const v = pct == null ? 0 : Math.min(pct, 100);
  const over = (pct ?? 0) > 100;
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-03">
        <div className={cn("h-full rounded-full", over ? "bg-destructive" : "bg-green-01")} style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 text-right font-mont text-xs tabular-nums text-gray-05">{pct == null ? "—" : `${Math.round(pct)}%`}</span>
    </div>
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

export function BudgetsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [heatmapId, setHeatmapId] = useState<number | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetBudgetsQuery({ entity });
  const rows = useMemo(() => toArray(data?.data), [data]);

  const activeHeatmapId = heatmapId ?? rows[0]?.id ?? null;

  const columns: Column<Budget>[] = [
    { header: "Name", cell: (b) => <span className="font-medium text-gray-01">{b.name}</span> },
    { header: "Fiscal year", cell: (b) => <span className="tabular-nums text-gray-05">{b.fiscal_year}</span> },
    { header: "Budgeted", align: "right", cell: (b) => <Money kobo={b.budgeted_total ?? 0} currency={currency} align="right" /> },
    { header: "Actual YTD", align: "right", cell: (b) => <Money kobo={b.actual_ytd ?? 0} currency={currency} align="right" /> },
    { header: "Consumed", align: "right", cell: (b) => <ConsumedBar pct={b.consumed_pct ?? null} /> },
    { header: "Status", cell: (b) => <StatusPill status={b.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl font-mont text-xs text-gray-05">
          A budget is a forward-looking plan in the same shape as your chart of accounts — one line per GL account × cost centre × period. The system compares it to live postings; red cells in the heatmap are overruns.
        </p>
        <Can permission={P.FIN_CREATE_BUDGET}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New budget</Button>
        </Can>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(b) => b.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={(b) => setSelectedId(b.id)}
        emptyTitle="No budgets" emptyMessage="Create a budget for a fiscal year, then add its lines." />

      {activeHeatmapId != null ? (
        <div className="rounded-md border border-gray-03 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <h2 className="font-mont text-sm font-semibold text-gray-01">Variance heatmap</h2>
              <InfoHint>Each cell is a GL account's actual spend in that period, coloured by how much of the budgeted amount it consumed. Variance is per account — actuals aren't tracked per cost centre.</InfoHint>
            </div>
            <Select value={String(activeHeatmapId)} onChange={(v) => setHeatmapId(Number(v))} className="w-60">
              {rows.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <Heatmap budgetId={activeHeatmapId} entity={entity} />
          <HeatLegend />
        </div>
      ) : null}

      <BudgetDrawer budgetId={selectedId} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
      <NewBudgetDrawer open={creating} onClose={() => setCreating(false)} entity={entity} />
    </div>
  );
}

function HeatLegend() {
  const items: [string, string][] = [["On track", "bg-emerald-50"], ["Approaching", "bg-amber-50"], ["Over budget", "bg-orange-100"], ["Severe overrun", "bg-red-100"]];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4">
      {items.map(([label, cls]) => (
        <span key={label} className="inline-flex items-center gap-1.5 font-mont text-[11px] text-gray-05">
          <span className={cn("size-3 rounded-sm border border-gray-03", cls)} /> {label}
        </span>
      ))}
    </div>
  );
}

function Heatmap({ budgetId, entity }: { budgetId: number; entity: string }) {
  const { data, isFetching, isError } = useGetBudgetHeatmapQuery({ id: budgetId, entity });
  const hm = data?.data;
  if (isError) return <p className="py-6 text-center font-mont text-xs text-destructive">Couldn't load the heatmap.</p>;
  if (isFetching && !hm) return <p className="py-6 text-center font-mont text-xs text-gray-05">Loading…</p>;
  if (!hm || hm.rows.length === 0) return <p className="py-6 text-center font-mont text-xs text-gray-05">No budget lines yet — add lines to see the variance heatmap.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(thCls, "sticky left-0 z-10 min-w-44")}>Account</th>
            {hm.periods.map((p) => <th key={p.period_no} className={cn(thCls, "text-right")}>{p.label}</th>)}
            <th className={cn(thCls, "text-right")}>YTD</th>
          </tr>
        </thead>
        <tbody>
          {hm.rows.map((r) => {
            const ytd = r.budget_total ? r.actual_total / r.budget_total : null;
            return (
              <tr key={r.account_id}>
                <td className={cn(tdCls, "sticky left-0 z-10 bg-white")}>
                  <span className="tabular-nums text-gray-05">{r.code}</span> <span className="text-black-01">{r.name}</span>
                </td>
                {hm.periods.map((p) => {
                  const cell = r.cells.find((c) => c.period_no === p.period_no);
                  const ratio = cell && cell.budget ? cell.actual / cell.budget : null;
                  const hasActual = !!cell && cell.actual !== 0;
                  return (
                    <td key={p.period_no} className={cn("border-t border-gray-03 px-2 py-1.5 text-right font-mont text-[11px] tabular-nums", heatClass(ratio))}>
                      {hasActual ? compactNaira(cell!.actual) : <span className="text-gray-05">—</span>}
                    </td>
                  );
                })}
                <td className={cn(tdCls, "text-right")}>
                  <span className={cn("font-medium tabular-nums", ytd != null && ytd > 1 ? "text-destructive" : "text-gray-05")}>{ytd == null ? "—" : `${Math.round(ytd * 100)}%`}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BudgetDrawer({ budgetId, entity, currency, onClose }: { budgetId: number | null; entity: string; currency?: string | null; onClose: () => void }) {
  const { can } = useCan();
  const { data: bd } = useGetBudgetsQuery({ entity });
  const budget = useMemo(() => toArray(bd?.data).find((b) => b.id === budgetId) ?? null, [bd, budgetId]);
  const { data: vd } = useGetBudgetVarianceQuery(budgetId != null ? { id: budgetId, entity } : ({} as never), { skip: budgetId == null });
  const v = vd?.data;
  const [approve, { isLoading: approving }] = useApproveBudgetMutation();
  const [adding, setAdding] = useState(false);

  if (budgetId == null || !budget) return null;
  const locked = budget.is_locked || budget.status !== "DRAFT";
  const budgeted = v?.total_budget.kobo ?? 0;
  const actual = v?.total_actual.kobo ?? 0;
  const remaining = budgeted - actual;
  const consumed = budgeted ? Math.round((actual * 100) / budgeted) : null;

  const doApprove = async () => { try { const r = await approve({ id: budget.id, entity }).unwrap(); toast.success(r.message || "Budget approved."); } catch { /* central */ } };

  return (
    <DetailDrawer open onOpenChange={(o) => (o ? undefined : onClose())}
      title={budget.name} description={`FY ${budget.fiscal_year} · ${budget.lines.length} lines`} widthClass="sm:max-w-3xl"
      footer={<>
        <StatusPill status={budget.status} />
        <div className="flex-1" />
        {budget.status === "DRAFT" ? (
          <Can permission={P.FIN_APPROVE_BUDGET}>
            <Button disabled={approving} onClick={doApprove} className="gap-1.5"><CheckCircle2 className="size-4" />{approving ? "Approving…" : "Approve & lock"}</Button>
          </Can>
        ) : <span className="inline-flex items-center gap-1.5 font-mont text-[11px] text-gray-05"><Lock className="size-3.5" /> Locked — only forecast revisions allowed</span>}
      </>}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Budgeted" kobo={budgeted} currency={currency} />
          <Metric label="Actual YTD" kobo={actual} currency={currency} />
          <Metric label="Variance (remaining)" kobo={remaining} currency={currency} tone={remaining < 0 ? "bad" : "good"} />
          <div className="rounded-md border border-gray-03 bg-white p-3">
            <p className="font-mont text-[11px] text-gray-05">% Consumed</p>
            <p className={cn("mt-1 font-mont text-sm font-semibold tabular-nums", consumed != null && consumed > 100 ? "text-destructive" : "text-black-01")}>{consumed == null ? "—" : `${consumed}%`}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines · actual vs budget</p>
            {!locked && can(P.FIN_EDIT_BUDGET) ? (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="size-3.5" /> Add line</Button>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-md border border-gray-03">
            <table className="w-full border-collapse">
              <thead><tr>
                <th className={thCls}>GL · Account</th>
                <th className={cn(thCls, "text-right")}>Budget</th><th className={cn(thCls, "text-right")}>Actual YTD</th>
                <th className={cn(thCls, "text-right")}>Variance</th><th className={cn(thCls, "text-right")}>Consumed</th>
              </tr></thead>
              <tbody>
                {(v?.rows ?? []).map((r) => {
                  const rem = r.budget.kobo - r.actual.kobo;
                  const pct = r.budget.kobo ? (r.actual.kobo * 100) / r.budget.kobo : null;
                  return (
                    <tr key={r.account_id}>
                      <td className={tdCls}><span className="tabular-nums text-gray-05">{r.code}</span> {r.name}</td>
                      <td className={cn(tdCls, "text-right tabular-nums")}>{formatMoney(r.budget.kobo, currency)}</td>
                      <td className={cn(tdCls, "text-right tabular-nums")}>{formatMoney(r.actual.kobo, currency)}</td>
                      <td className={cn(tdCls, "text-right tabular-nums", rem < 0 ? "text-destructive" : "text-green-01")}>{formatMoney(rem, currency)}</td>
                      <td className={cn(tdCls)}><ConsumedBar pct={pct} /></td>
                    </tr>
                  );
                })}
                {(v?.rows ?? []).length === 0 ? (
                  <tr><td className={cn(tdCls, "text-center text-gray-05")} colSpan={5}>No lines yet{!locked ? " — add one above." : "."}</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adding ? <AddLineDrawer budget={budget} entity={entity} currency={currency} onClose={() => setAdding(false)} /> : null}
    </DetailDrawer>
  );
}

function Metric({ label, kobo, currency, tone }: { label: string; kobo: number; currency?: string | null; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-md border border-gray-03 bg-white p-3">
      <p className="font-mont text-[11px] text-gray-05">{label}</p>
      <p className={cn("mt-1 font-mont text-sm font-semibold tabular-nums", tone === "bad" ? "text-destructive" : tone === "good" ? "text-green-01" : "text-black-01")}>{formatMoney(kobo, currency)}</p>
    </div>
  );
}

function AddLineDrawer({ budget, entity, currency, onClose }: { budget: Budget; entity: string; currency?: string | null; onClose: () => void }) {
  const [account, setAccount] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [period, setPeriod] = useState("1");
  const [amount, setAmount] = useState(0);
  const [add, { isLoading }] = useAddBudgetLineMutation();
  const submit = async () => {
    try {
      const r = await add({ id: budget.id, entity, account, period_no: Number(period), amount, cost_center: costCenter || undefined }).unwrap();
      toast.success(r.message || "Line saved.");
      onClose();
    } catch { /* central */ }
  };
  return (
    <DetailDrawer open onOpenChange={(o) => (o ? undefined : onClose())}
      title="Add budget line" description={`${budget.name} · one GL account × cost centre × period`} widthClass="sm:max-w-md"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading || !account || amount <= 0} onClick={submit} className="gap-1.5"><Plus className="size-4" />{isLoading ? "Saving…" : "Save line"}</Button>
      </>}>
      <div className="space-y-4">
        <FormField label="Account" required><AccountPicker entity={entity} value={account} onChange={setAccount} postableOnly /></FormField>
        <FormField label="Cost center"><CostCenterPicker entity={entity} value={costCenter} onChange={setCostCenter} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 font-mont text-xs text-gray-05">Period</p>
            <Select value={period} onChange={setPeriod} className="w-full">
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Period {i + 1}</option>)}
            </Select>
          </div>
          <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} className="[&_input]:h-9" /></FormField>
        </div>
        <p className="font-mont text-[11px] text-gray-05">Re-saving the same account × cost centre × period overwrites that cell.</p>
      </div>
    </DetailDrawer>
  );
}

function NewBudgetDrawer({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [name, setName] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [create, { isLoading }] = useCreateBudgetMutation();
  const close = () => { setName(""); setFiscalYear(""); onClose(); };
  const submit = async () => {
    try {
      const r = await create({ entity, name: name.trim(), fiscal_year: fiscalYear ? Number(fiscalYear) : undefined }).unwrap();
      toast.success(r.message || "Budget created.");
      close();
    } catch { /* central */ }
  };
  return (
    <DetailDrawer open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="New budget" description="Build a fiscal year's spending plan, then add its lines." widthClass="sm:max-w-md"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
        <Button disabled={isLoading || !name.trim() || !fiscalYear} onClick={submit} className="gap-1.5"><Plus className="size-4" />{isLoading ? "Creating…" : "Create budget"}</Button>
      </>}>
      <div className="space-y-4">
        <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Operating budget · 2026/27" className="h-9 bg-white" /></FormField>
        <FormField label="Fiscal year" required><Input type="number" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="2026" className="h-9 bg-white" /></FormField>
        <p className="rounded-md border border-gray-03 bg-gray-03/40 px-3 py-2 font-mont text-[11px] text-gray-05">Once approved, a budget locks — its lines can no longer be edited, only its forecast revised.</p>
      </div>
    </DetailDrawer>
  );
}
