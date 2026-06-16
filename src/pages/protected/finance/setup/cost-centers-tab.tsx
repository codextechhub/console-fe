// Setup → Cost Centers. Design topology: cost-centre table (branch derived from
// the code prefix) with a New cost centre form, plus the Analytical Dimensions
// section. "Owner" and the dimension Type/Values/Required columns are omitted
// (the models have no such fields) rather than faked.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Info } from "lucide-react";
import { DataTable, StatusPill, FormModal, FormField, toArray, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetCostCentersQuery, useCreateCostCenterMutation, useGetDimensionsQuery } from "@/redux/services/finance/setup-api";
import type { CostCenter, Dimension } from "@/redux/services/finance/setup-types";

const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-2 font-mont text-sm text-black-01 focus:border-primary focus:outline-none";
// CC-LAG-FAC → LAG (branch segment); CC-HQ-IT → HQ.
const branchOf = (code: string) => { const p = code.split(/[-_]/); return (p[1] || "").toUpperCase(); };

export function CostCentersTab({ entity }: { entity: string }) {
  const { data, isLoading, isFetching, isError, refetch } = useGetCostCentersQuery({ entity });
  const dims = useGetDimensionsQuery({ entity });
  const centres = toArray<CostCenter>(data?.data);
  const dimensions = toArray<Dimension>(dims.data?.data);
  const [branch, setBranch] = useState("");
  const [creating, setCreating] = useState(false);

  const branches = useMemo(() => [...new Set(centres.map((c) => branchOf(c.code)).filter(Boolean))].sort(), [centres]);
  const rows = useMemo(() => centres.filter((c) => !branch || branchOf(c.code) === branch), [centres, branch]);

  const columns: Column<CostCenter>[] = [
    { header: "Code", cell: (c) => <span className="font-semibold">{c.code}</span> },
    { header: "Name", cell: (c) => c.name },
    { header: "Branch", cell: (c) => branchOf(c.code) ? <span className="rounded bg-pry-01 px-1.5 py-0.5 font-mont text-[10px] font-semibold uppercase text-primary">{branchOf(c.code)}</span> : "—" },
    { header: "Parent", cell: (c) => c.parent_code ?? "—" },
    { header: "Status", cell: (c) => <StatusPill status={c.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  const dimCols: Column<Dimension>[] = [
    { header: "Code", cell: (d) => <span className="font-semibold">{d.code}</span> },
    { header: "Name", cell: (d) => d.name },
    { header: "Status", cell: (d) => <StatusPill status={d.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-md bg-pry-01/40 p-3 font-mont text-xs leading-relaxed text-gray-01">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>Cost centres tag journal lines with the department or branch that owns the spend, so reports can slice income and expense by unit. Analytical dimensions add further cross-cutting tags (class, project…) on top of the cost centre.</span>
      </div>

      <div className="flex items-center justify-between">
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className={selectCls} aria-label="Branch">
          <option value="">All branches</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <Can permission={P.FIN_CREATE_COST_CENTER}>
          <Button onClick={() => setCreating(true)} className="h-9 gap-1.5 font-mont text-xs font-semibold"><Plus className="size-3.5" /> New cost centre</Button>
        </Can>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(c) => c.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No cost centres" emptyMessage="Cost centres will appear here." />

      <div>
        <p className="font-mont text-sm font-semibold text-gray-01">Analytical Dimensions</p>
        <p className="mb-2 font-mont text-xs text-gray-05">Additional tags for cross-cutting analytics.</p>
        <DataTable columns={dimCols} rows={dimensions} rowKey={(d) => d.id}
          loading={dims.isLoading} error={dims.isError} onRetry={dims.refetch}
          emptyTitle="No dimensions" emptyMessage="Analytical dimensions will appear here." />
      </div>

      <NewCostCentreModal open={creating} onClose={() => setCreating(false)} entity={entity} parents={centres} />
    </div>
  );
}

function NewCostCentreModal({ open, onClose, entity, parents }: { open: boolean; onClose: () => void; entity: string; parents: CostCenter[] }) {
  const [create, { isLoading }] = useCreateCostCenterMutation();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const canSubmit = code.trim() !== "" && name.trim() !== "";

  const submit = async () => {
    try {
      const r = await create({ entity, code: code.trim().toUpperCase(), name: name.trim(), parent: parent || undefined }).unwrap();
      toast.success(r.message || "Cost centre saved.");
      setCode(""); setName(""); setParent("");
      onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New cost centre"
      description="Tag spend by department or branch." onSubmit={submit}
      loading={isLoading} canSubmit={canSubmit} widthClass="sm:max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CC-LAG-FAC" className="bg-white font-mont" /></FormField>
        <FormField label="Parent">
          <select value={parent} onChange={(e) => setParent(e.target.value)} className={`${selectCls} w-full`}>
            <option value="">None</option>
            {parents.map((c) => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lekki — Facilities" className="bg-white" /></FormField>
    </FormModal>
  );
}
