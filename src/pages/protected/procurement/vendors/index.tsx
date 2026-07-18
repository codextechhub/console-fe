// Vendors & catalog — route-selected master-data screens in the Procurement shell.

import { useState } from "react";
import { useActionParam } from "@/hooks/use-action-param";
import { useParams } from "react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "../procurement-shell";
import { DataTable, Money, StatusPill, FormModal, FormField, MoneyInput, AccountPicker, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { VendorsTab } from "./vendors-tab";
import { CategoriesTab } from "./categories-tab";
import { VendorPicker } from "../pickers";
import { useGetCatalogItemsQuery, useCreateCatalogItemMutation } from "@/redux/services/procurement/procurement-api";
import type { CatalogItem } from "@/redux/services/procurement/procurement-types";

function CatalogTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetCatalogItemsQuery({ entity, page });
  const pg = data?.pagination;
  const [creating, setCreating] = useState(false);
  useActionParam("new", () => setCreating(true));
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [uom, setUom] = useState("each");
  const [vendor, setVendor] = useState("");
  const [expense, setExpense] = useState("");
  const [price, setPrice] = useState(0);
  const [create, { isLoading: saving }] = useCreateCatalogItemMutation();
  const submit = async () => {
    try { const r = await create({ entity, code: code.trim(), name: name.trim(), unit_of_measure: uom, preferred_vendor: vendor || undefined, default_expense_account: expense || undefined, standard_unit_price: price || undefined }).unwrap(); toast.success(r.message || "Item created."); setCode(""); setName(""); setVendor(""); setExpense(""); setPrice(0); setCreating(false); } catch { /* central */ }
  };
  const columns: Column<CatalogItem>[] = [
    { header: "Code", cell: (i) => <span className="font-semibold">{i.code}</span> },
    { header: "Name", cell: (i) => i.name },
    { header: "UoM", cell: (i) => i.unit_of_measure },
    { header: "Preferred vendor", cell: (i) => i.preferred_vendor_code ?? "—" },
    { header: "Std price", align: "right", cell: (i) => <Money kobo={i.standard_unit_price} currency={currency} align="right" /> },
    { header: "Status", cell: (i) => <StatusPill status={i.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Can permission={P.PROC_CREATE_CATALOG_ITEM}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New item</Button></Can></div>
      <DataTable columns={columns} rows={data?.data ?? []} rowKey={(i) => i.id} loading={isLoading} error={isError} onRetry={refetch} page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} emptyTitle="No catalog items" />
      <FormModal open={creating} onOpenChange={(o) => !o && setCreating(false)} title="New catalog item" onSubmit={submit} loading={saving} canSubmit={!!code.trim() && !!name.trim()}>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} className="bg-white font-mont" /></FormField>
          <FormField label="UoM"><Input value={uom} onChange={(e) => setUom(e.target.value)} className="bg-white" /></FormField>
          <FormField label="Std price"><MoneyInput valueKobo={price} onChangeKobo={setPrice} currency={currency} /></FormField>
        </div>
        <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Preferred vendor"><VendorPicker entity={entity} value={vendor} onChange={setVendor} /></FormField>
        <FormField label="Default expense account"><AccountPicker entity={entity} value={expense} onChange={setExpense} accountType="EXPENSE" /></FormField>
      </FormModal>
    </>
  );
}

const LABELS: Record<string, string> = { vendors: "Vendors", categories: "Categories", catalog: "Catalog" };

export default function VendorsPage() {
  const { code: entity, currency } = useActiveEntity();
  const { section = "vendors" } = useParams();

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        {section === "catalog" && <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{LABELS[section] ?? "Vendors & Catalog"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Vendors, categories and the item catalog.</p>
        </div>}
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
