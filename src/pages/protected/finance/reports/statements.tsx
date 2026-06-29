// Financial-statement renderers for the Reports area. Each reads its report
// endpoint and shows the figures with an export bar (CSV / Excel / PDF). Money
// uses the report's `{kobo, naira}` pair directly.

import { Download } from "lucide-react";
import { Money } from "@/components/finance-ui";
import { LoadingState, ErrorState } from "@/components/finance-ui/states";
import { cn } from "@/lib/utils";
import { downloadReportExport } from "@/utils/finance-export";
import {
  useGetIncomeStatementQuery,
  useGetBalanceSheetQuery,
  useGetCashFlowQuery,
  useGetChangesInEquityQuery,
} from "@/redux/services/finance/reports-api";

const th = "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs px-3 py-2";
const td = "text-black-01 border-t border-gray-03 font-mont text-sm px-3 py-2";

function ExportBar({ path, entity }: { path: string; entity: string }) {
  return (
    <div className="flex items-center gap-2">
      {(["csv", "xlsx", "pdf"] as const).map((f) => (
        <button
          key={f}
          onClick={() => downloadReportExport(path, { entity }, f)}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mont text-xs font-semibold text-gray-01 hover:border-primary hover:text-primary"
        >
          <Download className="size-3.5" /> {f.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Frame({ title, entity, path, children }: { title: string; entity: string; path: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mont text-sm font-semibold text-gray-01">{title}</p>
        <ExportBar path={path} entity={entity} />
      </div>
      <div className="overflow-x-auto rounded-md bg-white">{children}</div>
    </div>
  );
}

export function IncomeStatementReport({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetIncomeStatementQuery({ entity });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const d = data.data;
  const section = (label: string, rows: typeof d.income) => rows.map((r) => (
    <tr key={label + r.account_id}><td className={td}>{label}</td><td className={td}>{r.code} · {r.name}</td><td className={td + " text-right"}><Money kobo={r.amount.kobo} currency={currency} align="right" /></td></tr>
  ));
  return (
    <Frame title="Income Statement" entity={entity} path="/finance/reports/income-statement/">
      <table className="w-full">
        <thead><tr><th className={th + " text-left"}>Section</th><th className={th + " text-left"}>Account</th><th className={th + " text-right"}>Amount</th></tr></thead>
        <tbody>
          {section("Income", d.income)}
          {section("Expense", d.expense)}
          <tr className="font-semibold"><td className={td} /><td className={td + " text-right"}>Total income</td><td className={td + " text-right"}><Money kobo={d.total_income.kobo} currency={currency} align="right" /></td></tr>
          <tr className="font-semibold"><td className={td} /><td className={td + " text-right"}>Total expense</td><td className={td + " text-right"}><Money kobo={d.total_expense.kobo} currency={currency} align="right" /></td></tr>
          <tr className="font-semibold"><td className={td} /><td className={td + " text-right"}>Net income</td><td className={td + " text-right"}><Money kobo={d.net_income.kobo} currency={currency} align="right" /></td></tr>
        </tbody>
      </table>
    </Frame>
  );
}

export function BalanceSheetReport({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetBalanceSheetQuery({ entity });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const d = data.data;
  const block = (label: string, rows: typeof d.assets, total: number) => (
    <>
      <tr className="bg-white-02/40"><td className={td + " font-semibold"} colSpan={2}>{label}</td><td className={td} /></tr>
      {rows.map((r) => <tr key={label + r.account_id}><td className={td} colSpan={2}>{r.code} · {r.name}</td><td className={td + " text-right"}><Money kobo={r.amount.kobo} currency={currency} align="right" /></td></tr>)}
      <tr className="font-semibold"><td className={td} colSpan={2}>Total {label.toLowerCase()}</td><td className={td + " text-right"}><Money kobo={total} currency={currency} align="right" /></td></tr>
    </>
  );
  return (
    <Frame title="Balance Sheet" entity={entity} path="/finance/reports/balance-sheet/">
      <table className="w-full">
        <tbody>
          {block("Assets", d.assets, d.total_assets.kobo)}
          {block("Liabilities", d.liabilities, d.total_liabilities.kobo)}
          {block("Equity", d.equity, d.total_equity.kobo)}
        </tbody>
      </table>
      <p className={cn("px-3 py-2 font-mont text-xs font-semibold", d.is_balanced ? "text-green-01" : "text-destructive")}>{d.is_balanced ? "Balanced ✓" : "Out of balance"}</p>
    </Frame>
  );
}

export function CashFlowReport({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetCashFlowQuery({ entity });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const d = data.data;
  return (
    <Frame title="Cash Flow Statement" entity={entity} path="/finance/reports/cash-flow/">
      <table className="w-full">
        <tbody>
          <tr><td className={td}>Opening cash</td><td className={td + " text-right"}><Money kobo={d.opening_cash.kobo} currency={currency} align="right" /></td></tr>
          {Object.entries(d.by_activity).map(([k, v]) => <tr key={k}><td className={td + " capitalize"}>{k} activities</td><td className={td + " text-right"}><Money kobo={v.kobo} currency={currency} align="right" /></td></tr>)}
          <tr className="font-semibold"><td className={td}>Net change</td><td className={td + " text-right"}><Money kobo={d.net_change.kobo} currency={currency} align="right" /></td></tr>
          <tr className="font-semibold"><td className={td}>Closing cash</td><td className={td + " text-right"}><Money kobo={d.closing_cash.kobo} currency={currency} align="right" /></td></tr>
        </tbody>
      </table>
    </Frame>
  );
}

export function EquityReport({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetChangesInEquityQuery({ entity });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const d = data.data;
  return (
    <Frame title="Statement of Changes in Equity" entity={entity} path="/finance/reports/changes-in-equity/">
      <table className="w-full">
        <thead><tr><th className={th + " text-left"}>Component</th><th className={th + " text-right"}>Opening</th><th className={th + " text-right"}>Profit</th><th className={th + " text-right"}>Contrib.</th><th className={th + " text-right"}>Closing</th></tr></thead>
        <tbody>
          {d.columns.map((c) => (
            <tr key={c.key}>
              <td className={td}>{c.label}</td>
              <td className={td + " text-right"}><Money kobo={c.opening.kobo} currency={currency} align="right" /></td>
              <td className={td + " text-right"}><Money kobo={c.profit.kobo} currency={currency} align="right" /></td>
              <td className={td + " text-right"}><Money kobo={c.contributions.kobo} currency={currency} align="right" /></td>
              <td className={td + " text-right"}><Money kobo={c.closing.kobo} currency={currency} align="right" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}
