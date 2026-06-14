// Finance audit trail (§6.9) — the immutable log of finance actions for the
// selected entity (who did what, to which document, and the outcome).

import { useState } from "react";
import { FinanceShell } from "./finance-shell";
import { DataTable, StatusPill, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useGetAuditLogQuery } from "@/redux/services/finance/setup-api";
import type { FinanceAuditLog } from "@/redux/services/finance/setup-types";

export default function FinanceAuditPage() {
  const { code: entity } = useActiveEntity();
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetAuditLogQuery({ entity: entity!, page }, { skip: !entity });
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<FinanceAuditLog>[] = [
    { header: "When", cell: (l) => new Date(l.created_at).toLocaleString("en-GB") },
    { header: "Action", cell: (l) => <span className="font-semibold">{l.action}</span> },
    { header: "Status", cell: (l) => <StatusPill status={l.status} /> },
    { header: "Actor", cell: (l) => l.actor ?? "System" },
    { header: "Target", cell: (l) => l.document_number || `${l.target_type}${l.target_id ? ` #${l.target_id}` : ""}` || "—" },
    { header: "Message", cell: (l) => <span className="block max-w-md truncate text-gray-01">{l.message || "—"}</span> },
  ];

  if (!entity) return <FinanceShell><main className="px-4.5 py-6"><EmptyState title="Select an entity" /></main></FinanceShell>;

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Audit Trail</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Finance actions recorded for this entity.</p>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(l) => l.id}
          loading={isLoading || isFetching} error={isError} onRetry={refetch}
          emptyTitle="No audit entries" emptyMessage="Finance actions will be logged here."
          page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
      </main>
    </FinanceShell>
  );
}
