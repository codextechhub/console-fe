// Collections — money in via the payment gateway, rebuilt to the Vision prototype in
// the house theme: KPIs (collected / pending / failed / success rate), status + provider
// filters, a checkouts table, a detail drawer with a status timeline and the settlement
// posting (Dr bank/collections, Cr AR), a New-checkout drawer, and a CSV export.
//
// Backed by the real model: initiate returns a hosted checkout_url; verify polls the PSP
// and books a vs_finance receipt when settled. Honest: providers are OPay/Paystack (+
// Fake for testing); no email is sent (Copy link copies the real URL); the receipt
// journal posts automatically on confirmation — the recap mirrors it, never a 2nd post.

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Download, RefreshCw, Link2, Receipt } from "lucide-react";
import { DataTable, Money, MoneyInput, DetailDrawer, FormField, CustomerPicker, PostingRecap, KpiCard, toArray, type Column, type RecapRow } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import { useGetCollectionsQuery, useInitiateCollectionMutation, useVerifyCollectionMutation } from "@/redux/services/payments/payments-api";
import type { Collection } from "@/redux/services/payments/payments-types";

const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const fmtDateTime = (s?: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

// filing-style status → prototype group (Pending / Paid / Failed / Refunded)
const STATUS_GROUP: Record<string, "PENDING" | "PAID" | "FAILED" | "REFUNDED"> = {
  PENDING: "PENDING", PROCESSING: "PENDING", SUCCEEDED: "PAID", FAILED: "FAILED", ABANDONED: "FAILED", REFUNDED: "REFUNDED",
};
const GROUP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  PAID: { label: "Paid", cls: "bg-green-01/10 text-green-01" },
  FAILED: { label: "Failed", cls: "bg-destructive/10 text-destructive" },
  REFUNDED: { label: "Refunded", cls: "bg-blue-50 text-blue-700" },
};
function StatusPill({ status }: { status: string }) {
  const g = GROUP[STATUS_GROUP[status] ?? "PENDING"];
  return <span className={cn(PILL, g.cls)}>{g.label}</span>;
}

const PROVIDERS: Record<string, { label: string; dot: string }> = {
  PAYSTACK: { label: "Paystack", dot: "bg-blue-500" },
  OPAY: { label: "OPay", dot: "bg-green-500" },
  FAKE: { label: "Fake (test)", dot: "bg-gray-400" },
};
function ProviderTag({ provider }: { provider: string }) {
  const p = PROVIDERS[provider] ?? { label: provider, dot: "bg-gray-400" };
  return <span className="inline-flex items-center gap-1.5 font-mont text-xs text-black-01"><span className={cn("size-2 rounded-sm", p.dot)} /> {p.label}</span>;
}

function Select({ value, onChange, children, className }: { value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 rounded-md border border-gray-03 bg-white px-2.5 font-mont text-xs text-black-01 focus:border-primary focus:outline-none", className)}>
      {children}
    </select>
  );
}

const customerLabel = (c: Collection) => c.customer_name || c.payer_name || c.customer_code || "—";

export function CollectionsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [group, setGroup] = useState("");
  const [provider, setProvider] = useState("");
  const { data, isLoading, isFetching, isError, refetch } = useGetCollectionsQuery({ entity });
  const all = useMemo(() => toArray(data?.data), [data]);
  const rows = useMemo(() => all.filter((c) =>
    (!group || STATUS_GROUP[c.status] === group) && (!provider || c.provider === provider)), [all, group, provider]);

  const kpis = useMemo(() => {
    const sum = (pred: (c: Collection) => boolean) => all.filter(pred).reduce((s, c) => s + c.amount, 0);
    const succeeded = all.filter((c) => c.status === "SUCCEEDED").length;
    const terminal = all.filter((c) => ["SUCCEEDED", "FAILED", "ABANDONED"].includes(c.status)).length;
    return {
      collected: sum((c) => c.status === "SUCCEEDED"),
      pending: sum((c) => c.status === "PENDING" || c.status === "PROCESSING"),
      failed: sum((c) => c.status === "FAILED" || c.status === "ABANDONED"),
      rate: terminal ? Math.round((succeeded * 100) / terminal) : null,
    };
  }, [all]);

  const columns: Column<Collection>[] = [
    { header: "Reference", cell: (c) => <span className="font-semibold tabular-nums text-gray-01">{c.reference}</span> },
    { header: "Created", cell: (c) => <span className="tabular-nums text-gray-05">{fmtDateTime(c.created_at)}</span> },
    { header: "Customer", cell: (c) => <span><span className="font-medium text-gray-01">{customerLabel(c)}</span>{c.narration ? <span className="block font-mont text-[11px] text-gray-05">{c.narration}</span> : null}</span> },
    { header: "Provider", cell: (c) => <ProviderTag provider={c.provider} /> },
    { header: "Amount", align: "right", cell: (c) => <Money kobo={c.amount} currency={currency} align="right" /> },
    { header: "Status", cell: (c) => <StatusPill status={c.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Collected (settled)" value={formatMoney(kpis.collected, currency)} foot="Confirmed receipts" />
        <KpiCard label="Pending" value={formatMoney(kpis.pending, currency)} foot="Awaiting payment" />
        <KpiCard label="Failed" value={formatMoney(kpis.failed, currency)} tone={kpis.failed > 0 ? "warn" : "default"} />
        <KpiCard label="Success rate" value={kpis.rate == null ? "—" : `${kpis.rate}%`} foot="Settled ÷ completed" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={group} onChange={setGroup} className="w-36">
            <option value="">All status</option>
            {Object.entries(GROUP).map(([v, g]) => <option key={v} value={v}>{g.label}</option>)}
          </Select>
          <Select value={provider} onChange={setProvider} className="w-40">
            <option value="">All providers</option>
            {Object.entries(PROVIDERS).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCsv(rows, currency)} disabled={!rows.length} className="gap-1.5"><Download className="size-4" /> Export</Button>
          <Can permission={P.PAY_CREATE_COLLECTION}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New checkout</Button>
          </Can>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(c) => c.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch} onRowClick={(c) => setSelectedId(c.id)}
        emptyTitle="No collections" emptyMessage="Create a checkout to collect money via the gateway." />

      <CollectionDrawer collectionId={selectedId} collections={all} entity={entity} currency={currency} onClose={() => setSelectedId(null)} />
      <NewCheckoutDrawer open={creating} onClose={() => setCreating(false)} entity={entity} currency={currency} />
    </div>
  );
}

function Metric({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-gray-03 bg-white p-3">
      <p className="font-mont text-[11px] text-gray-05">{label}</p>
      {value ? <p className="mt-1 font-mont text-sm font-semibold tabular-nums text-black-01">{value}</p> : <div className="mt-1.5">{children}</div>}
    </div>
  );
}

function TimelineStep({ done, current, title, sub }: { done: boolean; current?: boolean; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", done ? "bg-green-01" : current ? "bg-primary" : "bg-gray-03 text-gray-05")}>{done ? "✓" : ""}</span>
      <div>
        <p className={cn("font-mont text-xs font-semibold", done || current ? "text-black-01" : "text-gray-05")}>{title}</p>
        <p className="font-mont text-[11px] text-gray-05">{sub}</p>
      </div>
    </div>
  );
}

function CollectionDrawer({ collectionId, collections, entity, currency, onClose }: { collectionId: number | null; collections: Collection[]; entity: string; currency?: string | null; onClose: () => void }) {
  const c = useMemo(() => collections.find((x) => x.id === collectionId) ?? null, [collections, collectionId]);
  const [verify, { isLoading: verifying }] = useVerifyCollectionMutation();
  if (collectionId == null || !c) return null;

  const paid = c.status === "SUCCEEDED";
  const failed = c.status === "FAILED" || c.status === "ABANDONED";
  const dr: RecapRow[] = [{ code: c.deposit_account_code || "", name: c.deposit_account_name || "Bank / collections", amount: c.amount }];
  const cr: RecapRow[] = [{ code: "", name: "Accounts receivable", amount: c.amount }];

  const doVerify = async () => { try { const r = await verify({ id: c.id, entity }).unwrap(); toast.success(r.message || "Re-checked with provider."); } catch { /* central */ } };
  const copyLink = async () => {
    if (!c.checkout_url) return;
    try { await navigator.clipboard.writeText(c.checkout_url); toast.success("Checkout link copied."); }
    catch { toast.error("Couldn't copy the link."); }
  };

  return (
    <DetailDrawer open onOpenChange={(o) => (o ? undefined : onClose())}
      title={c.reference} description={`${customerLabel(c)} · ${formatMoney(c.amount, currency)}`} widthClass="sm:max-w-2xl"
      footer={<>
        <StatusPill status={c.status} />
        <div className="flex-1" />
        {c.checkout_url ? <Button variant="outline" onClick={copyLink} className="gap-1.5"><Link2 className="size-4" /> Copy link</Button> : null}
        {!paid && !failed ? <Button disabled={verifying} onClick={doVerify} className="gap-1.5"><RefreshCw className="size-4" />{verifying ? "Checking…" : "Re-verify"}</Button> : null}
      </>}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Amount" value={formatMoney(c.amount, currency)} />
          <Metric label="Provider"><ProviderTag provider={c.provider} /></Metric>
          <Metric label="Status"><StatusPill status={c.status} /></Metric>
        </div>

        <div className="rounded-md border border-gray-03 bg-white p-4">
          <p className="mb-3 font-mont text-[11px] font-semibold uppercase tracking-wide text-gray-05">Status timeline</p>
          <div className="space-y-3">
            <TimelineStep done title="Checkout created" sub={fmtDateTime(c.created_at)} />
            <TimelineStep done={paid || failed} current={!paid && !failed} title="Checkout link ready" sub={c.checkout_url ? (c.payer_email ? `Hand off to ${c.payer_email}` : "Link ready to share") : "No hosted link"} />
            <TimelineStep done={paid} current={!paid && !failed} title={failed ? "Payment failed" : "Payment confirmed"}
              sub={paid ? `Webhook received — receipt booked (Dr bank / Cr AR)${c.confirmed_at ? ` · ${fmtDateTime(c.confirmed_at)}` : ""}` : failed ? "The provider reported a failed/abandoned payment" : "Awaiting the provider's confirmation"} />
          </div>
        </div>

        {!failed ? (
          <div>
            <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">{paid ? "Settlement posting" : "On settlement (via webhook)"}</p>
            <PostingRecap title={paid ? "Receipt booked" : "Will post on confirmation"} dr={dr} cr={cr} currency={currency}
              helper={paid ? "Booked automatically when the provider confirmed payment." : "The journal posts automatically when the provider confirms payment — no manual receipt."} />
          </div>
        ) : null}

        {c.payment_id ? <p className="inline-flex items-center gap-1.5 font-mont text-[11px] text-gray-05"><Receipt className="size-3.5" /> Linked receipt #{c.payment_id}</p> : null}
      </div>
    </DetailDrawer>
  );
}

function NewCheckoutDrawer({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState(0);
  const [provider, setProvider] = useState("PAYSTACK");
  const [email, setEmail] = useState("");
  const [narration, setNarration] = useState("");
  const [initiate, { isLoading }] = useInitiateCollectionMutation();
  const close = () => { setCustomer(""); setAmount(0); setProvider("PAYSTACK"); setEmail(""); setNarration(""); onClose(); };
  const submit = async () => {
    try {
      const r = await initiate({ entity, amount, customer: customer || undefined, provider, payer_email: email.trim() || undefined, narration: narration.trim() || undefined }).unwrap();
      const url = r.data?.checkout_url;
      if (url) { try { await navigator.clipboard.writeText(url); } catch { /* ignore */ } }
      toast.success(url ? "Checkout link created and copied." : r.message || "Checkout created.");
      close();
    } catch { /* central */ }
  };
  const dr: RecapRow[] = [{ code: "", name: "Bank / collections", amount: amount || 0 }];
  const cr: RecapRow[] = [{ code: "", name: "Accounts receivable", amount: amount || 0 }];

  return (
    <DetailDrawer open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="New checkout" description="Create a hosted payment link to hand off to the customer." widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
        <Button disabled={isLoading || amount <= 0} onClick={submit} className="gap-1.5"><Plus className="size-4" />{isLoading ? "Creating…" : "Create checkout link"}</Button>
      </>}>
      <div className="space-y-4">
        <FormField label="Customer"><CustomerPicker entity={entity} value={customer} onChange={setCustomer} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} className="[&_input]:h-9" /></FormField>
          <div><p className="mb-1 font-mont text-xs text-gray-05">Provider</p><Select value={provider} onChange={setProvider} className="w-full">{Object.entries(PROVIDERS).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}</Select></div>
        </div>
        <FormField label="Customer email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-9 bg-white" /></FormField>
        <FormField label="Narration"><Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Term 3 tuition — A. Williams" className="h-9 bg-white" /></FormField>
        <div>
          <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">On settlement (via webhook)</p>
          <PostingRecap title="Will post on confirmation" dr={dr} cr={cr} currency={currency} helper="The journal posts automatically when the provider confirms payment." />
        </div>
      </div>
    </DetailDrawer>
  );
}

function exportCsv(rows: Collection[], currency?: string | null) {
  const head = ["Reference", "Created", "Customer", "Narration", "Provider", "Amount", "Status"];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const body = rows.map((c) => [
    c.reference, fmtDate(c.created_at), customerLabel(c), c.narration || "",
    (PROVIDERS[c.provider]?.label ?? c.provider), formatMoney(c.amount, currency),
    (GROUP[STATUS_GROUP[c.status] ?? "PENDING"].label),
  ].map(esc).join(","));
  const csv = [head.map(esc).join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `collections-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
