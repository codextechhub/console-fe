// Payroll (§6.7), rebuilt to the Vision prototype in the house theme: two tabs —
// Payroll runs and Employee salaries (the roster). A run shows Gross/PAYE/Pension/
// Net metric cards and a payslips table (per-employee figures FLS-masked unless the
// caller holds finance.payrollrun.view_sensitive); runs can be generated from the
// roster, posted, paid, and each payslip printed.
//
// Honest adaptations: we build Payroll runs + the Employee-salary roster the prototype's
// "Salary structures" / "Statutory returns" tabs and "Statutory pack" aren't modeled
// (PAYE/pension remit via Tax Remittance), and a payslip is the line's gross/PAYE/
// pension/net (no allowance/benefit breakdown).

import { useEffect, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { Plus, Trash2, Search, Sparkles, Banknote, Printer, Pencil, FileText, Users } from "lucide-react";
import { FinanceShell } from "./finance-shell";
import { DataTable, Money, MoneyInput, DetailDrawer, FormField, CostCenterPicker, Segmented, InfoHint, useActiveEntity, toArray, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import { isStripped } from "@/utils/fls";
import {
  useGetPayrollRunsQuery, useGetPayrollRunQuery, usePostPayrollRunMutation,
  usePayPayrollRunMutation, useCreatePayrollRunMutation, useGeneratePayrollRunMutation,
  useGetEmployeeSalariesQuery, useCreateEmployeeSalaryMutation, useUpdateEmployeeSalaryMutation,
  useDeleteEmployeeSalaryMutation,
} from "@/redux/services/finance/ops-api";
import type { PayrollLine, PayrollRun, EmployeeSalary } from "@/redux/services/finance/ops-types";

const todayISO = new Date().toISOString().slice(0, 10);
const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const thCls = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const tdCls = "border-t border-gray-03 px-3 py-2 font-mont text-xs text-black-01";
const fmtDate = (s: string) => new Date(s).toLocaleDateString();

const RUN_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-03/60 text-gray-05" },
  POSTED: { label: "Posted", cls: "bg-blue-50 text-blue-700" },
  PAID: { label: "Paid", cls: "bg-green-01/10 text-green-01" },
  CANCELLED: { label: "Cancelled", cls: "bg-destructive/10 text-destructive" },
};
function RunPill({ status }: { status: string }) {
  const s = RUN_STATUS[status] ?? RUN_STATUS.DRAFT;
  return <span className={cn(PILL, s.cls)}>{s.label}</span>;
}
function maskedMoney(obj: { _stripped_fields?: string[] }, field: string, value: number | undefined, currency?: string | null) {
  if (isStripped(obj, field)) return <span className="text-gray-05">••••</span>;
  return <Money kobo={value ?? 0} currency={currency} align="right" />;
}
function Kpi({ label, value, hint, danger }: { label: string; value: string; hint?: string; danger?: boolean }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="font-mont text-xs text-gray-05">{label}</p>
      <p className={cn("mt-1 font-mont text-xl font-semibold tabular-nums", danger ? "text-destructive" : "text-black-01")}>{value}</p>
      {hint && <p className="mt-0.5 font-mont text-[11px] text-gray-05">{hint}</p>}
    </div>
  );
}

const TABS = [{ key: "runs", label: "Payroll runs", icon: FileText }, { key: "employees", label: "Employee salaries", icon: Users }] as const;

export default function PayrollPage() {
  const { code: entity, currency } = useActiveEntity();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("runs");
  if (!entity) return <FinanceShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></FinanceShell>;

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mont text-lg font-semibold text-gray-01">Payroll</h1>
            <InfoHint>A payroll run computes gross, PAYE, pension and net for every employee, then posts one journal — Dr salary expense; Cr PAYE payable, Cr pension payable, Cr net-wages payable. Paying it clears net-wages payable against the bank. Per-employee figures need the sensitive grant.</InfoHint>
          </div>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Monthly salary runs and payslips, generated from the employee roster.</p>
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

        {tab === "runs" ? <RunsTab entity={entity} currency={currency} /> : <EmployeesTab entity={entity} currency={currency} />}
      </main>
    </FinanceShell>
  );
}

function RunsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetPayrollRunsQuery({ entity });
  const rows = useMemo(() => toArray(data?.data), [data]);

  const kpis = useMemo(() => {
    const latest = rows[0];
    const toPay = rows.filter((r) => r.run_status === "POSTED").reduce((s, r) => s + r.net_total, 0);
    return {
      runs: rows.length,
      employees: latest?.lines.length ?? 0,
      net: latest?.net_total ?? 0,
      toPay,
    };
  }, [rows]);

  const columns: Column<PayrollRun>[] = [
    { header: "Run no.", cell: (r) => <span className="font-semibold tabular-nums">{r.document_number}</span> },
    { header: "Period", cell: (r) => r.period_label || "—" },
    { header: "Payment date", cell: (r) => <span className="tabular-nums text-gray-05">{fmtDate(r.pay_date)}</span> },
    { header: "Employees", align: "right", cell: (r) => <span className="tabular-nums text-gray-05">{r.lines.length}</span> },
    { header: "Total gross", align: "right", cell: (r) => <Money kobo={r.gross_total} currency={currency} align="right" /> },
    { header: "Deductions", align: "right", cell: (r) => <Money kobo={r.paye_total + r.pension_total} currency={currency} align="right" /> },
    { header: "Net pay", align: "right", cell: (r) => <Money kobo={r.net_total} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <RunPill status={r.run_status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Payroll runs" value={String(kpis.runs)} />
        <Kpi label="Employees (latest run)" value={String(kpis.employees)} />
        <Kpi label="Net pay (latest run)" value={formatMoney(kpis.net, currency)} />
        <Kpi label="Awaiting payment" value={formatMoney(kpis.toPay, currency)} danger={kpis.toPay > 0} hint="Posted, not yet disbursed" />
      </div>

      <div className="flex justify-end">
        <Can permission={P.FIN_CREATE_PAYROLL}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New payroll run</Button>
        </Can>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={(r) => setSelectedId(r.id)}
        emptyTitle="No payroll runs" emptyMessage="Generate a run from the employee roster with New payroll run." />

      <RunDrawer runId={selectedId} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
      <NewRunDrawer open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </div>
  );
}

function RunDrawer({ runId, entity, currency, onClose }: { runId: number | null; entity: string; currency?: string | null; onClose: () => void }) {
  const { can } = useCan();
  const [paying, setPaying] = useState(false);
  const { data } = useGetPayrollRunQuery(runId != null ? { id: runId, entity } : skipToken);
  const [post, { isLoading: posting }] = usePostPayrollRunMutation();
  const r = data?.data;
  if (runId == null || !r) return null;

  const doPost = async () => { try { const res = await post({ id: r.id, entity }).unwrap(); toast.success(res.message || "Run posted."); } catch { /* central */ } };

  return (
    <>
      <DetailDrawer open={runId != null} onOpenChange={(o) => (o ? undefined : onClose())}
        title={r.document_number} description={`${r.period_label || "—"} · ${r.lines.length} employees`} widthClass="sm:max-w-3xl"
        footer={
          <>
            <RunPill status={r.run_status} />
            <div className="flex-1" />
            {r.run_status === "DRAFT" ? <Can permission={P.FIN_POST_PAYROLL}><Button disabled={posting} onClick={doPost} className="gap-1.5"><Banknote className="size-4" />{posting ? "Posting…" : "Post run"}</Button></Can> : null}
            {r.run_status === "POSTED" ? <Can permission={P.FIN_PAY_PAYROLL}><Button onClick={() => setPaying(true)} className="gap-1.5"><Banknote className="size-4" /> Pay net</Button></Can> : null}
          </>
        }>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Metric label="Gross" kobo={r.gross_total} currency={currency} />
            <Metric label="PAYE" kobo={r.paye_total} currency={currency} />
            <Metric label="Pension" kobo={r.pension_total} currency={currency} />
            <Metric label="Net" kobo={r.net_total} currency={currency} />
            <div className="rounded-md border border-gray-03 bg-white p-3"><p className="font-mont text-[11px] text-gray-05">Status</p><div className="mt-1.5"><RunPill status={r.run_status} /></div></div>
          </div>

          <div>
            <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Payslips · {r.lines.length}</p>
            <div className="overflow-hidden rounded-md border border-gray-03">
              <table className="w-full border-collapse">
                <thead><tr>
                  <th className={thCls}>Employee</th><th className={cn(thCls, "text-right")}>Gross</th>
                  <th className={cn(thCls, "text-right")}>PAYE</th><th className={cn(thCls, "text-right")}>Pension</th>
                  <th className={cn(thCls, "text-right")}>Net</th><th className={thCls} />
                </tr></thead>
                <tbody>
                  {r.lines.map((l) => (
                    <tr key={l.id}>
                      <td className={tdCls}>{isStripped(l, "employee_name") ? <span className="text-gray-05">••••</span> : l.employee_name || "—"}</td>
                      <td className={cn(tdCls, "text-right tabular-nums")}>{maskedMoney(l, "gross_amount", l.gross_amount, currency)}</td>
                      <td className={cn(tdCls, "text-right tabular-nums")}>{maskedMoney(l, "paye_amount", l.paye_amount, currency)}</td>
                      <td className={cn(tdCls, "text-right tabular-nums")}>{maskedMoney(l, "pension_amount", l.pension_amount, currency)}</td>
                      <td className={cn(tdCls, "text-right tabular-nums font-medium")}>{maskedMoney(l, "net_amount", l.net_amount, currency)}</td>
                      <td className={cn(tdCls, "text-right")}>
                        {!isStripped(l, "net_amount") ? <button type="button" onClick={() => printPayslip(r, l, currency)} className="inline-flex items-center gap-1 font-mont text-[11px] font-medium text-primary hover:underline"><Printer className="size-3" /> Payslip</button> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DetailDrawer>

      {paying ? <PayDrawer run={r} entity={entity} currency={currency} onClose={() => setPaying(false)} /> : null}
    </>
  );
}

function Metric({ label, kobo, currency }: { label: string; kobo: number; currency?: string | null }) {
  return <div className="rounded-md border border-gray-03 bg-white p-3"><p className="font-mont text-[11px] text-gray-05">{label}</p><p className="mt-1 font-mont text-sm font-semibold tabular-nums text-black-01">{formatMoney(kobo, currency)}</p></div>;
}

function PayDrawer({ run, entity, currency, onClose }: { run: PayrollRun; entity: string; currency?: string | null; onClose: () => void }) {
  const [payDate, setPayDate] = useState(run.pay_date || todayISO);
  const [pay, { isLoading }] = usePayPayrollRunMutation();
  const submit = async () => {
    try { const res = await pay({ id: run.id, entity, pay_date: payDate }).unwrap(); toast.success(res.message || "Net pay disbursed."); onClose(); }
    catch { /* central */ }
  };
  return (
    <DetailDrawer open onOpenChange={(o) => (o ? undefined : onClose())}
      title="Pay net wages" description={`${run.document_number} · ${run.period_label || "—"}`} widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading || !payDate} onClick={submit} className="gap-1.5"><Banknote className="size-4" />{isLoading ? "Paying…" : `Pay ${formatMoney(run.net_total, currency)}`}</Button>
      </>}>
      <div className="space-y-4">
        <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          Disburses net pay ({formatMoney(run.net_total, currency)}) — Dr net-wages payable, Cr bank — clearing the liability raised when the run was posted.
        </p>
        <FormField label="Payment date" required><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-9 bg-white" /></FormField>
      </div>
    </DetailDrawer>
  );
}

// ── New payroll run ──────────────────────────────────────────────────────────
type EmpRow = { employee_name: string; gross: number; paye: number; pension: number };
const emptyEmp = (): EmpRow => ({ employee_name: "", gross: 0, paye: 0, pension: 0 });

function NewRunDrawer({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [mode, setMode] = useState("roster");
  const [payDate, setPayDate] = useState(todayISO);
  const [periodLabel, setPeriodLabel] = useState("");
  const [lines, setLines] = useState<EmpRow[]>([emptyEmp()]);
  const { data: rosterData } = useGetEmployeeSalariesQuery({ entity, is_active: "true" }, { skip: !open });
  const roster = useMemo(() => toArray(rosterData?.data), [rosterData]);
  const [generate, { isLoading: generating }] = useGeneratePayrollRunMutation();
  const [create, { isLoading: creating }] = useCreatePayrollRunMutation();
  const isLoading = generating || creating;

  const setRow = (i: number, patch: Partial<EmpRow>) => setLines((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const validLines = lines.filter((l) => l.employee_name.trim() && l.gross > 0);
  const close = () => { setMode("roster"); setPayDate(todayISO); setPeriodLabel(""); setLines([emptyEmp()]); onClose(); };

  const submit = async () => {
    try {
      if (mode === "roster") {
        const res = await generate({ entity, pay_date: payDate, period_label: periodLabel.trim() || undefined }).unwrap();
        toast.success(res.message || "Run generated.");
      } else {
        const res = await create({ entity, pay_date: payDate, period_label: periodLabel.trim() || undefined,
          lines: validLines.map((l) => ({ employee_name: l.employee_name.trim(), gross_amount: l.gross, paye_amount: l.paye, pension_amount: l.pension })) }).unwrap();
        toast.success(res.message || "Run created.");
      }
      close();
    } catch { /* central */ }
  };

  const canSubmit = !!payDate && (mode === "roster" ? roster.length > 0 : validLines.length > 0);

  return (
    <DetailDrawer open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="New payroll run" description="Generate from the employee roster, or enter lines manually."
      widthClass={mode === "manual" ? "sm:max-w-4xl" : "sm:max-w-lg"}
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
        <Button disabled={isLoading || !canSubmit} onClick={submit} className="gap-1.5">
          {mode === "roster" ? <Sparkles className="size-4" /> : <Plus className="size-4" />}
          {isLoading ? "Working…" : mode === "roster" ? "Generate run" : "Create run"}
        </Button>
      </>}>
      <div className="space-y-4">
        <Segmented value={mode} onChange={setMode} options={[{ value: "roster", label: "From roster" }, { value: "manual", label: "Manual" }]} />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Period" ><Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="e.g. June 2026" className="h-9 bg-white" /></FormField>
          <FormField label="Payment date" required><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-9 bg-white" /></FormField>
        </div>

        {mode === "roster" ? (
          <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-3 font-mont text-[11px] text-gray-05">
            {roster.length > 0
              ? <>This will raise a draft run for the <span className="font-medium text-gray-01">{roster.length}</span> active employee(s) on the roster, copying each one's standard gross, PAYE and pension. Review, then post.</>
              : <>No active employees on the roster yet. Add them under <span className="font-medium text-gray-01">Employee salaries</span>, or switch to Manual.</>}
          </p>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Employees</p>
              <Button variant="outline" size="sm" onClick={() => setLines((rs) => [...rs, emptyEmp()])} className="gap-1.5"><Plus className="size-3.5" /> Add</Button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-end gap-2 rounded-md border border-gray-03 bg-white p-2.5">
                  <div className="grid flex-1 grid-cols-12 gap-2">
                    <div className="col-span-5"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Employee</p><Input value={l.employee_name} onChange={(e) => setRow(i, { employee_name: e.target.value })} placeholder="Name" className="h-9 bg-white text-sm" /></div>
                    <div className="col-span-3"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Gross</p><MoneyInput valueKobo={l.gross} onChangeKobo={(k) => setRow(i, { gross: k })} currency={currency} className="[&_input]:h-9" /></div>
                    <div className="col-span-2"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">PAYE</p><MoneyInput valueKobo={l.paye} onChangeKobo={(k) => setRow(i, { paye: k })} currency={currency} className="[&_input]:h-9" /></div>
                    <div className="col-span-2"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Pension</p><MoneyInput valueKobo={l.pension} onChangeKobo={(k) => setRow(i, { pension: k })} currency={currency} className="[&_input]:h-9" /></div>
                  </div>
                  <button type="button" onClick={() => setLines((rs) => rs.filter((_, idx) => idx !== i))} disabled={lines.length <= 1} className="mb-0.5 shrink-0 rounded p-1.5 text-gray-05 hover:bg-destructive/5 hover:text-destructive disabled:opacity-30"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DetailDrawer>
  );
}

// ── Employee salaries (roster) ───────────────────────────────────────────────
function EmployeesTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { can } = useCan();
  const [searchInput, setSearchInput] = useState("");
  const [editing, setEditing] = useState<EmployeeSalary | "new" | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetEmployeeSalariesQuery({ entity });
  const all = useMemo(() => toArray(data?.data), [data]);
  const rows = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all;
  }, [all, searchInput]);

  const [remove] = useDeleteEmployeeSalaryMutation();
  const doRemove = async (id: number) => { try { await remove({ id, entity }).unwrap(); toast.success("Employee removed."); } catch { /* central */ } };

  const cols: Column<EmployeeSalary>[] = [
    { header: "Employee", cell: (e) => <span className="font-medium text-gray-01">{e.name}</span> },
    { header: "Cost center", cell: (e) => <span className="tabular-nums text-gray-05">{e.cost_center || "—"}</span> },
    { header: "Gross", align: "right", cell: (e) => maskedMoney(e, "gross_amount", e.gross_amount, currency) },
    { header: "PAYE", align: "right", cell: (e) => maskedMoney(e, "paye_amount", e.paye_amount, currency) },
    { header: "Pension", align: "right", cell: (e) => maskedMoney(e, "pension_amount", e.pension_amount, currency) },
    { header: "Net", align: "right", cell: (e) => maskedMoney(e, "net_amount", e.net_amount, currency) },
    { header: "Status", cell: (e) => <span className={cn(PILL, e.is_active ? "bg-green-01/10 text-green-01" : "bg-gray-03/60 text-gray-05")}>{e.is_active ? "Active" : "Inactive"}</span> },
    { header: "", align: "right", cell: (e) => can(P.FIN_CREATE_PAYROLL) ? (
      <span className="inline-flex items-center gap-2">
        <button type="button" onClick={() => setEditing(e)} className="text-gray-05 hover:text-primary" aria-label="Edit"><Pencil className="size-3.5" /></button>
        <button type="button" onClick={() => doRemove(e.id)} className="text-gray-05 hover:text-destructive" aria-label="Remove"><Trash2 className="size-3.5" /></button>
      </span>
    ) : null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search employee" className="h-9 w-64 bg-white pl-8 font-mont" />
        </div>
        <Can permission={P.FIN_CREATE_PAYROLL}>
          <Button onClick={() => setEditing("new")} className="gap-1.5"><Plus className="size-4" /> Add employee</Button>
        </Can>
      </div>
      <DataTable columns={cols} rows={rows} rowKey={(e) => e.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle={searchInput ? "No matching employees" : "No employees yet"}
        emptyMessage={searchInput ? "Try a different search." : "Add employees to generate payroll runs from the roster."} />

      <EmployeeDrawer open={editing !== null} salary={editing === "new" ? null : editing} entity={entity} currency={currency} onClose={() => setEditing(null)} />
    </div>
  );
}

function EmployeeDrawer({ open, salary, entity, currency, onClose }: { open: boolean; salary: EmployeeSalary | null; entity: string; currency?: string | null; onClose: () => void }) {
  const isEdit = !!salary;
  const [name, setName] = useState("");
  const [gross, setGross] = useState(0);
  const [paye, setPaye] = useState(0);
  const [pension, setPension] = useState(0);
  const [costCenter, setCostCenter] = useState("");
  const [active, setActive] = useState(true);
  const [create, { isLoading: creating }] = useCreateEmployeeSalaryMutation();
  const [update, { isLoading: updating }] = useUpdateEmployeeSalaryMutation();
  const isLoading = creating || updating;

  // Sync the form to the row being edited (amounts only populate if not FLS-stripped).
  useEffect(() => {
    if (!open) return;
    if (salary) { setName(salary.name); setGross(salary.gross_amount ?? 0); setPaye(salary.paye_amount ?? 0); setPension(salary.pension_amount ?? 0); setCostCenter(salary.cost_center ?? ""); setActive(salary.is_active); }
    else { setName(""); setGross(0); setPaye(0); setPension(0); setCostCenter(""); setActive(true); }
  }, [open, salary]);

  const submit = async () => {
    try {
      if (isEdit && salary) { const r = await update({ id: salary.id, entity, name: name.trim(), gross_amount: gross, paye_amount: paye, pension_amount: pension, cost_center: costCenter || undefined, is_active: active }).unwrap(); toast.success(r.message || "Updated."); }
      else { const r = await create({ entity, name: name.trim(), gross_amount: gross, paye_amount: paye, pension_amount: pension, cost_center: costCenter || undefined }).unwrap(); toast.success(r.message || "Employee added."); }
      onClose();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer open={open} onOpenChange={(o) => (o ? undefined : onClose())}
      title={isEdit ? "Edit employee salary" : "Add employee"} description="Standard monthly pay used to generate runs."
      widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading || !name.trim() || gross <= 0} onClick={submit} className="gap-1.5"><Plus className="size-4" />{isLoading ? "Saving…" : isEdit ? "Save changes" : "Add employee"}</Button>
      </>}>
      <div className="space-y-4">
        <FormField label="Employee name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-9 bg-white" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Gross (monthly)" required><MoneyInput valueKobo={gross} onChangeKobo={setGross} currency={currency} className="[&_input]:h-9" /></FormField>
          <FormField label="Cost center"><CostCenterPicker entity={entity} value={costCenter} onChange={setCostCenter} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="PAYE"><MoneyInput valueKobo={paye} onChangeKobo={setPaye} currency={currency} className="[&_input]:h-9" /></FormField>
          <FormField label="Pension"><MoneyInput valueKobo={pension} onChangeKobo={setPension} currency={currency} className="[&_input]:h-9" /></FormField>
        </div>
        <div className="flex items-center justify-between rounded-md border border-gray-03 bg-gray-03 px-3 py-2">
          <span className="font-mont text-[11px] text-gray-05">Net (take-home)</span>
          <span className="font-mont text-sm font-semibold tabular-nums text-black-01">{formatMoney(gross - paye - pension, currency)}</span>
        </div>
        {isEdit ? <label className="flex items-center gap-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-primary" /> Active (included in generated runs)</label> : null}
      </div>
    </DetailDrawer>
  );
}

function printPayslip(run: PayrollRun, line: PayrollLine, currency?: string | null) {
  const money = (k?: number) => formatMoney(k ?? 0, currency);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payslip — ${line.employee_name}</title>
  <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;padding:32px;max-width:520px;margin:auto}
  h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:13px}td{padding:7px 0;border-bottom:1px solid #eee}
  td.r{text-align:right;font-variant-numeric:tabular-nums}.net td{font-weight:700;border-top:2px solid #ddd;border-bottom:none}</style></head><body>
  <h1>Payslip</h1>
  <div class="sub">${line.employee_name} · ${run.period_label || ""} · ${run.document_number} · paid ${fmtDate(run.pay_date)}</div>
  <table>
    <tr><td>Gross pay</td><td class="r">${money(line.gross_amount)}</td></tr>
    <tr><td>PAYE (income tax)</td><td class="r">− ${money(line.paye_amount)}</td></tr>
    <tr><td>Pension</td><td class="r">− ${money(line.pension_amount)}</td></tr>
    <tr class="net"><td>Net pay</td><td class="r">${money(line.net_amount)}</td></tr>
  </table></body></html>`;
  const w = window.open("", "_blank", "width=560,height=720");
  if (!w) { toast.error("Pop-up blocked — allow pop-ups to print."); return; }
  w.document.write(html); w.document.close(); w.focus(); w.print();
}
