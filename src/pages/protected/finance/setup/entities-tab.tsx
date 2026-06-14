// Setup → Entities. The ledger entities (sets of books) + "Create entity",
// which provisions a chart of accounts and twelve periods in one call.

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, StatusPill, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { P } from "@/permissions";
import { useGetEntitiesQuery, useCreateEntityMutation } from "@/redux/services/finance/entity-api";
import { useGetCurrenciesQuery } from "@/redux/services/finance/setup-api";
import type { LedgerEntity } from "@/redux/services/finance/entity-types";

export function EntitiesTab() {
  const { data, isLoading, isFetching, isError, refetch } = useGetEntitiesQuery();
  const [creating, setCreating] = useState(false);
  const rows = data?.data ?? [];

  const columns: Column<LedgerEntity>[] = [
    { header: "Code", cell: (e) => <span className="font-semibold">{e.code}</span> },
    { header: "Name", cell: (e) => e.name },
    { header: "Kind", cell: (e) => e.kind },
    { header: "Currency", cell: (e) => e.base_currency },
    { header: "Status", cell: (e) => <StatusPill status={e.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.FIN_CREATE_ENTITY}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> Create entity</Button>
        </Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(e) => e.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No entities" emptyMessage="Create a ledger entity to begin." />
      <CreateModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const { data: currencies } = useGetCurrenciesQuery(undefined, { skip: !open });
  const [create, { isLoading }] = useCreateEntityMutation();

  const submit = async () => {
    try {
      const res = await create({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        base_currency: baseCurrency || undefined,
        fiscal_year: fiscalYear ? Number(fiscalYear) : undefined,
        fiscal_start_month: startMonth ? Number(startMonth) : undefined,
      }).unwrap();
      toast.success(res.message || "Entity created.");
      setCode(""); setName(""); setBaseCurrency(""); setFiscalYear(""); setStartMonth("");
      onClose();
    } catch { /* central */ }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mont text-base font-semibold">Create ledger entity</DialogTitle>
          <DialogDescription className="font-mont text-sm text-gray-05">Provisions the chart of accounts and twelve open periods in one step.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Code</span>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CREST" className="bg-white font-mont" /></label>
            <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Base currency</span>
              <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
                <option value="">Default</option>
                {(currencies?.data ?? []).map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select></label>
          </div>
          <label className="block space-y-1"><span className="font-mont text-xs text-gray-05">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Crest Schools Ltd" className="bg-white" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Fiscal year (optional)</span>
              <Input type="number" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="2026" className="bg-white" /></label>
            <label className="space-y-1"><span className="font-mont text-xs text-gray-05">Start month (1–12)</span>
              <Input type="number" min={1} max={12} value={startMonth} onChange={(e) => setStartMonth(e.target.value)} placeholder="1" className="bg-white" /></label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
          <Button disabled={isLoading || !code.trim() || !name.trim()} onClick={submit}>{isLoading ? "Creating…" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
