// Batch generate — raise a posted invoice per customer from a fee structure.
// Backed by POST /finance/fee-structures/<id>/generate/ (gated on
// finance.feestructure.generate). Pick a structure, choose all active customers
// (the common case) and set the dates.
import { useState } from "react";
import { toast } from "sonner";
import { FormModal, FormField, toArray, PostingDateField,} from "@/components/finance-ui";
import { Input } from "@/components/ui/input";
import { useGetFeeStructuresQuery, useGenerateFromFeeStructureMutation } from "@/redux/services/finance/ar-api";
import type { FeeStructure } from "@/redux/services/finance/ar-types";

const selectCls = "h-9 w-full rounded-md border border-gray-03 bg-white px-2 font-mont text-sm focus:border-primary focus:outline-none";

export function BatchGenerateModal({ open, onOpenChange, entity }: {
  open: boolean; onOpenChange: (o: boolean) => void; entity: string;
}) {
  const { data } = useGetFeeStructuresQuery({ entity, is_active: "true" }, { skip: !open });
  const structures = toArray<FeeStructure>(data?.data);
  const [structure, setStructure] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [generate, { isLoading }] = useGenerateFromFeeStructureMutation();

  const submit = async () => {
    try {
      const res = await generate({
        id: structure, entity, all_active: true,
        invoice_date: invoiceDate || undefined, due_date: dueDate || undefined,
      }).unwrap();
      toast.success(res.message || `${res.data?.generated ?? 0} invoice(s) generated.`);
      onOpenChange(false); setStructure(""); setDueDate("");
    } catch { /* central */ }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Batch generate invoices"
      description="Raise a posted invoice for every active customer from the selected fee structure."
      submitText="Generate"
      loading={isLoading}
      canSubmit={!!structure}
      onSubmit={submit}
    >
      <FormField label="Fee structure" required>
        <select value={structure} onChange={(e) => setStructure(e.target.value)} className={selectCls} aria-label="Fee structure">
          <option value="">Select a fee structure…</option>
          {structures.map((f) => (
            <option key={f.id} value={f.id}>{f.code} — {f.name} ({f.total_naira})</option>
          ))}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <PostingDateField label="Invoice date" entity={entity} value={invoiceDate} onChange={setInvoiceDate} required={false} />
        <FormField label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-white" />
        </FormField>
      </div>
      <p className="font-mont text-[11px] text-gray-05">Invoices are raised and posted for all active customers. Customers already billed for this structure are skipped.</p>
    </FormModal>
  );
}
