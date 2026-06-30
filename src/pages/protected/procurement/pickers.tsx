// Procurement-scoped reference pickers (vendor, category) over SearchSelect.
// Kept in the procurement feature so finance-ui doesn't import procurement.

import { SearchSelect } from "@/components/custom/search-select";
import { useGetVendorsQuery, useGetCategoriesQuery, useGetRequisitionsQuery, useGetPurchaseOrdersQuery } from "@/redux/services/procurement/procurement-api";
import { useGetRfqsQuery } from "@/redux/services/procurement/procurement-ext-api";

const adapt = (onChange: (v: string) => void) =>
  (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value);

export function VendorPicker({ entity, value, onChange, label, placeholder = "Select vendor", isRequired }: { entity: string; value: string; onChange: (v: string) => void; label?: string; placeholder?: string; isRequired?: boolean }) {
  const { data, isLoading } = useGetVendorsQuery({ entity, page_size: 100 });
  const options = (data?.data ?? []).map((v) => ({ value: v.code, label: `${v.code} — ${v.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} revealOnSearch />;
}

export function CategoryPicker({ entity, value, onChange, label, placeholder = "No category" }: { entity: string; value: string; onChange: (v: string) => void; label?: string; placeholder?: string }) {
  const { data, isLoading } = useGetCategoriesQuery({ entity, page_size: 100 });
  const options = (data?.data ?? []).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} />;
}

export function RequisitionPicker({ entity, value, onChange, label, placeholder = "Select requisition", isRequired }: { entity: string; value: string; onChange: (v: string) => void; label?: string; placeholder?: string; isRequired?: boolean }) {
  const { data, isLoading } = useGetRequisitionsQuery({ entity, page_size: 100 });
  const options = (data?.data ?? []).map((r) => ({ value: String(r.id), label: `${r.document_number} (${r.status})` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} revealOnSearch />;
}

export function RfqPicker({ entity, value, onChange, label, placeholder = "Select RFQ", isRequired }: { entity: string; value: string; onChange: (v: string) => void; label?: string; placeholder?: string; isRequired?: boolean }) {
  const { data, isLoading } = useGetRfqsQuery({ entity });
  const options = (data?.data ?? []).map((r) => ({ value: String(r.id), label: `${r.document_number} — ${r.title}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} revealOnSearch />;
}

export function PurchaseOrderPicker({ entity, value, onChange, label, placeholder = "No PO" }: { entity: string; value: string; onChange: (v: string) => void; label?: string; placeholder?: string }) {
  const { data, isLoading } = useGetPurchaseOrdersQuery({ entity, page_size: 100 });
  const options = (data?.data ?? []).map((o) => ({ value: String(o.id), label: `${o.document_number} — ${o.vendor_code}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} revealOnSearch />;
}
