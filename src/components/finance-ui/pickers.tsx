// Entity-scoped reference pickers for create forms — thin wrappers over the
// app's SearchSelect that load their options from the matching list endpoint and
// report the selected CODE (the value the backend resolves by). Reused across
// every finance create form so account/currency/tax selection is consistent.

import { SearchSelect } from "@/components/custom/search-select";
import { useGetAccountsQuery, useGetCurrenciesQuery, useGetTaxCodesQuery, useGetCostCentersQuery } from "@/redux/services/finance/setup-api";
import { useGetTaxObligationsQuery, useGetPettyCashFundsQuery } from "@/redux/services/finance/ops-api";

interface PickerProps {
  entity: string;
  value: string;
  onChange: (code: string) => void;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
}

const adapt = (onChange: (v: string) => void) =>
  (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value);

/** Chart-of-accounts picker. Pass `postableOnly` for posting lines. */
export function AccountPicker({ entity, value, onChange, label, placeholder = "Select account", isRequired, disabled, postableOnly, accountType }: PickerProps & { postableOnly?: boolean; accountType?: string }) {
  const { data, isLoading } = useGetAccountsQuery({ entity, ...(postableOnly ? { is_postable: true } : {}), ...(accountType ? { account_type: accountType } : {}) });
  const options = (data?.data ?? []).map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} disabled={disabled} revealOnSearch />;
}

export function CurrencyPicker({ value, onChange, label, placeholder = "Default", isRequired, disabled }: Omit<PickerProps, "entity">) {
  const { data, isLoading } = useGetCurrenciesQuery();
  const options = (data?.data ?? []).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} disabled={disabled} />;
}

export function TaxCodePicker({ entity, value, onChange, label, placeholder = "No tax", isRequired, disabled }: PickerProps) {
  const { data, isLoading } = useGetTaxCodesQuery({ entity });
  const options = (data?.data ?? []).map((t) => ({ value: t.code, label: `${t.code} — ${t.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} disabled={disabled} />;
}

export function CostCenterPicker({ entity, value, onChange, label, placeholder = "None", isRequired, disabled }: PickerProps) {
  const { data, isLoading } = useGetCostCentersQuery({ entity });
  const options = (data?.data ?? []).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} disabled={disabled} />;
}

export function TaxObligationPicker({ entity, value, onChange, label, placeholder = "Select obligation", isRequired, disabled }: PickerProps) {
  const { data, isLoading } = useGetTaxObligationsQuery({ entity });
  const options = (data?.data ?? []).map((o) => ({ value: String(o.id), label: `${o.code} — ${o.name}` }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} disabled={disabled} />;
}

export function PettyCashFundPicker({ entity, value, onChange, label, placeholder = "Select fund", isRequired, disabled }: PickerProps) {
  const { data, isLoading } = useGetPettyCashFundsQuery({ entity, page: 1 });
  const options = (data?.data ?? []).map((f) => ({ value: String(f.id), label: f.name }));
  return <SearchSelect label={label} options={options} value={value} onChange={adapt(onChange)} loading={isLoading} placeholder={placeholder} isRequired={isRequired} disabled={disabled} />;
}
