// Receivables → Dunning. Automated overdue-reminder notices (read).
import { useState } from "react";
import { DataTable, Money, StatusPill, toArray, type Column } from "@/components/finance-ui";
import { useGetDunningNoticesQuery } from "@/redux/services/finance/ar-api";
import type { DunningNotice } from "@/redux/services/finance/ar-types";

export function DunningTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetDunningNoticesQuery({ entity, page });
  const rows = toArray<DunningNotice>(data?.data);
  const pg = data?.pagination;

  const columns: Column<DunningNotice>[] = [
    { header: "Notice", cell: (d) => <span className="font-semibold">{d.document_number}</span> },
    { header: "Customer", cell: (d) => <span>{d.customer_name}<span className="ml-1 text-gray-05">{d.customer_code}</span></span> },
    { header: "Invoice", cell: (d) => d.invoice_number },
    { header: "Level", align: "right", cell: (d) => d.level },
    { header: "Days overdue", align: "right", cell: (d) => d.days_overdue },
    { header: "Amount due", align: "right", cell: (d) => <Money kobo={d.amount_due} currency={currency} align="right" /> },
    { header: "Channel", cell: (d) => d.channel },
    { header: "Status", cell: (d) => <StatusPill status={d.notice_status} /> },
  ];

  return (
    <DataTable columns={columns} rows={rows} rowKey={(d) => d.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No dunning notices" emptyMessage="Overdue-reminder notices will appear here."
      page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
  );
}
