// Budgets, Assets & Tax → Fixed assets. List + create + acquire + depreciate.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, Money, StatusPill, ActionButton, FormModal, FormField, MoneyInput, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetFixedAssetsQuery, useAcquireFixedAssetMutation, useDepreciateFixedAssetMutation, useCreateFixedAssetMutation } from "@/redux/services/finance/ops-api";
import type { FixedAsset } from "@/redux/services/finance/ops-types";

export function AssetsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
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
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.FIN_CREATE_FIXED_ASSET}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New asset</Button>
        </Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No fixed assets" emptyMessage="Fixed assets will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      <CreateAssetModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function CreateAssetModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [name, setName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [cost, setCost] = useState(0);
  const [salvage, setSalvage] = useState(0);
  const [life, setLife] = useState("");
  const [create, { isLoading }] = useCreateFixedAssetMutation();
  const submit = async () => {
    try {
      const res = await create({ entity, name: name.trim(), asset_code: assetCode.trim() || undefined, acquisition_date: acquisitionDate, cost, salvage_value: salvage || undefined, useful_life_months: Number(life) }).unwrap();
      toast.success(res.message || "Asset created.");
      setName(""); setAssetCode(""); setAcquisitionDate(""); setCost(0); setSalvage(0); setLife(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New fixed asset"
      description="Registers an asset; acquire it to book the acquisition and build the depreciation schedule."
      onSubmit={submit} loading={isLoading} canSubmit={!!name.trim() && !!acquisitionDate && cost > 0 && Number(life) > 0}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Asset code"><Input value={assetCode} onChange={(e) => setAssetCode(e.target.value)} className="bg-white font-mont" /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Acquisition date" required><Input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Useful life (months)" required><Input type="number" min={1} value={life} onChange={(e) => setLife(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cost" required><MoneyInput valueKobo={cost} onChangeKobo={setCost} currency={currency} /></FormField>
        <FormField label="Salvage value"><MoneyInput valueKobo={salvage} onChangeKobo={setSalvage} currency={currency} /></FormField>
      </div>
    </FormModal>
  );
}
