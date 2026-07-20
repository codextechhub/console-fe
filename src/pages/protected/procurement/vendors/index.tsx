// Vendors & catalog — route-selected master-data screens in the Procurement shell.

import { useParams } from "react-router";
import { ProcurementShell } from "../procurement-shell";
import { useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { VendorsTab } from "./vendors-tab";
import { CategoriesTab } from "./categories-tab";
import { CatalogTab } from "./catalog-tab";

export default function VendorsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "vendors" } = useParams();

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : section === "categories" ? (
          <CategoriesTab entity={entity} currency={currency} />
        ) : section === "catalog" ? (
          <CatalogTab entity={entity} currency={currency} />
        ) : (
          <VendorsTab entity={entity} currency={currency} />
        )}
      </main>
    </ProcurementShell>
  );
}
