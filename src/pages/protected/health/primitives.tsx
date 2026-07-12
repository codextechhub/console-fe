// Shared building blocks for the Health screens: page frame, intro row,
// status colouring, KPI cards (house KpiCard underneath), table wrapper
// (house CustomTable underneath), and the detail-drawer scaffolding.

import { Database, RefreshCw, X, XCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import KpiCard from "@/components/custom/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/redux/services/health-api";

// Live-ish screens poll gently; paused while the tab is unfocused.
export const HEALTH_POLL = { pollingInterval: 30_000, skipPollingIfUnfocused: true } as const;

// Severity mapping: critical is red, degraded is orange (SEV 1–2 = red).
export function statusStyle(status: HealthStatus) {
  if (status === "critical") return { dot: "bg-red-500", badge: "rejected" as const, text: "Critical" };
  if (status === "warning") return { dot: "bg-amber-500", badge: "suspended" as const, text: "Degraded" };
  if (status === "healthy" || status === "operational")
    return { dot: "bg-emerald-500", badge: "active" as const, text: "Healthy" };
  return { dot: "bg-gray-400", badge: "inactive" as const, text: "Unknown" };
}

export function StatusDot({ status }: { status: HealthStatus }) {
  const style = statusStyle(status);
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span className={cn("size-2 rounded-full", style.dot)} />
      {style.text}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: number }) {
  return (
    <Badge variant={severity <= 2 ? "rejected" : "suspended"} className="font-mont text-xs">
      SEV {severity}
    </Badge>
  );
}

export function HealthFrame({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Health">
      <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">{children}</main>
    </DashboardLayout>
  );
}

/** House intro row + optional range picker and refresh action. */
export function PageIntro({
  title,
  description,
  range,
  onRange,
  refreshing,
  onRefresh,
}: {
  title: string;
  description: string;
  range?: string;
  onRange?: (range: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-semibold font-mont text-gray-01">{title}</p>
        <p className="text-xs text-gray-01 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {range && onRange && (
          // NativeSelect's wrapper is w-full; size it from a parent div.
          <div className="w-44">
            <NativeSelect className="h-10" value={range} onChange={(e) => onRange(e.target.value)}>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </NativeSelect>
          </div>
        )}
        {onRefresh && (
          <Button variant="white" size="lg" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}

export function QueryState({ loading, error, retry }: { loading: boolean; error: boolean; retry: () => void }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-md bg-white" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed bg-white">
        <XCircle className="size-7 text-destructive" />
        <p className="mt-3 text-sm font-medium">Health data could not be loaded.</p>
        <Button className="mt-4" variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }
  return null;
}

/** KPI tile on the house KpiCard. Deltas go in the foot as plain text because
 *  "up" is bad for latency/errors — KpiCard's coloured delta assumes up=good. */
export function HealthKpi({
  label,
  value,
  unit,
  delta,
  status,
}: {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  status?: HealthStatus;
}) {
  return (
    <KpiCard
      label={label}
      value={unit ? `${value} ${unit}` : value}
      tone={status === "critical" ? "alert" : status === "warning" ? "warn" : "default"}
      foot={delta != null ? `${delta > 0 ? "+" : ""}${delta}% vs previous window` : undefined}
    />
  );
}

/** House table: array rows in, CustomTable (phone cards, pager) out. */
export function HealthTable({
  headers,
  rows,
  loading,
  emptyText = "No data for this view.",
  onRowClick,
  totalPage,
  currentPage,
  onPageChange,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (index: number) => void;
  totalPage?: number;
  currentPage?: number;
  onPageChange?: (page?: string | number) => void;
}) {
  const tableData = rows.map((row, index) => ({
    ...Object.fromEntries(row.map((cell, i) => [`c${i}`, cell])),
    _index: index,
  }));
  return (
    <CustomTable
      tableHeaderList={headers}
      tableBodyList={tableData}
      loading={loading}
      emptyText={emptyText}
      onRowClick={onRowClick ? (row) => onRowClick((row as { _index: number })._index) : undefined}
      totalPage={totalPage}
      currentPage={currentPage}
      onPageChange={onPageChange}
      hidePagination={(totalPage ?? 0) <= 1}
    />
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center text-center text-sm text-gray-01">
      <Database className="mb-2 size-5" />
      {text}
    </div>
  );
}

// ── Detail drawer scaffolding ────────────────────────────────────────────────

export function DrawerFrame({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[620px]" showCloseButton={false}>
        <SheetHeader className="sticky top-0 z-10 flex-row items-start justify-between border-b bg-white px-6 py-5">
          <div>
            <SheetTitle className="font-mont text-lg text-black-01">{title}</SheetTitle>
            <SheetDescription className="mt-1">{description}</SheetDescription>
          </div>
          <SheetClose asChild>
            <button className="rounded-md p-2 text-gray-01 hover:bg-gray-50" aria-label="Close details">
              <X className="size-4" />
            </button>
          </SheetClose>
        </SheetHeader>
        <div className="space-y-5 p-6 text-black-01">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function DrawerLoading({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-destructive">
        Unable to load these details.
      </div>
    );
  }
  return null;
}

export function DetailMetrics({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-md bg-gray-50 p-4">
          <p className="text-xs text-gray-01">{item.label}</p>
          <div className="mt-2 text-lg font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
