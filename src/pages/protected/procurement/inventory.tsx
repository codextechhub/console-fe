// Procurement → Inventory (§5). Perpetual-inventory stock items (issue / adjust
// at moving-average cost) and the read-only movement ledger with valuation. Both
// sections render off the single :section route ("items" default | "movements").
import { useEffect, useMemo, useState } from "react";
import { useActionParam } from "@/hooks/use-action-param";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeftRight, Banknote, Boxes, ChevronRight, FilePenLine, FileText,
  History, PackageMinus, PackageX, Plus, Search, SlidersHorizontal,
} from "lucide-react";

import { ProcurementShell } from "./procurement-shell";
import {
  AccountPicker, DataTable, DetailDrawer, EmptyState, ErrorState, FormDrawer, FormField,
  LoadingState, Money, MoneyInput, PostingRecap, Segmented, StatCard, StatusPill, toArray,
  useActiveEntity, type Column, type RecapRow,
  PostingDateField,} from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import {
  useGetStockItemsQuery, useGetStockItemQuery, useGetStockSummaryQuery,
  useGetStockMovementsQuery, useCreateStockItemMutation, useUpdateStockItemMutation,
  useIssueStockMutation, useAdjustStockMutation,
} from "@/redux/services/procurement/procurement-ext-api";
import type { StockItem, StockItemDetail, StockMovement } from "@/redux/services/procurement/procurement-types";
import { formatMoney } from "@/utils/money";
import { ActivityFeed, EmptyPanel, Field } from "./sourcing/shared";
import { isForbidden, shortDate } from "./sourcing/helpers";

// ── Shared small helpers ─────────────────────────────────────────────────────
// Quantities arrive as 14,4 decimal strings ("10.0000"); show them trimmed.
const num = (value?: string | null) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const fmtQty = (value?: string | null) => {
  const n = num(value);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
};
// Signed quantity/value cell — green for a gain, red for a relief.
function signClass(n: number) {
  return n > 0 ? "text-emerald-700" : n < 0 ? "text-destructive" : "text-gray-05";
}
// Derived, display-only stock status (never a persisted field).
function itemStatus(item: StockItem): "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK" {
  if (num(item.on_hand_qty) <= 0) return "OUT_OF_STOCK";
  if (item.needs_reorder) return "LOW_STOCK";
  return "IN_STOCK";
}

const DETAIL_TABS = [
  ["overview", "Overview", FileText],
  ["movements", "Movements", ArrowLeftRight],
  ["activity", "Activity", History],
] as const;

const MOVEMENT_TABS = [
  ["All", ""], ["Receipt", "RECEIPT"], ["Issue", "ISSUE"], ["Adjustment", "ADJUSTMENT"],
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "items" } = useParams();

  if (!entity) {
    return (
      <ProcurementShell>
        <main className="px-4.5 py-6">
          <EmptyState title="Select an entity" message="Choose an entity to view its inventory." />
        </main>
      </ProcurementShell>
    );
  }
  return section === "movements"
    ? <MovementsSection entity={entity} currency={currency} />
    : <ItemsSection entity={entity} currency={currency} />;
}

// ── Stock Items ──────────────────────────────────────────────────────────────
function ItemsSection({ entity, currency }: { entity: string; currency?: string | null }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [needsReorder, setNeedsReorder] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  useActionParam("new", () => setCreating(true));
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    entity, page,
    ...(debounced ? { q: debounced } : {}),
    ...(needsReorder ? { needs_reorder: "true" } : {}),
  }), [entity, page, debounced, needsReorder]);
  const { currentData: data, isLoading, isFetching, isError, error, refetch } = useGetStockItemsQuery(params);
  const { data: summaryData, isLoading: summaryLoading } = useGetStockSummaryQuery({ entity });
  const rows = toArray(data?.data);
  const summary = summaryData?.data;

  const columns: Column<StockItem>[] = [
    { header: "Item", cell: (i) => <div className="min-w-40"><p className="font-semibold">{i.name}</p><p className="mt-0.5 font-mont text-xs text-gray-05">{i.code}</p></div> },
    { header: "Catalog item", cell: (i) => i.catalog_item_code || "—" },
    { header: "On hand", align: "right", cell: (i) => <span className="tabular-nums">{fmtQty(i.on_hand_qty)}</span> },
    { header: "Reorder", align: "right", cell: (i) => <span className="tabular-nums text-gray-05">{fmtQty(i.reorder_level)}</span> },
    { header: "Unit cost", align: "right", cell: (i) => <Money kobo={i.unit_cost} currency={currency} align="right" /> },
    { header: "Value", align: "right", cell: (i) => <Money kobo={i.stock_value} currency={currency} align="right" /> },
    { header: "Status", cell: (i) => <StatusPill status={itemStatus(i)} /> },
    { header: "", align: "right", cell: () => <ChevronRight className="ml-auto size-4 text-gray-04" /> },
  ];

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Stock Items</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">On-hand inventory with reorder thresholds and valuation.</p>
          </div>
          <Can permission={P.PROC_MANAGE_STOCK}><Button onClick={() => setCreating(true)}><Plus className="size-4" /> New stock item</Button></Can>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryLoading || !summary ? <div className="col-span-full rounded-md bg-white"><LoadingState rows={2} /></div> : <>
            <StatCard label="Items tracked" value={String(summary.tracked)} icon={Boxes} tone="gray" />
            <StatCard label="Low stock" value={String(summary.low_stock)} icon={AlertTriangle} tone="amber" />
            <StatCard label="Out of stock" value={String(summary.out_of_stock)} icon={PackageX} tone="red" />
            <StatCard label="Total value" value={formatMoney(summary.total_value, currency)} icon={Banknote} tone="primary" />
          </>}
        </div>

        <section className="min-w-0 rounded-md bg-white">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-03 px-4 py-2">
            <label className="flex cursor-pointer items-center gap-2 font-mont text-xs font-medium text-gray-01">
              <input type="checkbox" checked={needsReorder} onChange={(e) => { setNeedsReorder(e.target.checked); setPage(1); }} /> Needs reorder
            </label>
            <label className="relative min-w-0 flex-1 sm:max-w-64"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-05" /><Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search code or name" className="h-9 bg-white pl-9" /></label>
          </div>
          <DataTable columns={columns} rows={rows} rowKey={(i) => i.id} loading={isLoading || isFetching} error={isError} forbidden={isForbidden(error)} onRetry={refetch} onRowClick={(i) => setSelectedId(i.id)} page={data?.pagination?.currentPage} totalPages={data?.pagination?.totalPages} onPageChange={setPage} emptyTitle="No stock items" emptyMessage={debounced || needsReorder ? "Try a different search or filter." : "Register a stock item to track its on-hand quantity and value."} />
        </section>
      </main>
      <StockItemDrawer key={selectedId ?? "closed"} id={selectedId} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
      {creating && <StockItemForm entity={entity} onClose={() => setCreating(false)} />}
    </ProcurementShell>
  );
}

// ── Stock Item detail drawer ─────────────────────────────────────────────────
function StockItemDrawer({ id, entity, currency, onClose }: { id: number | null; entity: string; currency?: string | null; onClose: () => void }) {
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const { data, isLoading, isError, refetch } = useGetStockItemQuery({ id: id!, entity }, { skip: id == null });
  const item = data?.data;

  return <>
    <DetailDrawer
      open={id != null} onOpenChange={(open) => !open && onClose()}
      title={item ? item.name : "Stock item"}
      description={item ? `${item.code} · ${item.unit_of_measure}` : "Loading stock item"}
      widthClass="sm:max-w-2xl"
      footer={item && <>
        <Can permission={P.PROC_MANAGE_STOCK}><Button variant="outline" onClick={() => setEditing(true)}><FilePenLine className="size-4" /> Edit</Button></Can>
        <Can permission={P.PROC_ISSUE_STOCK}><Button variant="outline" onClick={() => setIssuing(true)}><PackageMinus className="size-4" /> Issue</Button></Can>
        <Can permission={P.PROC_ADJUST_STOCK}><Button variant="outline" onClick={() => setAdjusting(true)}><SlidersHorizontal className="size-4" /> Adjust</Button></Can>
      </>}
    >
      {isLoading ? <LoadingState rows={8} /> : isError || !item ? <ErrorState onRetry={refetch} /> : <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusPill status={itemStatus(item)} />
          <p className="font-mont text-lg font-semibold tabular-nums">{formatMoney(item.stock_value, currency)}</p>
        </div>
        <div className="max-w-full overflow-x-auto border-b border-gray-03"><div className="flex min-w-max gap-5">{DETAIL_TABS.map(([value, label, Icon]) => (
          <button key={value} onClick={() => setTab(value)} className={cn("flex items-center gap-1.5 border-b-2 py-2.5 font-mont text-xs font-medium whitespace-nowrap", tab === value ? "border-primary text-primary" : "border-transparent text-gray-05")}><Icon className="size-3.5" />{label}</button>
        ))}</div></div>

        {tab === "overview" && (
          <dl className="grid grid-cols-1 gap-4 rounded-md border border-gray-03 p-4 sm:grid-cols-2">
            <Field label="Code" value={item.code} />
            <Field label="Name" value={item.name} />
            <Field label="Catalog item" value={item.catalog_item_code || "—"} />
            <Field label="Unit of measure" value={item.unit_of_measure} />
            <Field label="On hand" value={fmtQty(item.on_hand_qty)} />
            <Field label="Reorder point" value={fmtQty(item.reorder_level)} />
            <Field label="Reorder qty" value={fmtQty(item.reorder_qty)} />
            <Field label="Unit cost" value={<Money kobo={item.unit_cost} currency={currency} />} />
            <Field label="Total value" value={<Money kobo={item.stock_value} currency={currency} />} />
            <Field label="Inventory account" value={item.inventory_code || "—"} />
            <Field label="Expense account" value={item.expense_code || "—"} />
            <Field label="Valuation" value="Weighted average" />
            <Field label="Active" value={item.is_active ? "Yes" : "No"} />
          </dl>
        )}

        {tab === "movements" && <MovementsSubTable movements={item.movements} currency={currency} />}
        {tab === "activity" && <ActivityFeed activity={item.activity} />}
      </div>}
    </DetailDrawer>
    {item && editing && <StockItemForm entity={entity} initial={item} onClose={() => setEditing(false)} />}
    {item && issuing && <IssueDrawer entity={entity} currency={currency} item={item} onClose={() => setIssuing(false)} />}
    {item && adjusting && <AdjustDrawer entity={entity} currency={currency} item={item} onClose={() => setAdjusting(false)} />}
  </>;
}

function MovementsSubTable({ movements, currency }: { movements: StockMovement[]; currency?: string | null }) {
  if (!movements.length) return <EmptyPanel>No movements recorded for this item yet.</EmptyPanel>;
  return (
    <div className="overflow-x-auto rounded-md border border-gray-03"><table className="w-full min-w-[560px]">
      <thead><tr>{["Date", "Type", "Qty", "Value", "Bal. qty", "Bal. value"].map((h) => <th key={h} className="bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01">{h}</th>)}</tr></thead>
      <tbody>{movements.map((m) => {
        const q = num(m.quantity);
        return (
          <tr key={m.id}>
            <td className="border-t border-gray-03 px-3 py-2 font-mont text-xs tabular-nums">{shortDate(m.movement_date)}</td>
            <td className="border-t border-gray-03 px-3 py-2"><StatusPill status={m.movement_type} /></td>
            <td className={cn("border-t border-gray-03 px-3 py-2 text-right font-mont text-xs tabular-nums", signClass(q))}>{q > 0 ? "+" : ""}{fmtQty(m.quantity)}</td>
            <td className="border-t border-gray-03 px-3 py-2 text-right"><Money kobo={m.value_amount} currency={currency} align="right" /></td>
            <td className="border-t border-gray-03 px-3 py-2 text-right font-mont text-xs tabular-nums">{fmtQty(m.balance_qty)}</td>
            <td className="border-t border-gray-03 px-3 py-2 text-right"><Money kobo={m.balance_value} currency={currency} align="right" /></td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

// ── Create / edit form ───────────────────────────────────────────────────────
function StockItemForm({ entity, initial, onClose }: { entity: string; initial?: StockItemDetail; onClose: () => void }) {
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [uom, setUom] = useState(initial?.unit_of_measure || "each");
  const [inventory, setInventory] = useState(initial?.inventory_code || "");
  const [expense, setExpense] = useState(initial?.expense_code || "");
  const [reorderLevel, setReorderLevel] = useState(initial ? String(num(initial.reorder_level)) : "");
  const [reorderQty, setReorderQty] = useState(initial ? String(num(initial.reorder_qty)) : "");
  const [create, { isLoading: creating }] = useCreateStockItemMutation();
  const [update, { isLoading: updating }] = useUpdateStockItemMutation();
  const saving = creating || updating;

  const dirty = !initial
    || name !== initial.name || uom !== (initial.unit_of_measure || "")
    || inventory !== (initial.inventory_code || "") || expense !== (initial.expense_code || "")
    || reorderLevel !== String(num(initial.reorder_level)) || reorderQty !== String(num(initial.reorder_qty));
  const canSubmit = !!name.trim() && !!inventory && (!initial || dirty);

  const save = async () => {
    if (!canSubmit) return;
    try {
      if (initial) {
        const r = await update({
          id: initial.id, entity,
          name: name.trim(), unit_of_measure: uom, inventory_account: inventory,
          default_expense_account: expense || null,
          reorder_level: reorderLevel ? Number(reorderLevel) : 0,
          reorder_qty: reorderQty ? Number(reorderQty) : 0,
        }).unwrap();
        toast.success(r.message || "Stock item updated.");
      } else {
        const r = await create({
          entity, code: code.trim() || undefined, name: name.trim(), unit_of_measure: uom,
          inventory_account: inventory, default_expense_account: expense || undefined,
          reorder_level: reorderLevel ? Number(reorderLevel) : undefined,
          reorder_qty: reorderQty ? Number(reorderQty) : undefined,
        }).unwrap();
        toast.success(r.message || "Stock item created.");
      }
      onClose();
    } catch { /* central */ }
  };

  return (
    <FormDrawer
      open onOpenChange={(o) => !saving && !o && onClose()}
      title={initial ? "Edit stock item" : "New stock item"}
      description={initial ? "Update this stock item. Its reference and on-hand balance cannot be changed here." : "Register a stock item. A system reference is generated unless you provide a real SKU or external code."}
      widthClass="sm:max-w-lg" onSubmit={save} submitText={initial ? "Save changes" : "Create"} loading={saving} canSubmit={canSubmit}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="SKU / external code"><Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} disabled={!!initial} className="bg-white font-mont uppercase" placeholder="Optional — generated if blank" /></FormField>
        <FormField label="Unit of measure"><Input value={uom} onChange={(e) => setUom(e.target.value)} className="bg-white" placeholder="each" /></FormField>
      </div>
      <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} className="bg-white" /></FormField>
      <FormField label="Inventory account" required><AccountPicker entity={entity} value={inventory} onChange={setInventory} accountType="ASSET" postableOnly activeOnly /></FormField>
      <FormField label="Default expense account"><AccountPicker entity={entity} value={expense} onChange={setExpense} accountType="EXPENSE" postableOnly activeOnly placeholder="Optional — debited when stock is issued" /></FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Reorder level"><Input type="number" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className="bg-white tabular-nums" /></FormField>
        <FormField label="Reorder qty"><Input type="number" min="0" value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} className="bg-white tabular-nums" /></FormField>
      </div>
    </FormDrawer>
  );
}

// ── Issue drawer (Dr expense · Cr inventory at moving-average cost) ───────────
function IssueDrawer({ entity, currency, item, onClose }: { entity: string; currency?: string | null; item: StockItemDetail; onClose: () => void }) {
  const onHand = num(item.on_hand_qty);
  const [qty, setQty] = useState("");
  const [movementDate, setMovementDate] = useState("");
  const [expense, setExpense] = useState(item.expense_code || "");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [issue, { isLoading }] = useIssueStockMutation();

  const q = Number(qty);
  const qtyValid = Number.isFinite(q) && q > 0 && q <= onHand;
  // Preview value at moving-average cost (server rounds with banker's rounding — a
  // ≤1-kobo preview drift is fine).
  const value = onHand > 0 && qtyValid ? Math.round((item.stock_value * q) / onHand) : 0;
  const canSubmit = qtyValid && value > 0 && !!expense;

  const dr: RecapRow[] = [{ code: expense || "—", name: "", amount: value }];
  const cr: RecapRow[] = [{ code: item.inventory_code || "—", name: "", amount: value }];

  const save = async () => {
    if (!canSubmit) return;
    try {
      const r = await issue({
        id: item.id, entity, quantity: q, movement_date: movementDate,
        expense_account: expense || undefined,
        reference: reference.trim() || undefined, narration: narration.trim() || undefined,
      }).unwrap();
      toast.success(r.message || "Stock issued.");
      onClose();
    } catch { /* central */ }
  };

  return (
    <FormDrawer
      open onOpenChange={(o) => !isLoading && !o && onClose()}
      title="Issue stock" description={`Issue ${item.code} out at moving-average cost. ${fmtQty(item.on_hand_qty)} ${item.unit_of_measure} on hand.`}
      widthClass="sm:max-w-lg" onSubmit={save} submitText="Issue" loading={isLoading} canSubmit={canSubmit}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Quantity" required>
          <Input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="bg-white tabular-nums" />
          <span className="mt-1 block font-mont text-[11px] text-gray-05">{qtyValid ? `${fmtQty(String(onHand - q))} ${item.unit_of_measure} remaining` : `Up to ${fmtQty(item.on_hand_qty)} available`}</span>
        </FormField>
        <PostingDateField label="Movement date" entity={entity} value={movementDate} onChange={setMovementDate} />
      </div>
      <FormField label="Expense account" required={!item.expense_code}><AccountPicker entity={entity} value={expense} onChange={setExpense} accountType="EXPENSE" postableOnly activeOnly /></FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Narration"><Input value={narration} onChange={(e) => setNarration(e.target.value)} className="bg-white" /></FormField>
      </div>
      <PostingRecap title="Journal preview" dr={dr} cr={cr} currency={currency} helper="Preview of the journal this issue will post at moving-average cost." />
    </FormDrawer>
  );
}

// ── Adjust drawer (write-up / shrinkage) ─────────────────────────────────────
const ADJUST_DIRECTIONS = [["increase", "Increase"], ["decrease", "Decrease"]] as const;

function AdjustDrawer({ entity, currency, item, onClose }: { entity: string; currency?: string | null; item: StockItemDetail; onClose: () => void }) {
  const onHand = num(item.on_hand_qty);
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [qty, setQty] = useState("");
  const [movementDate, setMovementDate] = useState("");
  const [adjustment, setAdjustment] = useState("5150");
  const [unitCostKobo, setUnitCostKobo] = useState(0);
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [adjust, { isLoading }] = useAdjustStockMutation();

  const q = Number(qty);
  const magnitudeValid = Number.isFinite(q) && q > 0;
  const isIncrease = direction === "increase";
  const fromEmpty = onHand <= 0;
  const decreaseValid = magnitudeValid && (!isIncrease ? q <= onHand : true);

  // Preview value: a decrease relieves at the current average; an increase uses the
  // entered unit cost, falling back to the current average when stock is already held.
  const value = !magnitudeValid ? 0
    : isIncrease
      ? (unitCostKobo > 0 ? unitCostKobo * q : (onHand > 0 ? Math.round((item.stock_value * q) / onHand) : 0))
      : (onHand > 0 ? Math.round((item.stock_value * q) / onHand) : 0);

  // A write-up from zero has no average to fall back on — a unit cost is required.
  const unitCostOk = !isIncrease || !fromEmpty || unitCostKobo > 0;
  const canSubmit = magnitudeValid && decreaseValid && value > 0 && unitCostOk;

  const inv: RecapRow = { code: item.inventory_code || "—", name: "", amount: value };
  const adj: RecapRow = { code: adjustment || "5150", name: "", amount: value };
  const dr = isIncrease ? [inv] : [adj];
  const cr = isIncrease ? [adj] : [inv];

  const save = async () => {
    if (!canSubmit) return;
    try {
      const r = await adjust({
        id: item.id, entity,
        quantity_delta: isIncrease ? q : -q,
        movement_date: movementDate,
        ...(isIncrease && unitCostKobo > 0 ? { unit_cost: unitCostKobo } : {}),
        adjustment_account: adjustment || undefined,
        reference: reference.trim() || undefined, narration: narration.trim() || undefined,
      }).unwrap();
      toast.success(r.message || "Stock adjusted.");
      onClose();
    } catch { /* central */ }
  };

  return (
    <FormDrawer
      open onOpenChange={(o) => !isLoading && !o && onClose()}
      title="Adjust stock" description={`Correct the recorded count for ${item.code}. ${fmtQty(item.on_hand_qty)} ${item.unit_of_measure} on hand.`}
      widthClass="sm:max-w-lg" onSubmit={save} submitText="Adjust" loading={isLoading} canSubmit={canSubmit}
    >
      <Segmented value={direction} onChange={setDirection} options={ADJUST_DIRECTIONS} label="Direction" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Quantity" required>
          <Input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="bg-white tabular-nums" />
          {!isIncrease && <span className="mt-1 block font-mont text-[11px] text-gray-05">Up to {fmtQty(item.on_hand_qty)} available</span>}
        </FormField>
        <PostingDateField label="Movement date" entity={entity} value={movementDate} onChange={setMovementDate} />
      </div>
      {isIncrease && (
        <FormField label={`Unit cost${fromEmpty ? "" : " (optional — defaults to average)"}`} required={fromEmpty}>
          <MoneyInput valueKobo={unitCostKobo} onChangeKobo={setUnitCostKobo} currency={currency} />
        </FormField>
      )}
      <FormField label="Adjustment account"><AccountPicker entity={entity} value={adjustment} onChange={setAdjustment} accountType="EXPENSE" postableOnly activeOnly /></FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Narration"><Input value={narration} onChange={(e) => setNarration(e.target.value)} className="bg-white" /></FormField>
      </div>
      <PostingRecap title="Journal preview" dr={dr} cr={cr} currency={currency} helper={isIncrease ? "Write-up: debits the inventory asset and credits the adjustment account." : "Shrinkage: debits the adjustment account and credits the inventory asset."} />
    </FormDrawer>
  );
}

// ── Stock Movements (read-only ledger) ───────────────────────────────────────
function MovementsSection({ entity, currency }: { entity: string; currency?: string | null }) {
  const [tab, setTab] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ entity, page, ...(tab ? { movement_type: tab } : {}) }), [entity, page, tab]);
  const { currentData: data, isLoading, isFetching, isError, error, refetch } = useGetStockMovementsQuery(params);
  const rows = toArray(data?.data);

  const columns: Column<StockMovement>[] = [
    { header: "Date", cell: (m) => shortDate(m.movement_date) },
    { header: "Move #", cell: (m) => <span className="font-mont font-semibold text-primary">#{m.id}</span> },
    { header: "Type", cell: (m) => <StatusPill status={m.movement_type} /> },
    { header: "Item", cell: (m) => m.stock_item_code || "—" },
    { header: "Qty", align: "right", cell: (m) => { const q = num(m.quantity); return <span className={cn("tabular-nums", signClass(q))}>{q > 0 ? "+" : ""}{fmtQty(m.quantity)}</span>; } },
    { header: "Value", align: "right", cell: (m) => <Money kobo={m.value_amount} currency={currency} align="right" /> },
    { header: "Bal. qty", align: "right", cell: (m) => <span className="tabular-nums">{fmtQty(m.balance_qty)}</span> },
    { header: "By", cell: (m) => m.created_by_name || "—" },
    { header: "Reference", cell: (m) => m.reference || "—" },
  ];

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Stock Movements</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Receipts, issues and adjustments.</p>
        </div>
        <section className="min-w-0 rounded-md bg-white">
          <div className="max-w-full overflow-x-auto border-b border-gray-03 px-4">
            <div className="flex min-w-max gap-5">{MOVEMENT_TABS.map(([label, value]) => (
              <button key={label} onClick={() => { setTab(value); setPage(1); }} className={cn("border-b-2 py-3 font-mont text-xs font-medium whitespace-nowrap", tab === value ? "border-primary text-primary" : "border-transparent text-gray-05")}>{label}</button>
            ))}</div>
          </div>
          <DataTable columns={columns} rows={rows} rowKey={(m) => m.id} loading={isLoading || isFetching} error={isError} forbidden={isForbidden(error)} onRetry={refetch} mobile="scroll" page={data?.pagination?.currentPage} totalPages={data?.pagination?.totalPages} onPageChange={setPage} emptyTitle="No movements" emptyMessage={tab ? "No movements of this type yet." : "Stock movements will appear here as goods are received, issued and adjusted."} />
        </section>
      </main>
    </ProcurementShell>
  );
}
