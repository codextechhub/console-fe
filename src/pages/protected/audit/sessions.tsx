import { useMemo, useState, useEffect } from "react";
import {
  RefreshCw, Download, LogOut, ExternalLink, GitBranch,
  AlertTriangle, EllipsisVertical, X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchSelect } from "@/components/custom/search-select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { formatRelativeDate } from "@/utils/helpers";
import {
  useGetLoginSessionsQuery, useForceLogoutMutation,
} from "@/redux/services/dashboard/security-api";
import { useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import { useGetAuditEventsQuery } from "@/redux/services/dashboard/audit-api";
import { ActorCell } from "./components/audit-cells";
import { DEVICE_ICONS, formatAge, deviceParts } from "./components/session-device";
import { SessionStatusBadge, Pagination } from "./components/session-bits";
import type { LoginSession } from "@/redux/services/dashboard/security-types";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { routesPath } from "@/routes/routes-path";
import { cn } from "@/lib/utils";

// ── Modal state ──────────────────────────────────────────────────────────────

type ModalState =
  | { kind: "end_one"; session: LoginSession }
  | { kind: "end_all_user"; userId: string; userName: string }
  | { kind: "end_selected" }
  | null;

function modalTitle(modal: ModalState): string {
  if (!modal) return "";
  if (modal.kind === "end_one") return "End session";
  if (modal.kind === "end_all_user") return "End all sessions";
  return "End selected sessions";
}

function modalDescription(modal: ModalState, count: number): string {
  if (!modal) return "";
  if (modal.kind === "end_one") {
    return `End this session for ${modal.session.user?.email ?? "the user"}? They will need to log in again.`;
  }
  if (modal.kind === "end_all_user") {
    return `End all active sessions for ${modal.userName}? They will be signed out on all devices.`;
  }
  return `End ${count} selected session(s)? Those users will need to log in again.`;
}

// ── Main component ───────────────────────────────────────────────────────────

type Scope = "active" | "all" | "ended_today";

export default function LiveSessions() {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Filters
  const [scope, setScope] = useState<Scope>("active");
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [endReasonFilter, setEndReasonFilter] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 600);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Detail drawer
  const [detailSession, setDetailSession] = useState<LoginSession | null>(null);

  // End-session modal
  const [modal, setModal] = useState<ModalState>(null);
  const [endReason, setEndReason] = useState("");

  // Auto-refresh tick (recalculates ages every 30 s)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.search = debouncedSearch;
    if (scope === "active") p.is_active = "true";
    if (scope === "ended_today") { p.is_active = "false"; p.ended_today = "true"; }
    if (schoolFilter) p.school = schoolFilter;
    if (endReasonFilter) p.end_reason = endReasonFilter;
    return p;
  }, [page, debouncedSearch, scope, schoolFilter, endReasonFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetLoginSessionsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const { data: schoolsData } = useGetSchoolsQuery({ page_size: 200 });
  const { data: relatedEventsData } = useGetAuditEventsQuery(
    { actor_user_id: detailSession?.user?.id ?? "", page_size: 8 },
    { skip: !detailSession },
  );
  const [forceLogout, { isLoading: ending }] = useForceLogoutMutation();

  const sessions = data?.data ?? [];
  const schools = schoolsData?.data ?? [];
  const relatedEvents = relatedEventsData?.data ?? [];
  const activeCount = sessions.filter((s) => s.is_active).length;

  // Selection helpers
  const allIds = sessions.map((s) => s.id);
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const toggleAll = () => setSelectedIds(allSelected ? [] : allIds);

  const closeModal = () => { setModal(null); setEndReason(""); };

  const handleConfirm = () => {
    if (!modal || !endReason.trim()) return;
    if (modal.kind === "end_one") {
      forceLogout({ session_id: modal.session.id, reason: endReason })
        .unwrap()
        .then(() => { toast.success("Session ended."); closeModal(); })
        .catch(() => {});
    } else if (modal.kind === "end_all_user") {
      forceLogout({ user_id: modal.userId, reason: endReason })
        .unwrap()
        .then((res) => {
          toast.success(`${res.data.ended_sessions} session(s) ended.`);
          closeModal();
        })
        .catch(() => {});
    } else if (modal.kind === "end_selected") {
      Promise.all(
        selectedIds.map((id) => forceLogout({ session_id: id, reason: endReason }).unwrap()),
      )
        .then(() => {
          toast.success(`${selectedIds.length} session(s) ended.`);
          setSelectedIds([]);
          closeModal();
        })
        .catch(() => {});
    }
  };

  const canManage = hasPermission(P.SUSPEND_TEAM_MEMBER);

  const scopeLabels: Record<Scope, string> = {
    active: "Active only",
    all: "All sessions",
    ended_today: "Ended today",
  };

  return (
    <DashboardLayout title="Live Sessions">
      <main className="px-4.5 py-6 space-y-5 text-black-01">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold font-mont text-gray-01">Live Sessions</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1.5 text-xs text-gray-01">
                <span className="size-1.5 rounded-full bg-green-01 animate-pulse" />
                {activeCount} active right now
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Refresh
            </Button>
            <Button variant="white" size="lg">
              <Download className="size-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Scope tabs */}
          <div className="inline-flex bg-white rounded-md p-1 border border-gray-200 shrink-0">
            {(["active", "all", "ended_today"] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setScope(s); setPage(1); setSelectedIds([]); }}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-colors",
                  scope === s ? "bg-blue-600 text-white" : "text-gray-01 hover:bg-gray-100",
                )}
              >
                {scopeLabels[s]}
              </button>
            ))}
          </div>

          <CustomInput
            id="search-sessions"
            canSearch
            placeholder="Search user, IP, device..."
            className="h-10"
            containerClass="w-full sm:max-w-[260px]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          <Combobox
            value={schoolFilter || null}
            onValueChange={(v) => { setSchoolFilter(v ?? ""); setPage(1); }}
          >
            <ComboboxInput
              placeholder="All schools"
              showTrigger
              showClear={!!schoolFilter}
              className="w-52 h-10"
            />
            <ComboboxContent>
              <ComboboxList>
                {schools.map((s) => (
                  <ComboboxItem key={s.slug} value={s.slug}>
                    {s.name}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>No schools found</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          <div className="w-40">
            <SearchSelect
              value={endReasonFilter}
              onChange={(e) => { setEndReasonFilter(e.target.value); setPage(1); }}
              placeholder="Any end reason"
              options={[
                { value: "LOGOUT", label: "LOGOUT" },
                { value: "FORCE_LOGOUT", label: "FORCE_LOGOUT" },
                { value: "EXPIRED", label: "EXPIRED" },
              ]}
            />
          </div>

        </div>

        {/* ── Bulk banner ────────────────────────────────────────────────── */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
            <span className="text-sm font-medium text-blue-700">
              {selectedIds.length} session{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
            {canManage && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setModal({ kind: "end_selected" })}
              >
                <LogOut className="size-3" /> End selected
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────────── */}
        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md border">
            <p className="text-sm font-medium text-destructive">Failed to load sessions.</p>
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
                  <th className="px-3 py-3 w-10">
                    <Checkbox
                      checked={someSelected ? "indeterminate" : allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  {[
                    "User", "School", "Device", "IP Address",
                    "Last seen", "Session age", "Status", "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-3 text-left text-xs font-semibold font-mont text-gray-01 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-03">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-56 text-center">
                      <div className="size-40 mx-auto rounded-full border border-primary grid place-content-center">
                        <p className="text-xs text-gray-01">No sessions match these filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => {
                    const { name: deviceName, browser: browserLabel, deviceClass } = deviceParts(s);
                    const DevIcon = DEVICE_ICONS[deviceClass];

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setDetailSession(s)}
                        className={cn(
                          "transition-colors hover:bg-primary/5 cursor-pointer",
                          selectedIds.includes(s.id) && "bg-blue-50/60",
                        )}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(s.id)}
                            onCheckedChange={() => toggleSelect(s.id)}
                          />
                        </td>

                        {/* User */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <ActorCell
                              label={s.user?.full_name || s.user?.email || "—"}
                              email={s.user?.email}
                              userId={s.user?.id}
                            />
                            <div>
                              <div className="text-xs font-medium leading-snug">
                                {s.user?.full_name || s.user?.email || "—"}
                              </div>
                              {s.user?.full_name && (
                                <div className="text-[10px] text-gray-01">{s.user.email}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* School */}
                        <td className="px-3 py-3">
                          <span className="text-xs">
                            {s.school?.name ?? <span className="text-gray-01">Platform</span>}
                          </span>
                        </td>

                        {/* Device */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <DevIcon className="size-3.5 text-gray-01 shrink-0" />
                            <div>
                              <div className="text-xs">{deviceName}</div>
                              <div className="text-[10px] text-gray-01">{browserLabel}</div>
                            </div>
                          </div>
                        </td>

                        {/* IP */}
                        <td className="px-3 py-3">
                          <span className="font-mono text-xs">{s.ip_address ?? "—"}</span>
                        </td>

                        {/* Last seen */}
                        <td className="px-3 py-3">
                          {s.is_active ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <span className="size-1.5 rounded-full bg-green-01 animate-pulse shrink-0" />
                              {formatRelativeDate(s.last_seen_at)}
                            </span>
                          ) : (
                            <span className="text-xs">{formatRelativeDate(s.last_seen_at)}</span>
                          )}
                        </td>

                        {/* Session age */}
                        <td className="px-3 py-3">
                          <span className="font-mono text-xs" data-tick={tick}>
                            {formatAge(s.created_at)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <SessionStatusBadge session={s} />
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                              >
                                <EllipsisVertical className="size-4 text-gray-01" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" style={{ width: 220 }}>
                              <DropdownMenuItem
                                className="cursor-pointer text-xs"
                                onClick={() => setDetailSession(s)}
                              >
                                <ExternalLink className="size-3.5" /> View detail
                              </DropdownMenuItem>

                              {s.is_active && canManage && (
                                <>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    className="cursor-pointer text-xs"
                                    onClick={() => setModal({ kind: "end_one", session: s })}
                                  >
                                    <LogOut className="size-3.5" /> End session
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    className="cursor-pointer text-xs"
                                    onClick={() =>
                                      setModal({
                                        kind: "end_all_user",
                                        userId: s.user?.id ?? "",
                                        userName: s.user?.full_name || s.user?.email || "user",
                                      })
                                    }
                                  >
                                    <LogOut className="size-3.5" /> End all for this user
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer text-xs"
                                onClick={() =>
                                  navigate(
                                    routesPath.PROTECTED.AUDIT.ENTITY_TRAIL_DETAIL(
                                      "User",
                                      s.user?.id ?? "",
                                    ),
                                  )
                                }
                              >
                                <GitBranch className="size-3.5" /> View user audit trail
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <Pagination
            currentPage={data?.pagination?.currentPage ?? 1}
            totalPages={data?.pagination?.totalPages ?? 0}
            onPageChange={setPage}
          />
        )}

        {/* ── Detail drawer ───────────────────────────────────────────────── */}
        <Sheet
          open={!!detailSession}
          onOpenChange={(open) => {
            if (!open) setDetailSession(null);
          }}
        >
          <SheetContent
            className="w-full sm:max-w-md flex flex-col p-0 gap-0"
            showCloseButton={false}
          >
            {detailSession && (() => {
              const { name: deviceName, browser: browserLabel, deviceClass } = deviceParts(detailSession);
              const DevIcon = DEVICE_ICONS[deviceClass];

              return (
                <>
                  <SheetHeader className="border-b px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SessionStatusBadge session={detailSession} />
                          <span className="font-mono text-[10px] text-gray-01 truncate max-w-[180px]">
                            {detailSession.id}
                          </span>
                        </div>
                        <SheetTitle className="text-sm font-semibold leading-snug">
                          {detailSession.user?.full_name || detailSession.user?.email}'s session
                        </SheetTitle>
                      </div>
                      <SheetClose asChild>
                        <button type="button" className="p-1 rounded hover:bg-gray-100 shrink-0">
                          <X className="size-4" />
                        </button>
                      </SheetClose>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {/* User */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">
                        User
                      </p>
                      <div className="flex items-center gap-3">
                        <ActorCell
                          label={detailSession.user?.full_name || detailSession.user?.email || "—"}
                          email={detailSession.user?.email}
                          userId={detailSession.user?.id}
                        />
                        <div>
                          <div className="text-sm font-medium">
                            {detailSession.user?.full_name || "—"}
                          </div>
                          <div className="text-xs text-gray-01">{detailSession.user?.email}</div>
                          {detailSession.user?.role && (
                            <div className="text-xs text-gray-01">
                              {detailSession.user.role} · {detailSession.school?.name ?? "Platform"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Device */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">
                        Device
                      </p>
                      <div className="flex items-center gap-2 mb-1">
                        <DevIcon className="size-4 text-gray-01" />
                        <span className="text-sm font-medium">{deviceName}</span>
                      </div>
                      <p className="text-xs text-gray-01">
                        {browserLabel} · {deviceName} · {deviceClass}
                      </p>
                    </div>

                    {/* Network */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">
                        Network
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-01">IP </span>
                          <span className="font-mono">{detailSession.ip_address ?? "—"}</span>
                        </div>
                        <details>
                          <summary className="text-gray-01 cursor-pointer list-none flex items-center gap-1 select-none">
                            <span className="text-[10px]">▶</span> Raw user-agent
                          </summary>
                          <div className="mt-2 font-mono text-[10px] bg-gray-50 p-2 rounded break-all leading-relaxed">
                            {detailSession.user_agent}
                          </div>
                        </details>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">
                        Timestamps
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-gray-01">Created </span>
                          {formatRelativeDate(detailSession.created_at)}
                        </div>
                        <div>
                          <span className="text-gray-01">Last seen </span>
                          {formatRelativeDate(detailSession.last_seen_at)}
                        </div>
                        {detailSession.ended_at && (
                          <div>
                            <span className="text-gray-01">Ended </span>
                            {formatRelativeDate(detailSession.ended_at)}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-01">Session age </span>
                          {formatAge(detailSession.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Related events */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">
                        Related events
                      </p>
                      {relatedEvents.length === 0 ? (
                        <p className="text-xs text-gray-01">No related events.</p>
                      ) : (
                        relatedEvents.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center gap-2 py-1.5 border-b last:border-0"
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full shrink-0",
                                e.severity === "CRITICAL"
                                  ? "bg-destructive"
                                  : e.severity === "WARNING"
                                  ? "bg-yellow-01"
                                  : "bg-blue-400",
                              )}
                            />
                            <span className="text-xs flex-1 leading-snug">
                              {e.summary || e.action_type}
                            </span>
                            <span className="text-[10px] text-gray-01 shrink-0">
                              {formatRelativeDate(e.event_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <SheetFooter className="border-t px-4 py-3 flex items-center justify-end gap-2">
                    {detailSession.is_active && canManage && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setModal({ kind: "end_one", session: detailSession })}
                      >
                        <LogOut className="size-3.5" /> End session
                      </Button>
                    )}
                  </SheetFooter>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>

        {/* ── End-session modal (all kinds) ───────────────────────────────── */}
        <Dialog open={!!modal} onOpenChange={(open) => { if (!open) closeModal(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-yellow-500" />
                {modalTitle(modal)}
              </DialogTitle>
              <DialogDescription>
                {modalDescription(modal, selectedIds.length)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-black-01">
                Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="e.g. Suspicious activity from new IP"
                value={endReason}
                onChange={(e) => setEndReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeModal} disabled={ending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!endReason.trim() || ending}
                loading={ending}
                onClick={handleConfirm}
              >
                {modalTitle(modal)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </DashboardLayout>
  );
}
