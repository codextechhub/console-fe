// Contracts (§7.3) — vendor contracts with milestones + renewal radar, and
// lifecycle actions (activate / renew / terminate).
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, DetailDrawer, Money, StatusPill, ActionButton, FormModal, FormField, MoneyInput, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import {
  useGetContractsQuery, useActivateContractMutation, useRenewContractMutation, useTerminateContractMutation, useCreateContractMutation,
} from "@/redux/services/procurement/procurement-ext-api";
import type { VendorContract } from "@/redux/services/procurement/procurement-types";
import { VendorPicker } from "./pickers";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p><p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value ?? "—"}</p></div>;
}

export default function ContractsPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<VendorContract | null>(null);
  const [creating, setCreating] = useState(false);
  const [reason, setReason] = useState("");
  const { data, isLoading, isFetching, isError, refetch } = useGetContractsQuery({ entity: entity!, page }, { skip: !entity });
  const [activate] = useActivateContractMutation();
  const [renew] = useRenewContractMutation();
  const [terminate] = useTerminateContractMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<VendorContract>[] = [
    { header: "Reference", cell: (c) => <span className="font-semibold">{c.reference}</span> },
    { header: "Title", cell: (c) => c.title },
    { header: "Vendor", cell: (c) => c.vendor_code },
    { header: "End date", cell: (c) => c.end_date ?? "—" },
    { header: "Value", align: "right", cell: (c) => <Money kobo={c.contract_value} currency={currency} align="right" /> },
    { header: "Status", cell: (c) => <StatusPill status={c.status} /> },
  ];

  if (!entity) return <ProcurementShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></ProcurementShell>;

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Contracts</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Vendor contracts with milestones and renewal radar.</p>
          </div>
          <Can permission={P.PROC_CREATE_CONTRACT}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New contract</Button>
          </Can>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(c) => c.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={setSelected}
          emptyTitle="No contracts" emptyMessage="Vendor contracts will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>

      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.title ?? "Contract"} description={selected?.reference} widthClass="sm:max-w-2xl"
        footer={selected && (
          <div className="flex flex-wrap items-center gap-2">
            {selected.status === "DRAFT" && (
              <ActionButton asLink label="Activate" permission={P.PROC_ACTIVATE_CONTRACT} title="Activate contract?"
                description={`Activates ${selected.reference}.`}
                onConfirm={async () => { const r = await activate({ id: selected.id, entity }).unwrap(); toast.success(r.message || "Activated."); }} />
            )}
            {selected.status === "ACTIVE" && (
              <ActionButton asLink label="Renew" permission={P.PROC_RENEW_CONTRACT} title="Renew contract?"
                description={`Creates a renewal of ${selected.reference}.`}
                onConfirm={async () => { const r = await renew({ id: selected.id, entity }).unwrap(); toast.success(r.message || "Renewed."); }} />
            )}
            {selected.status === "ACTIVE" && (
              <ActionButton label="Terminate" permission={P.PROC_TERMINATE_CONTRACT} destructive title="Terminate contract?"
                description={`Terminates ${selected.reference}.`}
                onConfirm={async () => { const r = await terminate({ id: selected.id, entity, reason }).unwrap(); toast.success(r.message || "Terminated."); setReason(""); }}>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="bg-white" />
              </ActionButton>
            )}
          </div>
        )}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3"><StatusPill status={selected.status} />{selected.auto_renew && <span className="font-mont text-xs text-gray-05">Auto-renew</span>}</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vendor" value={selected.vendor_code} />
              <Field label="Payment terms" value={selected.payment_terms} />
              <Field label="Start" value={selected.start_date} />
              <Field label="End" value={selected.end_date} />
              <Field label="Renewal window" value={selected.renewal_window_start} />
              <Field label="Value" value={<Money kobo={selected.contract_value} currency={currency} />} />
            </div>
            {selected.milestones.length > 0 && (
              <div>
                <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Milestones</p>
                <div className="space-y-1.5">
                  {selected.milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-gray-03 px-3 py-2 font-mont text-sm">
                      <span>{m.name}<span className="ml-2 text-gray-05">{m.due_date ?? ""}</span></span>
                      <span className="flex items-center gap-2"><Money kobo={m.amount} currency={currency} className="font-semibold" /><StatusPill status={m.status} /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
      <CreateContractModal open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </ProcurementShell>
  );
}

function CreateContractModal({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [reference, setReference] = useState("");
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [value, setValue] = useState(0);
  const [terms, setTerms] = useState("NET_30");
  const [autoRenew, setAutoRenew] = useState(false);
  const [create, { isLoading }] = useCreateContractMutation();
  const submit = async () => {
    try {
      const r = await create({ entity, reference: reference.trim(), title: title.trim(), vendor, start_date: startDate || undefined, end_date: endDate || undefined, contract_value: value || undefined, payment_terms: terms, auto_renew: autoRenew }).unwrap();
      toast.success(r.message || "Contract created.");
      setReference(""); setTitle(""); setVendor(""); setStartDate(""); setEndDate(""); setValue(0); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New contract"
      description="Vendor contract. Activate it afterwards to make it live." onSubmit={submit}
      loading={isLoading} canSubmit={!!reference.trim() && !!title.trim() && !!vendor}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Reference" required><Input value={reference} onChange={(e) => setReference(e.target.value)} className="bg-white font-mont" /></FormField>
        <FormField label="Vendor" required><VendorPicker entity={entity} value={vendor} onChange={setVendor} /></FormField>
      </div>
      <FormField label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start date"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white" /></FormField>
        <FormField label="End date"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white" /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Contract value"><MoneyInput valueKobo={value} onChangeKobo={setValue} currency={currency} /></FormField>
        <FormField label="Payment terms">
          <select value={terms} onChange={(e) => setTerms(e.target.value)} className="h-9 w-full rounded-md border bg-white px-2 font-mont text-sm">
            {["NET_7", "NET_14", "NET_30", "NET_60"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </FormField>
      </div>
      <label className="flex items-center gap-2 font-mont text-sm text-gray-01">
        <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} /> Auto-renew
      </label>
    </FormModal>
  );
}
