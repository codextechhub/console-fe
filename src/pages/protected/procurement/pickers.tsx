// Procurement-scoped reference pickers (vendor, category) over SearchSelect.
// Kept in the procurement feature so finance-ui doesn't import procurement.

import { SearchSelect } from "@/components/custom/search-select";
import { useGetVendorsQuery, useGetCategoriesQuery } from "@/redux/services/procurement/procurement-api";

const adapt = (onChange: (v: string) => void) =>
  (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value);

export function VendorPicker({ entity, value, onChange, label, placeholder = "Select vendor", isRequired }: { entity: string; value: string; onChange: (v: string) => void; label?: string; placeholder?: string; isRequired?: boolean }) {
  const { data, isLoading } = useGetVendorsQuery({ entity });
  const options = (data?.data ?? []).map((v) => ({ value: v.code, label: `${v.code} — ${v.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} revealOnSearch />;
}

export function CategoryPicker({ entity, value, onChange, label, placeholder = "No category" }: { entity: string; value: string; onChange: (v: string) => void; label?: string; placeholder?: string }) {
  const { data, isLoading } = useGetCategoriesQuery({ entity });
  const options = (data?.data ?? []).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} />;
}
