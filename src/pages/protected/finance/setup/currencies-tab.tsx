// Setup → Currencies & FX. Reference data: the currency list and FX rates.
import { DataTable, StatusPill, toArray, type Column } from "@/components/finance-ui";
import { useGetCurrenciesQuery, useGetFxRatesQuery } from "@/redux/services/finance/setup-api";
import type { Currency, FxRate } from "@/redux/services/finance/setup-types";

export function CurrenciesTab() {
  const cur = useGetCurrenciesQuery();
  const fx = useGetFxRatesQuery();

  const currencyCols: Column<Currency>[] = [
    { header: "Code", cell: (c) => <span className="font-semibold">{c.code}</span> },
    { header: "Name", cell: (c) => c.name },
    { header: "Symbol", cell: (c) => c.symbol || "—" },
    { header: "Minor unit", align: "right", cell: (c) => c.minor_unit },
    { header: "Status", cell: (c) => <StatusPill status={c.is_active ? "ACTIVE" : "INACTIVE"} /> },
  ];
  const fxCols: Column<FxRate>[] = [
    { header: "Base", cell: (r) => <span className="font-semibold">{r.base}</span> },
    { header: "Quote", cell: (r) => r.quote },
    { header: "Rate", align: "right", cell: (r) => r.rate },
    { header: "As of", cell: (r) => r.as_of },
    { header: "Source", cell: (r) => r.source || "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 font-mont text-sm font-semibold text-gray-01">Currencies</p>
        <DataTable columns={currencyCols} rows={toArray(cur.data?.data)} rowKey={(c) => c.code}
          loading={cur.isLoading} error={cur.isError} onRetry={cur.refetch} emptyTitle="No currencies" />
      </div>
      <div>
        <p className="mb-2 font-mont text-sm font-semibold text-gray-01">FX rates</p>
        <DataTable columns={fxCols} rows={toArray(fx.data?.data)} rowKey={(r) => r.id}
          loading={fx.isLoading} error={fx.isError} onRetry={fx.refetch}
          emptyTitle="No FX rates" emptyMessage="Exchange rates will appear here." />
      </div>
    </div>
  );
}
