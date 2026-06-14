// Procurement dashboard (§7.0) — the Procure-to-Pay pipeline at a glance: how
// many documents sit at each stage, plus vendor and unpaid-invoice counts.

import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { ProcurementShell } from "./procurement-shell";
import { KpiCard, useActiveEntity } from "@/components/finance-ui";
import { EmptyState } from "@/components/finance-ui/states";
import { useCan } from "@/components/finance-ui/can";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import {
  useGetVendorsQuery,
  useGetRequisitionsQuery,
  useGetPurchaseOrdersQuery,
  useGetGoodsReceiptsQuery,
  useGetVendorInvoicesQuery,
} from "@/redux/services/procurement/procurement-api";

const R = routesPath.PROTECTED.PROCUREMENT;

export default function ProcurementDashboard() {
  const navigate = useNavigate();
  const { code: entity } = useActiveEntity();
  const { can } = useCan();
  const skip = !entity;

  const vendors = useGetVendorsQuery({ entity: entity! }, { skip: skip || !can(P.PROC_VIEW_VENDORS) });
  const reqs = useGetRequisitionsQuery({ entity: entity! }, { skip: skip || !can(P.PROC_VIEW_REQUISITIONS) });
  const pos = useGetPurchaseOrdersQuery({ entity: entity! }, { skip: skip || !can(P.PROC_VIEW_PURCHASE_ORDERS) });
  const grns = useGetGoodsReceiptsQuery({ entity: entity! }, { skip: skip || !can(P.PROC_VIEW_GOODS_RECEIPTS) });
  const invoices = useGetVendorInvoicesQuery({ entity: entity!, payment_status: "UNPAID" }, { skip: skip || !can(P.PROC_VIEW_VENDOR_INVOICES) });

  const count = (q: { data?: { pagination: { totalItems: number } } }) => q.data?.pagination.totalItems ?? 0;

  const stages: { label: string; value: number; url: string }[] = [
    { label: "Requisitions", value: count(reqs), url: R.REQUISITIONS },
    { label: "Purchase Orders", value: count(pos), url: R.PURCHASE_ORDERS },
    { label: "Goods Receipts", value: count(grns), url: R.GOODS_RECEIPTS },
    { label: "Vendor Invoices", value: count(invoices), url: R.VENDOR_INVOICES },
    { label: "Vendor Payments", value: 0, url: R.VENDOR_PAYMENTS },
  ];

  return (
    <ProcurementShell>
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
        <div>
          <h1 className="font-mont text-lg font-semibold text-gray-01">Procurement Dashboard</h1>
          <p className="mt-0.5 font-mont text-xs text-gray-05">Spend pipeline for the selected entity.</p>
        </div>

        {!entity ? (
          <EmptyState title="Select an entity" message="Choose an entity to see procurement." />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Vendors" value={count(vendors)} />
              <KpiCard label="Open requisitions" value={count(reqs)} />
              <KpiCard label="Open purchase orders" value={count(pos)} />
              <KpiCard label="Unpaid invoices" value={count(invoices)} tone={count(invoices) > 0 ? "warn" : "default"} />
            </div>

            {/* P2P pipeline */}
            <div>
              <p className="mb-2 font-mont text-sm font-semibold text-gray-01">Procure-to-Pay pipeline</p>
              <div className="flex flex-wrap items-stretch gap-2">
                {stages.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <button onClick={() => navigate(s.url)} className="min-w-40 rounded-md bg-white px-4 py-3 text-left transition-colors hover:bg-primary/5">
                      <p className="font-mont text-xs text-gray-05">{s.label}</p>
                      <p className="mt-1 font-mont text-xl font-semibold text-black-01">{s.value}</p>
                    </button>
                    {i < stages.length - 1 && <ChevronRight className="size-5 shrink-0 text-gray-03" />}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </ProcurementShell>
  );
}
