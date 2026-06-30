// Procurement → Vendors. List + detail drawer; bank details are FLS-masked
// unless procurement.vendor.view_sensitive.

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, DetailDrawer, StatusPill, FormModal, FormField, AccountPicker, toArray, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { isStripped } from "@/utils/fls";
import { P } from "@/permissions";
import { useGetVendorsQuery, useCreateVendorMutation } from "@/redux/services/procurement/procurement-api";
import type { Vendor } from "@/redux/services/procurement/procurement-types";
import { CategoryPicker } from "../pickers";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p><p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p></div>;
}
function bank(v: Vendor, f: "bank_name" | "bank_account_number" | "bank_account_name") {
  if (isStripped(v, f)) return <span className="text-gray-05">••••</span>;
  return v[f] || "—";
}

export function VendorsTab({ entity }: { entity: string }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [creating, setCreating] = useState(false);
  const params = useMemo(() => ({ entity, page, ...(q ? { q } : {}) }), [entity, page, q]);
  const { data, isLoading, isFetching, isError, refetch } = useGetVendorsQuery(params);
  const rows = toArray(data?.data);
  const pg = data?.pagination;

  const columns: Column<Vendor>[] = [
    { header: "Code", cell: (v) => <span className="font-semibold">{v.code}</span> },
    { header: "Name", cell: (v) => v.name },
    { header: "Category", cell: (v) => v.category_code ?? "—" },
    { header: "Terms", cell: (v) => v.payment_terms || "—" },
    { header: "KYC", cell: (v) => <StatusPill status={v.kyc_status} /> },
    { header: "Status", cell: (v) => v.on_hold ? <StatusPill status="BLOCKED" /> : <StatusPill status={v.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search vendors…" className="h-10 w-64 bg-white" />
        <Can permission={P.PROC_CREATE_VENDOR}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New vendor</Button>
        </Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(v) => v.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
        emptyTitle="No vendors" emptyMessage="Vendors will appear here."
        />

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? `${selected.name}` : "Vendor"} description={selected?.code}>
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3"><StatusPill status={selected.kyc_status} />{selected.on_hold && <StatusPill status="BLOCKED" />}</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" value={selected.email} />
              <Field label="Phone" value={selected.phone} />
              <Field label="Tax ID" value={selected.tax_id} />
              <Field label="Payment terms" value={selected.payment_terms} />
              <Field label="Risk" value={selected.risk} />
              <Field label="Payable account" value={selected.payable_code} />
            </div>
            <div>
              <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Bank details</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Bank" value={bank(selected, "bank_name")} />
                <Field label="Account number" value={bank(selected, "bank_account_number")} />
                <Field label="Account name" value={bank(selected, "bank_account_name")} />
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
      <CreateVendorModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </>
  );
}

function CreateVendorModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payable, setPayable] = useState("");
  const [terms, setTerms] = useState("NET_30");
  const [create, { isLoading }] = useCreateVendorMutation();

  const submit = async () => {
    try {
      const res = await create({ entity, code: code.trim(), name: name.trim(), category: category || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined, payable_account: payable || undefined, payment_terms: terms }).unwrap();
      toast.success(res.message || "Vendor created.");
      setCode(""); setName(""); setCategory(""); setEmail(""); setPhone(""); setPayable(""); onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New vendor"
      description="Onboard a vendor. Bank details can be added later (FLS-protected)." onSubmit={submit}
      loading={isLoading} canSubmit={!!code.trim() && !!name.trim()}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} className="bg-white font-mont" /></FormField>
        <FormField label="Payment terms">
          <select value={terms} onChange={(e) => setTerms(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            {["NET_7", "NET_14", "NET_30", "NET_60", "DUE_ON_RECEIPT"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
      <FormField label="Category"><CategoryPicker entity={entity} value={category} onChange={setCategory} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white" /></FormField>
      </div>
      <FormField label="Payable account"><AccountPicker entity={entity} value={payable} onChange={setPayable} accountType="LIABILITY" /></FormField>
    </FormModal>
  );
}
