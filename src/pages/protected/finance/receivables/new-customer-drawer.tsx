// New customer / payer — a right-side drawer (prototype style). The receivable
// control account uses the app's type-to-search AccountPicker; opening balance is
// entered in naira and sent as integer kobo. Defaults the AR control to 1200.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DetailDrawer, FormField, ReceivableAccountPicker } from "@/components/finance-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateCustomerMutation } from "@/redux/services/finance/ar-api";

const toKobo = (naira: string) => Math.round((parseFloat(naira) || 0) * 100);

export function NewCustomerDrawer({ open, onOpenChange, entity }: {
  open: boolean; onOpenChange: (o: boolean) => void; entity: string;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [account, setAccount] = useState("");
  const [opening, setOpening] = useState("");
  const [active, setActive] = useState(true);
  const [create, { isLoading }] = useCreateCustomerMutation();

  const canSubmit = code.trim() !== "" && name.trim() !== "";
  const reset = () => { setCode(""); setName(""); setEmail(""); setPhone(""); setAddress(""); setAccount(""); setOpening(""); setActive(true); };
  const close = () => { reset(); onOpenChange(false); };

  const submit = async () => {
    try {
      const res = await create({
        entity, code: code.trim(), name: name.trim(),
        billing_email: email || undefined, billing_phone: phone || undefined,
        billing_address: address || undefined,
        receivable_account: account || undefined,
        opening_balance: opening ? toKobo(opening) : undefined,
        is_active: active,
      }).unwrap();
      toast.success(res.message || "Customer created.");
      close();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={(o) => (o ? undefined : close())}
      title="New customer"
      description="Add a customer / payer to the AR sub-ledger."
      widthClass="sm:max-w-xl"
      footer={
        <>
          <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
          <Button disabled={isLoading || !canSubmit} onClick={submit} className="gap-1.5">
            <Plus className="size-4" />{isLoading ? "Saving…" : "Create customer"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CUST-005" className="bg-white font-mont" /></FormField>
          <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Ltd" className="bg-white" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Billing email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="billing@acme.com" className="bg-white" /></FormField>
          <FormField label="Billing phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" className="bg-white" /></FormField>
        </div>
        <FormField label="Billing address"><Input value={address} onChange={(e) => setAddress(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Receivable account">
          <ReceivableAccountPicker entity={entity} value={account} onChange={setAccount} placeholder="Defaults to 1200 Accounts Receivable" />
        </FormField>
        <div className="grid grid-cols-2 items-end gap-3">
          <FormField label="Opening balance (₦)"><Input type="number" min="0" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0.00" className="bg-white" /></FormField>
          <label className="flex items-center gap-2 pb-2 font-mont text-sm text-gray-01">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-primary" /> Active
          </label>
        </div>
      </div>
    </DetailDrawer>
  );
}
