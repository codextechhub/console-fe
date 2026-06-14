// Budgets, Assets & Tax → Tax. Filings list + file + pay (VAT/PAYE/WHT).
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, Money, StatusPill, ActionButton, type Column } from "@/components/finance-ui";
import { P } from "@/permissions";
import { useGetTaxFilingsQuery, useFileTaxFilingMutation, usePayTaxFilingMutation } from "@/redux/services/finance/ops-api";
import type { TaxFiling } from "@/redux/services/finance/ops-types";

export function TaxTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetTaxFilingsQuery({ entity, page });
  const [file] = useFileTaxFilingMutation();
  const [pay] = usePayTaxFilingMutation();
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<TaxFiling>[] = [
    { header: "Filing", cell: (t) => <span className="font-semibold">{t.document_number}</span> },
    { header: "Obligation", cell: (t) => <span>{t.obligation_code}<span className="ml-1 text-gray-05">{t.obligation_type}</span></span> },
    { header: "Period", cell: (t) => `${t.period_start} → ${t.period_end}` },
    { header: "Due", align: "right", cell: (t) => <Money kobo={t.amount_due} currency={currency} align="right" /> },
    { header: "Balance", align: "right", cell: (t) => <Money kobo={t.balance_due} currency={currency} align="right" /> },
    { header: "Filing", cell: (t) => <StatusPill status={t.filing_status} /> },
    { header: "Payment", cell: (t) => <StatusPill status={t.payment_status} /> },
    {
      header: "", cell: (t) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {t.filing_status !== "FILED" && (
            <ActionButton asLink label="File" permission={P.FIN_FILE_TAX} title="File this return?"
              description={`Files ${t.document_number} with ${t.authority_name}.`}
              onConfirm={async () => { const r = await file({ id: t.id, entity }).unwrap(); toast.success(r.message || "Filed."); }} />
          )}
          {t.payment_status !== "PAID" && (
            <ActionButton asLink label="Pay" permission={P.FIN_PAY_TAX} title="Pay this filing?"
              description={`Pays the balance due on ${t.document_number}.`}
              onConfirm={async () => { const r = await pay({ id: t.id, entity }).unwrap(); toast.success(r.message || "Paid."); }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable columns={columns} rows={rows} rowKey={(t) => t.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No tax filings" emptyMessage="VAT/PAYE/WHT filings will appear here."
      page={pg?.currentPage} totalPages={pg?.totalPages} onPageChange={setPage} />
  );
}
