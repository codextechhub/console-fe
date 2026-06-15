// Vendors & catalog (§7.1) — vendors, categories and the item catalog, as tabs.

import { useState } from "react";
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
import { VendorPicker } from "../pickers";
import { useGetCategoriesQuery, useGetCatalogItemsQuery, useCreateCategoryMutation, useCreateCatalogItemMutation } from "@/redux/services/procurement/procurement-api";
import type { CatalogItem, VendorCategory } from "@/redux/services/procurement/procurement-types";

function CategoriesTab({ entity }: { entity: string }) {
  const { data, isLoading, isError, refetch } = useGetCategoriesQuery({ entity });
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [expense, setExpense] = useState("");
  const [create, { isLoading: saving }] = useCreateCategoryMutation();
  const submit = async () => {
    try { const r = await create({ entity, code: code.trim(), name: name.trim(), default_expense_account: expense || undefined }).unwrap(); toast.success(r.message || "Category created."); setCode(""); setName(""); setExpense(""); setCreating(false); } catch { /* central */ }
  };
  const columns: Column<VendorCategory>[] = [
    { header: "Code", cell: (c) => <span className="font-semibold">{c.code}</span> },
    { header: "Name", cell: (c) => c.name },
    { header: "Default expense", cell: (c) => c.default_expense_code ?? "—" },
    { header: "Status", cell: (c) => <StatusPill status={c.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Can permission={P.PROC_CREATE_CATEGORY}><Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New category</Button></Can></div>
      <DataTable columns={columns} rows={data?.data ?? []} rowKey={(c) => c.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No categories" />
      <FormModal open={creating} onOpenChange={(o) => !o && setCreating(false)} title="New vendor category" onSubmit={submit} loading={saving} canSubmit={!!code.trim() && !!name.trim()}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} className="bg-white font-mont" /></FormField>
          <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
        </div>
        <FormField label="Default expense account"><AccountPicker entity={entity} value={expense} onChange={setExpense} accountType="EXPENSE" /></FormField>
      </FormModal>
    </>
  );
}

function CatalogTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetCatalogItemsQuery({ entity });
  const [creating, setCreating] = useState(false);
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
      <DataTable columns={columns} rows={data?.data ?? []} rowKey={(i) => i.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No catalog items" />
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
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">{LABELS[section] ?? "Vendors & Catalog"}</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Vendors, categories and the item catalog.</p>
        </div>
        {!entity ? (
          <EmptyState title="Select an entity" />
        ) : section === "categories" ? (
          <CategoriesTab entity={entity} />
        ) : section === "catalog" ? (
          <CatalogTab entity={entity} currency={currency} />
        ) : (
          <VendorsTab entity={entity} />
        )}
      </main>
    </ProcurementShell>
  );
}
