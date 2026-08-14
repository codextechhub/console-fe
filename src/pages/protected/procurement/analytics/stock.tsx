// Procurement Analytics → the two stock reports (§6).
//
// Reorder: what has fallen to or below its reorder point. Valuation: what the
// carried stock is worth at weighted-average cost. Both are read-only, both gate
// on procurement.report.view, and both accept an optional store.
//
// The two live in one file because they share the store filter and the same rule
// about it: a school with fewer than two active stores never sees the control, and
// with no store selected both reports return exactly the numbers they returned
// before stock gained a location dimension.
//
// Money here is the reports' {kobo, naira} pair, not the bare integer the
// transactional endpoints use - read it through `kobo()`.
import { useMemo, useState } from "react";
import { Banknote, Boxes, TriangleAlert } from "lucide-react";

import {
  EmptyState, ErrorState, ForbiddenState, LoadingState, StatCard,
} from "@/components/finance-ui";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/utils/money";
import { formatQuantity } from "@/utils/quantity";
import {
  useGetStockReorderReportQuery, useGetStockValuationReportQuery,
} from "@/redux/services/procurement/procurement-ext-api";
import type { Pagination } from "@/redux/services/finance/api-types";
import { isForbidden } from "../sourcing/helpers";
import { useStockLocations } from "../use-stock-locations";
import { SectionHeader } from "./shared";
import { TD, TDR, TFOOT, TFOOTR, TH, THR, kobo, type SectionProps } from "./helpers";

const qty = (value: string) => formatQuantity(Number(value));

/**
 * Store filter for a stock report. Renders nothing at all unless the entity really
 * has more than one active store - the same rule the rest of the console follows,
 * so a single-store school never learns the dimension exists.
 */
function StoreFilter({ entity, value, onChange }: {
  entity: string; value: string; onChange: (value: string) => void;
}) {
  const { locations, multi } = useStockLocations(entity);
  if (!multi) return null;
  return (
    <label className="w-full sm:w-56">
      <span className="mb-1 block font-mont text-[11px] font-semibold text-gray-01">Store</span>
      <NativeSelect value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All stores</option>
        {locations.map((l) => <option key={l.id} value={String(l.id)}>{l.code} - {l.name}</option>)}
      </NativeSelect>
    </label>
  );
}

/** Shared page-through control; both reports paginate server-side at 25 rows. */
function Pager({ pagination, page, onPage }: {
  pagination?: Pagination; page: number; onPage: (page: number) => void;
}) {
  const total = pagination?.totalPages ?? 1;
  if (total <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-03 px-4 py-3">
      <p className="font-mont text-xs text-gray-05">Page {pagination?.currentPage ?? page} of {total} · {pagination?.totalItems ?? 0} item(s)</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button size="sm" variant="outline" disabled={page >= total} onClick={() => onPage(total === page ? page : page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/** One line naming which store a report was narrowed to, when it was. */
function ScopeNote({ location, what }: { location: string | null; what: string }) {
  if (!location) return null;
  return (
    <p className="font-mont text-xs leading-5 text-gray-05">
      <span className="font-semibold text-gray-01">{location} only.</span> {what}
    </p>
  );
}

// ── Reorder ──────────────────────────────────────────────────────────────────
export function StockReorderScreen({ entity, currency }: SectionProps) {
  const [store, setStore] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({
    entity, page, ...(store ? { location: Number(store) } : {}),
  }), [entity, page, store]);
  const { currentData: data, isLoading, isFetching, isError, error, refetch } =
    useGetStockReorderReportQuery(params);
  const d = data?.data;
  const rows = d?.rows ?? [];

  // Estimated cost of restocking, at each item's current average. Rows with no
  // cost history contribute nothing and are shown as "-" rather than as zero, so
  // the total is never quietly understated by pretending an unknown price is free.
  const priced = rows.filter((row) => kobo(row.unit_cost) > 0);
  const estimate = priced.reduce(
    (sum, row) => sum + Math.round(Number(row.reorder_qty) * kobo(row.unit_cost)), 0,
  );
  const unpriced = rows.length - priced.length;

  return (
    <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
      <SectionHeader title="Stock Reorder" subtitle="Items at or below their reorder point.">
        <StoreFilter entity={entity} value={store} onChange={(v) => { setStore(v); setPage(1); }} />
      </SectionHeader>

      {isForbidden(error) ? <div className="rounded-md bg-white"><ForbiddenState /></div>
        : isLoading ? <div className="rounded-md bg-white"><LoadingState rows={8} /></div>
          : isError || !d ? <div className="rounded-md bg-white"><ErrorState onRetry={refetch} /></div>
            : (
              <div className="space-y-5">
                <ScopeNote location={d.location} what="These are the items short at that store, with that store's own quantity and cost. A store can be short of something the entity as a whole still holds plenty of." />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard label="Items to reorder" value={String(data?.pagination?.totalItems ?? rows.length)} icon={TriangleAlert} tone="amber" sub={d.location ? `short at ${d.location}` : "across every store"} />
                  {/* With nothing priced there is no estimate to give, and "₦0.00"
                      would read as "free" rather than "not known yet". */}
                  <StatCard
                    label="Estimated reorder cost"
                    value={priced.length === 0 ? "Not yet known" : formatMoney(estimate, currency)}
                    icon={Banknote}
                    tone={priced.length === 0 ? "gray" : "primary"}
                    sub={priced.length === 0
                      ? "no item here has been received yet, so none has a cost"
                      : unpriced > 0
                        ? `${unpriced} of ${rows.length} item(s) have no unit cost yet`
                        : "at current average cost, this page"}
                  />
                </div>

                <section className="min-w-0 rounded-md bg-white">
                  {rows.length === 0 ? (
                    <EmptyState title="Nothing needs reordering" message={d.location ? `Every item is above its reorder point at ${d.location}.` : "Every active item is above its reorder point."} />
                  ) : (<>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead><tr>
                          <th className={TH}>Item</th>
                          <th className={THR}>On hand</th>
                          <th className={THR}>Reorder point</th>
                          <th className={THR}>Reorder qty</th>
                          <th className={THR}>Unit cost</th>
                          <th className={THR}>Est. cost</th>
                        </tr></thead>
                        <tbody>{rows.map((row) => {
                          const unit = kobo(row.unit_cost);
                          return (
                            <tr key={row.stock_item_id}>
                              <td className={TD}><p className="font-semibold">{row.name}</p><p className="mt-0.5 font-mont text-xs text-gray-05">{row.code}</p></td>
                              <td className={TDR}>{qty(row.on_hand_qty)}</td>
                              <td className={`${TDR} text-gray-05`}>{qty(row.reorder_level)}</td>
                              <td className={TDR}>{qty(row.reorder_qty)}</td>
                              <td className={TDR}>{unit > 0 ? formatMoney(unit, currency) : "-"}</td>
                              <td className={TDR}>{unit > 0 ? formatMoney(Math.round(Number(row.reorder_qty) * unit), currency) : "-"}</td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>
                    <Pager pagination={data?.pagination} page={page} onPage={setPage} />
                  </>)}
                  {isFetching && <div className="border-t border-gray-03"><LoadingState rows={1} /></div>}
                </section>
              </div>
            )}
    </main>
  );
}

// ── Valuation ────────────────────────────────────────────────────────────────
export function StockValuationScreen({ entity, currency }: SectionProps) {
  const [store, setStore] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({
    entity, page, ...(store ? { location: Number(store) } : {}),
  }), [entity, page, store]);
  const { currentData: data, isLoading, isFetching, isError, error, refetch } =
    useGetStockValuationReportQuery(params);
  const d = data?.data;
  const rows = d?.rows ?? [];
  // Server-computed across every row, so it is right regardless of the page
  // boundary. Never replace it with a sum of the rows on screen.
  const total = kobo(d?.total_value);
  const held = rows.filter((row) => Number(row.on_hand_qty) !== 0).length;

  return (
    <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
      <SectionHeader title="Stock Valuation" subtitle="On-hand value at weighted-average cost.">
        <StoreFilter entity={entity} value={store} onChange={(v) => { setStore(v); setPage(1); }} />
      </SectionHeader>

      {isForbidden(error) ? <div className="rounded-md bg-white"><ForbiddenState /></div>
        : isLoading ? <div className="rounded-md bg-white"><LoadingState rows={8} /></div>
          : isError || !d ? <div className="rounded-md bg-white"><ErrorState onRetry={refetch} /></div>
            : (
              <div className="space-y-5">
                <ScopeNote location={d.location} what="This is that store's stock only; the entity total is elsewhere. Each store carries its own weighted-average cost, so the same item can be valued differently in another store." />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard label={d.location ? `Value at ${d.location}` : "Total stock value"} value={formatMoney(total, currency)} icon={Banknote} tone="primary" sub="across every page" />
                  <StatCard label="Items valued" value={String(data?.pagination?.totalItems ?? rows.length)} icon={Boxes} tone="gray" sub={`${held} holding stock on this page`} />
                </div>

                <section className="min-w-0 rounded-md bg-white">
                  {rows.length === 0 ? (
                    <EmptyState title="Nothing to value" message={d.location ? `No stock is held at ${d.location}.` : "Register a stock item and receive it to see it valued here."} />
                  ) : (<>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px]">
                        <thead><tr>
                          <th className={TH}>Item</th>
                          <th className={THR}>On hand</th>
                          <th className={THR}>Unit cost</th>
                          <th className={THR}>Value</th>
                        </tr></thead>
                        <tbody>{rows.map((row) => (
                          <tr key={`${row.stock_item_id}-${row.code}`}>
                            <td className={TD}><p className="font-semibold">{row.name}</p><p className="mt-0.5 font-mont text-xs text-gray-05">{row.code}</p></td>
                            <td className={TDR}>{qty(row.on_hand_qty)}</td>
                            <td className={TDR}>{formatMoney(kobo(row.unit_cost), currency)}</td>
                            <td className={TDR}>{formatMoney(kobo(row.stock_value), currency)}</td>
                          </tr>
                        ))}</tbody>
                        <tfoot><tr>
                          {/* The report total, not this page's - the rows above are
                              one page of it, so summing them would disagree. */}
                          <td className={TFOOT} colSpan={3}>{d.location ? `${d.location} total` : "Total"}{(data?.pagination?.totalPages ?? 1) > 1 ? " (all pages)" : ""}</td>
                          <td className={TFOOTR}>{formatMoney(total, currency)}</td>
                        </tr></tfoot>
                      </table>
                    </div>
                    <Pager pagination={data?.pagination} page={page} onPage={setPage} />
                  </>)}
                  {isFetching && <div className="border-t border-gray-03"><LoadingState rows={1} /></div>}
                </section>
              </div>
            )}
    </main>
  );
}
