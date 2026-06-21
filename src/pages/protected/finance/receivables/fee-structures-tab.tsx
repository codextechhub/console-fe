// Receivables → Fee Structures. Rebuilt to the Vision prototype in the house theme:
// a search/status list, a detail drawer (line items + Generate invoices) and a
// New-structure drawer with a line-items editor.
//
// Honest adaptation: the prototype is school-specific (branch · session · class
// scope · fee category · frequency · optional · assigned students). Our generic
// FeeStructure has code · name · term · is_active · items(description · GL account ·
// amount · tax), so those school-only fields/panels are dropped and status is
// Active / Inactive (is_active).
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, FileStack, Info } from "lucide-react";
import {
  DataTable, Money, MoneyInput, DetailDrawer, FormField,
  AccountPicker, TaxCodePicker, toArray, type Column,
} from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetFeeStructuresQuery, useCreateFeeStructureMutation, useGenerateFromFeeStructureMutation,
} from "@/redux/services/finance/ar-api";
import type { FeeStructure } from "@/redux/services/finance/ar-types";

const todayISO = new Date().toISOString().slice(0, 10);
const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const thCls = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const tdCls = "border-t border-gray-03 px-3 py-2 font-mont text-xs text-black-01";

function StatusPill({ active }: { active: boolean }) {
  return <span className={cn(PILL, active ? "bg-green-01/10 text-green-01" : "bg-gray-03/60 text-gray-05")}>{active ? "Active" : "Inactive"}</span>;
}

export function FeeStructuresTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<FeeStructure | null>(null);

  const params = useMemo(() => ({ entity, ...(search ? { search } : {}), ...(status ? { is_active: status } : {}) }), [entity, search, status]);
  const { data, isLoading, isFetching, isError, refetch } = useGetFeeStructuresQuery(params);
  const rows = useMemo(() => toArray(data?.data), [data]);
  const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01";

  const columns: Column<FeeStructure>[] = [
    { header: "Code", cell: (f) => <span className="font-semibold tabular-nums">{f.code}</span> },
    { header: "Name", cell: (f) => <span className="font-medium text-gray-01">{f.name}</span> },
    { header: "Term", cell: (f) => <span className="text-gray-05">{f.term || "—"}</span> },
    { header: "Lines", align: "right", cell: (f) => <span className="tabular-nums text-gray-05">{f.items.length}</span> },
    { header: "Total / term", align: "right", cell: (f) => <Money kobo={f.total} currency={currency} align="right" /> },
    { header: "Status", cell: (f) => <StatusPill active={f.is_active} /> },
  ];

  return (
    <>
      <div className="mb-5 flex items-start gap-2 rounded-md bg-blue-50/60 px-4 py-3 ring-1 ring-blue-100">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p className="font-mont text-xs text-blue-900/80">A fee structure is a billing template. When you generate invoices, each line builds an invoice line from its GL account, amount and tax — so revenue posts to the right place automatically.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search code or name" className="h-9 w-64 bg-white pl-8 font-mont" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <Can permission={P.FIN_CREATE_FEE_STRUCTURE}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New structure</Button>
        </Can>
      </div>

      <DataTable
        columns={columns} rows={rows} rowKey={(f) => f.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
        emptyTitle="No fee structures"
        emptyMessage="Create a billing template with New structure."
      />

      <FeeStructureDetailDrawer structure={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
      <NewStructureDrawer open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </>
  );
}

function FeeStructureDetailDrawer({ structure, entity, currency, onClose }: {
  structure: FeeStructure | null; entity: string; currency?: string | null; onClose: () => void;
}) {
  const { can } = useCan();
  const [generating, setGenerating] = useState(false);
  if (!structure) return null;

  return (
    <>
      <DetailDrawer
        open={!!structure} onOpenChange={(o) => (o ? undefined : onClose())}
        title={structure.name} description={`${structure.code}${structure.term ? ` · ${structure.term}` : ""}`}
        widthClass="sm:max-w-2xl"
        footer={
          <>
            <StatusPill active={structure.is_active} />
            <div className="flex-1" />
            {can(P.FIN_GENERATE_FEE_STRUCTURE) ? <Button onClick={() => setGenerating(true)} className="gap-1.5"><FileStack className="size-4" /> Generate invoices</Button> : null}
          </>
        }
      >
        <div className="space-y-4">
          {structure.description ? <p className="font-mont text-sm text-gray-01">{structure.description}</p> : null}
          <div>
            <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Lines</p>
            <div className="overflow-hidden rounded-md border border-gray-03">
              <table className="w-full border-collapse">
                <thead><tr>
                  <th className={thCls}>Fee item</th><th className={thCls}>GL account</th>
                  <th className={cn(thCls, "text-right")}>Amount</th><th className={thCls}>Tax</th>
                </tr></thead>
                <tbody>
                  {structure.items.map((it) => (
                    <tr key={it.id}>
                      <td className={tdCls}>{it.description || "—"}</td>
                      <td className={cn(tdCls, "tabular-nums text-gray-05")}>{it.revenue_account_code}</td>
                      <td className={cn(tdCls, "text-right tabular-nums")}><Money kobo={it.amount} currency={currency} align="right" /></td>
                      <td className={tdCls}>{it.tax_code_value ?? <span className="text-gray-05">Exempt</span>}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className={cn(tdCls, "border-t-2")} colSpan={2}>Total / term</td>
                    <td className={cn(tdCls, "border-t-2 text-right tabular-nums")}><Money kobo={structure.total} currency={currency} align="right" /></td>
                    <td className={cn(tdCls, "border-t-2")} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DetailDrawer>

      {generating ? <GenerateDrawer structure={structure} entity={entity} onClose={() => setGenerating(false)} /> : null}
    </>
  );
}

function GenerateDrawer({ structure, entity, onClose }: { structure: FeeStructure; entity: string; onClose: () => void }) {
  const [invoiceDate, setInvoiceDate] = useState(todayISO);
  const [dueDate, setDueDate] = useState("");
  const [generate, { isLoading }] = useGenerateFromFeeStructureMutation();

  const submit = async () => {
    try {
      const res = await generate({ id: structure.code, entity, all_active: true, invoice_date: invoiceDate, due_date: dueDate || undefined }).unwrap();
      toast.success(res.message || `Generated ${res.data?.generated ?? 0} invoice(s).`);
      onClose();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open onOpenChange={(o) => (o ? undefined : onClose())}
      title="Generate invoices" description={`${structure.code} · ${structure.name}`}
      widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading || !invoiceDate} onClick={submit} className="gap-1.5"><FileStack className="size-4" />{isLoading ? "Generating…" : "Generate"}</Button>
      </>}
    >
      <div className="space-y-4">
        <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          Raises one posted invoice per active customer from this structure's lines ({formatMoney(structure.total)} / term). Customers already billed for it are skipped.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Invoice date" required><Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-white" /></FormField>
          <FormField label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-white" /></FormField>
        </div>
      </div>
    </DetailDrawer>
  );
}

type EditItem = { description: string; revenue_account: string; amount: number; tax_code: string };
const emptyItem = (): EditItem => ({ description: "", revenue_account: "", amount: 0, tax_code: "" });

function NewStructureDrawer({ open, onClose, entity, currency }: {
  open: boolean; onClose: () => void; entity: string; currency?: string | null;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [items, setItems] = useState<EditItem[]>([emptyItem()]);
  const [create, { isLoading }] = useCreateFeeStructureMutation();

  const setItem = (i: number, patch: Partial<EditItem>) => setItems((s) => s.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const addItem = () => setItems((s) => [...s, emptyItem()]);
  const removeItem = (i: number) => setItems((s) => s.filter((_, idx) => idx !== i));
  const total = items.reduce((s, it) => s + it.amount, 0);

  const validItems = items.filter((it) => it.description.trim() && it.revenue_account && it.amount > 0);
  const canSubmit = code.trim() !== "" && name.trim() !== "" && validItems.length > 0;

  const reset = () => { setCode(""); setName(""); setTerm(""); setDescription(""); setActive(true); setItems([emptyItem()]); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    try {
      const res = await create({
        entity, code: code.trim().toUpperCase(), name: name.trim(), term: term.trim() || undefined,
        description: description.trim() || undefined, is_active: active,
        items: validItems.map((it) => ({ description: it.description.trim(), revenue_account: it.revenue_account, amount: it.amount, tax_code: it.tax_code || undefined })),
      }).unwrap();
      toast.success(res.message || "Fee structure created.");
      close();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="New fee structure" description="A billing template whose lines become invoice lines."
      widthClass="sm:max-w-3xl"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
        <Button disabled={isLoading || !canSubmit} onClick={submit} className="gap-1.5"><Plus className="size-4" />{isLoading ? "Creating…" : "Create structure"}</Button>
      </>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FS-SSS-T1" className="bg-white font-mont" /></FormField>
          <FormField label="Term"><Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. First Term" className="bg-white" /></FormField>
          <label className="flex items-end gap-2 pb-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-primary" /> Active</label>
        </div>
        <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senior Secondary — First Term" className="bg-white" /></FormField>
        <FormField label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white" /></FormField>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Fee lines</p>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5"><Plus className="size-3.5" /> Add line</Button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border border-gray-03 bg-white p-2.5">
                <div className="col-span-3"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Fee item</p><Input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Tuition" className="h-8 bg-white font-mont text-sm" /></div>
                <div className="col-span-4"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">GL account</p><AccountPicker entity={entity} value={it.revenue_account} onChange={(v) => setItem(i, { revenue_account: v })} accountType="INCOME" postableOnly placeholder="Revenue account" /></div>
                <div className="col-span-2"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Amount</p><MoneyInput valueKobo={it.amount} onChangeKobo={(v) => setItem(i, { amount: v })} currency={currency} /></div>
                <div className="col-span-2"><p className="mb-1 font-mont text-[10px] uppercase tracking-wide text-gray-05">Tax</p><TaxCodePicker entity={entity} value={it.tax_code} onChange={(v) => setItem(i, { tax_code: v })} /></div>
                <div className="col-span-1 flex justify-end"><button type="button" onClick={() => removeItem(i)} disabled={items.length <= 1} className="rounded p-1.5 text-gray-05 hover:bg-destructive/5 hover:text-destructive disabled:opacity-30" aria-label="Remove line"><Trash2 className="size-4" /></button></div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end font-mont text-sm">
            <span className="text-gray-05">Total / term&nbsp;</span><span className="font-semibold tabular-nums text-black-01">{formatMoney(total, currency)}</span>
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}
