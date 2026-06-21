// Operations → Petty Cash, rebuilt to the Vision prototype in the house theme:
// a fund-centric float register. Fund selector → KPIs (ceiling / current / spent
// this week / to replenish) → tabs (Movement register · Vouchers) with
// Establish float, Replenish and New voucher.
//
// Honest adaptations: a fund selector (the prototype shows one fund; we can hold
// several). The movement register is the petty-cash GL ledger, and "Category" is
// derived from each journal's counter line (we don't store a category field).

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Coins, ArrowDownToLine, RefreshCw, FileText, ListChecks } from "lucide-react";
import {
  DataTable, Money, MoneyInput, DetailDrawer, FormField,
  AccountPicker, TaxCodePicker, BankAccountPicker, StatusPill, toArray, type Column,
} from "@/components/finance-ui";
import { Can, useCan } from "@/components/finance-ui/can";
import { EmptyState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";
import { P } from "@/permissions";
import {
  useGetPettyCashFundsQuery, useGetPettyCashFundQuery, useCreatePettyCashFundMutation,
  useEstablishPettyCashMutation, useReplenishPettyCashMutation, useGetPettyCashVouchersQuery,
  useCreatePettyCashVoucherMutation, usePostPettyCashVoucherMutation,
} from "@/redux/services/finance/ops-api";
import type { PettyCashFund, PettyCashVoucher, PettyCashMovement } from "@/redux/services/finance/ops-types";

const todayISO = new Date().toISOString().slice(0, 10);
const PILL = "inline-flex rounded px-2 py-0.5 font-mont text-[11px] font-medium";
const fmtDate = (s: string) => new Date(s).toLocaleDateString();

function Kpi({ label, value, hint, danger }: { label: string; value: string; hint?: string; danger?: boolean }) {
  return (
    <div className="rounded-md bg-white p-4 ring-1 ring-gray-03">
      <p className="font-mont text-xs text-gray-05">{label}</p>
      <p className={cn("mt-1 font-mont text-xl font-semibold tabular-nums", danger ? "text-destructive" : "text-black-01")}>{value}</p>
      {hint && <p className="mt-0.5 font-mont text-[11px] text-gray-05">{hint}</p>}
    </div>
  );
}

export function PettyCashTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data: listData, isLoading } = useGetPettyCashFundsQuery({ entity });
  const funds = useMemo(() => toArray(listData?.data), [listData]);
  const [fundId, setFundId] = useState<number | null>(null);
  const [creatingFund, setCreatingFund] = useState(false);
  const fund = useMemo<PettyCashFund | undefined>(
    () => (fundId != null ? funds.find((f) => f.id === fundId) : funds.find((f) => f.is_active) ?? funds[0]),
    [funds, fundId]);

  if (isLoading) return <div className="py-10 text-center font-mont text-sm text-gray-05">Loading…</div>;
  if (funds.length === 0) {
    return (
      <>
        <EmptyState title="No petty-cash funds" message="Create a float, then establish cash into it." />
        <div className="mt-3 flex justify-center">
          <Can permission={P.FIN_CREATE_PETTY_CASH}><Button onClick={() => setCreatingFund(true)} className="gap-1.5"><Plus className="size-4" /> New float</Button></Can>
        </div>
        <NewFundDrawer open={creatingFund} onClose={() => setCreatingFund(false)} entity={entity} currency={currency} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={fund?.id ?? ""} onChange={(e) => setFundId(Number(e.target.value))}
            className="h-9 rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-gray-01">
            {funds.map((f) => <option key={f.id} value={f.id}>{f.name}{f.custodian_label ? ` · ${f.custodian_label}` : ""}</option>)}
          </select>
          <Can permission={P.FIN_CREATE_PETTY_CASH}><Button variant="outline" size="sm" onClick={() => setCreatingFund(true)} className="gap-1.5"><Plus className="size-3.5" /> New float</Button></Can>
        </div>
      </div>
      {fund ? <FundWorkbench fund={fund} entity={entity} currency={currency} /> : null}
      <NewFundDrawer open={creatingFund} onClose={() => setCreatingFund(false)} entity={entity} currency={currency} />
    </div>
  );
}

const TABS = [{ key: "register", label: "Movement register", icon: ListChecks }, { key: "vouchers", label: "Vouchers", icon: FileText }] as const;

function FundWorkbench({ fund, entity, currency }: { fund: PettyCashFund; entity: string; currency?: string | null }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("register");
  const [drawer, setDrawer] = useState<null | "voucher" | "establish" | "replenish">(null);
  const { data: detailData } = useGetPettyCashFundQuery({ id: fund.id, entity });
  const detail = detailData?.data;
  const register = useMemo(() => detail?.register ?? [], [detail]);
  const vouchersQ = useGetPettyCashVouchersQuery({ entity, fund: fund.id });
  const vouchers = useMemo(() => toArray(vouchersQ.data?.data), [vouchersQ.data]);

  const registerCols: Column<PettyCashMovement>[] = [
    { header: "Date", cell: (m) => <span className="tabular-nums text-gray-05">{fmtDate(m.date)}</span> },
    { header: "Description", cell: (m) => m.description },
    { header: "Category", cell: (m) => <span className={cn(PILL, m.in ? "bg-green-01/10 text-green-01" : "bg-gray-03/60 text-gray-05")}>{m.category}</span> },
    { header: "In", align: "right", cell: (m) => m.in ? <span className="tabular-nums text-green-01">{formatMoney(m.in, currency)}</span> : <span className="text-gray-05">—</span> },
    { header: "Out", align: "right", cell: (m) => m.out ? <span className="tabular-nums text-destructive">{formatMoney(m.out, currency)}</span> : <span className="text-gray-05">—</span> },
    { header: "Balance", align: "right", cell: (m) => <span className="font-medium tabular-nums">{formatMoney(m.balance, currency)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-mont text-xs text-gray-05">Float register · {fund.gl_account}{fund.custodian_label ? ` · custodian ${fund.custodian_label}` : ""}</p>
        <div className="flex flex-wrap gap-2">
          <Can permission={P.FIN_REPLENISH_PETTY_CASH}>
            <Button variant="outline" onClick={() => setDrawer("establish")} className="gap-1.5"><ArrowDownToLine className="size-4" /> Establish float</Button>
            <Button variant="outline" onClick={() => setDrawer("replenish")} className="gap-1.5"><RefreshCw className="size-4" /> Replenish</Button>
          </Can>
          <Can permission={P.FIN_CREATE_PETTY_CASH}>
            <Button onClick={() => setDrawer("voucher")} className="gap-1.5"><Plus className="size-4" /> New voucher</Button>
          </Can>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Float ceiling" value={formatMoney(fund.float_amount, currency)} />
        <Kpi label="Current balance" value={formatMoney(fund.current_balance, currency)} hint="Cash on hand" />
        <Kpi label="Spent (this week)" value={formatMoney(detail?.spent_this_week ?? 0, currency)} />
        <Kpi label="To replenish" value={formatMoney(fund.shortfall, currency)} danger={fund.shortfall > 0} hint="Restores the float" />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-03">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 font-mont text-xs font-semibold",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-05 hover:text-gray-01")}>
            <t.icon className="size-3.5" /> {t.label}{t.key === "vouchers" && vouchers.length ? ` · ${vouchers.length}` : ""}
          </button>
        ))}
      </div>

      {tab === "register" ? (
        <DataTable columns={registerCols} rows={register} rowKey={(m) => m.id}
          emptyTitle="No movements yet" emptyMessage="Establish cash or record a voucher to see the register." />
      ) : (
        <VouchersList vouchers={vouchers} entity={entity} currency={currency} loading={vouchersQ.isFetching} />
      )}

      {drawer === "voucher" ? <NewVoucherDrawer fund={fund} entity={entity} currency={currency} onClose={() => setDrawer(null)} /> : null}
      {drawer === "establish" ? <FundCashDrawer mode="establish" fund={fund} entity={entity} currency={currency} onClose={() => setDrawer(null)} /> : null}
      {drawer === "replenish" ? <FundCashDrawer mode="replenish" fund={fund} entity={entity} currency={currency} onClose={() => setDrawer(null)} /> : null}
    </div>
  );
}

function VouchersList({ vouchers, entity, currency, loading }: { vouchers: PettyCashVoucher[]; entity: string; currency?: string | null; loading: boolean }) {
  const { can } = useCan();
  const [post] = usePostPettyCashVoucherMutation();
  const doPost = async (id: number) => { try { const r = await post({ id, entity }).unwrap(); toast.success(r.message || "Voucher posted."); } catch { /* central */ } };
  const cols: Column<PettyCashVoucher>[] = [
    { header: "Voucher no.", cell: (v) => <span className="font-semibold tabular-nums">{v.document_number}</span> },
    { header: "Date", cell: (v) => <span className="tabular-nums text-gray-05">{fmtDate(v.voucher_date)}</span> },
    { header: "Payee", cell: (v) => v.payee || "—" },
    { header: "Total", align: "right", cell: (v) => <Money kobo={v.total} currency={currency} align="right" /> },
    { header: "Status", cell: (v) => <StatusPill status={v.status} /> },
    { header: "", align: "right", cell: (v) => v.status === "DRAFT" && can(P.FIN_POST_PETTY_CASH)
      ? <button type="button" onClick={() => doPost(v.id)} className="font-mont text-[11px] font-medium text-primary hover:underline">Post</button> : null },
  ];
  return (
    <DataTable columns={cols} rows={vouchers} rowKey={(v) => v.id} loading={loading}
      emptyTitle="No vouchers" emptyMessage="Record a voucher with New voucher." />
  );
}

function NewVoucherDrawer({ fund, entity, currency, onClose }: { fund: PettyCashFund; entity: string; currency?: string | null; onClose: () => void }) {
  const [payee, setPayee] = useState("");
  const [date, setDate] = useState(todayISO);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState(0);
  const [tax, setTax] = useState("");
  const [narration, setNarration] = useState("");
  const [create, { isLoading }] = useCreatePettyCashVoucherMutation();
  const [post, { isLoading: posting }] = usePostPettyCashVoucherMutation();

  const submit = async (thenPost: boolean) => {
    try {
      const res = await create({
        entity, fund: fund.id, voucher_date: date, payee: payee.trim() || undefined,
        lines: [{ description: narration.trim() || "Petty cash spend", expense_account: account, quantity: 1, unit_price: amount, tax_code: tax || undefined }],
      }).unwrap();
      if (thenPost && res.data) await post({ id: res.data.id, entity }).unwrap();
      toast.success(thenPost ? "Voucher posted." : "Voucher saved.");
      onClose();
    } catch { /* central */ }
  };

  const canSubmit = account !== "" && amount > 0;
  return (
    <DetailDrawer
      open onOpenChange={(o) => (o ? undefined : onClose())}
      title="New voucher" description={`${fund.name} · spends the float`}
      widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading || posting} onClick={() => submit(false)}>Save draft</Button>
        <Button disabled={!canSubmit || isLoading || posting} onClick={() => submit(true)} className="gap-1.5"><Coins className="size-4" />{posting ? "Posting…" : "Save & post"}</Button>
      </>}
    >
      <div className="space-y-4">
        <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          Posting a voucher spends the tin — Dr expense (+ recoverable VAT), Cr petty cash — lowering the balance by the gross total.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Payee"><Input value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="Who was paid" className="bg-white" /></FormField>
          <FormField label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></FormField>
        </div>
        <FormField label="Expense account" required><AccountPicker entity={entity} value={account} onChange={setAccount} accountType="EXPENSE" postableOnly placeholder="5xxx" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></FormField>
          <FormField label="Tax"><TaxCodePicker entity={entity} value={tax} onChange={setTax} /></FormField>
        </div>
        <FormField label="Note"><Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="What it was for" className="bg-white" /></FormField>
      </div>
    </DetailDrawer>
  );
}

function FundCashDrawer({ mode, fund, entity, currency, onClose }: { mode: "establish" | "replenish"; fund: PettyCashFund; entity: string; currency?: string | null; onClose: () => void }) {
  const isEstablish = mode === "establish";
  const [bank, setBank] = useState("");
  const [date, setDate] = useState(todayISO);
  const [amount, setAmount] = useState(isEstablish ? fund.float_amount : fund.shortfall);
  const [establish, { isLoading: e1 }] = useEstablishPettyCashMutation();
  const [replenish, { isLoading: e2 }] = useReplenishPettyCashMutation();
  const isLoading = e1 || e2;

  const submit = async () => {
    try {
      const res = isEstablish
        ? await establish({ id: fund.id, entity, bank_account: bank || undefined, amount, date }).unwrap()
        : await replenish({ id: fund.id, entity, bank_account: bank || undefined, amount: amount || undefined, date }).unwrap();
      toast.success(res.message || "Done.");
      onClose();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open onOpenChange={(o) => (o ? undefined : onClose())}
      title={isEstablish ? "Establish float" : "Replenish float"} description={fund.name}
      widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading || amount <= 0} onClick={submit} className="gap-1.5"><ArrowDownToLine className="size-4" />{isLoading ? "Saving…" : `Move ${formatMoney(amount, currency)}`}</Button>
      </>}
    >
      <div className="space-y-4">
        <p className="rounded-md border border-gray-03 bg-gray-03 px-3 py-2 font-mont text-[11px] text-gray-05">
          {isEstablish ? "Moves cash from the bank into the tin (Dr petty cash, Cr bank) to set up the float." : `Tops the tin back up to its ${formatMoney(fund.float_amount, currency)} ceiling (Dr petty cash, Cr bank).`}
        </p>
        <FormField label="Bank account"><BankAccountPicker entity={entity} value={bank} onChange={setBank} placeholder="Default cash/bank" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount" required><MoneyInput valueKobo={amount} onChangeKobo={setAmount} currency={currency} /></FormField>
          <FormField label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" /></FormField>
        </div>
      </div>
    </DetailDrawer>
  );
}

function NewFundDrawer({ open, onClose, entity, currency }: { open: boolean; onClose: () => void; entity: string; currency?: string | null }) {
  const [name, setName] = useState("");
  const [glAccount, setGlAccount] = useState("");
  const [custodian, setCustodian] = useState("");
  const [floatAmount, setFloatAmount] = useState(0);
  const [create, { isLoading }] = useCreatePettyCashFundMutation();

  const reset = () => { setName(""); setGlAccount(""); setCustodian(""); setFloatAmount(0); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    try {
      const res = await create({ entity, name: name.trim(), gl_account: glAccount, custodian_name: custodian.trim() || undefined, float_amount: floatAmount || undefined }).unwrap();
      toast.success(res.message || "Fund created.");
      close();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={open} onOpenChange={(o) => (o ? undefined : close())}
      title="New petty-cash float" description="A float mapped 1:1 to its own petty-cash GL account."
      widthClass="sm:max-w-lg"
      footer={<>
        <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
        <Button disabled={isLoading || !name.trim() || !glAccount} onClick={submit} className="gap-1.5"><Plus className="size-4" />{isLoading ? "Creating…" : "Create fund"}</Button>
      </>}
    >
      <div className="space-y-4">
        <FormField label="Fund name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Front-desk float" className="bg-white" /></FormField>
        <FormField label="Petty-cash GL account" required><AccountPicker entity={entity} value={glAccount} onChange={setGlAccount} accountType="ASSET" postableOnly placeholder="Petty cash account" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Custodian"><Input value={custodian} onChange={(e) => setCustodian(e.target.value)} placeholder="Who holds the tin" className="bg-white" /></FormField>
          <FormField label="Float ceiling"><MoneyInput valueKobo={floatAmount} onChangeKobo={setFloatAmount} currency={currency} /></FormField>
        </div>
      </div>
    </DetailDrawer>
  );
}
