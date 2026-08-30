// Recharts wrappers for the Health screens: a single-series area trend and
// the stacked 2xx/3xx/4xx/5xx status-code chart.

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/redux/services/health-api";

const ISO = /^\d{4}-\d{2}-\d{2}T/;

function useTimeTicks(timestamps: string[]) {
  const spansDays =
    timestamps.length > 1 &&
    new Date(timestamps[timestamps.length - 1]).getTime() - new Date(timestamps[0]).getTime() >
      36 * 60 * 60 * 1000;
  const tick = (value: string) => {
    if (!ISO.test(value)) return value;
    const date = new Date(value);
    return spansDays
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };
  return tick;
}

const tooltipLabel = (value: React.ReactNode) => {
  const raw = String(value ?? "");
  if (!ISO.test(raw)) return raw;
  return new Date(raw).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function TrendChart({
  data,
  dataKey = "requests",
  color = "#7557D3",
}: {
  data: SeriesPoint[];
  dataKey?: keyof SeriesPoint;
  color?: string;
}) {
  const tick = useTimeTicks(data.map((point) => point.t).filter((value) => ISO.test(value)));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ bottom: 8 }}>
          <defs>
            <linearGradient id={`health-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAF1" />
          <XAxis
            dataKey="t"
            tickFormatter={tick}
            interval="preserveStartEnd"
            minTickGap={34}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#74778e" }}
            height={34}
          />
          <YAxis tickLine={false} axisLine={false} width={42} fontSize={11} />
          <Tooltip labelFormatter={tooltipLabel} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#health-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_SERIES = [
  { key: "status_2xx", name: "2xx Success", color: "#16A36A" },
  { key: "status_3xx", name: "3xx Redirect", color: "#3B82F6" },
  { key: "status_4xx", name: "4xx Client error", color: "#D99018" },
  { key: "status_5xx", name: "5xx Server error", color: "#DC3F4F" },
] as const;

export function StatusCodeChart({ data }: { data: SeriesPoint[] }) {
  const tick = useTimeTicks(data.map((point) => point.t));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ bottom: 8 }}>
          <defs>
            {STATUS_SERIES.map((series) => (
              <linearGradient key={series.key} id={series.key} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={series.color} stopOpacity={0.24} />
                <stop offset="95%" stopColor={series.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAF1" />
          <XAxis
            dataKey="t"
            tickFormatter={tick}
            interval="preserveStartEnd"
            minTickGap={34}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#74778e" }}
            height={34}
          />
          <YAxis tickLine={false} axisLine={false} width={42} fontSize={11} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="min-w-32 rounded-lg border border-white-02 bg-white px-3.5 py-3 shadow-lg">
                  <p className="border-b border-white-02 pb-2 text-[11px] font-medium text-gray-01">
                    {new Date(String(label)).toLocaleString()}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                    {payload.map((entry) => (
                      <div key={String(entry.dataKey)} className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="font-mono text-sm font-semibold text-black-01">
                          {Number(entry.value ?? 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            }
          />
          <Legend iconType="circle" iconSize={8} />
          {STATUS_SERIES.map((series) => (
            <Area
              key={series.key}
              name={series.name}
              type="monotone"
              dataKey={series.key}
              stroke={series.color}
              strokeWidth={2}
              fill={`url(#${series.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
