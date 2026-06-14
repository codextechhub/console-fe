// Procurement → Vendors. List + detail drawer; bank details are FLS-masked
// unless procurement.vendor.view_sensitive.

import { useMemo, useState } from "react";
import { DataTable, DetailDrawer, StatusPill, type Column } from "@/components/finance-ui";
import { Input } from "@/components/ui/input";
import { isStripped } from "@/utils/fls";
import { useGetVendorsQuery } from "@/redux/services/procurement/procurement-api";
import type { Vendor } from "@/redux/services/procurement/procurement-types";

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
  const params = useMemo(() => ({ entity, page, ...(q ? { q } : {}) }), [entity, page, q]);
  const { data, isLoading, isFetching, isError, refetch } = useGetVendorsQuery(params);
  const rows = data?.data ?? [];
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
      <div className="mb-4">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search vendors…" className="h-10 w-64 bg-white" />
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(v) => v.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        emptyTitle="No vendors" emptyMessage="Vendors will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />

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
    </>
  );
}
