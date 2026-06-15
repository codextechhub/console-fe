// Finance dashboard (§6.0). Headline KPIs from the income statement + AR aging,
// the trial-balance health check, and the most recent journals — all scoped to
// the selected entity. Cards/tables only; every write lives in its own area.

import { useNavigate } from "react-router";
import { FinanceShell } from "./finance-shell";
import { KpiCard, Money, StatusPill, TeachingNote, BarChart, Donut, CHART_COLORS, useActiveEntity } from "@/components/finance-ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { Check, TriangleAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { useGetArAgingQuery, useGetIncomeStatementQuery, useGetTrialBalanceQuery } from "@/redux/services/finance/reports-api";
import { useGetJournalsQuery } from "@/redux/services/finance/gl-api";

const headCls = "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs whitespace-nowrap pt-3 pb-2";
const cellCls = "text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5";

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const canReports = can(P.FIN_VIEW_REPORTS);
  const canJournals = can(P.FIN_VIEW_JOURNALS);
  const skip = !entity;

  const pnl = useGetIncomeStatementQuery({ entity: entity! }, { skip: skip || !canReports });
  const tb = useGetTrialBalanceQuery({ entity: entity! }, { skip: skip || !canReports });
  const aging = useGetArAgingQuery({ entity: entity! }, { skip: skip || !canReports });
  const journals = useGetJournalsQuery({ entity: entity!, page: 1 }, { skip: skip || !canJournals });

  const p = pnl.data?.data;
  const balanced = tb.data?.data?.is_balanced;
  const arOutstanding = aging.data?.data?.total_net.kobo ?? 0;
  const recent = (journals.data?.data ?? []).slice(0, 6);

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Finance Dashboard</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">
            Position and recent activity for the selected entity.
          </p>
        </div>

        <TeachingNote id="finance-dashboard">
          The executive view of this entity's finances — every figure is computed live from the general ledger. KPIs and charts reflect the selected period; drill into each area from the sidebar.
        </TeachingNote>

        {!entity ? (
          <EmptyState title="Select an entity" message="Choose a ledger entity to see its finances." />
        ) : !canReports ? (
          <EmptyState title="No report access" message="You don’t hold finance.report.view for this console." />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Income (period)" value={formatMoney(p?.total_income.kobo ?? 0, currency)} help="Total income recognised in the period (income-statement)." />
              <KpiCard label="Expense (period)" value={formatMoney(p?.total_expense.kobo ?? 0, currency)} help="Total expense recognised in the period." />
              <KpiCard
                label="Net surplus (period)"
                value={formatMoney(p?.net_income.kobo ?? 0, currency)}
                tone={(p?.net_income.kobo ?? 0) < 0 ? "alert" : "default"}
                help="Income less expense for the period; closes to retained earnings at year-end."
              />
              <KpiCard label="AR outstanding" value={formatMoney(arOutstanding, currency)} help="Net receivable across all customers (AR aging, net of unallocated credit)." />
            </div>

            {/* Charts — real data from income statement + AR aging */}
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-md bg-white p-5">
                <p className="mb-3 font-mont text-sm font-semibold text-gray-01">Income vs Expense</p>
                <Donut
                  data={[
                    { label: "Income", value: p?.total_income.kobo ?? 0, color: CHART_COLORS.green },
                    { label: "Expense", value: p?.total_expense.kobo ?? 0, color: CHART_COLORS.red },
                  ]}
                  center={{ main: formatMoney(p?.net_income.kobo ?? 0, currency), sub: "Net" }}
                />
              </div>
              <div className="rounded-md bg-white p-5">
                <p className="mb-1 font-mont text-sm font-semibold text-gray-01">AR aging</p>
                <p className="mb-2 font-mont text-xs text-gray-05">Outstanding receivable by age bucket.</p>
                <BarChart
                  data={Object.entries(aging.data?.data?.bucket_totals ?? {}).map(([label, m]) => ({ label, value: m.kobo }))}
                  color={CHART_COLORS.amber}
                  format={(v) => formatMoney(v, currency)}
                />
              </div>
            </div>
          </>
        )}

        {/* Trial-balance health */}
        {entity && canReports && tb.data && (
          <div className="flex items-center gap-2 rounded-md bg-white px-4 py-3 font-mont text-sm">
            {balanced ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-green-01">
                <Check className="size-4" /> Trial balance is balanced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
                <TriangleAlert className="size-4" /> Trial balance is out of balance
              </span>
            )}
            <span className="ml-auto text-gray-05">
              Debit <Money kobo={tb.data.data.total_debit.kobo} currency={currency} className="ml-1 font-semibold text-black-01" />
            </span>
            <span className="text-gray-05">
              Credit <Money kobo={tb.data.data.total_credit.kobo} currency={currency} className="ml-1 font-semibold text-black-01" />
            </span>
          </div>
        )}

        {/* Recent journals */}
        {entity && canJournals && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-mont text-sm font-semibold text-gray-01">Recent journals</p>
              <button
                onClick={() => navigate(routesPath.PROTECTED.FINANCE.LEDGER)}
                className="font-mont text-xs font-semibold text-primary hover:underline"
              >
                View all
              </button>
            </div>
            <div className="rounded-md bg-white">
              {journals.isLoading ? (
                <LoadingState rows={4} />
              ) : journals.isError ? (
                <ErrorState onRetry={journals.refetch} />
              ) : recent.length === 0 ? (
                <EmptyState title="No journals yet" message="Posted journals will appear here." />
              ) : (
                <Table>
                  <TableHeader className="border-0">
                    <TableRow>
                      <TableHead className={headCls}>Document</TableHead>
                      <TableHead className={headCls}>Date</TableHead>
                      <TableHead className={headCls}>Source</TableHead>
                      <TableHead className={headCls}>Narration</TableHead>
                      <TableHead className={headCls}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((j) => (
                      <TableRow
                        key={j.id}
                        className="cursor-pointer hover:bg-primary/5"
                        onClick={() => navigate(routesPath.PROTECTED.FINANCE.LEDGER)}
                      >
                        <TableCell className={cn(cellCls, "font-semibold")}>{j.document_number}</TableCell>
                        <TableCell className={cellCls}>{j.date}</TableCell>
                        <TableCell className={cellCls}>{j.source}</TableCell>
                        <TableCell className={cn(cellCls, "max-w-xs truncate text-gray-01")}>{j.narration || "—"}</TableCell>
                        <TableCell className={cellCls}><StatusPill status={j.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </main>
    </FinanceShell>
  );
}
