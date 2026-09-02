// Setup -> Entities, second section: the platform's roll-call of who has books.
//
// The table above it is the caller's OWN entities, read from
// /finance/entities/, which is scoped to the asserted tenant. This one is the
// operator's view: every tenant on the platform and whether its books exist.
//
// It lives in the console rather than in @xvs/finance because the gate is
// host-bound. `platform.schools.view` is code 100101 here, and 100101 in the
// school app is `school.dashboard.view` - a package that hard-coded the number
// would gate correctly in one product and on an unrelated permission in the
// other. The package asks the host for this section instead
// (HostContract.PlatformLedgerInventory), and a single-tenant product supplies
// one that renders nothing.
//
// What it deliberately does NOT show: any figure. A balance here would put
// every tenant's money on one screen, bypassing the proxy session that makes
// reading a school's numbers attributable to somebody entitled to them.

import { useMemo, useState } from "react";
import { Building2, TriangleAlert } from "lucide-react";
import { DataTable, StatusPill, type Column } from "@/components/finance-ui";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { useGetFinanceInventoryQuery } from "@/redux/services/dashboard/finance-inventory-api";
import type { FinanceInventoryRow } from "@/redux/services/dashboard/finance-inventory-types";

type Filter = "all" | "unprovisioned";

export function PlatformLedgerInventory() {
  return (
    <PermissionGate permission={P.BROWSE_SCHOOLS}>
      <InventorySection />
    </PermissionGate>
  );
}

function InventorySection() {
  const { data, isLoading, isFetching, isError, refetch } = useGetFinanceInventoryQuery();
  const [filter, setFilter] = useState<Filter>("all");

  const all = useMemo<FinanceInventoryRow[]>(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data],
  );
  const withoutBooks = all.filter((row) => !row.has_books);
  const rows = filter === "unprovisioned" ? withoutBooks : all;

  const columns: Column<FinanceInventoryRow>[] = [
    {
      header: "Tenant",
      cell: (row) => (
        <div className="min-w-0">
          <div className="truncate font-mont font-semibold text-black-01">{row.tenant.name}</div>
          <div className="truncate font-mont text-xs text-gray-05">{row.tenant.slug}</div>
        </div>
      ),
    },
    {
      header: "Books",
      cell: (row) =>
        row.has_books ? (
          <div className="flex flex-wrap gap-1">
            {row.entities.map((entity) => (
              <span
                key={entity.id}
                title={entity.name}
                className={
                  "inline-flex items-center gap-1 rounded-md border border-white-02 px-1.5 py-0.5 " +
                  "font-mont text-xs font-semibold " +
                  (entity.is_active ? "text-black-01" : "text-gray-05 line-through")
                }
              >
                {entity.code}
              </span>
            ))}
          </div>
        ) : (
          // Not an empty cell: an empty cell reads as "we did not look".
          <span className="inline-flex items-center gap-1 font-mont text-xs font-medium text-amber-700">
            <TriangleAlert className="size-3.5" /> Not provisioned
          </span>
        ),
    },
    {
      header: "Reporting currency",
      cell: (row) => (
        <span className="font-mont text-xs text-gray-05">
          {[...new Set(row.entities.map((e) => e.base_currency).filter(Boolean))].join(", ") || "-"}
        </span>
      ),
    },
    { header: "Tenant status", cell: (row) => <StatusPill status={row.tenant.status} /> },
  ];

  return (
    <section className="space-y-3 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-white-02 pt-4">
        <div>
          <h2 className="flex items-center gap-1.5 font-mont text-sm font-semibold text-black-01">
            <Building2 className="size-4" /> Across the platform
          </h2>
          <p className="mt-0.5 font-mont text-xs text-gray-05">
            Which tenants have books, and whether they are usable. No figures:
            a tenant&rsquo;s numbers are read on that tenant&rsquo;s own screens.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white-02 p-0.5">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            All {all.length > 0 && <Count>{all.length}</Count>}
          </FilterTab>
          <FilterTab
            active={filter === "unprovisioned"}
            onClick={() => setFilter("unprovisioned")}
          >
            Without books {withoutBooks.length > 0 && <Count>{withoutBooks.length}</Count>}
          </FilterTab>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.tenant.id}
        loading={isLoading || isFetching}
        error={isError}
        onRetry={refetch}
        emptyTitle={filter === "unprovisioned" ? "Every tenant has books" : "No tenants"}
        emptyMessage={
          filter === "unprovisioned"
            ? "Nobody on the platform is waiting to be provisioned."
            : "There is nothing on the platform yet."
        }
      />
    </section>
  );
}

function FilterTab({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mont text-xs font-semibold " +
        (active ? "bg-primary text-white" : "text-gray-05 hover:bg-gray-02")
      }
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="font-mont text-[10px] font-bold opacity-70">{children}</span>;
}
