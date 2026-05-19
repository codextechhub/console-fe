import { useParams, useNavigate } from "react-router";
import { RefreshCw, ExternalLink, Download, X } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useGetEntityTrailDetailQuery,
  useCreateAuditExportMutation,
} from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate, returnInitial } from "@/utils/helpers";
import { useState, useMemo } from "react";
import EventDetailDrawer from "./components/event-detail-drawer";
import { routesPath } from "@/routes/routesPath";
import type { AuditEventDetail } from "@/redux/services/dashboard/auditTypes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SEV_DOT: Record<string, string> = {
  CRITICAL: "bg-red-500",
  WARNING: "bg-amber-400",
  INFO: "bg-blue-400",
};

const MODULE_COLOR: Record<string, string> = {
  IDENTITY: "bg-purple-100 text-purple-700",
  USER: "bg-blue-100 text-blue-700",
  RBAC: "bg-indigo-100 text-indigo-700",
  SCHOOL: "bg-green-100 text-green-700",
  BRANCH: "bg-teal-100 text-teal-700",
  FINANCE: "bg-emerald-100 text-emerald-700",
  PROCUREMENT: "bg-cyan-100 text-cyan-700",
  IMPORT: "bg-orange-100 text-orange-700",
  CONFIG: "bg-slate-100 text-slate-700",
  SYSTEM: "bg-gray-100 text-gray-700",
  ONBOARDING: "bg-pink-100 text-pink-700",
};

function actorInitials(e: AuditEventDetail): string {
  if (e.actor_user?.full_name) return returnInitial(e.actor_user.full_name);
  if (e.actor_user?.email) return e.actor_user.email.slice(0, 2).toUpperCase();
  if (e.actor_label === "System") return "SY";
  return (e.actor_label || "?").slice(0, 2).toUpperCase();
}

function actorName(e: AuditEventDetail): string {
  return e.actor_user?.full_name || e.actor_user?.email || e.actor_label || "System";
}

function actorKey(e: AuditEventDetail): string {
  return e.actor_user?.id || e.actor_label || "system";
}

export default function EntityTrailDetail() {
  const params = useParams<{ entity_type: string; entity_id: string }>();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chip, setChip] = useState("all");
  const [selectedSnap, setSelectedSnap] = useState<AuditEventDetail[]>([]);

  const { data, isLoading, isError, refetch, isFetching } = useGetEntityTrailDetailQuery(
    { entity_type: params.entity_type!, entity_id: params.entity_id! },
    { skip: !params.entity_type || !params.entity_id },
  );
  const [createExport, { isLoading: exporting }] = useCreateAuditExportMutation();

  const trail = data?.data?.trail;
  const events = (data?.data?.events ?? []) as AuditEventDetail[];

  const modules = useMemo(() => [...new Set(events.map((e) => e.module_key))], [events]);

  const actors = useMemo(() => {
    const seen = new Map<string, { key: string; label: string }>();
    events.forEach((e) => {
      const key = actorKey(e);
      if (!seen.has(key)) seen.set(key, { key, label: actorName(e) });
    });
    return [...seen.values()].slice(0, 4);
  }, [events]);

  const distinctActorCount = useMemo(
    () => new Set(events.map((e) => actorKey(e))).size,
    [events],
  );

  const filtered = useMemo(() => {
    if (chip === "all") return events;
    if (chip.startsWith("mod:")) return events.filter((e) => e.module_key === chip.slice(4));
    if (chip.startsWith("actor:")) return events.filter((e) => actorKey(e) === chip.slice(6));
    return events;
  }, [events, chip]);

  function toggleSnap(event: AuditEventDetail) {
    setSelectedSnap((prev) => {
      if (prev.find((e) => e.id === event.id)) return prev.filter((e) => e.id !== event.id);
      if (prev.length >= 2) return [prev[1], event];
      return [...prev, event];
    });
  }

  function handleExport() {
    createExport({
      filter_payload: { entity_type: params.entity_type, entity_id: params.entity_id },
      export_format: "CSV",
    })
      .unwrap()
      .then(() => toast.success("Export queued. Check Audit Exports for the download link."))
      .catch(() => {});
  }

  const chips = [
    { key: "all", label: "All" },
    ...modules.map((m) => ({ key: `mod:${m}`, label: m })),
    ...actors.map((a) => ({ key: `actor:${a.key}`, label: a.label.split(" ")[0] })),
  ];

  return (
    <DashboardLayout title="Entity Trails" hasBack>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        {/* Page heading */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Entity Trails</p>
            <p className="text-xs text-gray-01 mt-0.5">Full lifecycle of a single audited entity.</p>
          </div>
          <div className="flex items-center gap-2">
            {trail && (
              <>
                <Button
                  variant="white"
                  size="lg"
                  onClick={() =>
                    navigate(
                      `${routesPath.PROTECTED.AUDIT.EVENTS}?entity_type=${encodeURIComponent(params.entity_type!)}&entity_id=${encodeURIComponent(params.entity_id!)}`,
                    )
                  }
                >
                  <ExternalLink className="size-3.5" /> Open in Events
                </Button>
                <Button variant="white" size="lg" onClick={handleExport} disabled={exporting}>
                  <Download className="size-3.5" /> Export trail
                </Button>
              </>
            )}
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Trail not found or failed to load.</p>
          </div>
        ) : isLoading ? (
          <div className="text-center text-xs text-gray-01 py-6">Loading trail…</div>
        ) : trail ? (
          <>
            {/* Entity card */}
            <div className="bg-white rounded-md p-5 space-y-4">
              <div className="flex items-start gap-2">
                <Badge variant="inactive" className="text-[10px] uppercase shrink-0 mt-0.5">
                  {trail.entity_type}
                </Badge>
                <div>
                  <p className="text-lg font-semibold leading-tight" style={{ letterSpacing: "-0.01em" }}>
                    {trail.entity_label || trail.entity_id}
                  </p>
                  <p className="font-mono text-xs text-gray-01 mt-0.5">{trail.entity_id}</p>
                </div>
              </div>

              {/* Stat strip — 4 tiles */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-[10px] uppercase text-gray-01 tracking-wide mb-0.5">Events</p>
                  <p className="text-xl font-semibold">{trail.event_count}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-01 tracking-wide mb-0.5">First seen</p>
                  <p className="text-sm">{trail.first_event_at ? formatRelativeDate(trail.first_event_at) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-01 tracking-wide mb-0.5">Last seen</p>
                  <p className="text-sm">{trail.last_event_at ? formatRelativeDate(trail.last_event_at) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-01 tracking-wide mb-0.5">Distinct actors</p>
                  <p className="text-xl font-semibold">{distinctActorCount}</p>
                </div>
              </div>
            </div>

            {/* Snapshot comparison panel — appears when 2 events are selected */}
            {selectedSnap.length >= 2 && (
              <div className="bg-white rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Snapshot comparison</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedSnap([])}
                  >
                    <X className="size-3 mr-1" /> Clear
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedSnap.slice(0, 2).map((snap) => (
                    <div key={snap.id} className="border border-gray-200 rounded-md overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 border-b">
                        <span className="font-mono text-[10px] font-medium text-gray-01 uppercase">
                          {snap.action_type}
                        </span>
                        <span className="text-[10px] text-gray-01 ml-2">
                          {formatRelativeDate(snap.event_at)}
                        </span>
                      </div>
                      {snap.diff_data ? (
                        <pre className="p-3 text-[11px] font-mono text-black-01 overflow-auto max-h-48 bg-white whitespace-pre-wrap">
                          {JSON.stringify(snap.diff_data, null, 2)}
                        </pre>
                      ) : (
                        <p className="p-3 text-xs text-gray-01">No state captured for this event.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-md overflow-hidden">
              {/* Timeline header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <p className="text-sm font-semibold">Timeline ({events.length})</p>
                <p className="text-[11px] text-gray-01">{selectedSnap.length}/2 selected for compare</p>
              </div>

              {/* Chip filter row */}
              <div className="flex items-center gap-1.5 flex-wrap px-5 pb-3">
                {chips.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChip(key)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                      chip === key
                        ? "bg-black-01 text-white border-black-01"
                        : "bg-white text-gray-01 border-gray-200 hover:border-gray-400",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Feed */}
              <div className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-01 px-5 py-6">No events match this filter.</p>
                ) : (
                  filtered.map((e) => {
                    const isSelected = !!selectedSnap.find((s) => s.id === e.id);
                    return (
                      <div
                        key={e.id}
                        className={cn(
                          "flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors",
                          isSelected && "bg-blue-50/60",
                        )}
                        onClick={() => setSelectedId(e.id)}
                      >
                        {/* Severity dot */}
                        <span
                          className={cn(
                            "size-2.5 rounded-full shrink-0 mt-[18px]",
                            SEV_DOT[e.severity] ?? "bg-gray-300",
                          )}
                        />

                        {/* Actor avatar */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className="size-6 shrink-0 mt-3.5 cursor-default">
                                <AvatarImage src={undefined} />
                                <AvatarFallback className="text-[9px] font-semibold bg-blue-100 text-blue-700">
                                  {actorInitials(e)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{actorName(e)}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Content */}
                        <div className="flex-1 min-w-0 py-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold">{actorName(e)}</span>
                            <span className="text-gray-01 text-[10px]">·</span>
                            <span className="text-[10px] text-gray-01">
                              {formatRelativeDate(e.event_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-01 truncate mb-1.5">{e.summary || "—"}</p>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                                MODULE_COLOR[e.module_key] ?? "bg-gray-100 text-gray-600",
                              )}
                            >
                              {e.module_key}
                            </span>
                            <span className="font-mono text-[10px] text-gray-01">{e.action_type}</span>
                          </div>
                        </div>

                        {/* Compare toggle */}
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            toggleSnap(e);
                          }}
                          className={cn(
                            "shrink-0 self-center text-[10px] px-2 py-0.5 rounded border transition-colors",
                            isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-600"
                              : "border-gray-200 text-gray-01 hover:border-gray-400",
                          )}
                        >
                          {isSelected ? "✓" : "Compare"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : null}

        <EventDetailDrawer eventId={selectedId} onClose={() => setSelectedId(null)} />
      </main>
    </DashboardLayout>
  );
}
