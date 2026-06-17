// Customer / payer detail drawer — prototype topology: header (name · status),
// three stat cards (Current balance / Lifetime paid / Open invoices) and a tabbed
// body. The Customer Statement lives here as a tab (Overview · Transactions ·
// Statement · Contact). Footer: Send reminder · Record receipt.
import { useState } from "react";
import { toast } from "sonner";
import { skipToken } from "@reduxjs/toolkit/query";
import { List, ArrowLeftRight, ScrollText, User, BellRing, CreditCard } from "lucide-react";
import { DetailDrawer, Money, ConfirmActionModal, FormField } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { LoadingState, ErrorState, EmptyState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetCustomerDetailQuery, useUpdateCustomerMutation, useRemindCustomerMutation,
} from "@/redux/services/finance/ar-api";
import type { Customer } from "@/redux/services/finance/ar-types";
import { CustomerReceiptModal } from "./customer-receipt-modal";

const TABS = [
  { key: "overview", label: "Overview", icon: List },
  { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { key: "statement", label: "Statement", icon: ScrollText },
  { key: "contact", label: "Contact", icon: User },
] as const;

const ACCOUNT_PILL: Record<string, string> = {
  ACTIVE: "bg-green-01/10 text-green-01", OVERDUE: "bg-destructive/10 text-destructive",
  CREDIT: "bg-blue-50 text-blue-700",
};
const ACCOUNT_LABEL: Record<string, string> = { ACTIVE: "Active", OVERDUE: "Overdue", CREDIT: "In credit" };
const th = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";
const td = "border-t border-gray-03 px-3 py-2 font-mont text-xs text-black-01";

function Pill({ status }: { status: string }) {
  return <span className={cn("rounded px-2 py-0.5 font-mont text-[11px] font-medium", ACCOUNT_PILL[status] ?? "bg-gray-03/60 text-gray-05")}>{ACCOUNT_LABEL[status] ?? status}</span>;
}

/** Signed money: positive owes (black), negative shows as a green credit. */
function SignedBalance({ kobo, currency }: { kobo: number; currency?: string | null }) {
  if (kobo < 0) return <span className="text-green-01">{formatMoney(-kobo, currency)} cr</span>;
  return <span>{formatMoney(kobo, currency)}</span>;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-gray-03">
      <p className="font-mont text-[11px] text-gray-05">{label}</p>
      <div className="mt-1 font-mont text-sm font-semibold tabular-nums text-black-01">{children}</div>
    </div>
  );
}

export function CustomerDetailDrawer({ id, entity, currency, onClose }: {
  id: number | null; entity: string; currency?: string | null; onClose: () => void;
}) {
  const { data, isLoading, isError, refetch } = useGetCustomerDetailQuery(id ? { entity, id } : skipToken);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("overview");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const [remind, { isLoading: reminding }] = useRemindCustomerMutation();
  const d = data?.data;
  const c = d?.customer;
  const s = d?.summary;
  const owes = (s?.current_balance.kobo ?? 0) > 0;

  const sendReminder = async () => {
    if (!c) return;
    try {
      const res = await remind({ entity, customer: c.id }).unwrap();
      toast.success(res.message || "Reminder generated.");
      setRemindOpen(false);
    } catch { /* central */ }
  };

  const count = (k: string) =>
    k === "overview" ? d?.open_invoices.length : k === "transactions" ? d?.transactions.length : k === "statement" ? d?.statement.length : undefined;

  return (
    <DetailDrawer
      open={id != null}
      onOpenChange={(o) => !o && onClose()}
      title={c ? c.name : "Customer"}
      description={c ? `${c.code}${c.billing_email ? ` · ${c.billing_email}` : ""}` : undefined}
      widthClass="sm:max-w-3xl"
      footer={
        owes ? (
          <div className="flex w-full items-center justify-end gap-2">
            <Can permission={P.FIN_SEND_DUNNING}>
              <Button variant="outline" onClick={() => setRemindOpen(true)} className="gap-1.5"><BellRing className="size-4" /> Send reminder</Button>
            </Can>
            <Can permission={P.FIN_RECORD_PAYMENT}>
              <Button onClick={() => setReceiptOpen(true)} className="gap-1.5"><CreditCard className="size-4" /> Record receipt</Button>
            </Can>
          </div>
        ) : null
      }
    >
      {isLoading ? <LoadingState rows={6} /> : isError || !d || !c || !s ? <ErrorState onRetry={refetch} /> : (
        <div className="space-y-4">
          <div><Pill status={s.account_status} /></div>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Current balance"><SignedBalance kobo={s.current_balance.kobo} currency={currency} /></Stat>
            <Stat label="Lifetime paid"><Money kobo={s.lifetime_paid.kobo} currency={currency} /></Stat>
            <Stat label="Open invoices">{s.open_invoice_count}</Stat>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-gray-03">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 font-mont text-xs font-semibold",
                  tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-05 hover:text-gray-01")}>
                <t.icon className="size-3.5" />{t.label}{count(t.key) ? ` (${count(t.key)})` : ""}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            d.open_invoices.length === 0 ? <EmptyState title="No open invoices" message="This customer has no outstanding invoices." /> : (
              <div className="overflow-x-auto rounded-md border border-gray-03">
                <table className="w-full border-collapse">
                  <thead><tr>
                    <th className={th}>Invoice</th><th className={th}>Date</th><th className={th}>Due</th>
                    <th className={cn(th, "text-right")}>Total</th><th className={cn(th, "text-right")}>Balance</th><th className={th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {d.open_invoices.map((i) => (
                      <tr key={i.document_number}>
                        <td className={cn(td, "font-semibold")}>{i.document_number}</td>
                        <td className={cn(td, "tabular-nums text-gray-05")}>{i.invoice_date}</td>
                        <td className={cn(td, "tabular-nums text-gray-05")}>{i.due_date ?? "—"}</td>
                        <td className={cn(td, "text-right tabular-nums")}><Money kobo={i.total.kobo} currency={currency} align="right" /></td>
                        <td className={cn(td, "text-right font-medium tabular-nums")}><Money kobo={i.balance.kobo} currency={currency} align="right" /></td>
                        <td className={td}><Pill status={i.status === "PAID" ? "ACTIVE" : i.status === "OVERDUE" ? "OVERDUE" : "ACTIVE"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "transactions" && (
            d.transactions.length === 0 ? <EmptyState title="No transactions" /> : (
              <div className="overflow-x-auto rounded-md border border-gray-03">
                <table className="w-full border-collapse">
                  <thead><tr>
                    <th className={th}>Date</th><th className={th}>Type</th><th className={th}>Reference</th><th className={cn(th, "text-right")}>Amount</th>
                  </tr></thead>
                  <tbody>
                    {d.transactions.map((t, i) => (
                      <tr key={`${t.reference}-${i}`}>
                        <td className={cn(td, "tabular-nums text-gray-05")}>{t.date}</td>
                        <td className={td}><span className={cn("rounded px-2 py-0.5 font-mont text-[11px] font-medium", t.type === "PAYMENT" ? "bg-green-01/10 text-green-01" : "bg-blue-50 text-blue-700")}>{t.type === "PAYMENT" ? "Receipt" : "Invoice"}</span></td>
                        <td className={cn(td, "font-semibold")}>{t.reference}</td>
                        <td className={cn(td, "text-right tabular-nums")}><Money kobo={t.amount.kobo} currency={currency} align="right" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "statement" && (
            d.statement.length === 0 ? <EmptyState title="No statement activity" message="Posted invoices and receipts will appear here as a running balance." /> : (
              <div className="overflow-x-auto rounded-md border border-gray-03">
                <table className="w-full border-collapse">
                  <thead><tr>
                    <th className={th}>Date</th><th className={th}>Description</th>
                    <th className={cn(th, "text-right")}>Debit</th><th className={cn(th, "text-right")}>Credit</th><th className={cn(th, "text-right")}>Balance</th>
                  </tr></thead>
                  <tbody>
                    {d.statement.map((r, i) => (
                      <tr key={i}>
                        <td className={cn(td, "tabular-nums text-gray-05")}>{r.date ?? "Opening"}</td>
                        <td className={td}>{r.description}</td>
                        <td className={cn(td, "text-right tabular-nums")}>{r.debit.kobo ? <Money kobo={r.debit.kobo} currency={currency} align="right" /> : "—"}</td>
                        <td className={cn(td, "text-right tabular-nums")}>{r.credit.kobo ? <Money kobo={r.credit.kobo} currency={currency} align="right" /> : "—"}</td>
                        <td className={cn(td, "text-right font-medium tabular-nums")}><Money kobo={r.balance.kobo} currency={currency} align="right" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "contact" && <ContactPanel key={c.id} entity={entity} customer={c} currency={currency} />}
        </div>
      )}

      {c && (
        <>
          <CustomerReceiptModal
            key={`rcpt-${receiptOpen}`}
            open={receiptOpen}
            onOpenChange={setReceiptOpen}
            entity={entity}
            customerId={c.id}
            customerName={c.name}
            owedKobo={s?.current_balance.kobo ?? 0}
          />
          <ConfirmActionModal
            open={remindOpen}
            onOpenChange={setRemindOpen}
            title="Send a payment reminder?"
            description={`Raises dunning reminders for ${c.name}'s overdue invoices (per the entity's policy).`}
            confirmText="Send reminder"
            loading={reminding}
            onConfirm={sendReminder}
          />
        </>
      )}
    </DetailDrawer>
  );
}

function ContactPanel({ entity, customer, currency }: { entity: string; customer: Customer; currency?: string | null }) {
  const [update, { isLoading }] = useUpdateCustomerMutation();
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.billing_email);
  const [phone, setPhone] = useState(customer.billing_phone);
  const [address, setAddress] = useState(customer.billing_address);
  const [active, setActive] = useState(customer.is_active);
  const dirty = name !== customer.name || email !== customer.billing_email || phone !== customer.billing_phone || address !== customer.billing_address || active !== customer.is_active;

  const save = async () => {
    try {
      const res = await update({ entity, id: customer.id, name: name.trim(), billing_email: email, billing_phone: phone, billing_address: address, is_active: active }).unwrap();
      toast.success(res.message || "Customer updated.");
    } catch { /* central */ }
  };

  return (
    <Can permission={P.FIN_UPDATE_CUSTOMER} fallback={
      <div className="space-y-2 font-mont text-sm">
        <p><span className="text-gray-05">Email:</span> {customer.billing_email || "—"}</p>
        <p><span className="text-gray-05">Phone:</span> {customer.billing_phone || "—"}</p>
        <p><span className="text-gray-05">Address:</span> {customer.billing_address || "—"}</p>
        <p><span className="text-gray-05">Receivable a/c:</span> {customer.receivable_account_code ?? "—"} {customer.receivable_account_name}</p>
      </div>
    }>
      <div className="space-y-3">
        <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Billing email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white" /></FormField>
          <FormField label="Billing phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white" /></FormField>
        </div>
        <FormField label="Billing address"><Input value={address} onChange={(e) => setAddress(e.target.value)} className="bg-white" /></FormField>
        <p className="font-mont text-xs text-gray-05">Receivable a/c: <span className="font-medium text-gray-01">{customer.receivable_account_code ?? "—"} {customer.receivable_account_name}</span> · Opening balance {formatMoney(customer.opening_balance, currency)}</p>
        <label className="flex items-center gap-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-primary" /> Active</label>
        <Button onClick={save} disabled={!dirty || isLoading} className="font-mont text-xs font-semibold">{isLoading ? "Saving…" : "Save changes"}</Button>
      </div>
    </Can>
  );
}
