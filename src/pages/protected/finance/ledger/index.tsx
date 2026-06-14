// General Ledger (§6.2) — READ-ONLY journals list with filters, a detail drawer
// (Dr/Cr lines), the Reverse action, and Direct Entry (the only raw-lines post).
// There is deliberately no "create journal" form.

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { FinanceShell } from "../finance-shell";
import { DataTable, StatusPill, useActiveEntity, type Column } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { P } from "@/permissions";
import { useGetJournalsQuery } from "@/redux/services/finance/gl-api";
import type { JournalListItem, JournalSource, JournalStatus } from "@/redux/services/finance/gl-types";
import { DirectEntryModal } from "./direct-entry-modal";
import { JournalDetailDrawer } from "./journal-detail-drawer";

const selectCls =
  "h-10 rounded-md border bg-white px-3 font-mont text-sm text-black-01 focus:border-primary focus:outline-none";

const STATUSES: JournalStatus[] = ["DRAFT", "POSTED", "REVERSED", "CANCELLED"];
const SOURCES: JournalSource[] = ["MANUAL", "SALES", "PURCHASE", "BANK", "PAYROLL", "CLOSING", "OPENING", "FX", "SYSTEM"];

export default function GeneralLedgerPage() {
  const { code: entity, currency } = useActiveEntity();
  const [status, setStatus] = useState<JournalStatus | "">("");
  const [source, setSource] = useState<JournalSource | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [directOpen, setDirectOpen] = useState(false);

  const params = useMemo(
    () => ({
      entity: entity!,
      page,
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    }),
    [entity, page, status, source, dateFrom, dateTo],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetJournalsQuery(params, { skip: !entity });
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const columns: Column<JournalListItem>[] = [
    { header: "Document", cell: (j) => <span className="font-semibold">{j.document_number}</span> },
    { header: "Date", cell: (j) => j.date },
    { header: "Period", cell: (j) => j.period ?? "—" },
    { header: "Source", cell: (j) => j.source },
    { header: "Narration", cell: (j) => <span className="block max-w-xs truncate text-gray-01">{j.narration || "—"}</span> },
    { header: "Status", cell: (j) => <StatusPill status={j.status} /> },
  ];

  if (!entity) {
    return (
      <FinanceShell>
        <main className="px-4.5 py-6"><EmptyState title="Select an entity" message="Choose a ledger entity to view its journals." /></main>
      </FinanceShell>
    );
  }

  return (
    <FinanceShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mont text-lg font-semibold text-gray-01">General Ledger</h1>
            <p className="mt-0.5 font-mont text-xs text-gray-05">Posted journals are read-only. Use Direct Entry for opening balances and adjustments.</p>
          </div>
          <Can permission={P.FIN_POST_DIRECT_ENTRY}>
            <Button onClick={() => setDirectOpen(true)} className="gap-1.5">
              <Plus className="size-4" /> Direct Entry
            </Button>
          </Can>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => { setStatus(e.target.value as JournalStatus | ""); setPage(1); }} className={selectCls} aria-label="Status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
          <select value={source} onChange={(e) => { setSource(e.target.value as JournalSource | ""); setPage(1); }} className={selectCls} aria-label="Source">
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} aria-label="From" className="h-10 w-40 bg-white" />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} aria-label="To" className="h-10 w-40 bg-white" />
          {(status || source || dateFrom || dateTo) && (
            <button onClick={() => { setStatus(""); setSource(""); setDateFrom(""); setDateTo(""); setPage(1); }} className="font-mont text-xs font-semibold text-gray-05 hover:text-primary">
              Clear
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(j) => j.id}
          loading={isLoading || isFetching}
          error={isError}
          onRetry={refetch}
          onRowClick={(j) => setSelected(j.id)}
          emptyTitle="No journals"
          emptyMessage="No journal entries match these filters."
          page={pg?.currentPage}
          totalPages={pg?.totalPages}
          onPageChange={setPage}
        />
      </main>

      <DirectEntryModal open={directOpen} onClose={() => setDirectOpen(false)} entity={entity} currency={currency} />
      <JournalDetailDrawer journalId={selected} entity={entity} currency={currency} onClose={() => setSelected(null)} />
    </FinanceShell>
  );
}
