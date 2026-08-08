// SLOs - objective attainment computed from real uptime/request data against
// the configured targets, with error-budget context per service.

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetSlosQuery, type Slo } from "@/redux/services/health-api";
import { SloDrawer } from "./drawers";
import { HealthFrame, HealthKpi, PageIntro, QueryState } from "./primitives";

export default function SlosPage() {
  const query = useGetSlosQuery();
  const [selectedSlo, setSelectedSlo] = useState<Slo | null>(null);
  const slos = query.data?.data.slos;

  const intro = (
    <PageIntro
      title="Service Level Objectives"
      description="Reliability attainment and remaining error budgets per service."
      onRefresh={query.refetch}
      refreshing={query.isFetching}
    />
  );

  if (!slos) {
    return (
      <HealthFrame>
        {intro}
        <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch} />
      </HealthFrame>
    );
  }

  const healthy = slos.filter((s) => !s.breached).length;
  const averageBudget = (
    slos.reduce((sum, s) => sum + s.error_budget_remaining, 0) / Math.max(slos.length, 1)
  ).toFixed(1);

  return (
    <HealthFrame>
      {intro}

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <HealthKpi label="Objectives" value={slos.length} />
        <HealthKpi label="Meeting target" value={healthy} />
        <HealthKpi
          label="Breached"
          value={slos.length - healthy}
          status={healthy === slos.length ? "healthy" : "critical"}
        />
        <HealthKpi label="Average budget" value={averageBudget} unit="%" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {slos.map((s) => (
          <button
            type="button"
            onClick={() => setSelectedSlo(s)}
            key={s.service_key}
            className="rounded-md bg-white p-5.5 text-left transition-colors hover:bg-pry-01/40"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-md bg-pry-01 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <Badge variant={s.breached ? "rejected" : "active"}>
                {s.breached ? "Breached" : "On target"}
              </Badge>
            </div>
            <h2 className="mt-5 font-mont font-semibold">{s.service}</h2>
            <p className="mt-1 text-xs text-gray-01">{s.window_days}-day availability objective</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-xs text-gray-01">Current</p>
                <p className="mt-1 text-xl font-semibold">{s.current}%</p>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-xs text-gray-01">Target</p>
                <p className="mt-1 text-xl font-semibold">{s.target}%</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-01">Error budget remaining</span>
                <span className="font-semibold">{s.error_budget_remaining}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    s.error_budget_remaining < 20
                      ? "bg-red-500"
                      : s.error_budget_remaining < 50
                        ? "bg-amber-500"
                        : "bg-primary",
                  )}
                  style={{ width: `${Math.min(100, s.error_budget_remaining)}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      <SloDrawer slo={selectedSlo} onClose={() => setSelectedSlo(null)} />
    </HealthFrame>
  );
}
