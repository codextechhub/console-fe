import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RADIAN = Math.PI / 180;

export type DowntimeSlice = {
  name: string;
  value: number;
  date: string;
  color: string;
};

interface SliceShapeProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  percent?: number;
  payload?: DowntimeSlice;
}

/**
 * Slice renderer (recharts `shape`). The hovered slice - matched by name
 * against the controlled `activeName` - is pushed outward along its mid-angle
 * via a CSS transform (so the pull-out animates smoothly), given an outer
 * accent ring and an extra "% of downtime" line. The transform is applied to
 * the whole group so the sector + its label move together.
 */
function renderSlice(activeName: string | null) {
  return function Slice(props: SliceShapeProps) {
    const cx = Number(props.cx ?? 0);
    const cy = Number(props.cy ?? 0);
    const midAngle = Number(props.midAngle ?? 0);
    const innerRadius = Number(props.innerRadius ?? 0);
    const outerRadius = Number(props.outerRadius ?? 0);
    const startAngle = Number(props.startAngle ?? 0);
    const endAngle = Number(props.endAngle ?? 0);
    const entry = props.payload;
    if (!entry) return <g />;

    const active = entry.name === activeName;
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);
    const pull = 16; // px the hovered slice slides outward

    const lr = innerRadius + (outerRadius - innerRadius) * 0.55;
    const lx = cx + cos * lr;
    const ly = cy + sin * lr;
    const nameLines = entry.name.split("\n");
    const pct = Math.round((props.percent ?? 0) * 100);

    return (
      <g
        style={{
          transform: active
            ? `translate(${cos * pull}px, ${sin * pull}px)`
            : "translate(0px, 0px)",
          transition: "transform 0.25s ease",
        }}
      >
        {active && (
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={outerRadius + 3}
            outerRadius={outerRadius + 8}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={entry.color}
            opacity={0.4}
          />
        )}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={entry.color}
          stroke="#ffffff"
          strokeWidth={2}
        />
        <text x={lx} y={ly} fill="#ffffff" textAnchor="middle" dominantBaseline="central">
          <tspan x={lx} dy="-0.9em" fontSize={active ? 22 : 20} fontWeight={700}>
            {entry.value}
          </tspan>
          {nameLines.map((line, i) => (
            <tspan key={line} x={lx} dy={i === 0 ? "1.55em" : "1.2em"} fontSize="9.5">
              {line}
            </tspan>
          ))}
          <tspan x={lx} dy="1.2em" fontSize="9.5">
            {entry.date}
          </tspan>
          {active && (
            <tspan x={lx} dy="1.5em" fontSize="10.5" fontWeight={600}>
              {pct}% of downtime
            </tspan>
          )}
        </text>
      </g>
    );
  };
}

function DowntimeTooltip({
  active,
  payload,
  total = 0,
}: {
  active?: boolean;
  payload?: Array<{ payload: DowntimeSlice }>;
  total?: number;
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  const pct = total ? Math.round((slice.value / total) * 100) : 0;
  return (
    <div className="rounded-md border border-white-02 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-red-500">{pct}% of downtime</p>
    </div>
  );
}

export function DowntimesPie({
  data,
  height = 300,
}: {
  data: DowntimeSlice[];
  height?: number;
}) {
  const [activeName, setActiveName] = useState<string | null>(null);
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="80%"
          startAngle={90}
          endAngle={-270}
          paddingAngle={1}
          isAnimationActive
          animationDuration={600}
          shape={renderSlice(activeName)}
          onMouseEnter={(d: { name?: string; payload?: { name?: string } }) =>
            setActiveName(d?.name ?? d?.payload?.name ?? null)
          }
          onMouseLeave={() => setActiveName(null)}
        />
        <Tooltip content={<DowntimeTooltip total={total} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export type ActivityPoint = { label: string; value: number };

export function ActivityBar({
  data,
  height = 330,
}: {
  data: ActivityPoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -8, bottom: 0 }}
        barCategoryGap="32%"
      >
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          domain={[0, 6000]}
          ticks={[0, 1000, 2000, 3000, 4000, 5000, 6000]}
        />
        <Tooltip
          cursor={{ fill: "rgba(15,23,42,0.04)" }}
          wrapperClassName="text-xs"
        />
        <Bar dataKey="value" fill="#13B5C3" radius={[6, 6, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
