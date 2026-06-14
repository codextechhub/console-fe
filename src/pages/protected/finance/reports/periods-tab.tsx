// Reports → Periods. Fiscal periods with the month-end Close action (runs the
// checklist; supports soft close). Surfaces the checklist result on success.

import { useState } from "react";
import { toast } from "sonner";
import { DataTable, StatusPill, ActionButton, type Column } from "@/components/finance-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { P } from "@/permissions";
import { useGetPeriodsQuery, useClosePeriodMutation } from "@/redux/services/finance/setup-api";
import type { FiscalPeriod } from "@/redux/services/finance/setup-types";

export function PeriodsTab({ entity }: { entity: string }) {
  const { data, isLoading, isFetching, isError, refetch } = useGetPeriodsQuery({ entity });
  const [close] = useClosePeriodMutation();
  const [soft, setSoft] = useState(false);
  const rows = data?.data ?? [];

  const columns: Column<FiscalPeriod>[] = [
    { header: "Period", cell: (p) => <span className="font-semibold">{p.name}</span> },
    { header: "Fiscal year", cell: (p) => p.fiscal_year },
    { header: "Start", cell: (p) => p.start_date },
    { header: "End", cell: (p) => p.end_date },
    { header: "Status", cell: (p) => <StatusPill status={p.status} /> },
    {
      header: "", cell: (p) => (
        <div onClick={(e) => e.stopPropagation()}>
          {(p.status === "OPEN" || p.status === "SOFT_CLOSED") && (
            <ActionButton asLink label="Close" permission={P.FIN_CLOSE_PERIOD} title={`Close ${p.name}?`}
              description="Runs the month-end checklist (including depreciation) and closes the period."
              onConfirm={async () => { const r = await close({ id: p.id, entity, soft }).unwrap(); const ck = r.data?.checklist; toast.success(ck?.passed ? `Closed ${p.name}.` : `Closed ${p.name} (with checklist warnings).`); }}>
              <label className="flex items-center gap-2 font-mont text-sm text-gray-01">
                <Checkbox checked={soft} onCheckedChange={(v) => setSoft(!!v)} /> Soft close (reversible)
              </label>
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable columns={columns} rows={rows} rowKey={(p) => p.id}
      loading={isLoading || isFetching} error={isError} onRetry={refetch}
      emptyTitle="No periods" emptyMessage="Fiscal periods will appear here." />
  );
}
