// Sourcing (§7.3) — RFQs and vendor quotations. Award a quotation to spawn a PO.
import { useState } from "react";
import { toast } from "sonner";
import { ProcurementShell } from "./procurement-shell";
import { DataTable, Money, StatusPill, TabBar, ActionButton, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import {
  useGetRfqsQuery, useIssueRfqMutation,
  useGetQuotationsQuery, useSubmitQuotationMutation, useAwardQuotationMutation,
} from "@/redux/services/procurement/procurement-ext-api";
import type { Quotation, Rfq } from "@/redux/services/procurement/procurement-types";

function RfqTab({ entity }: { entity: string }) {
  const { data, isLoading, isError, refetch } = useGetRfqsQuery({ entity });
  const [issue] = useIssueRfqMutation();
  const columns: Column<Rfq>[] = [
    { header: "RFQ", cell: (r) => <span className="font-semibold">{r.document_number}</span> },
    { header: "Title", cell: (r) => r.title },
    { header: "Issued", cell: (r) => r.issue_date ?? "—" },
    { header: "Due", cell: (r) => r.response_due_date ?? "—" },
    { header: "Status", cell: (r) => <StatusPill status={r.rfq_status} /> },
    {
      header: "", cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          {r.rfq_status === "DRAFT" && (
            <ActionButton asLink label="Issue" permission={P.PROC_ISSUE_RFQ} title="Issue RFQ?"
              description={`Sends ${r.document_number} to vendors for quotation.`}
              onConfirm={async () => { const res = await issue({ id: r.id, entity }).unwrap(); toast.success(res.message || "Issued."); }} />
          )}
        </div>
      ),
    },
  ];
  return <DataTable columns={columns} rows={data?.data ?? []} rowKey={(r) => r.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No RFQs" />;
}

function QuotationsTab({ entity, currency }: { entity: string; currency?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetQuotationsQuery({ entity });
  const [submit] = useSubmitQuotationMutation();
  const [award] = useAwardQuotationMutation();
  const columns: Column<Quotation>[] = [
    { header: "Quotation", cell: (q) => <span className="font-semibold">{q.document_number}</span> },
    { header: "Vendor", cell: (q) => q.vendor_code },
    { header: "RFQ", cell: (q) => q.rfq_number },
    { header: "Total", align: "right", cell: (q) => <Money kobo={q.total} currency={currency} align="right" /> },
    { header: "Status", cell: (q) => <StatusPill status={q.quotation_status} /> },
    {
      header: "", cell: (q) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {q.quotation_status === "DRAFT" && (
            <ActionButton asLink label="Submit" permission={P.PROC_SUBMIT_QUOTATION} title="Submit quotation?"
              description={`Records ${q.document_number} as received.`}
              onConfirm={async () => { const res = await submit({ id: q.id, entity }).unwrap(); toast.success(res.message || "Submitted."); }} />
          )}
          {q.quotation_status === "SUBMITTED" && !q.awarded_po_id && (
            <ActionButton asLink label="Award" permission={P.PROC_AWARD_QUOTATION} title="Award quotation?"
              description={`Awards ${q.document_number} and spawns a purchase order.`}
              onConfirm={async () => { const res = await award({ id: q.id, entity }).unwrap(); toast.success(res.message || "Awarded."); }} />
          )}
        </div>
      ),
    },
  ];
  return <DataTable columns={columns} rows={data?.data ?? []} rowKey={(q) => q.id} loading={isLoading} error={isError} onRetry={refetch} emptyTitle="No quotations" />;
}

export default function SourcingPage() {
  const { code: entity, currency } = useActiveEntity();
  const { can } = useCan();
  const tabs = [
    can(P.PROC_VIEW_RFQS) && { key: "rfqs", label: "RFQs" },
    can(P.PROC_VIEW_QUOTATIONS) && { key: "quotations", label: "Quotations" },
  ].filter(Boolean) as { key: string; label: string }[];
  const [active, setActive] = useState(tabs[0]?.key ?? "rfqs");

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Sourcing</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">RFQs and vendor quotations. Awarding a quotation spawns a PO.</p>
        </div>
        {!entity ? <EmptyState title="Select an entity" /> : tabs.length === 0 ? <EmptyState title="No access" /> : (
          <>
            <TabBar tabs={tabs} active={active} onChange={setActive} />
            {active === "rfqs" && <RfqTab entity={entity} />}
            {active === "quotations" && <QuotationsTab entity={entity} currency={currency} />}
          </>
        )}
      </main>
    </ProcurementShell>
  );
}
