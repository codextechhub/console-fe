// API & Endpoints - per-route latency/volume/error signals from the request
// middleware, with slowest/most-erroring rankings and a per-route drawer.

import { useMemo, useState } from "react";
import { CustomInput } from "@/components/custom/custom-input";
import { Badge } from "@/components/ui/badge";
import {
  useGetHealthEndpointsQuery,
  type Endpoint,
} from "@/redux/services/health-api";
import { StatusCodeChart } from "./charts";
import { EndpointDrawer } from "./drawers";
import {
  Empty,
  HealthFrame,
  HealthTable,
  PageIntro,
  QueryState,
  StatusDot,
} from "./primitives";

function RankPanel({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: Endpoint[];
  metric: (row: Endpoint) => string;
}) {
  return (
    <section className="rounded-md bg-white p-5.5">
      <h2 className="font-mont font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={`${row.method}-${row.route}`} className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded bg-gray-50 text-xs font-semibold">
                {index + 1}
              </span>
              <p className="min-w-0 flex-1 truncate font-mono text-xs">
                {row.method} {row.route}
              </p>
              <span className="text-xs font-semibold text-gray-05">{metric(row)}</span>
            </div>
          ))
        ) : (
          <Empty text="No endpoint data" />
        )}
      </div>
    </section>
  );
}

export default function ApiPage() {
  const [range, setRange] = useState("1h");
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const query = useGetHealthEndpointsQuery({ range });
  const data = query.data?.data;

  // Client-side filter over the already-loaded inventory (no extra requests).
  const endpoints = useMemo(
    () =>
      data?.endpoints.filter((e) =>
        `${e.method} ${e.route}`.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [data, search],
  );

  const intro = (
    <PageIntro
      title="API & Endpoints"
      description="Latency, request volume, errors, and throttling by route."
      range={range}
      onRange={setRange}
      onRefresh={query.refetch}
      refreshing={query.isFetching}
    />
  );

  if (!data) {
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <RankPanel title="Slowest endpoints" rows={data.top_slowest} metric={(e) => `${e.p95} ms p95`} />
        <RankPanel title="Highest error rates" rows={data.top_errors} metric={(e) => `${e.error_rate}% errors`} />
      </div>

      <section className="rounded-md bg-white p-5.5">
        <h2 className="font-mont font-semibold">Status code traffic</h2>
        <StatusCodeChart data={data.status_code_series} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mont font-semibold">Endpoint inventory</h2>
          <p className="text-xs text-gray-01">Select a route for latency distribution and tenant impact</p>
        </div>
        <CustomInput
          id="endpoint-search"
          canSearch
          placeholder="Search route"
          className="h-10"
          containerClass="w-full sm:max-w-[280px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <HealthTable
        onRowClick={(index) => setSelectedRoute(endpoints[index].route)}
        headers={["Endpoint", "Requests", "RPM", "P50", "P95", "P99", "Errors", "Status"]}
        rows={endpoints.map((e) => [
          <span className="font-mono text-xs">
            <Badge variant="inactive" className="mr-2">
              {e.method}
            </Badge>
            {e.route}
          </span>,
          e.requests,
          e.rpm,
          `${e.p50} ms`,
          `${e.p95} ms`,
          `${e.p99} ms`,
          `${e.error_rate}%`,
          <StatusDot status={e.status} />,
        ])}
        emptyText="No routes match your search."
      />

      <EndpointDrawer route={selectedRoute} range={range} onClose={() => setSelectedRoute(null)} />
    </HealthFrame>
  );
}
