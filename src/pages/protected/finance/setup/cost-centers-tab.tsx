// Setup → Cost Centers. Reference data for dimensional reporting.
import { DataTable, StatusPill, toArray, type Column } from "@/components/finance-ui";
import { useGetCostCentersQuery } from "@/redux/services/finance/setup-api";
import type { CostCenter } from "@/redux/services/finance/setup-types";

export function CostCentersTab({ entity }: { entity: string }) {
  const { data, isLoading, isError, refetch } = useGetCostCentersQuery({ entity });
  const columns: Column<CostCenter>[] = [
    { header: "Code", cell: (c) => <span className="font-semibold">{c.code}</span> },
    { header: "Name", cell: (c) => c.name },
    { header: "Parent", cell: (c) => c.parent_code ?? "—" },
    { header: "Status", cell: (c) => <StatusPill status={c.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  return (
    <DataTable columns={columns} rows={toArray(data?.data)} rowKey={(c) => c.id}
      loading={isLoading} error={isError} onRetry={refetch}
      emptyTitle="No cost centres" emptyMessage="Cost centres will appear here." />
  );
}
