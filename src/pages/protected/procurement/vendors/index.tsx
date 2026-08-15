// Vendors & catalog - route-selected master-data screens in the Procurement shell.

import { ProcurementShell } from "../procurement-shell";
import { useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { VendorsTab } from "./vendors-tab";
import { CategoriesTab } from "./categories-tab";
import { CatalogTab } from "./catalog-tab";
import { DEFAULT_VENDOR_SECTION, type VendorSection } from "../console-sections";

/** `section` comes from the route table; see console-sections.ts. */
export default function VendorsPage({ section = DEFAULT_VENDOR_SECTION }: {
  section?: VendorSection;
}) {
  const { code: entity, currency } = useActiveEntity();

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
