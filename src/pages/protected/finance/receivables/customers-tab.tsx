// Receivables → Customers / Payers. The AR sub-ledger party register (read).
import { useState } from "react";
import { DataTable, Money, StatusPill, toArray, type Column } from "@/components/finance-ui";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useGetCustomersQuery } from "@/redux/services/finance/ar-api";
import type { Customer } from "@/redux/services/finance/ar-types";

export function CustomersTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [search, setSearch] = useState("");
  // Debounce so we hit the list endpoint once the user pauses, not per keystroke.
  const debouncedSearch = useDebounce(search.trim(), 350);
  const { data, isLoading, isFetching, isError, refetch } = useGetCustomersQuery({ entity, search: debouncedSearch || undefined });
  const rows = toArray<Customer>(data?.data);

  const columns: Column<Customer>[] = [
    { header: "Code", cell: (c) => <span className="font-semibold">{c.code}</span> },
    { header: "Name", cell: (c) => c.name },
    { header: "Contact", cell: (c) => <span className="text-gray-05">{c.billing_email || c.billing_phone || "—"}</span> },
    { header: "Receivable a/c", cell: (c) => c.receivable_account_code ? <span>{c.receivable_account_code}<span className="ml-1 text-gray-05">{c.receivable_account_name}</span></span> : "—" },
    { header: "Opening balance", align: "right", cell: (c) => <Money kobo={c.opening_balance} currency={currency} align="right" /> },
    { header: "Status", cell: (c) => <StatusPill status={c.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div className="space-y-3">
      <Input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by code or name" className="max-w-xs font-mont text-sm" />
      <DataTable columns={columns} rows={rows} rowKey={(c) => c.id}
        loading={isLoading || isFetching} error={isError} onRetry={refetch}
        emptyTitle="No customers" emptyMessage="Customers / payers will appear here." />
    </div>
  );
}
