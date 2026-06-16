// Fiscal Periods (Fiscal Calendar) — fiscal-year summary + a period strip; click
// a period to open its close drawer (the month-end checklist + Soft close / Run
// close steps). The old standalone "Period Close" screen folds in here.

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { Check, Info } from "lucide-react";
import { DetailDrawer, StatusPill } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { EmptyState, ErrorState, LoadingState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { useGetPeriodsQuery, useGetPeriodChecklistQuery, useClosePeriodMutation } from "@/redux/services/finance/setup-api";
import type { FiscalPeriod } from "@/redux/services/finance/setup-types";

const th = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const td = "border-t border-gray-03 px-3 py-2 font-mont text-sm text-black-01";
const humanize = (s: string) => { const t = s.replace(/_/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };

export function PeriodsTab({ entity }: { entity: string }) {
  const { data, isLoading, isFetching, isError, refetch } = useGetPeriodsQuery({ entity });
  const periods = useMemo(() => data?.data ?? [], [data]);
  const [selected, setSelected] = useState<number | null>(null);

  // Group periods by fiscal year for the summary table + the per-year strips.
  const years = useMemo(() => {
    const map = new Map<number, FiscalPeriod[]>();
    for (const p of periods) {
      if (!map.has(p.fiscal_year)) map.set(p.fiscal_year, []);
      map.get(p.fiscal_year)!.push(p);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([year, ps]) => {
      const sorted = ps.slice().sort((a, b) => a.start_date.localeCompare(b.start_date));
      return {
        year, periods: sorted, count: ps.length,
        start: sorted[0]?.start_date, end: sorted[sorted.length - 1]?.end_date,
        status: ps.some((p) => p.status === "OPEN") ? "OPEN" : "CLOSED",
      };
    });
  }, [periods]);

  if (isLoading || isFetching) return <LoadingState rows={6} />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (periods.length === 0) return <EmptyState title="No periods" message="Fiscal periods will appear here." />;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-md bg-pry-01/40 p-3 font-mont text-xs leading-relaxed text-gray-01">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>Periods control when journals can post. An <b>open</b> period accepts postings; <b>soft-closed</b> blocks new journals but admins can edit; <b>closed</b> locks non-admins; <b>locked</b> is permanent. Click a period to run its month-end close.</span>
      </div>

      {/* Fiscal-year summary */}
      <div className="overflow-x-auto rounded-md border border-gray-03 bg-white">
        <table className="w-full border-collapse">
          <thead><tr>
            <th className={th}>Fiscal year</th><th className={th}>Start</th><th className={th}>End</th>
            <th className={th}>Frequency</th><th className={cn(th, "text-right")}>Periods</th><th className={th}>Status</th>
          </tr></thead>
          <tbody>
            {years.map((y) => (
              <tr key={y.year}>
                <td className={cn(td, "font-semibold")}>{y.year}</td>
                <td className={cn(td, "text-gray-05")}>{y.start}</td>
                <td className={cn(td, "text-gray-05")}>{y.end}</td>
                <td className={cn(td, "text-gray-05")}>Monthly</td>
                <td className={cn(td, "text-right tabular-nums")}>{y.count}</td>
                <td className={td}><StatusPill status={y.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Period strips per fiscal year */}
      {years.map((y) => (
        <div key={y.year}>
          <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Period strip · {y.year} — click a period to close</p>
          <div className="flex flex-wrap gap-2">
            {y.periods.map((p) => (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className="min-w-28 rounded-md border border-gray-03 bg-white px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5">
                <p className="font-mont text-sm font-semibold text-gray-01">{p.name}</p>
                <p className="font-mont text-[10px] text-gray-05 tabular-nums">{p.start_date} → {p.end_date}</p>
                <div className="mt-1"><StatusPill status={p.status} /></div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <PeriodCloseDrawer id={selected} entity={entity} onClose={() => setSelected(null)} />
    </div>
  );
}

function PeriodCloseDrawer({ id, entity, onClose }: { id: number | null; entity: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useGetPeriodChecklistQuery(id ? { id, entity } : skipToken);
  const [close, { isLoading: closing }] = useClosePeriodMutation();
  const d = data?.data;
  const p = d?.period;
  const canClose = !!p && (p.status === "OPEN" || p.status === "SOFT_CLOSED");

  const doClose = async (soft: boolean) => {
    try {
      const r = await close({ id: id!, entity, soft }).unwrap();
      const ck = r.data?.checklist;
      toast.success(ck && !ck.passed ? `Closed ${p?.name} (with checklist warnings).` : `Closed ${p?.name}.`);
      onClose();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={id != null}
      onOpenChange={(o) => !o && onClose()}
      title={p ? `Close ${p.name}` : "Period close"}
      description={p ? `Period ${p.period_no} · ${p.start_date} → ${p.end_date}` : undefined}
      widthClass="sm:max-w-2xl"
      footer={canClose ? (
        <Can permission={P.FIN_CLOSE_PERIOD}>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => doClose(true)} disabled={closing}>Soft close</Button>
            <Button onClick={() => doClose(false)} disabled={closing}>Run close steps</Button>
          </div>
        </Can>
      ) : null}
    >
      {isLoading ? <LoadingState rows={5} /> : isError || !d || !p ? <ErrorState onRetry={refetch} /> : (
        <div className="space-y-4">
          <div className="flex items-center justify-between font-mont text-sm">
            <span className="flex items-center gap-2 text-gray-05">Current status <StatusPill status={p.status} /></span>
            <span className="text-gray-05">Progress <span className="font-semibold text-black-01 tabular-nums">{d.done} / {d.total}</span></span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-03/50">
            <div className="h-full rounded-full bg-primary" style={{ width: `${d.total ? (d.done / d.total) * 100 : 0}%` }} />
          </div>

          <div>
            <p className="mb-2 font-mont text-sm font-semibold text-gray-01">Close checklist</p>
            <div className="space-y-2">
              {d.items.map((it, i) => (
                <div key={it.name} className="flex items-start gap-3 rounded-md border border-gray-03 bg-white px-3 py-2.5">
                  <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-mont text-[11px] font-semibold",
                    it.passed ? "bg-green-01 text-white" : "border border-gray-03 text-gray-05")}>
                    {it.passed ? <Check className="size-3" /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mont text-sm font-medium text-gray-01">{humanize(it.name)}</p>
                    {it.detail && <p className="font-mont text-xs text-gray-05">{it.detail}</p>}
                  </div>
                  {!it.blocking && <span className="ml-auto font-mont text-[10px] text-gray-05">non-blocking</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 rounded-md bg-pry-01/40 p-3 font-mont text-xs leading-relaxed text-gray-01">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">i</span>
            <span>Closing runs the month-end steps (including depreciation), each creating a journal visible in the GL. Soft close is reversible; once a period is fully closed/locked those journals can’t be reversed — corrections use a journal in a later open period.</span>
          </div>
        </div>
      )}
    </DetailDrawer>
  );
}
