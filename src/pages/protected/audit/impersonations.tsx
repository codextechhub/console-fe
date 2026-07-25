import { useMemo, useState } from "react";
import { RefreshCw, Timer, MoreHorizontal, XCircle, List, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SearchSelect } from "@/components/custom/search-select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PromptModal from "@/components/modal/prompt-modal";
import { useGetImpersonationsQuery, useEndImpersonationMutation } from "@/redux/services/dashboard/security-api";
import { useGetAuditEventsQuery } from "@/redux/services/dashboard/audit-api";
import { formatRelativeDate } from "@/utils/helpers";
import { usePermissions } from "@/hooks/use-permissions";
import { useNow } from "@/hooks/use-now";
import { ActorCell } from "./components/audit-cells";
import { friendlyAction } from "./audit-constants";
import { P } from "@/permissions";
import type { ImpersonationSession } from "@/redux/services/dashboard/security-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Countdown ─────────────────────────────────────────────────────────────────

function Countdown({ iso, className }: { iso: string | null; className?: string }) {
  const now = useNow();
  // Open-ended sessions expire server-side after 30 minutes without activity.
  if (!iso) return <span className={className}>Until exit · idle cap</span>;
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return <span className={cn("text-destructive", className)}>Expired</span>;
  const m = Math.floor(ms / 60_000);
  if (m < 60) return <span className={className}>{m}m</span>;
  const h = Math.floor(m / 60);
  if (h < 24) return <span className={className}>{h}h {m % 60}m</span>;
  return <span className={className}>{Math.floor(h / 24)}d {h % 24}h</span>;
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function ImpersonationDetailDrawer({
  session,
  onClose,
  onEnd,
  ending,
}: {
  session: ImpersonationSession | null;
  onClose: () => void;
  onEnd: (s: ImpersonationSession) => void;
  ending: boolean;
}) {
  const eventsParams = useMemo<Record<string, string | number>>(() => ({
    impersonation_session_id: session?.id ?? 0,
    page_size: 20,
  }), [session]);

  const { data: eventsData, isLoading: eventsLoading } = useGetAuditEventsQuery(
    eventsParams,
    { skip: !session },
  );

  const events = eventsData?.data ?? [];

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[680px] overflow-y-auto p-0">
        <SheetTitle className="sr-only">Proxy session details</SheetTitle>
        {session && (
          <>
            {/* Drawer header */}
            <div className="px-5 pt-5 pb-4 border-b space-y-1">
              <div className="flex items-center gap-2">
                {session.status === "ACTIVE" ? (
                  <>
                    <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                    <Badge variant="suspended" className="text-[10px] uppercase">Active</Badge>
                    <span className="text-gray-01 text-xs">·</span>
                    <Countdown iso={session.ends_at} className="text-xs font-mono text-destructive" />
                  </>
                ) : (
                  <Badge variant="inactive" className="text-[10px] uppercase">
                    {session.status === "EXPIRED" ? "Expired" : "Ended"}
                  </Badge>
                )}
                <span className="text-gray-01 text-xs">·</span>
                <span className="font-mono text-[10px] text-gray-01 truncate">#{session.id}</span>
              </div>
              <p className="font-semibold font-mont text-sm">Proxy session</p>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Impersonator → Target */}
              {/* Phone: Proxier stacks above Target (arrow turns down); sm+: side by side. */}
              <div className="grid grid-cols-1 gap-2 items-center sm:grid-cols-[1fr_32px_1fr]">
                <div className="rounded-md border bg-gray-50 p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase text-gray-01">Proxier</p>
                  <div className="flex items-center gap-2.5">
                    <ActorCell label={session.staff_email} email={session.staff_email} userId={session.staff_user} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{session.staff_email}</p>
                      <p className="text-[10px] text-gray-01">{session.staff_type_label}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center text-gray-01">
                  <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
                </div>
                <div className="rounded-md border bg-gray-50 p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase text-gray-01">Target</p>
                  <div className="flex items-center gap-2.5">
                    <ActorCell label={session.target_email} email={session.target_email} userId={session.target_user} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{session.target_email}</p>
                      <p className="text-[10px] text-gray-01">{session.tenant_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div className="rounded-md border bg-white p-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase text-gray-01">Justification</p>
                <p className="text-sm text-black-01">{session.justification}</p>
              </div>

              {/* Stat strip */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Started", value: formatRelativeDate(session.started_at) },
                  {
                    label: session.status === "ACTIVE" ? "Ends" : "Ended",
                    value: session.status === "ACTIVE"
                      ? null
                      : session.ended_at
                        ? formatRelativeDate(session.ended_at)
                        : "—",
                    countdown: session.status === "ACTIVE" ? session.ends_at : null,
                  },
                  { label: "Actions captured", value: eventsLoading ? "…" : String(events.length) },
                  // The backend ImpersonationSessionSerializer has no
                  // end_reason field — status is the closest real signal.
                  {
                    label: "Status",
                    value: session.status === "ACTIVE" ? "Active"
                      : session.status === "EXPIRED" ? "Expired"
                      : "Ended",
                  },
                ].map(({ label, value, countdown }) => (
                  <div key={label} className="rounded-md border bg-gray-50 p-2.5 space-y-1">
                    <p className="text-[10px] font-semibold uppercase text-gray-01">{label}</p>
                    {countdown ? (
                      <Countdown iso={countdown} className="text-xs font-medium" />
                    ) : (
                      <p className="text-xs font-medium">{value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Read trail — what the proxier viewed, deduped by endpoint */}
              <div>
                <p className="text-xs font-semibold font-mont mb-2">Data accessed during session</p>
                {(session.access_log ?? []).length === 0 ? (
                  <div className="flex h-16 items-center justify-center text-xs text-gray-01 border rounded-md bg-gray-50">
                    No reads recorded for this session.
                  </div>
                ) : (
                  <div className="divide-y border rounded-md overflow-hidden max-h-56 overflow-y-auto">
                    {[...session.access_log]
                      .sort((a, b) => b.last_at.localeCompare(a.last_at))
                      .map((entry) => (
                        <div key={entry.path} className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-gray-50">
                          <p className="flex-1 min-w-0 truncate font-mono text-[11px] text-black-01">{entry.path}</p>
                          <span className="shrink-0 text-[10px] text-gray-01 tabular-nums">
                            ×{entry.count} · {formatRelativeDate(entry.last_at)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Actions timeline */}
              <div>
                <p className="text-xs font-semibold font-mont mb-2">Actions taken during session</p>
                {eventsLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <div className="loader" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="flex h-24 items-center justify-center text-xs text-gray-01 border rounded-md bg-gray-50">
                    No meaningful audited actions recorded for this session.
                  </div>
                ) : (
                  <div className="divide-y border rounded-md overflow-hidden">
                    {events.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 px-3 py-2.5 bg-white hover:bg-gray-50">
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0 mt-1.5",
                            e.severity === "CRITICAL" ? "bg-destructive"
                              : e.severity === "WARNING" ? "bg-yellow-01"
                              : "bg-blue-400",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-medium">{friendlyAction(e.action_type)}</span>
                            <span className="text-[10px] text-gray-01 uppercase bg-gray-100 px-1 rounded">{e.module_key}</span>
                          </div>
                          {e.summary && <p className="text-[10px] text-gray-01 truncate">{e.summary}</p>}
                        </div>
                        <span className="text-[10px] text-gray-01 shrink-0">{formatRelativeDate(e.event_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {session.status === "ACTIVE" && (
              <div className="px-5 py-3 border-t flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={ending}
                  onClick={() => onEnd(session)}
                >
                  <XCircle className="size-3.5" /> End proxy session now
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Impersonations() {
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "ENDED">("");
  const [staffFilter, setStaffFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [dateRange, setDateRange] = useState("30d");
  const [detail, setDetail] = useState<ImpersonationSession | null>(null);
  const [confirmEnd, setConfirmEnd] = useState<ImpersonationSession | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [page, statusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetImpersonationsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const [endImpersonation, { isLoading: ending }] = useEndImpersonationMutation();

  const raw = useMemo(() => data?.data ?? [], [data]);
  const now = useNow();

  // Derive unique values for secondary filters from loaded data
  const staffOptions = useMemo(() => [...new Set(raw.map((i) => i.staff_email))].sort(), [raw]);
  const targetOptions = useMemo(() => [...new Set(raw.map((i) => i.target_email))].sort(), [raw]);
  const tenantOptions = useMemo(() => (
    [...new Map(raw.map((i) => [i.tenant_slug, i.tenant_name])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
  ), [raw]);

  // Client-side filter + sort
  const list = useMemo(() => {
    const cutoffMs: Record<string, number> = {
      "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000, "90d": 90 * 86_400_000,
    };
    const cutoff = cutoffMs[dateRange] ? now - cutoffMs[dateRange] : 0;

    return raw
      .filter((i) => !staffFilter || i.staff_email === staffFilter)
      .filter((i) => !targetFilter || i.target_email === targetFilter)
      .filter((i) => !tenantFilter || i.tenant_slug === tenantFilter)
      .filter((i) => cutoff === 0 || new Date(i.started_at).getTime() >= cutoff)
      .sort((a, b) => {
        if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
        if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
        return b.started_at.localeCompare(a.started_at);
      });
  }, [raw, staffFilter, targetFilter, tenantFilter, dateRange, now]);

  const activeCount = raw.filter((i) => i.status === "ACTIVE").length;

  const handleEnd = () => {
    if (!confirmEnd) return;
    endImpersonation({ session_id: confirmEnd.id })
      .unwrap()
      .then(() => {
        toast.success("Proxy session ended");
        setConfirmEnd(null);
        setDetail(null);
      })
      .catch(() => {});
  };

  const canEnd = hasPermission(P.END_IMPERSONATION);

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Proxy Sessions</p>
            <p className="text-xs text-gray-01 mt-0.5">
              {activeCount > 0 ? (
                <><span className="text-destructive font-medium">{activeCount} active</span> · </>
              ) : null}
              Changes and failed actions are audited; reads land in each session&apos;s access trail.
            </p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex gap-3 items-center overflow-x-auto pb-1">
          <div className="w-36 shrink-0">
            <SearchSelect
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as "" | "ACTIVE" | "ENDED"); setPage(1); }}
              placeholder="Any status"
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "ENDED", label: "Ended" },
              ]}
            />
          </div>

          <div className="w-52 shrink-0">
            <SearchSelect
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              placeholder="Any staff user"
              options={staffOptions.map((email) => ({ value: email, label: email }))}
            />
          </div>

          <div className="w-52 shrink-0">
            <SearchSelect
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              placeholder="Any target user"
              options={targetOptions.map((email) => ({ value: email, label: email }))}
            />
          </div>

          <div className="w-40 shrink-0">
            <SearchSelect
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              placeholder="All organisations"
              options={tenantOptions.map(([slug, name]) => ({ value: slug, label: name }))}
            />
          </div>

          <div className="w-36 shrink-0">
            <SearchSelect
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              clearable={false}
              options={[
                { value: "24h", label: "Last 24h" },
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 90 days" },
                { value: "all", label: "All time" },
              ]}
            />
          </div>
        </div>

        {/* Body */}
        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md border">
            <p className="text-sm font-medium text-destructive">Failed to load proxy sessions.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex h-60 items-center justify-center bg-white rounded-md border">
            <div className="loader" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F1F1F1] border-b">
                  {["Staff (proxier)", "Target user", "Organisation", "Justification", "Status", "Started", "Ends / Ended", ""].map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-xs font-semibold font-mont text-gray-01 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-03">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="h-48 text-center">
                      <p className="text-xs text-gray-01">No proxy sessions in this range.</p>
                    </td>
                  </tr>
                ) : (
                  list.map((i) => (
                    <tr
                      key={i.id}
                      onClick={() => setDetail(i)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        i.status === "ACTIVE"
                          ? "bg-red-50/50 hover:bg-red-50"
                          : "hover:bg-primary/5",
                      )}
                    >
                      {/* Staff */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ActorCell label={i.staff_email} email={i.staff_email} userId={i.staff_user} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[160px]">{i.staff_email}</p>
                            <p className="text-[10px] text-gray-01">{i.staff_type_label}</p>
                          </div>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ActorCell label={i.target_email} email={i.target_email} userId={i.target_user} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[160px]">{i.target_email}</p>
                            <p className="text-[10px] text-gray-01">{i.tenant_name}</p>
                          </div>
                        </div>
                      </td>

                      {/* School */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-01">{i.tenant_name}</span>
                      </td>

                      {/* Justification */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-01 line-clamp-2 max-w-[260px] block">{i.justification}</span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        {i.status === "ACTIVE" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                            <Badge variant="suspended" className="text-[10px] uppercase">Active</Badge>
                          </div>
                        ) : (
                          <Badge variant="inactive" className="text-[10px] uppercase">Ended</Badge>
                        )}
                      </td>

                      {/* Started */}
                      <td className="px-3 py-3">
                        <span className="text-xs whitespace-nowrap">{formatRelativeDate(i.started_at)}</span>
                      </td>

                      {/* Ends / Ended */}
                      <td className="px-3 py-3">
                        {i.status === "ACTIVE" ? (
                          <div className="flex items-center gap-1 text-destructive">
                            <Timer className="size-3 shrink-0" />
                            <Countdown iso={i.ends_at} className="text-xs font-mono" />
                          </div>
                        ) : (
                          <span className="text-xs whitespace-nowrap">
                            {i.ended_at ? formatRelativeDate(i.ended_at) : "—"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="size-7 p-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{ width: 220 }}>
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={() => setDetail(i)}
                            >
                              <List className="size-3.5 shrink-0" /> View session details
                            </DropdownMenuItem>
                            {canEnd && i.status === "ACTIVE" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-xs gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => setConfirmEnd(i)}
                                >
                                  <XCircle className="size-3.5 shrink-0" /> End proxy session
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail drawer */}
      <ImpersonationDetailDrawer
        session={detail}
        onClose={() => setDetail(null)}
        onEnd={(s) => { setDetail(null); setConfirmEnd(s); }}
        ending={ending}
      />

      {/* Confirm end modal */}
      <PromptModal
        isOpen={!!confirmEnd}
        onClose={() => setConfirmEnd(null)}
        onConfirm={handleEnd}
        title="End proxy session?"
        description={`This will immediately end ${confirmEnd?.staff_email}'s session as ${confirmEnd?.target_email}. The action is logged.`}
        onConfirmText="End proxy session"
        onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
        canCancel
        loading={ending}
      />
    </>
  );
}
