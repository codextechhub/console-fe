import { useMemo, useState } from "react";
import { KeyRound, Mail, RefreshCw, Search, Timer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchSelect } from "@/components/custom/search-select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useGetAuditEventsQuery } from "@/redux/services/dashboard/audit-api";
import {
  useGetPendingResetsQuery,
  useRevokeResetMutation,
  useResendPasswordResetMutation,
} from "@/redux/services/dashboard/security-api";
import {
  useGetTeamMembersQuery,
  useAdminPasswordResetMutation,
  useChangeUserEmailMutation,
} from "@/redux/services/dashboard/team-mgt-api";
import { ActorCell } from "./components/audit-cells";
import { formatRelativeDate } from "@/utils/helpers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AuditEventListItem, AuditSeverity } from "@/redux/services/dashboard/audit-types";
import type { TeamMember } from "@/redux/services/dashboard/dashboard-types";
import { FRIENDLY_ACTION } from "./audit-constants";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { PageShell } from "@/components/layout/page-shell";

// ── Constants ────────────────────────────────────────────────────────────────

const PW_ACTIONS = [
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET",
  "PASSWORD_CHANGED",
  "EMAIL_CHANGED",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_REACTIVATED",
  "ACCOUNT_DEACTIVATED",
  "TOKEN_REVOKED",
  "FORCE_LOGOUT",
  "USER_INVITED",
  "USER_CREATED",
] as const;


type DateRange = "24h" | "7d" | "30d" | "all";

function dateRangeToFrom(range: DateRange): string {
  if (range === "all") return "";
  const ms: Record<DateRange, number> = { "24h": 86400_000, "7d": 604800_000, "30d": 2592000_000, all: 0 };
  return new Date(Date.now() - ms[range]).toISOString().slice(0, 10);
}

// ── Severity dot ─────────────────────────────────────────────────────────────

const SEV_DOT: Record<AuditSeverity, string> = {
  INFO:     "bg-blue-400",
  WARNING:  "bg-yellow-01",
  CRITICAL: "bg-destructive",
};

// ── Countdown ────────────────────────────────────────────────────────────────

function formatCountdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | string)[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);
  return (
    <div className="flex items-center justify-end gap-2 mt-3.5">
      <button onClick={() => currentPage > 1 && onPageChange(currentPage - 1)} disabled={currentPage <= 1} className={cn("grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage <= 1 ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer")}>Prev</button>
      {pages.map((p, i) => typeof p === "string" ? <span key={`e-${i}`} className="px-2 text-black-02">...</span> : (
        <button key={p} onClick={() => onPageChange(p)} className={cn("grid size-7.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage === p ? "bg-primary text-white" : "text-black-02 hover:bg-gray-100")}>{p}</button>
      ))}
      <button onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={cn("grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer")}>Next</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PasswordActivity() {
  const [actionFilter, setActionFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Quick admin actions state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, module_key: "IDENTITY" };
    if (actionFilter) p.action_type = actionFilter;
    if (statusFilter) p.status = statusFilter;
    const from = dateRangeToFrom(dateRange);
    if (from) p.date_from = from;
    return p;
  }, [page, actionFilter, dateRange, statusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditEventsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const { data: resetsData, refetch: refetchResets } = useGetPendingResetsQuery();
  const [resetTenantFilter, setResetTenantFilter] = useState("all");
  const [revokeReset, { isLoading: revoking }] = useRevokeResetMutation();
  const [resendReset, { isLoading: resending }] = useResendPasswordResetMutation();
  const { data: searchResults, isFetching: searching } = useGetTeamMembersQuery(
    { search: searchQuery, page_size: 5 },
    { skip: !searchQuery },
  );
  const [quickReset, { isLoading: quickResetting }] = useAdminPasswordResetMutation();
  const [changeEmail, { isLoading: changingEmail }] = useChangeUserEmailMutation();

  const events = data?.data ?? [];
  // Memoised because ``?? []`` mints a new array on every render, which would
  // make the tenant list below recompute each time and defeat its own memo.
  const pendingResets = useMemo(() => resetsData?.data ?? [], [resetsData]);

  // The pending list spans every tenant on the platform. Its tenants are read
  // off the rows themselves rather than fetched: the list is small (one active
  // reset per user at most), and options taken from a separate school lookup
  // would offer schools with nothing pending and answer with an empty panel.
  const resetTenants = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of pendingResets) seen.set(r.tenant_slug, r.tenant_name);
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [pendingResets]);

  // One tenant is the common case and a picker holding a single entry is
  // noise, so the control appears only once there is a choice to make.
  const showTenantFilter = resetTenants.length > 1;
  const activeTenant = showTenantFilter ? resetTenantFilter : "all";
  const visibleResets =
    activeTenant === "all"
      ? pendingResets
      : pendingResets.filter((r) => r.tenant_slug === activeTenant);

  const resetPage = () => setPage(1);

  const handleRevoke = (id: number) => {
    revokeReset({ id })
      .unwrap()
      .then(() => toast.success("Reset token revoked."))
      .catch(() => {});
  };

  const handleResend = (userId: string) => {
    resendReset({ user_id: userId })
      .unwrap()
      .then(() => toast.success("Password reset email resent."))
      .catch(() => {});
  };

  return (
    <>
      <PageShell className="space-y-5 text-black-01">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div data-guide="audit-password-activity.heading" className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Password & Account Activity</p>
            <p className="text-xs text-gray-01 mt-0.5">Identity-related events across XVS.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => { refetch(); refetchResets(); }} disabled={isFetching}>
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="flex gap-3 items-center overflow-x-auto pb-1">
          <div className="w-60 shrink-0">
            <SearchSelect
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); resetPage(); }}
              placeholder="All actions"
              options={PW_ACTIONS.map((a) => ({ value: a, label: FRIENDLY_ACTION[a] ?? a }))}
            />
          </div>

          <div className="w-36 shrink-0">
            <SearchSelect
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value as DateRange); resetPage(); }}
              clearable={false}
              options={[
                { value: "24h", label: "Last 24h" },
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "all", label: "All time" },
              ]}
            />
          </div>

          <div className="w-36 shrink-0">
            <SearchSelect
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
              placeholder="Any status"
              options={[
                { value: "SUCCESS", label: "SUCCESS" },
                { value: "FAILED", label: "FAILED" },
                { value: "DENIED", label: "DENIED" },
              ]}
            />
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md border">
            <p className="text-sm font-medium text-destructive">Failed to load events.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">

            {/* Table */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex h-60 items-center justify-center bg-white rounded-md border">
                  <div className="loader" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F1F1F1] border-b">
                        {["When", "Action", "Target user", "Actor", "School", "IP", "Status"].map((h, i) => (
                          <th key={i} className="px-3 py-3 text-left text-xs font-semibold font-mont text-gray-01 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-03">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="h-48 text-center">
                            <p className="text-xs text-gray-01">No activity in this range.</p>
                          </td>
                        </tr>
                      ) : (
                        events.map((e) => <ActivityRow key={e.id} event={e} />)
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                currentPage={data?.pagination?.currentPage ?? 1}
                totalPages={data?.pagination?.totalPages ?? 0}
                onPageChange={setPage}
              />
            </div>

            {/* ── Sidebar column ── */}
            <div className="space-y-4">

            {/* Quick admin actions panel - requires platform.team.update */}
            <PermissionGate permission={P.MODIFY_TEAM_MEMBER}>
            <div className="rounded-md border bg-white">
              <div className="px-4 py-3 border-b">
                <p className="text-xs font-semibold font-mont text-gray-01">Admin actions</p>
                <p className="text-[10px] text-gray-01 mt-0.5">Search a user and perform security actions</p>
              </div>
              <div className="px-4 py-3 space-y-3">
                {/* Search input */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { setSearchQuery(searchInput); setSelectedUser(null); } }}
                    placeholder="Name or email…"
                    className="flex-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    variant="white"
                    className="h-7 px-2 shrink-0"
                    disabled={!searchInput.trim()}
                    onClick={() => { setSearchQuery(searchInput); setSelectedUser(null); }}
                  >
                    {searching ? <RefreshCw className="size-3 animate-spin" /> : <Search className="size-3" />}
                  </Button>
                </div>

                {/* Search results */}
                {searchQuery && !searching && (
                  <div className="space-y-1">
                    {(searchResults?.data ?? []).length === 0 ? (
                      <p className="text-[10px] text-gray-01 text-center py-2">No users found.</p>
                    ) : (
                      (searchResults?.data ?? []).map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                            selectedUser?.id === u.id
                              ? "bg-pry-01 border border-primary/20"
                              : "hover:bg-gray-50 border border-transparent",
                          )}
                        >
                          <ActorCell label={u.full_name || u.email} email={u.email} userId={u.id} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{u.full_name || u.email}</p>
                            <p className="text-[10px] text-gray-01 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Actions for selected user */}
                {selectedUser && (
                  <div className="pt-1 border-t border-gray-100 space-y-1.5">
                    <p className="text-[10px] text-gray-01">
                      Actions for <span className="font-medium text-black-01">{selectedUser.full_name || selectedUser.email}</span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px] justify-start gap-1.5"
                      disabled={quickResetting}
                      loading={quickResetting}
                      onClick={() =>
                        quickReset(selectedUser.id)
                          .unwrap()
                          .then(() => toast.success("Password reset email sent."))
                          .catch(() => {})
                      }
                    >
                      <KeyRound className="size-3" /> Send password reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px] justify-start gap-1.5"
                      onClick={() => setEmailModal(true)}
                    >
                      <Mail className="size-3" /> Change email address
                    </Button>
                  </div>
                )}
              </div>
            </div>

            </PermissionGate>

            {/* Pending resets sidebar */}
            <div className="rounded-md border bg-white">
              <div className="px-4 py-3 border-b">
                <p className="text-xs font-semibold font-mont text-gray-01">Pending password resets</p>
                <p className="text-[10px] text-gray-01 mt-0.5">Active reset tokens awaiting use</p>
                {showTenantFilter && (
                  <select
                    className="mt-2 w-full rounded border px-2 py-1 text-[10px] text-gray-01 bg-white"
                    value={resetTenantFilter}
                    onChange={(e) => setResetTenantFilter(e.target.value)}
                    aria-label="Filter pending resets by school"
                  >
                    <option value="all">All schools ({pendingResets.length})</option>
                    {resetTenants.map(([slug, name]) => (
                      <option key={slug} value={slug}>{name}</option>
                    ))}
                  </select>
                )}
              </div>

              {visibleResets.length === 0 ? (
                <div className="px-4 py-6 text-xs text-gray-01 text-center">No pending resets.</div>
              ) : (
                <div className="divide-y">
                  {visibleResets.map((r) => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <ActorCell
                          label={r.user.full_name || r.user.email}
                          email={r.user.email}
                          userId={r.user.id}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{r.user.full_name || r.user.email}</p>
                          {activeTenant === "all" && (
                            <p className="text-[10px] font-medium text-gray-01 truncate">{r.tenant_name}</p>
                          )}
                          <p className="text-[10px] text-gray-01">
                            Requested {r.requested_by === "SELF" ? "by user" : "by admin"} · {formatRelativeDate(r.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-01">
                        <Timer className="size-3 shrink-0" />
                        <span>Expires in {formatCountdown(r.expires_at)}</span>
                        {r.requested_ip && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{r.requested_ip}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          disabled={revoking}
                          onClick={() => handleRevoke(r.id)}
                        >
                          <XCircle className="size-3" /> Revoke
                        </Button>
                        {r.requested_by === "ADMIN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            disabled={resending}
                            onClick={() => handleResend(r.user.id)}
                          >
                            <Mail className="size-3" /> Resend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            </div>{/* end sidebar column */}

          </div>
        )}
      </PageShell>

      {/* Change email modal */}
      <Dialog open={emailModal} onOpenChange={(open) => { setEmailModal(open); if (!open) setNewEmail(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Change email address</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-01">
              Changing the email for <span className="font-medium text-black-01">{selectedUser?.full_name || selectedUser?.email}</span>. Their sessions will be ended and they must sign in with the new address.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-01">New email address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@school.edu"
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="white" size="sm" onClick={() => { setEmailModal(false); setNewEmail(""); }} disabled={changingEmail}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newEmail.includes("@") || changingEmail}
              loading={changingEmail}
              onClick={() => {
                if (!selectedUser) return;
                changeEmail({ user_id: selectedUser.id, email: newEmail })
                  .unwrap()
                  .then(() => {
                    toast.success("Email updated successfully.");
                    setEmailModal(false);
                    setNewEmail("");
                  })
                  .catch(() => {});
              }}
            >
              Update email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Row component (extracted to keep the table readable) ─────────────────────

function ActivityRow({ event: e }: { event: AuditEventListItem }) {
  const isSelf = e.actor_user && e.actor_user.id === e.entity_id;

  return (
    <tr className="hover:bg-primary/5 transition-colors">
      <td className="px-3 py-3 text-xs whitespace-nowrap">{formatRelativeDate(e.event_at)}</td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full shrink-0", SEV_DOT[e.severity] ?? "bg-blue-400")} />
          <span className="text-xs font-medium">{FRIENDLY_ACTION[e.action_type] ?? e.action_type}</span>
        </div>
      </td>

      {/* Target user */}
      <td className="px-3 py-3">
        {e.entity_type === "User" && (e.entity_user || e.entity_label) ? (
          <ActorCell
            label={e.entity_user?.full_name || e.entity_user?.email || e.entity_label || ""}
            email={e.entity_user?.email ?? undefined}
            userId={e.entity_user?.id}
          />
        ) : (
          <span className="text-xs text-gray-01">-</span>
        )}
      </td>

      {/* Actor */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <ActorCell
            label={e.actor_user?.full_name || e.actor_user?.email || e.actor_label || "System"}
            email={e.actor_user?.email}
            userId={e.actor_user?.id}
          />
          {isSelf && (
            <Badge variant="outline" className="text-[9px] px-1 h-4">self</Badge>
          )}
        </div>
      </td>

      {/* School - not available in list serializer, show - */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-01">-</span>
      </td>

      {/* IP */}
      <td className="px-3 py-3">
        <span className="font-mono text-xs">{e.ip_address ?? "-"}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <Badge
          variant={e.status === "SUCCESS" ? "active" : e.status === "DENIED" ? "locked" : "suspended"}
          className="text-[10px] uppercase"
        >
          {e.status}
        </Badge>
      </td>
    </tr>
  );
}
