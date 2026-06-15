// Inventory / stock (§7.4) — stock items (issue / adjust) and the movement
// ledger with valuation.
import { useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, Money, StatusPill, FormModal, FormField, AccountPicker, useActiveEntity, toArray, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetStockItemsQuery, useGetStockMovementsQuery, useCreateStockItemMutation } from "@/redux/services/procurement/procurement-ext-api";
import type { StockItem, StockMovement } from "@/redux/services/procurement/procurement-types";

function ItemsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetStockItemsQuery({ entity });
  const rows = toArray(data?.data);
  const columns: Column<StockItem>[] = [
    { header: "Code", cell: (i) => <span className="font-semibold">{i.code}</span> },
    { header: "Name", cell: (i) => i.name },
    { header: "On hand", align: "right", cell: (i) => i.on_hand_qty },
    { header: "Unit cost", align: "right", cell: (i) => <Money kobo={i.unit_cost} currency={currency} align="right" /> },
    { header: "Value", align: "right", cell: (i) => <Money kobo={i.stock_value} currency={currency} align="right" /> },
    { header: "Reorder", cell: (i) => i.needs_reorder ? <StatusPill status="OVERDUE" /> : <StatusPill status="OK" /> },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.PROC_MANAGE_STOCK}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New stock item</Button></Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(i) => i.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No stock items" emptyMessage="Stock items will appear here."
        />
      <CreateStockItemModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </>
  );
}

function CreateStockItemModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [uom, setUom] = useState("each");
  const [inventory, setInventory] = useState("");
  const [expense, setExpense] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [reorderQty, setReorderQty] = useState("");
  const [create, { isLoading }] = useCreateStockItemMutation();
  const submit = async () => {
    try {
      const r = await create({ entity, code: code.trim(), name: name.trim(), unit_of_measure: uom, inventory_account: inventory, default_expense_account: expense || undefined, reorder_level: reorderLevel ? Number(reorderLevel) : undefined, reorder_qty: reorderQty ? Number(reorderQty) : undefined }).unwrap();
      toast.success(r.message || "Stock item created.");
      setCode(""); setName(""); setInventory(""); setExpense(""); setReorderLevel(""); setReorderQty(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New stock item" onSubmit={submit} loading={isLoading} canSubmit={!!code.trim() && !!name.trim() && !!inventory}>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} className="bg-white font-mont" /></FormField>
        <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
        <FormField label="UoM"><Input value={uom} onChange={(e) => setUom(e.target.value)} className="bg-white" /></FormField>
      </div>
      <FormField label="Inventory asset account" required><AccountPicker entity={entity} value={inventory} onChange={setInventory} accountType="ASSET" /></FormField>
      <FormField label="Default expense account"><AccountPicker entity={entity} value={expense} onChange={setExpense} accountType="EXPENSE" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Reorder level"><Input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Reorder qty"><Input type="number" value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} className="bg-white" /></FormField>
      </div>
    </FormModal>
  );
}

function MovementsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetStockMovementsQuery({ entity });
  const rows = toArray(data?.data);
  const columns: Column<StockMovement>[] = [
    { header: "Date", cell: (m) => m.movement_date },
    { header: "Item", cell: (m) => m.stock_item_code ?? "—" },
    { header: "Type", cell: (m) => <StatusPill status={m.movement_type} /> },
    { header: "Qty", align: "right", cell: (m) => m.quantity },
    { header: "Value", align: "right", cell: (m) => <Money kobo={m.value_amount} currency={currency} align="right" /> },
    { header: "Bal. qty", align: "right", cell: (m) => m.balance_qty },
    { header: "Bal. value", align: "right", cell: (m) => <Money kobo={m.balance_value} currency={currency} align="right" /> },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(m) => m.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No movements" emptyMessage="Stock movements will appear here." />;
}

export default function InventoryPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "items" } = useParams();

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{section === "movements" ? "Stock Movements" : "Stock Items"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Stock items, the movement ledger and valuation.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : section === "movements" ? (
          <MovementsTab entity={entity} currency={currency} />
        ) : (
          <ItemsTab entity={entity} currency={currency} />
        )}
      </main>
    </ProcurementShell>
  );
}
