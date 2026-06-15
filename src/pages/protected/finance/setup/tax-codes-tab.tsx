// Setup → Tax Codes. Reference data: VAT/WHT etc. with their rate + GL accounts.
import { DataTable, StatusPill, toArray, type Column } from "@/components/finance-ui";
import { useGetTaxCodesQuery } from "@/redux/services/finance/setup-api";
import type { TaxCode } from "@/redux/services/finance/setup-types";

export function TaxCodesTab({ entity }: { entity: string }) {
  const { data, isLoading, isError, refetch } = useGetTaxCodesQuery({ entity });
  const columns: Column<TaxCode>[] = [
    { header: "Code", cell: (t) => <span className="font-semibold">{t.code}</span> },
    { header: "Name", cell: (t) => t.name },
    { header: "Rate", align: "right", cell: (t) => `${(t.rate_bps / 100).toFixed(2)}%` },
    { header: "Recoverable", cell: (t) => (t.is_recoverable ? "Yes" : "No") },
    { header: "Collected acct", cell: (t) => t.collected_account ?? "—" },
    { header: "Paid acct", cell: (t) => t.paid_account ?? "—" },
    { header: "Status", cell: (t) => <StatusPill status={t.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  return (
    <DataTable columns={columns} rows={toArray(data?.data)} rowKey={(t) => t.id}
      loading={isLoading} error={isError} onRetry={refetch}
      emptyTitle="No tax codes" emptyMessage="VAT / WHT and other tax codes will appear here." />
  );
}
