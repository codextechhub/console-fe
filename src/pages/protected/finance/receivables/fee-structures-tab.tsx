// Receivables → Fee Structures. The billing catalogue; each structure rolls a
// set of fee items into invoices via "Generate" (one posted invoice per active
// customer). Read + generate; authoring lives in the create flow.
import { toast } from "sonner";
import { DataTable, Money, StatusPill, ActionButton, toArray, type Column } from "@/components/finance-ui";
import { P } from "@/permissions";
import { useGetFeeStructuresQuery, useGenerateFromFeeStructureMutation } from "@/redux/services/finance/ar-api";
import type { FeeStructure } from "@/redux/services/finance/ar-types";

export function FeeStructuresTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isFetching, isError, refetch } = useGetFeeStructuresQuery({ entity });
  const [generate] = useGenerateFromFeeStructureMutation();
  const rows = toArray<FeeStructure>(data?.data);

  const columns: Column<FeeStructure>[] = [
    { header: "Code", cell: (f) => <span className="font-semibold">{f.code}</span> },
    { header: "Name", cell: (f) => f.name },
    { header: "Term", cell: (f) => f.term || "—" },
    { header: "Items", align: "right", cell: (f) => f.items.length },
    { header: "Total", align: "right", cell: (f) => <Money kobo={f.total} currency={currency} align="right" /> },
    { header: "Status", cell: (f) => <StatusPill status={f.is_active ? "ACTIVE" : "INACTIVE"} /> },
    {
      header: "", cell: (f) => (
        <div onClick={(e) => e.stopPropagation()}>
          {f.is_active && (
            <ActionButton asLink label="Generate" permission={P.FIN_GENERATE_FEE_STRUCTURE}
              title="Generate invoices?"
              description={`Raises one posted invoice from ${f.code} for every active customer in this entity.`}
              onConfirm={async () => {
                const r = await generate({ id: f.id, entity, all_active: true }).unwrap();
                toast.success(r.message || `${r.data?.generated ?? 0} invoice(s) generated.`);
              }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable columns={columns} rows={rows} rowKey={(f) => f.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No fee structures" emptyMessage="Billing catalogues will appear here." />
  );
}
