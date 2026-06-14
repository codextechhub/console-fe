// Payroll (§6.7). Runs list → detail with per-employee lines (salary figures
// FLS-masked unless finance.payrollrun.view_sensitive), and Post + Pay actions.

import { useState } from "react";
import { toast } from "sonner";
import { FinanceShell } from "./finance-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { P } from "@/permissions";
import { isStripped } from "@/utils/fls";
import {
  useGetPayrollRunsQuery,
  useGetPayrollRunQuery,
  usePostPayrollRunMutation,
  usePayPayrollRunMutation,
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
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Payroll</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Payroll runs. Salary figures are visible only with the sensitive grant.</p>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={(r) => setSelectedId(r.id)}
          emptyTitle="No payroll runs" emptyMessage="Payroll runs will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>
      <RunDrawer runId={selectedId} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
    </FinanceShell>
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
