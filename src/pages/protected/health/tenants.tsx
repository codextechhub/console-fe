// Tenant Health — per-school demand, latency, and error signals derived from
// the tenant-attributed request metrics, with a per-tenant drill-in drawer.

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { CustomInput } from "@/components/custom/custom-input";
import { Badge } from "@/components/ui/badge";
import { useGetTenantHealthQuery } from "@/redux/services/health-api";
import { TenantDrawer } from "./drawers";
import {
  HealthFrame,
  HealthKpi,
  HealthTable,
  PageIntro,
  QueryState,
  StatusDot,
} from "./primitives";

export default function TenantsPage() {
  const [range, setRange] = useState("1h");
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<{ id: number; name: string } | null>(null);
  const query = useGetTenantHealthQuery({ range });
  const all = query.data?.data.tenants;

  // Client-side filter over the already-loaded list (no extra requests).
  const tenants = useMemo(
    () => all?.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())) ?? [],
    [all, search],
  );

  const intro = (
    <PageIntro
      title="Tenant Health"
      description="Compare tenant-level demand, latency, and error signals."
      range={range}
      onRange={setRange}
      onRefresh={query.refetch}
      refreshing={query.isFetching}
    />
  );

  if (!all) {
    return (
      <HealthFrame>
        {intro}
        <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch} />
      </HealthFrame>
    );
  }

  return (
    <HealthFrame>
      {intro}

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <HealthKpi label="Observed tenants" value={all.length} />
        <HealthKpi label="Healthy" value={all.filter((t) => t.status === "healthy").length} />
        <HealthKpi
          label="Needs attention"
          value={all.filter((t) => t.status !== "healthy").length}
          status={all.some((t) => t.status !== "healthy") ? "warning" : "healthy"}
        />
        <HealthKpi label="High-volume tenants" value={all.filter((t) => t.noisy).length} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont font-semibold">Tenant signals</h2>
          <p className="text-xs text-gray-01">Select a tenant for scoped traffic and endpoint details</p>
        </div>
        <CustomInput
          id="tenant-search"
          canSearch
          placeholder="Find tenant"
          className="h-10"
          containerClass="w-full sm:max-w-[280px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <HealthTable
        onRowClick={(index) =>
          setSelectedTenant({ id: tenants[index].tenant_id, name: tenants[index].name })
        }
        headers={["Tenant", "Status", "Requests", "RPM", "P95 latency", "Error rate", "Volume"]}
        rows={tenants.map((t) => [
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-pry-01 text-primary">
              <Users className="size-4" />
            </span>
            <span className="font-medium">{t.name}</span>
          </div>,
          <StatusDot status={t.status} />,
          t.requests,
          t.rpm,
          `${t.p95} ms`,
          `${t.error_rate}%`,
          t.noisy ? (
            <Badge variant="suspended" className="font-mont text-xs">
              High volume
            </Badge>
          ) : (
            <span className="text-xs text-gray-01">Normal</span>
          ),
        ])}
        emptyText="No tenant-attributed traffic in this window yet."
      />

      <TenantDrawer tenant={selectedTenant} range={range} onClose={() => setSelectedTenant(null)} />
    </HealthFrame>
  );
}
