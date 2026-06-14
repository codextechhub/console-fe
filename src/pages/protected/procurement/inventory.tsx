// Inventory / stock (§7.4) — stock items (issue / adjust) and the movement
// ledger with valuation.
import { useState } from "react";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, Money, StatusPill, TabBar, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { useGetStockItemsQuery, useGetStockMovementsQuery } from "@/redux/services/procurement/procurement-ext-api";
import type { StockItem, StockMovement } from "@/redux/services/procurement/procurement-types";

function ItemsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetStockItemsQuery({ entity, page });
  const rows = data?.data ?? [];
  const pg = data?.pagination;
  const columns: Column<StockItem>[] = [
    { header: "Code", cell: (i) => <span className="font-semibold">{i.code}</span> },
    { header: "Name", cell: (i) => i.name },
    { header: "On hand", align: "right", cell: (i) => i.on_hand_qty },
    { header: "Unit cost", align: "right", cell: (i) => <Money kobo={i.unit_cost} currency={currency} align="right" /> },
    { header: "Value", align: "right", cell: (i) => <Money kobo={i.stock_value} currency={currency} align="right" /> },
    { header: "Reorder", cell: (i) => i.needs_reorder ? <StatusPill status="OVERDUE" /> : <StatusPill status="OK" /> },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(i) => i.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No stock items" emptyMessage="Stock items will appear here."
      page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
  );
}

function MovementsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetStockMovementsQuery({ entity });
  const rows = data?.data ?? [];
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
  const { can } = useCan();
  const canStock = can(P.PROC_VIEW_STOCK);
  const tabs = canStock ? [{ key: "items", label: "Stock Items" }, { key: "movements", label: "Movements" }] : [];
  const [active, setActive] = useState("items");

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Inventory</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Stock items, the movement ledger and valuation.</p>
        </div>
        {!entity ? <EmptyState title="Select an entity" /> : !canStock ? <EmptyState title="No access" /> : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "items" && <ItemsTab entity={entity} currency={currency} />}
            {active === "movements" && <MovementsTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </ProcurementShell>
  );
}
