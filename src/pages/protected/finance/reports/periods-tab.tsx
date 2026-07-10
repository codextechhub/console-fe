// Fiscal Periods (Fiscal Calendar) — fiscal-year summary + a period strip; click
// a period to open its close drawer (the month-end checklist + Soft close / Run
// close steps). The old standalone "Period Close" screen folds in here.

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { DetailDrawer, StatusPill, InfoHint, ConfirmActionModal } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { EmptyState, ErrorState, LoadingState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { useGetPeriodsQuery, useGetPeriodChecklistQuery, useClosePeriodMutation, useReopenPeriodMutation, useLockPeriodMutation, useCloseFiscalYearMutation } from "@/redux/services/finance/setup-api";
import { useGetFiscalYearsQuery } from "@/redux/services/finance/ops-api";
import type { FiscalPeriod } from "@/redux/services/finance/setup-types";

const th = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const td = "border-t border-gray-03 px-3 py-2 font-mont text-sm text-black-01";
const humanize = (s: string) => { const t = s.replace(/_/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };

export function PeriodsTab({ entity }: { entity: string }) {
  const { data, isLoading, isFetching, isError, refetch } = useGetPeriodsQuery({ entity });
  const periods = useMemo(() => data?.data ?? [], [data]);
  const [selected, setSelected] = useState<number | null>(null);
  // Real fiscal-year records (id + status) — needed to seal a year (the period rows only
  // carry the year number). A year is year-end-closable while its FY status is OPEN.
  const { data: fyData } = useGetFiscalYearsQuery({ entity });
  const fyByYear = useMemo(() => {
    const m = new Map<number, { id: number; status: string }>();
    for (const f of fyData?.data ?? []) m.set(f.year, { id: f.id, status: f.status });
    return m;
  }, [fyData]);
  const [closing, setClosing] = useState<{ id: number; year: number; hasOpen: boolean } | null>(null);
  const [closeYear, { isLoading: closingYear }] = useCloseFiscalYearMutation();
  const doCloseYear = async () => {
    if (!closing) return;
    try {
      const r = await closeYear({ id: closing.id, entity, force: closing.hasOpen }).unwrap();
      const ni = r.data?.net_income?.naira;
      toast.success(`${r.message || `Fiscal year ${closing.year} closed.`}${ni ? ` · Net ${ni} → Retained Earnings` : ""}`);
      setClosing(null);
    } catch { /* central */ }
  };

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
      {/* Fiscal-year summary */}
      <div className="overflow-x-auto rounded-md border border-gray-03 bg-white">
        <table className="w-full border-collapse">
          <thead><tr>
            <th className={th}>Fiscal year</th><th className={th}>Start</th><th className={th}>End</th>
            <th className={th}>Frequency</th><th className={cn(th, "text-right")}>Periods</th><th className={th}>Status</th>
            <th className={cn(th, "text-right")}>Year-end</th>
          </tr></thead>
          <tbody>
            {years.map((y) => {
              const fy = fyByYear.get(y.year);
              return (
              <tr key={y.year}>
                <td className={cn(td, "font-semibold")}>{y.year}</td>
                <td className={cn(td, "text-gray-05")}>{y.start}</td>
                <td className={cn(td, "text-gray-05")}>{y.end}</td>
                <td className={cn(td, "text-gray-05")}>Monthly</td>
                <td className={cn(td, "text-right tabular-nums")}>{y.count}</td>
                <td className={td}><StatusPill status={fy?.status ?? y.status} /></td>
                <td className={cn(td, "text-right")}>
                  {fy && fy.status === "OPEN" ? (
                    <Can permission={P.FIN_CLOSE_PERIOD}>
                      <Button variant="outline" size="sm" onClick={() => setClosing({ id: fy.id, year: y.year, hasOpen: y.status === "OPEN" })}>Close year</Button>
                    </Can>
                  ) : fy ? <span className="font-mont text-[11px] text-gray-05">Sealed</span> : <span className="text-gray-05">—</span>}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Period strips per fiscal year */}
      {years.map((y) => (
        <div key={y.year}>
          <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Period strip · {y.year} — click a period to close, re-open or lock</p>
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

      <ConfirmActionModal
        open={closing != null}
        onOpenChange={(o) => !o && setClosing(null)}
        title={closing ? `Close fiscal year ${closing.year}?` : ""}
        description={`Posts the year-end closing entry — zeroes every income and expense account and rolls the net profit or loss into Retained Earnings (3200), then permanently seals FY ${closing?.year}.${closing?.hasOpen ? " Some periods are still open; the year will be closed anyway (force)." : ""} The final period must still accept the closing entry. This can't be undone.`}
        confirmText="Close year"
        destructive
        loading={closingYear}
        onConfirm={doCloseYear}
      />
    </div>
  );
}

function PeriodCloseDrawer({ id, entity, onClose }: { id: number | null; entity: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useGetPeriodChecklistQuery(id ? { id, entity } : skipToken);
  const [close, { isLoading: closing }] = useClosePeriodMutation();
  const [reopen, { isLoading: reopening }] = useReopenPeriodMutation();
  const [lock, { isLoading: locking }] = useLockPeriodMutation();
  const d = data?.data;
  const p = d?.period;
  const busy = closing || reopening || locking;
  const canClose = !!p && (p.status === "OPEN" || p.status === "SOFT_CLOSED");
  const canReopen = !!p && (p.status === "CLOSED" || p.status === "SOFT_CLOSED");
  const canLock = !!p && p.status === "CLOSED";

  const doClose = async (soft: boolean) => {
    try {
      const r = await close({ id: id!, entity, soft }).unwrap();
      const ck = r.data?.checklist;
      toast.success(ck && !ck.passed ? `Closed ${p?.name} (with checklist warnings).` : `Closed ${p?.name}.`);
      onClose();
    } catch { /* central */ }
  };
  const doReopen = async () => {
    try { const r = await reopen({ id: id!, entity }).unwrap(); toast.success(r.message || `Re-opened ${p?.name}.`); onClose(); }
    catch { /* central */ }
  };
  const doLock = async () => {
    try { const r = await lock({ id: id!, entity }).unwrap(); toast.success(r.message || `Locked ${p?.name}.`); onClose(); }
    catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={id != null}
      onOpenChange={(o) => !o && onClose()}
      title={p ? `Close ${p.name}` : "Period close"}
      description={p ? `Period ${p.period_no} · ${p.start_date} → ${p.end_date}` : undefined}
      widthClass="sm:max-w-2xl"
      footer={(canClose || canReopen || canLock) ? (
        <div className="flex flex-wrap items-center gap-2">
          {canReopen ? (
            <Can permission={P.FIN_REOPEN_PERIOD}>
              <Button variant="outline" onClick={doReopen} disabled={busy}>Re-open</Button>
            </Can>
          ) : null}
          {canLock ? (
            <Can permission={P.FIN_LOCK_PERIOD}>
              <Button variant="outline" onClick={doLock} disabled={busy} className="border-destructive/40 text-destructive hover:bg-destructive/5">Lock period</Button>
            </Can>
          ) : null}
          {canClose ? (
            <Can permission={P.FIN_CLOSE_PERIOD}>
              <Button variant="outline" onClick={() => doClose(true)} disabled={busy}>Soft close</Button>
              <Button onClick={() => doClose(false)} disabled={busy}>Run close steps</Button>
            </Can>
          ) : null}
        </div>
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
            <div className="mb-2 flex items-center gap-1.5">
              <p className="font-mont text-sm font-semibold text-gray-01">Close checklist</p>
              <InfoHint>Closing runs the month-end steps (including depreciation), each creating a journal visible in the GL. Soft close is reversible; once a period is fully closed/locked those journals can’t be reversed — corrections use a journal in a later open period.</InfoHint>
            </div>
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

        </div>
      )}
    </DetailDrawer>
  );
}
