// Vendors & catalog (§7.1) — vendors, categories and the item catalog, as tabs.

import { useState } from "react";
import { ProcurementShell } from "../procurement-shell";
import { DataTable, Money, StatusPill, TabBar, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { VendorsTab } from "./vendors-tab";
import { useGetCategoriesQuery, useGetCatalogItemsQuery } from "@/redux/services/procurement/procurement-api";
import type { CatalogItem, VendorCategory } from "@/redux/services/procurement/procurement-types";

function CategoriesTab({ entity }: { entity: string }) {
  const { data, isLoading, isError, refetch } = useGetCategoriesQuery({ entity });
  const columns: Column<VendorCategory>[] = [
    { header: "Code", cell: (c) => <span className="font-semibold">{c.code}</span> },
    { header: "Name", cell: (c) => c.name },
    { header: "Default expense", cell: (c) => c.default_expense_code ?? "—" },
    { header: "Status", cell: (c) => <StatusPill status={c.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  return <DataTable columns={columns} rows={data?.data ?? []} rowKey={(c) => c.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No categories" />;
}

function CatalogTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetCatalogItemsQuery({ entity });
  const columns: Column<CatalogItem>[] = [
    { header: "Code", cell: (i) => <span className="font-semibold">{i.code}</span> },
    { header: "Name", cell: (i) => i.name },
    { header: "UoM", cell: (i) => i.unit_of_measure },
    { header: "Preferred vendor", cell: (i) => i.preferred_vendor_code ?? "—" },
    { header: "Std price", align: "right", cell: (i) => <Money kobo={i.standard_unit_price} currency={currency} align="right" /> },
    { header: "Status", cell: (i) => <StatusPill status={i.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  return <DataTable columns={columns} rows={data?.data ?? []} rowKey={(i) => i.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No catalog items" />;
}

export default function VendorsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const tabs = [
    can(P.PROC_VIEW_VENDORS) && { key: "vendors", label: "Vendors" },
    can(P.PROC_VIEW_CATEGORIES) && { key: "categories", label: "Categories" },
    can(P.PROC_VIEW_CATALOG) && { key: "catalog", label: "Catalog" },
  ].filter(Boolean) as { key: string; label: string }[];
  const [active, setActive] = useState(tabs[0]?.key ?? "vendors");

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Vendors & Catalog</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Vendors, categories and the item catalog.</p>
        </div>
        {!entity ? <EmptyState title="Select an entity" /> : tabs.length === 0 ? <EmptyState title="No access" /> : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "vendors" && <VendorsTab entity={entity} />}
            {active === "categories" && <CategoriesTab entity={entity} />}
            {active === "catalog" && <CatalogTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </ProcurementShell>
  );
}
