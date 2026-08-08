import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const SEVERITY_COLORS = {
  INFO: "#3b82f6",
  WARNING: "#f59e0b",
  CRITICAL: "#dc2626",
} as const;

export const MODULE_COLORS: Record<string, string> = {
  ONBOARDING: "#8b5cf6",
  IDENTITY: "#06b6d4",
  USER: "#0ea5e9",
  RBAC: "#ec4899",
  IMPORT: "#84cc16",
  CONFIG: "#6366f1",
  FINANCE: "#16a34a",
  PROCUREMENT: "#f59e0b",
  SCHOOL: "#14b8a6",
  BRANCH: "#0d9488",
  SYSTEM: "#71717a",
};

type SeverityPoint = { date: string; INFO: number; WARNING: number; CRITICAL: number };

export function SeverityStackedBar({ data, height = 220 }: { data: SeverityPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip wrapperClassName="text-xs" />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="INFO" stackId="a" fill={SEVERITY_COLORS.INFO} />
        <Bar dataKey="WARNING" stackId="a" fill={SEVERITY_COLORS.WARNING} />
        <Bar dataKey="CRITICAL" stackId="a" fill={SEVERITY_COLORS.CRITICAL} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type ModulePoint = { module_key: string; count: number };

export function ModuleDonut({ data, height = 220 }: { data: ModulePoint[]; height?: number }) {
  const total = data.reduce((s, x) => s + x.count, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="module_key"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
        >
          {data.map((entry, idx) => (
            <Cell key={idx} fill={MODULE_COLORS[entry.module_key] ?? "#a1a1aa"} />
          ))}
          <LabelList dataKey="count" position="outside" style={{ fontSize: 10 }} />
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const v = typeof value === "number" ? value : Number(value ?? 0);
            return [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, String(name ?? "")];
          }}
          wrapperClassName="text-xs"
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

type SigninPoint = { date: string; SUCCESS: number; FAIL: number };

export function SigninDualLine({ data, height = 220 }: { data: SigninPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip wrapperClassName="text-xs" />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="SUCCESS" stroke="#16a34a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="FAIL" stroke="#dc2626" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CriticalHeatmap({ data }: { data: number[][] }) {
  // Compute max for intensity scale.
  let max = 0;
  for (const row of data) for (const v of row) if (v > max) max = v;
  const intensity = (v: number) => (max === 0 ? 0 : Math.min(1, v / max));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-[2px] text-[10px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white" />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="text-gray-400 font-normal text-center w-6">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx}>
              <td className="text-gray-500 pr-2 text-right whitespace-nowrap">
                {DAY_LABELS[rIdx]}
              </td>
              {row.map((v, hIdx) => {
                const alpha = intensity(v);
                return (
                  <td
                    key={hIdx}
                    title={`${DAY_LABELS[rIdx]} ${hIdx}:00 - ${v} critical event${v === 1 ? "" : "s"}`}
                    style={{
                      backgroundColor: alpha === 0 ? "#f1f5f9" : `rgba(220, 38, 38, ${0.15 + alpha * 0.75})`,
                    }}
                    className="rounded-[2px] h-5 text-center text-white font-medium"
                  >
                    {v > 0 ? v : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
