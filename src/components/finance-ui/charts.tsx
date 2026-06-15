// Lightweight SVG charts in the app's theme (no chart lib). Ported in spirit
// from the Crestfield design's BarChart/Donut/StatStrip, restyled to our
// palette/typography. Used on dashboards for real data (aging buckets, income
// vs expense, spend) — not fabricated trend series.

import { cn } from "@/lib/utils";

// House chart palette (maps to our tokens; falls back to hex for SVG fills).
export const CHART_COLORS = {
  primary: "var(--color-primary, #2563eb)",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  violet: "#7c3aed",
  slate: "#64748b",
  teal: "#0d9488",
} as const;

export interface BarDatum {
  label: string;
  value: number;
}

/** Vertical bars from {label, value}. `format` renders the hover/tooltip value. */
export function BarChart({
  data,
  height = 180,
  color = CHART_COLORS.primary,
  format = (v: number) => String(v),
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3 overflow-x-auto pt-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex min-w-12 flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className="w-7 rounded-t-sm transition-[height]"
              style={{ height: `${(d.value / max) * (height - 40)}px`, minHeight: 2, background: color }}
              title={`${d.label}: ${format(d.value)}`}
            />
          </div>
          <span className="font-mont text-[10.5px] text-gray-05">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

/** Donut with optional center label. */
export function Donut({
  data,
  size = 132,
  thickness = 18,
  center,
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  center?: { main: string; sub?: string };
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  // Precompute each segment's length + cumulative offset without mutating a
  // captured variable during render (keeps the React-compiler lint happy).
  const lens = data.map((d) => (d.value / total) * circ);
  const offsets = lens.map((_, i) => lens.slice(0, i).reduce((s, l) => s + l, 0));
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef0f3" strokeWidth={thickness} />
        {data.map((d, i) => (
          <circle
            key={d.label}
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${lens[i]} ${circ - lens[i]}`}
            strokeDashoffset={-offsets[i]}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        ))}
        {center && (
          <>
            <text x={cx} y={cx - 2} textAnchor="middle" className="fill-black-01 font-mont" style={{ fontSize: 14, fontWeight: 600 }}>{center.main}</text>
            {center.sub && <text x={cx} y={cx + 14} textAnchor="middle" className="fill-gray-05 font-mont" style={{ fontSize: 11 }}>{center.sub}</text>}
          </>
        )}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 font-mont text-xs text-gray-01">
            <span className="inline-block size-2.5 rounded-full" style={{ background: d.color }} />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A compact label/value/sub strip — for summary rows above a table. */
export function StatStrip({ items }: { items: { label: string; value: React.ReactNode; sub?: string }[] }) {
  return (
    <div className="flex flex-wrap divide-x divide-gray-03 rounded-md border border-gray-03 bg-white">
      {items.map((it, i) => (
        <div key={i} className="min-w-36 flex-1 px-4 py-3">
          <p className="font-mont text-xs text-gray-05">{it.label}</p>
          <p className="mt-1 font-mont text-lg font-semibold text-black-01 tabular-nums">{it.value}</p>
          {it.sub && <p className="font-mont text-[11px] text-gray-05">{it.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/** P2P-style step strip: states done | current | rejected | todo. */
export function WorkflowStrip({ steps }: { steps: { label: string; state: "done" | "current" | "rejected" | "todo" }[] }) {
  const styles: Record<string, string> = {
    done: "bg-green-01/10 text-green-01",
    current: "bg-blue-50 text-blue-700",
    rejected: "bg-destructive/10 text-destructive",
    todo: "bg-gray-05/10 text-gray-05",
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mont text-xs font-medium", styles[s.state])}>
            <span className="size-1.5 rounded-full bg-current opacity-70" />
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-gray-03">›</span>}
        </span>
      ))}
    </div>
  );
}
