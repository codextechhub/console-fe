// Budgets, Assets & Tax → Budgets. List + approve action.
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, StatusPill, ActionButton, type Column } from "@/components/finance-ui";
import { P } from "@/permissions";
import { useGetBudgetsQuery, useApproveBudgetMutation } from "@/redux/services/finance/ops-api";
import type { Budget } from "@/redux/services/finance/ops-types";

export function BudgetsTab({ entity }: { entity: string }) {
  const [page, setPage] = useState(1);
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
    <DataTable columns={columns} rows={rows} rowKey={(b) => b.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No budgets" emptyMessage="Budgets will appear here."
      page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
  );
}
