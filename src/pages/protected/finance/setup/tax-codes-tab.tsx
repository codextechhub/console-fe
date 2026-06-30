// Setup → Tax Codes. Design topology: teaching note, type filter, the rate/rules
// table, and New tax code. Type is derived from the code prefix (VAT/WHT/PAYE…)
// since the model has no type field; Country/Effective columns are omitted (no
// data) rather than faked.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, StatusPill, FormDrawer, FormField, AccountPicker, toArray, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetTaxCodesQuery, useCreateTaxCodeMutation } from "@/redux/services/finance/setup-api";
import type { TaxCode } from "@/redux/services/finance/setup-types";

const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-2 font-mont text-sm text-black-01 focus:border-primary focus:outline-none";
const taxType = (code: string) => (code.split(/[-_ ]/)[0] || code).toUpperCase();

export function TaxCodesTab({ entity }: { entity: string }) {
  const { data, isLoading, isFetching, isError, refetch } = useGetTaxCodesQuery({ entity });
  const codes = toArray<TaxCode>(data?.data);
  const [type, setType] = useState("");
  const [creating, setCreating] = useState(false);

  const types = useMemo(() => [...new Set(codes.map((c) => taxType(c.code)))].sort(), [codes]);
  const rows = useMemo(() => codes.filter((c) => !type || taxType(c.code) === type), [codes, type]);

  const columns: Column<TaxCode>[] = [
    { header: "Code", cell: (t) => <span className="font-semibold">{t.code}</span> },
    { header: "Name", cell: (t) => t.name },
    { header: "Type", cell: (t) => <span className="rounded bg-pry-01 px-1.5 py-0.5 font-mont text-[10px] font-semibold uppercase text-primary">{taxType(t.code)}</span> },
    { header: "Rate", align: "right", cell: (t) => <span className="tabular-nums">{(t.rate_bps / 100).toFixed(2)}%</span> },
    { header: "Recoverable", cell: (t) => (t.is_recoverable ? "Yes" : "No") },
    { header: "Collected a/c", cell: (t) => t.collected_account ?? "—" },
    { header: "Paid a/c", cell: (t) => t.paid_account ?? "—" },
    { header: "Status", cell: (t) => <StatusPill status={t.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls} aria-label="Tax type">
          <option value="">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Can permission={P.FIN_CREATE_TAX_CODE}>
          <Button onClick={() => setCreating(true)} className="h-9 gap-1.5 font-mont text-xs font-semibold"><Plus className="size-3.5" /> New tax code</Button>
        </Can>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(t) => t.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No tax codes" emptyMessage="VAT / WHT and other tax codes will appear here." />

      <NewTaxCodeModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </div>
  );
}

function NewTaxCodeModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [create, { isLoading }] = useCreateTaxCodeMutation();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [pct, setPct] = useState("");
  const [recoverable, setRecoverable] = useState(true);
  const [collected, setCollected] = useState("");
  const [paid, setPaid] = useState("");
  const canSubmit = code.trim() !== "" && name.trim() !== "" && pct !== "" && Number(pct) >= 0;

  const submit = async () => {
    try {
      const r = await create({
        entity, code: code.trim().toUpperCase(), name: name.trim(),
        rate_bps: Math.round(Number(pct) * 100), is_recoverable: recoverable,
        collected_account: collected || undefined, paid_account: paid || undefined,
      }).unwrap();
      toast.success(r.message || "Tax code saved.");
      setCode(""); setName(""); setPct(""); setCollected(""); setPaid("");
      onClose();
    } catch { /* central */ }
  };

  return (
    <FormDrawer open={open} onOpenChange={(o) => !o && onClose()} title="New tax code"
      description="Define a rate and the GL accounts it books to." onSubmit={submit}
      loading={isLoading} canSubmit={canSubmit} widthClass="sm:max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. VAT-7.5" className="bg-white font-mont" /></FormField>
        <FormField label="Rate (%)" required><Input value={pct} onChange={(e) => setPct(e.target.value)} type="number" step="0.01" placeholder="7.5" className="bg-white font-mont" /></FormField>
      </div>
      <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VAT 7.5%" className="bg-white" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Collected a/c (output)"><AccountPicker entity={entity} value={collected} onChange={setCollected} placeholder="None" /></FormField>
        <FormField label="Paid a/c (input)"><AccountPicker entity={entity} value={paid} onChange={setPaid} placeholder="None" /></FormField>
      </div>
      <label className="flex items-center gap-2 font-mont text-sm text-gray-01">
        <input type="checkbox" checked={recoverable} onChange={(e) => setRecoverable(e.target.checked)} /> Recoverable (input tax offsets output)
      </label>
    </FormDrawer>
  );
}
