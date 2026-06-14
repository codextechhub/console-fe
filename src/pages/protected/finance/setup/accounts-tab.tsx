// Setup → Chart of accounts (read-only viewer).
import { useState } from "react";
import { DataTable, StatusPill, type Column } from "@/components/finance-ui";
import { useGetAccountsQuery } from "@/redux/services/finance/setup-api";
import type { Account } from "@/redux/services/finance/setup-types";

const selectCls = "h-10 rounded-md border bg-white px-3 font-mont text-sm focus:border-primary focus:outline-none";

export function AccountsTab({ entity }: { entity: string }) {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetAccountsQuery({ entity, page, ...(type ? { account_type: type } : {}) });
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<Account>[] = [
    { header: "Code", cell: (a) => <span className="font-semibold">{a.code}</span> },
    { header: "Name", cell: (a) => a.name },
    { header: "Type", cell: (a) => a.account_type },
    { header: "Normal", cell: (a) => a.normal_balance },
    { header: "Postable", cell: (a) => (a.is_postable ? "Yes" : "No") },
    { header: "Status", cell: (a) => <StatusPill status={a.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <>
      <div className="mb-4">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={selectCls} aria-label="Account type">
          <option value="">All types</option>
          {["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No accounts" emptyMessage="The chart of accounts will appear here."
        page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
    </>
  );
}
