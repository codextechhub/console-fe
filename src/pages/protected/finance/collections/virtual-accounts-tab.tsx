// Collections → Virtual accounts. Dedicated funding accounts per customer. The
// account number/name are FLS-stripped unless the caller holds
// payments.virtual_account.view_sensitive — render "••••" rather than crash.

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, StatusPill, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { P } from "@/permissions";
import { isStripped } from "@/utils/fls";
import { useGetVirtualAccountsQuery, useCreateVirtualAccountMutation } from "@/redux/services/payments/payments-api";
import type { VirtualAccount } from "@/redux/services/payments/payments-types";

function masked(va: VirtualAccount, field: "account_number" | "account_name"): React.ReactNode {
  if (isStripped(va, field)) return <span className="text-gray-05">••••</span>;
  return va[field] || "—";
}

export function VirtualAccountsTab({ entity }: { entity: string }) {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetVirtualAccountsQuery({ entity, page });
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<VirtualAccount>[] = [
    { header: "Customer", cell: (v) => v.customer_code ?? "—" },
    { header: "Bank", cell: (v) => v.bank_name || "—" },
    { header: "Account number", cell: (v) => masked(v, "account_number") },
    { header: "Account name", cell: (v) => masked(v, "account_name") },
    { header: "Provider", cell: (v) => <span className="capitalize">{v.provider}</span> },
    { header: "Status", cell: (v) => <StatusPill status={v.status} /> },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.PAY_CREATE_VIRTUAL_ACCOUNT}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New virtual account</Button>
        </Can>
      </div>
      <DataTable
        columns={columns} rows={rows} rowKey={(v) => v.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No virtual accounts" emptyMessage="Provision a dedicated account for a customer to collect funds."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage}
      />
      <CreateModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </>
  );
}

function CreateModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [customer, setCustomer] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [create, { isLoading }] = useCreateVirtualAccountMutation();

  const submit = async () => {
    try {
      const res = await create({ entity, customer: customer.trim(), bank_code: bankCode.trim() || undefined }).unwrap();
      toast.success(res.message || "Virtual account created.");
      setCustomer(""); setBankCode("");
      onClose();
    } catch { /* central */ }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mont text-base font-semibold">New virtual account</DialogTitle>
          <DialogDescription className="font-mont text-sm text-gray-05">Provisions a dedicated funding account for a customer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="block space-y-1"><span className="font-mont text-xs text-gray-05">Customer code or id (required)</span>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} className="bg-white" /></label>
          <label className="block space-y-1"><span className="font-mont text-xs text-gray-05">Bank code (optional)</span>
            <Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="bg-white" /></label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
          <Button disabled={isLoading || !customer.trim()} onClick={submit}>{isLoading ? "Creating…" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
