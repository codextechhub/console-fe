// Setup → Entities. The ledger entities ("sets of books") you switch between in
// the top-bar picker. New entity provisions a chart of accounts + twelve open
// periods in one call. (No design reference — entities are a platform concept;
// styled to match the other Setup screens.)
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, StatusPill, FormModal, FormField, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetEntitiesQuery, useCreateEntityMutation } from "@/redux/services/finance/entity-api";
import { useGetCurrenciesQuery } from "@/redux/services/finance/setup-api";
import type { LedgerEntity } from "@/redux/services/finance/entity-types";

const selectCls = "h-9 w-full rounded-md border border-gray-03 bg-white px-2 font-mont text-sm text-black-01 focus:border-primary focus:outline-none";

export function EntitiesTab() {
  const { data, isLoading, isFetching, isError, refetch } = useGetEntitiesQuery();
  const [creating, setCreating] = useState(false);
  const rows = data?.data ?? [];

  const columns: Column<LedgerEntity>[] = [
    { header: "Code", cell: (e) => <span className="font-semibold">{e.code}</span> },
    { header: "Doc code", cell: (e) => <span className="font-mont text-gray-05">{e.number_code}</span> },
    { header: "Name", cell: (e) => e.name },
    { header: "Kind", cell: (e) => <span className="capitalize">{e.kind.toLowerCase()}</span> },
    { header: "Base currency", cell: (e) => e.base_currency },
    { header: "Status", cell: (e) => <StatusPill status={e.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Can permission={P.FIN_CREATE_ENTITY}>
          <Button onClick={() => setCreating(true)} className="h-9 gap-1.5 font-mont text-xs font-semibold"><Plus className="size-3.5" /> New entity</Button>
        </Can>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(e) => e.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No entities" emptyMessage="Create a ledger entity to begin." />

      <CreateEntityModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function CreateEntityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [numberCode, setNumberCode] = useState("");
  const [name, setName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const { data: currencies } = useGetCurrenciesQuery(undefined, { skip: !open });
  const [create, { isLoading }] = useCreateEntityMutation();
  const canSubmit = code.trim() !== "" && name.trim() !== "";

  const submit = async () => {
    try {
      const res = await create({
        code: code.trim().toUpperCase(),
        number_code: numberCode.trim().toUpperCase() || undefined,
        name: name.trim(),
        base_currency: baseCurrency || undefined,
        fiscal_year: fiscalYear ? Number(fiscalYear) : undefined,
        fiscal_start_month: startMonth ? Number(startMonth) : undefined,
      }).unwrap();
      toast.success(res.message || "Entity created.");
      setCode(""); setNumberCode(""); setName(""); setBaseCurrency(""); setFiscalYear(""); setStartMonth("");
      onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New ledger entity"
      description="Provisions the chart of accounts and twelve open periods in one step." onSubmit={submit}
      loading={isLoading} canSubmit={canSubmit} widthClass="sm:max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CREST" className="bg-white font-mont" /></FormField>
        <FormField label="Doc code"><Input value={numberCode} onChange={(e) => setNumberCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))} placeholder="Auto (e.g. CRE)" maxLength={3} className="bg-white font-mont" /></FormField>
      </div>
      <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Crestfield Academy" className="bg-white" /></FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Base currency">
          <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className={selectCls}>
            <option value="">Default</option>
            {(currencies?.data ?? []).map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </FormField>
        <FormField label="Fiscal year"><Input type="number" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="2026" className="bg-white" /></FormField>
        <FormField label="Start month (1–12)"><Input type="number" min={1} max={12} value={startMonth} onChange={(e) => setStartMonth(e.target.value)} placeholder="1" className="bg-white" /></FormField>
      </div>
    </FormModal>
  );
}
