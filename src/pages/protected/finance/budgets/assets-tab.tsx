// Budgets, Assets & Tax → Fixed assets. List + acquire + depreciate actions.
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, Money, StatusPill, ActionButton, type Column } from "@/components/finance-ui";
import { P } from "@/permissions";
import { useGetFixedAssetsQuery, useAcquireFixedAssetMutation, useDepreciateFixedAssetMutation } from "@/redux/services/finance/ops-api";
import type { FixedAsset } from "@/redux/services/finance/ops-types";

export function AssetsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetFixedAssetsQuery({ entity, page });
  const [acquire] = useAcquireFixedAssetMutation();
  const [depreciate] = useDepreciateFixedAssetMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<FixedAsset>[] = [
    { header: "Asset", cell: (a) => <span className="font-semibold">{a.name}</span> },
    { header: "Code", cell: (a) => a.asset_code },
    { header: "Cost", align: "right", cell: (a) => <Money kobo={a.cost} currency={currency} align="right" /> },
    { header: "Accum. dep.", align: "right", cell: (a) => <Money kobo={a.accumulated_depreciation} currency={currency} align="right" /> },
    { header: "Net book value", align: "right", cell: (a) => <Money kobo={a.net_book_value} currency={currency} align="right" /> },
    { header: "Status", cell: (a) => <StatusPill status={a.asset_status} /> },
    {
      header: "", cell: (a) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {a.asset_status === "DRAFT" && (
            <ActionButton asLink label="Acquire" permission={P.FIN_ACQUIRE_FIXED_ASSET} title="Acquire asset?"
              description={`Books the acquisition of ${a.name} and builds its depreciation schedule.`}
              onConfirm={async () => { const r = await acquire({ id: a.id, entity }).unwrap(); toast.success(r.message || "Acquired."); }} />
          )}
          {a.asset_status === "ACTIVE" && (
            <ActionButton asLink label="Depreciate" permission={P.FIN_DEPRECIATE_FIXED_ASSET} title="Run depreciation?"
              description={`Posts the due depreciation for ${a.name}.`}
              onConfirm={async () => { const r = await depreciate({ id: a.id, entity }).unwrap(); toast.success(r.message || "Depreciation posted."); }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable columns={columns} rows={rows} rowKey={(a) => a.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No fixed assets" emptyMessage="Fixed assets will appear here."
      page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
  );
}
