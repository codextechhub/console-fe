// Procurement analytics (§7.5) — AP aging, GR/IR + AP control reconciliation,
// spend by vendor/category, and vendor performance.
import { useState } from "react";
import { ProcurementShell } from "./procurement-shell";
import { KpiCard, Money, TabBar, useActiveEntity } from "@/components/finance-ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { formatMoney } from "@/utils/money";
import {
  useGetApAgingQuery, useGetApReconciliationQuery, useGetGrirBalanceQuery,
  useGetSpendAnalysisQuery, useGetVendorPerformanceQuery,
} from "@/redux/services/procurement/procurement-ext-api";

const th = "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs px-3 py-2";
const td = "text-black-01 border-t border-gray-03 font-mont text-sm px-3 py-2";

function ApAgingTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetApAgingQuery({ entity });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const d = data.data;
  return (
    <div className="overflow-x-auto rounded-md bg-white">
      <table className="w-full">
        <thead><tr><th className={th + " text-left"}>Vendor</th>{d.buckets.map((b) => <th key={b} className={th + " text-right"}>{b}</th>)}<th className={th + " text-right"}>Net</th></tr></thead>
        <tbody>
          {d.rows.map((r) => (
            <tr key={r.vendor_id}>
              <td className={td}>{r.name}<span className="ml-1 text-gray-05">{r.code}</span></td>
              {d.buckets.map((b) => <td key={b} className={td + " text-right"}><Money kobo={r.buckets[b]?.kobo ?? 0} currency={currency} align="right" /></td>)}
              <td className={td + " text-right font-semibold"}><Money kobo={r.net.kobo} currency={currency} align="right" /></td>
            </tr>
          ))}
          <tr className="font-semibold"><td className={td}>TOTAL</td>{d.buckets.map((b) => <td key={b} className={td + " text-right"}><Money kobo={d.bucket_totals[b]?.kobo ?? 0} currency={currency} align="right" /></td>)}<td className={td + " text-right"}><Money kobo={d.total_net.kobo} currency={currency} align="right" /></td></tr>
        </tbody>
      </table>
    </div>
  );
}

function GrirTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const grir = useGetGrirBalanceQuery({ entity });
  const recon = useGetApReconciliationQuery({ entity });
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="GR/IR balance" value={formatMoney(grir.data?.data.grir_balance.kobo ?? 0, currency)} tone={grir.data?.data.is_clear ? "default" : "warn"} foot={grir.data?.data.is_clear ? "Clear" : "Open balance"} />
      <KpiCard label="AP sub-ledger" value={formatMoney(recon.data?.data.subledger_total.kobo ?? 0, currency)} />
      <KpiCard label="AP control" value={formatMoney(recon.data?.data.control_total.kobo ?? 0, currency)} />
      <KpiCard label="Difference" value={formatMoney(recon.data?.data.difference.kobo ?? 0, currency)} tone={recon.data?.data.is_reconciled ? "default" : "alert"} foot={recon.data?.data.is_reconciled ? "Reconciled" : "Out of balance"} />
    </div>
  );
}

function SpendTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetSpendAnalysisQuery({ entity });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  const d = data.data;
  const tableOf = (title: string, rows: typeof d.by_vendor) => (
    <div className="space-y-2">
      <p className="font-mont text-sm font-semibold text-gray-01">{title}</p>
      <div className="overflow-x-auto rounded-md bg-white">
        <table className="w-full">
          <thead><tr><th className={th + " text-left"}>Name</th><th className={th + " text-right"}>Net</th><th className={th + " text-right"}>Gross</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}><td className={td}>{r.name ?? r.code ?? "—"}</td><td className={td + " text-right"}><Money kobo={r.net?.kobo ?? 0} currency={currency} align="right" /></td><td className={td + " text-right"}><Money kobo={r.gross?.kobo ?? 0} currency={currency} align="right" /></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <KpiCard label="Total net" value={formatMoney(d.total_net.kobo, currency)} />
        <KpiCard label="Total gross" value={formatMoney(d.total_gross.kobo, currency)} />
        <KpiCard label="Invoices" value={d.invoice_count} />
      </div>
      {tableOf("By vendor", d.by_vendor)}
      {tableOf("By category", d.by_category)}
    </div>
  );
}

function PerformanceTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetVendorPerformanceQuery({ entity });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;
  return (
    <div className="overflow-x-auto rounded-md bg-white">
      <table className="w-full">
        <thead><tr><th className={th + " text-left"}>Vendor</th><th className={th + " text-right"}>POs</th><th className={th + " text-right"}>On-time %</th><th className={th + " text-right"}>Billed</th><th className={th + " text-right"}>Paid</th><th className={th + " text-right"}>Avg pay days</th></tr></thead>
        <tbody>
          {data.data.rows.map((r) => (
            <tr key={r.vendor_id}>
              <td className={td}>{r.name}<span className="ml-1 text-gray-05">{r.code}</span></td>
              <td className={td + " text-right"}>{r.po_count}</td>
              <td className={td + " text-right"}>{r.on_time_rate}%</td>
              <td className={td + " text-right"}><Money kobo={r.total_billed.kobo} currency={currency} align="right" /></td>
              <td className={td + " text-right"}><Money kobo={r.total_paid.kobo} currency={currency} align="right" /></td>
              <td className={td + " text-right"}>{r.avg_payment_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const canReports = can(P.PROC_VIEW_PROC_REPORTS);
  const tabs = canReports ? [
    { key: "ap-aging", label: "AP Aging" },
    { key: "grir", label: "GR/IR & Control" },
    { key: "spend", label: "Spend" },
    { key: "performance", label: "Vendor Performance" },
  ] : [];
  const [active, setActive] = useState("ap-aging");

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Analytics</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Spend, vendor performance, AP aging and GR/IR.</p>
        </div>
        {!entity ? <EmptyState title="Select an entity" /> : !canReports ? <EmptyState title="No access" message="You don’t hold procurement.report.view." /> : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "ap-aging" && <ApAgingTab entity={entity} currency={currency} />}
            {active === "grir" && <GrirTab entity={entity} currency={currency} />}
            {active === "spend" && <SpendTab entity={entity} currency={currency} />}
            {active === "performance" && <PerformanceTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </ProcurementShell>
  );
}
