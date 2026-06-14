// Banking & reconciliation (§6.5). Bank accounts (account number FLS-masked),
// a statement-lines drawer per account, and auto-reconcile.

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { FinanceShell } from "./finance-shell";
import { DataTable, DetailDrawer, Money, StatusPill, FormModal, FormField, AccountPicker, CurrencyPicker, useActiveEntity, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { EmptyState, ErrorState, LoadingState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { isStripped } from "@/utils/fls";
import {
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,
  useGetStatementLinesQuery,
  useAutoReconcileMutation,
} from "@/redux/services/finance/ops-api";
import type { BankAccount } from "@/redux/services/finance/ops-types";

export default function BankingPage() {
  const { code: entity, currency } = useActiveEntity();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useGetBankAccountsQuery({ entity: entity!, page }, { skip: !entity });
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<BankAccount>[] = [
    { header: "Account", cell: (a) => <span className="font-semibold">{a.name}</span> },
    { header: "Bank", cell: (a) => a.bank_name },
    { header: "Account number", cell: (a) => (isStripped(a, "account_number") ? <span className="text-gray-05">••••</span> : a.account_number || "—") },
    { header: "GL account", cell: (a) => a.gl_account },
    { header: "Currency", cell: (a) => a.currency ?? "—" },
    { header: "Status", cell: (a) => <StatusPill status={a.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  if (!entity) {
    return <FinanceShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></FinanceShell>;
  }

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">Banking & Reconciliation</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Bank accounts and their statement reconciliation.</p>
          </div>
          <Can permission={P.FIN_CREATE_BANK_ACCOUNT}>
            <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New bank account</Button>
          </Can>
        </div>
        <DataTable
          columns={columns} rows={rows} rowKey={(a) => a.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch}
          onRowClick={setSelected}
          emptyTitle="No bank accounts" emptyMessage="Bank accounts for this entity will appear here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
        />
      </main>

      <StatementDrawer account={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
      <CreateBankAccountModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </FinanceShell>
  );
}

function CreateBankAccountModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [glAccount, setGlAccount] = useState("");
  const [currency, setCurrency] = useState("");
  const [create, { isLoading }] = useCreateBankAccountMutation();

  const submit = async () => {
    try {
      const res = await create({ entity, name: name.trim(), bank_name: bankName.trim() || undefined, account_number: accountNumber.trim() || undefined, gl_account: glAccount, currency: currency || undefined }).unwrap();
      toast.success(res.message || "Bank account created.");
      setName(""); setBankName(""); setAccountNumber(""); setGlAccount(""); setCurrency("");
      onClose();
    } catch { /* central */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New bank account"
      description="Links a bank account to a GL cash account." onSubmit={submit} loading={isLoading}
      canSubmit={!!name.trim() && !!glAccount}>
      <FormField label="Account name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Bank name"><Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Account number"><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="bg-white font-mont" /></FormField>
      </div>
      <FormField label="GL cash account" required><AccountPicker entity={entity} value={glAccount} onChange={setGlAccount} postableOnly accountType="ASSET" /></FormField>
      <FormField label="Currency"><CurrencyPicker value={currency} onChange={setCurrency} /></FormField>
    </FormModal>
  );
}

const headCls = "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs whitespace-nowrap pt-2.5 pb-2";
const cellCls = "text-black-01 border-gray-03 font-medium font-mont text-sm";

function StatementDrawer({ account, entity, currency, onClose }: { account: BankAccount | null; entity: string; currency?: string | null; onClose: () => void }) {
  const open = !!account;
  const { data, isLoading, isError, refetch } = useGetStatementLinesQuery({ id: account!.id, entity }, { skip: !open });
  const [reconcile, { isLoading: reconciling }] = useAutoReconcileMutation();
  const lines = data?.data ?? [];

  const doReconcile = async () => {
    try {
      const res = await reconcile({ id: account!.id, entity }).unwrap();
      toast.success(res.message || "Auto-reconcile complete.");
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={account ? account.name : "Bank account"}
      description={account ? `${account.bank_name} · ${account.gl_account}` : undefined}
      widthClass="sm:max-w-2xl"
      footer={
        <Can permission={P.FIN_RECONCILE_BANK}>
          <Button onClick={doReconcile} disabled={reconciling}>{reconciling ? "Reconciling…" : "Auto-reconcile"}</Button>
        </Can>
      }
    >
      <p className="mb-2 font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">Statement lines</p>
      {isLoading ? <LoadingState rows={5} /> : isError ? <ErrorState onRetry={refetch} /> : lines.length === 0 ? (
        <EmptyState title="No statement lines" message="Import a statement to begin reconciling." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-03">
          <table className="w-full">
            <thead><tr>
              <th className={headCls + " px-3 text-left"}>Date</th>
              <th className={headCls + " px-3 text-left"}>Description</th>
              <th className={headCls + " px-3 text-right"}>Amount</th>
              <th className={headCls + " px-3 text-left"}>Status</th>
            </tr></thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-t border-gray-03">
                  <td className={cellCls + " px-3 py-2"}>{l.txn_date}</td>
                  <td className={cellCls + " px-3 py-2 text-gray-01"}>{l.description || "—"}</td>
                  <td className={cellCls + " px-3 py-2"}><Money kobo={l.amount} currency={currency} align="right" /></td>
                  <td className={cellCls + " px-3 py-2"}><StatusPill status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DetailDrawer>
  );
}
