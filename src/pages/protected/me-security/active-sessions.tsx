import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown, ChevronUp, Clock, Eye, EyeOff, Globe, LogIn, LogOut,
  Monitor, RefreshCw, Smartphone, Tablet,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PromptModal from "@/components/modal/prompt-modal";
import {
  useGetMyLoginSessionsQuery,
  useEndMySessionMutation,
} from "@/redux/services/dashboard/security-api";
import { useAppSelector } from "@/redux/store";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import type { LoginSession } from "@/redux/services/dashboard/security-types";
import { toast } from "sonner";

// ── Utilities ─────────────────────────────────────────────────────────────────

type DeviceType = "desktop" | "mobile" | "tablet";

function parseUA(ua: string | null | undefined): { browser: string; os: string; type: DeviceType } {
  if (!ua) return { browser: "—", os: "—", type: "desktop" };
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "—";
  const os =
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Windows/.test(ua) ? "Windows" :
    /Linux/.test(ua) ? "Linux" : "—";
  const type: DeviceType =
    /iPhone|Android.*Mobile/.test(ua) ? "mobile" :
    /iPad/.test(ua) ? "tablet" : "desktop";
  return { browser, os, type };
}

function maskIp(ip: string | null | undefined): string {
  if (!ip) return "—";
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.•••.•••.${parts[3]}`;
}

const DEVICE_ICON: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function endReasonLabel(reason: string): string {
  if (reason === "FORCE_LOGOUT") return "Signed out by admin";
  if (reason === "EXPIRED") return "Expired";
  return "Signed out";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyActiveSessions() {
  const navigate = useNavigate();
  // The backend doesn't expose refresh_jti on session rows; the login
  // response's session_id (persisted in the auth slice) is the identity.
  const sessionId = useAppSelector((s) => s.auth.session_id);
  const isCurrent = (s: LoginSession) => !!sessionId && Number(s.id) === Number(sessionId);

  const [revealedIps, setRevealedIps] = useState<Set<string>>(new Set());
  const [confirmEnd, setConfirmEnd] = useState<LoginSession | null>(null);
  const [confirmEndAll, setConfirmEndAll] = useState(false);
  const [isEndingAll, setIsEndingAll] = useState(false);
  const [showEnded, setShowEnded] = useState(false);

  const {
    data: activeData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetMyLoginSessionsQuery(
    { is_active: "true", page_size: 20 },
    { refetchOnMountOrArgChange: true },
  );
  const { data: endedData } = useGetMyLoginSessionsQuery(
    { is_active: "false", page_size: 5 },
    { refetchOnMountOrArgChange: true },
  );
  const [endMySession, { isLoading: ending }] = useEndMySessionMutation();

  const activeSessions = activeData?.data ?? [];
  const endedSessions = endedData?.data ?? [];
  const otherSessions = activeSessions.filter((s) => !isCurrent(s));

  const toggleRevealIp = (id: string) =>
    setRevealedIps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleEnd = () => {
    if (!confirmEnd) return;
    endMySession({ session_id: confirmEnd.id })
      .unwrap()
      .then(() => {
        toast.success("Session ended.");
        setConfirmEnd(null);
      })
      .catch(() => {});
  };

  const handleEndAllOthers = async () => {
    setIsEndingAll(true);
    try {
      await Promise.allSettled(
        otherSessions.map((s) =>
          endMySession({ session_id: s.id }).unwrap(),
        ),
      );
      toast.success(
        `Signed out of ${otherSessions.length} other session${otherSessions.length !== 1 ? "s" : ""}.`,
      );
      setConfirmEndAll(false);
    } finally {
      setIsEndingAll(false);
    }
  };

  return (
    <DashboardLayout title="Active Sessions">
      <main className="px-4.5 py-6 space-y-5 text-black-01">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold font-mont text-gray-01">Active sessions</p>
            {/* Gap 9 — dynamic count */}
            <p className="text-xs text-gray-01 mt-0.5">
              {activeSessions.length} device{activeSessions.length !== 1 ? "s" : ""} currently signed in
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Gap 7 — sign out all other sessions. Hidden when the current
                session can't be identified (no persisted session_id), because
                "others" would then include this device. */}
            {!!sessionId && otherSessions.length > 0 && (
              <Button variant="white" size="sm" onClick={() => setConfirmEndAll(true)}>
                <LogOut className="size-3.5" />
                Sign out of all other sessions
              </Button>
            )}
            <Button variant="white" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Gap 1 — card grid (replaces table) */}
        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load sessions.</p>
          </div>
        ) : isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-md p-4 h-44 animate-pulse" />
            ))}
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="flex h-40 items-center justify-center bg-white rounded-md">
            <p className="text-sm text-gray-01">No active sessions found.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeSessions.map((s) => {
              const ua = parseUA(s.user_agent);
              const DevIcon = DEVICE_ICON[ua.type];
              const current = isCurrent(s);
              const ipRevealed = revealedIps.has(s.id);

              return (
                <div
                  key={s.id}
                  className={`bg-white border rounded-md p-4 flex flex-col gap-3 ${
                    current
                      ? "border-green-500 ring-1 ring-green-500"
                      : "border-gray-100"
                  }`}
                >
                  {/* Gap 2 — device icon + Gap 3 — "This device" badge + Gap 4 — browser/OS */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <DevIcon
                        size={20}
                        strokeWidth={1.5}
                        className={current ? "text-green-500" : "text-gray-400"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm leading-tight truncate">
                          {ua.browser}
                        </span>
                        {current && (
                          <Badge variant="active" className="text-[10px] gap-1 py-0 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            This device
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-01 mt-0.5">{ua.os}</p>
                    </div>
                  </div>

                  {/* Gap 5 — two timestamps + Gap 6 — IP masking */}
                  <div className="flex flex-col gap-1.5 text-xs text-gray-01">
                    <div className="flex items-center gap-2">
                      <Globe size={11} className="shrink-0" />
                      <span className="font-mono">
                        {ipRevealed ? (s.ip_address ?? "—") : maskIp(s.ip_address)}
                      </span>
                      <button
                        onClick={() => toggleRevealIp(s.id)}
                        className="ml-auto text-gray-300 hover:text-gray-500 transition"
                        aria-label={ipRevealed ? "Hide IP" : "Show IP"}
                      >
                        {ipRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={11} className="shrink-0" />
                      <span>Last active {formatRelativeDate(s.last_seen_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LogIn size={11} className="shrink-0" />
                      <span>Signed in {formatRelativeDate(s.created_at)}</span>
                    </div>
                  </div>

                  {/* Gap 11 — full-width sign-out button */}
                  {current ? (
                    <button
                      disabled
                      className="w-full text-xs py-1.5 px-3 rounded border border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed"
                    >
                      Current session
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmEnd(s)}
                      className="w-full text-xs py-1.5 px-3 rounded border border-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition flex items-center justify-center gap-1.5"
                    >
                      <LogOut size={12} />
                      Sign out
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Recently ended sessions (collapsible) */}
        {endedSessions.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1.5 text-sm text-gray-01 font-medium"
              onClick={() => setShowEnded((v) => !v)}
            >
              {showEnded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Recently ended sessions ({endedSessions.length})
            </button>
            {showEnded && (
              <>
                <div className="mt-3 bg-white rounded-md overflow-hidden border border-gray-100">
                  {endedSessions.map((s, i) => {
                    const ua = parseUA(s.user_agent);
                    const DevIcon = DEVICE_ICON[ua.type];
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 px-4 py-2.5 text-xs ${
                          i < endedSessions.length - 1 ? "border-b border-gray-50" : ""
                        }`}
                      >
                        <DevIcon size={14} className="text-gray-300 shrink-0" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ua.browser}</p>
                          <p className="text-gray-01">{ua.os} · {maskIp(s.ip_address)}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {endReasonLabel(s.end_reason)}
                        </Badge>
                        <span className="text-gray-01 shrink-0 ml-1">
                          {s.ended_at ? formatRelativeDate(s.ended_at) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.LOGIN_HISTORY)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  View full history →
                </button>
              </>
            )}
          </div>
        )}

        {/* Sign out single session */}
        <PromptModal
          isOpen={!!confirmEnd}
          onClose={() => setConfirmEnd(null)}
          onConfirm={handleEnd}
          title="Sign out from device"
          description={`Sign out from ${confirmEnd?.device_label || "this device"}? This will end the session immediately.`}
          onConfirmText="Sign out"
          onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
          canCancel
          loading={ending}
        />

        {/* Sign out all other sessions */}
        <PromptModal
          isOpen={confirmEndAll}
          onClose={() => setConfirmEndAll(false)}
          onConfirm={handleEndAllOthers}
          title="Sign out of all other sessions"
          description={`This will sign you out of ${otherSessions.length} other session${otherSessions.length !== 1 ? "s" : ""}. Your current session on this device stays signed in.`}
          onConfirmText="Sign out everywhere else"
          onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
          canCancel
          loading={isEndingAll}
        />
      </main>
    </DashboardLayout>
  );
}
