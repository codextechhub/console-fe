// Payroll (§6.7). Runs list → detail with per-employee lines (salary figures
// FLS-masked unless finance.payrollrun.view_sensitive), and Post + Pay actions.

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { FinanceShell } from "./finance-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, FormModal, FormField, MoneyInput, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { isStripped } from "@/utils/fls";
import {
  useGetPayrollRunsQuery,
  useGetPayrollRunQuery,
  usePostPayrollRunMutation,
  usePayPayrollRunMutation,
  useCreatePayrollRunMutation,
} from "@/redux/services/finance/ops-api";
import type { PayrollLine, PayrollRun } from "@/redux/services/finance/ops-types";

function maskedMoney(line: PayrollLine, field: "gross_amount" | "paye_amount" | "pension_amount" | "net_amount", currency?: string | null) {
  if (isStripped(line, field)) return <span className="text-gray-05">••••</span>;
  return <Money kobo={line[field] ?? 0} currency={currency} align="right" />;
}

export default function PayrollPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetPayrollRunsQuery({ entity: entity!, page }, { skip: !entity });

  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<PayrollRun>[] = [
    { header: "Run", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Period", cell: (r) => r.period_label },
    { header: "Pay date", cell: (r) => r.pay_date },
    { header: "Net total", align: "right", cell: (r) => <Money kobo={r.net_total} currency={currency} align="right" /> },
    { header: "Status", cell: (r) => <StatusPill status={r.run_status} /> },
  ];

  if (!entity) return <FinanceShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></FinanceShell>;

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Payroll</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Payroll runs. Salary figures are visible only with the sensitive grant.</p>
          </div>
          <Can permission={P.FIN_CREATE_PAYROLL}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New run</Button>
          </Can>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={(r) => setSelectedId(r.id)}
          emptyTitle="No payroll runs" emptyMessage="Payroll runs will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>
      <RunDrawer runId={selectedId} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
      <CreateRunModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </FinanceShell>
  );
}

interface EmpRow { employee_name: string; grossKobo: number; payeKobo: number; pensionKobo: number }
const emptyEmp = (): EmpRow => ({ employee_name: "", grossKobo: 0, payeKobo: 0, pensionKobo: 0 });

function CreateRunModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodLabel, setPeriodLabel] = useState("");
  const [lines, setLines] = useState<EmpRow[]>([emptyEmp()]);
  const [create, { isLoading }] = useCreatePayrollRunMutation();
  const setRow = (i: number, patch: Partial<EmpRow>) => setLines((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const apiLines = lines.filter((l) => l.employee_name.trim() && l.grossKobo > 0)
    .map((l) => ({ employee_name: l.employee_name.trim(), gross_amount: l.grossKobo, paye_amount: l.payeKobo, pension_amount: l.pensionKobo }));

  const submit = async () => {
    try {
      const r = await create({ entity, pay_date: payDate, period_label: periodLabel.trim() || undefined, lines: apiLines }).unwrap();
      toast.success(r.message || "Payroll run created.");
      setPeriodLabel(""); setLines([emptyEmp()]); onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New payroll run"
      description="Capture employees and pay components; net is computed. Post and pay afterwards." onSubmit={submit}
      loading={isLoading} canSubmit={!!payDate && apiLines.length > 0} widthClass="sm:max-w-3xl">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Pay date" required><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Period label"><Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="e.g. June 2026" className="bg-white" /></FormField>
      </div>
      <div className="pt-1">
        <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Employees</p>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={l.employee_name} onChange={(e) => setRow(i, { employee_name: e.target.value })} placeholder="Employee name" className="flex-1 bg-white" />
              <MoneyInput valueKobo={l.grossKobo} onChangeKobo={(k) => setRow(i, { grossKobo: k })} currency={currency} placeholder="Gross" className="w-32" />
              <MoneyInput valueKobo={l.payeKobo} onChangeKobo={(k) => setRow(i, { payeKobo: k })} currency={currency} placeholder="PAYE" className="w-28" />
              <MoneyInput valueKobo={l.pensionKobo} onChangeKobo={(k) => setRow(i, { pensionKobo: k })} currency={currency} placeholder="Pension" className="w-28" />
              <button type="button" onClick={() => setLines((rs) => rs.filter((_, idx) => idx !== i))} disabled={lines.length <= 1} className="text-gray-05 hover:text-destructive disabled:opacity-30"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines((rs) => [...rs, emptyEmp()])} className="gap-1.5"><Plus className="size-4" /> Add employee</Button>
        </div>
      </div>
    </FormModal>
  );
}

const headCls = "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs whitespace-nowrap pt-2.5 pb-2 px-3";
const cellCls = "text-black-01 border-gray-03 font-medium font-mont text-sm px-3 py-2";

function RunDrawer({ runId, entity, currency, onClose }: { runId: number | null; entity: string; currency?: string | null; onClose: () => void }) {
  const open = runId != null;
  const { data } = useGetPayrollRunQuery({ id: runId!, entity }, { skip: !open });
  const [post] = usePostPayrollRunMutation();
  const [pay] = usePayPayrollRunMutation();
  const r = data?.data;

  return (
    <DetailDrawer open={open} onOpenChange={(o) => !o && onClose()}
      title={r ? r.document_number : "Payroll run"} description={r?.period_label} widthClass="sm:max-w-2xl"
      footer={r && (
        <div className="flex gap-2">
          {r.run_status === "DRAFT" && (
            <ActionButton label="Post" permission={P.FIN_POST_PAYROLL} title="Post payroll run?"
              description={`Posts the payroll journal for ${r.document_number}.`}
              onConfirm={async () => { const res = await post({ id: r.id, entity }).unwrap(); toast.success(res.message || "Posted."); }} />
          )}
          {r.run_status === "POSTED" && (
            <ActionButton label="Pay" permission={P.FIN_PAY_PAYROLL} title="Pay payroll run?"
              description={`Disburses net pay for ${r.document_number}.`}
              onConfirm={async () => { const res = await pay({ id: r.id, entity }).unwrap(); toast.success(res.message || "Paid."); }} />
          )}
        </div>
      )}>
      {r && (
        <div className="space-y-4">
          <div className="flex items-center gap-3"><StatusPill status={r.run_status} /><span className="font-mont text-sm text-gray-05">Net <Money kobo={r.net_total} currency={currency} className="font-semibold text-black-01" /></span></div>
          <div className="overflow-x-auto rounded-md border border-gray-03">
            <table className="w-full">
              <thead><tr>
                <th className={headCls + " text-left"}>Employee</th>
                <th className={headCls + " text-right"}>Gross</th>
                <th className={headCls + " text-right"}>PAYE</th>
                <th className={headCls + " text-right"}>Pension</th>
                <th className={headCls + " text-right"}>Net</th>
              </tr></thead>
              <tbody>
                {r.lines.map((l) => (
                  <tr key={l.id} className="border-t border-gray-03">
                    <td className={cellCls}>{isStripped(l, "employee_name") ? <span className="text-gray-05">••••</span> : l.employee_name || "—"}</td>
                    <td className={cellCls + " text-right"}>{maskedMoney(l, "gross_amount", currency)}</td>
                    <td className={cellCls + " text-right"}>{maskedMoney(l, "paye_amount", currency)}</td>
                    <td className={cellCls + " text-right"}>{maskedMoney(l, "pension_amount", currency)}</td>
                    <td className={cellCls + " text-right"}>{maskedMoney(l, "net_amount", currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DetailDrawer>
  );
}
