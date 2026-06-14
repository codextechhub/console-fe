// Budgets, Assets & Tax → Budgets. List + create + approve action.
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable, StatusPill, ActionButton, FormModal, FormField, type Column } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetBudgetsQuery, useApproveBudgetMutation, useCreateBudgetMutation } from "@/redux/services/finance/ops-api";
import type { Budget } from "@/redux/services/finance/ops-types";

export function BudgetsTab({ entity }: { entity: string }) {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useGetBudgetsQuery({ entity, page });
  const [approve] = useApproveBudgetMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<Budget>[] = [
    { header: "Budget", cell: (b) => <span className="font-semibold">{b.name}</span> },
    { header: "Fiscal year", cell: (b) => b.fiscal_year },
    { header: "Lines", cell: (b) => b.lines.length },
    { header: "Status", cell: (b) => <StatusPill status={b.status} /> },
    {
      header: "", cell: (b) => (
        <div onClick={(e) => e.stopPropagation()}>
          {!b.is_locked && b.status !== "APPROVED" && (
            <ActionButton asLink label="Approve" permission={P.FIN_APPROVE_BUDGET} title="Approve budget?"
              description={`Locks ${b.name} for the fiscal year.`}
              onConfirm={async () => { const r = await approve({ id: b.id, entity }).unwrap(); toast.success(r.message || "Approved."); }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission={P.FIN_CREATE_BUDGET}>
          <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="size-4" /> New budget</Button>
        </Can>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(b) => b.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No budgets" emptyMessage="Budgets will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      <CreateBudgetModal open={creating} onClose={() => setCreating(false)} entity={entity} />
    </>
  );
}

function CreateBudgetModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity: string }) {
  const [name, setName] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [create, { isLoading }] = useCreateBudgetMutation();
  const submit = async () => {
    try {
      const res = await create({ entity, name: name.trim(), fiscal_year: fiscalYear ? Number(fiscalYear) : undefined }).unwrap();
      toast.success(res.message || "Budget created.");
      setName(""); setFiscalYear(""); onClose();
    } catch { /* central */ }
  };
  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New budget"
      description="Create a budget for a fiscal year; add lines after." onSubmit={submit} loading={isLoading} canSubmit={!!name.trim()}>
      <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
      <FormField label="Fiscal year"><Input type="number" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="2026" className="bg-white" /></FormField>
    </FormModal>
  );
}
