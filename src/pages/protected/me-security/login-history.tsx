import { useState, useMemo } from "react";
import { useNow } from "@/hooks/use-now";
import {
  Check, CornerDownLeft, Eye, EyeOff, Flag,
  LogOut, Monitor, RefreshCw, ShieldX, Smartphone, Tablet, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetMyAuthAttemptsQuery,
  useGetMyLoginSessionsQuery,
  useEndAllMySessionsMutation,
} from "@/redux/services/dashboard/security-api";
import { useAppSelector } from "@/redux/store";
import { formatRelativeDate } from "@/utils/helpers";
import { useNavigate } from "react-router";
import { routesPath } from "@/routes/routes-path";
import { toast } from "sonner";

// ── Utilities ─────────────────────────────────────────────────────────────────

type DeviceType = "desktop" | "mobile" | "tablet";

function parseUA(ua: string | null | undefined): { browser: string; os: string; type: DeviceType } {
  if (!ua) return { browser: "-", os: "-", type: "desktop" };
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "-";
  const os =
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Windows/.test(ua) ? "Windows" :
    /Linux/.test(ua) ? "Linux" : "-";
  const type: DeviceType =
    /iPhone|Android.*Mobile/.test(ua) ? "mobile" :
    /iPad/.test(ua) ? "tablet" : "desktop";
  return { browser, os, type };
}

function maskIp(ip: string | null | undefined): string {
  if (!ip) return "-";
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.•••.•••.${parts[3]}`;
}

const friendlyFailure = (code: string | null | undefined): string =>
  ({
    INVALID_CREDENTIALS: "Wrong password",
    SCHOOL_MISMATCH: "School mismatch",
    LOCKED: "Account locked",
    ACCOUNT_SUSPENDED: "Account suspended",
    ACCOUNT_NOT_FOUND: "Account not found",
    MFA_REQUIRED: "MFA required",
  } as Record<string, string>)[code ?? ""] ?? (code || "-");

const DEVICE_ICON: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

type EventKind = "signin" | "failed" | "blocked" | "signout" | "force";

const KIND_ICON: Record<EventKind, typeof Check> = {
  signin: Check,
  failed: X,
  blocked: ShieldX,
  signout: CornerDownLeft,
  force: LogOut,
};

const KIND_COLOR: Record<EventKind, string> = {
  signin: "text-green-500",
  failed: "text-destructive",
  blocked: "text-destructive",
  signout: "text-gray-400",
  force: "text-orange-500",
};

const KIND_LABEL: Record<EventKind, string> = {
  signin: "Sign-in",
  failed: "Failed attempt",
  blocked: "Blocked",
  signout: "Signed out",
  force: "Signed out by admin",
};

interface TimelineItem {
  id: string;
  ts: string;
  kind: EventKind;
  failure_code?: string;
  ip: string | null;
  ua: string | null | undefined;
  device_label?: string;
}

const DATE_RANGES = [
  { v: "7d", ms: 7 * 86400_000 },
  { v: "30d", ms: 30 * 86400_000 },
  { v: "90d", ms: 90 * 86400_000 },
  { v: "all", ms: Infinity },
] as const;

const FILTERS = ["All", "Successful", "Failed", "Blocked"] as const;
type Filter = (typeof FILTERS)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyLoginHistory() {
  const navigate = useNavigate();
  const impersonation = useAppSelector((s) => s.auth.impersonation);

  const [filter, setFilter] = useState<Filter>("All");
  const [range, setRange] = useState("30d");
  const [revealedIps, setRevealedIps] = useState<Set<string>>(new Set());
  const [reportModal, setReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const { data: attemptsData, isLoading, isError, refetch, isFetching } = useGetMyAuthAttemptsQuery(
    { page_size: 50 },
    { refetchOnMountOrArgChange: true },
  );
  const { data: endedSessionsData } = useGetMyLoginSessionsQuery(
    { is_active: "false", page_size: 20 },
    { refetchOnMountOrArgChange: true },
  );
  const [endAllMySessions] = useEndAllMySessionsMutation();

  const attempts = useMemo(() => attemptsData?.data ?? [], [attemptsData]);
  const endedSessions = useMemo(() => endedSessionsData?.data ?? [], [endedSessionsData]);

  const allItems = useMemo((): TimelineItem[] => {
    const list: TimelineItem[] = [];
    attempts.forEach((a) => {
      list.push({
        id: a.id,
        ts: a.created_at,
        kind: a.result === "SUCCESS" ? "signin" : a.result === "BLOCKED" ? "blocked" : "failed",
        failure_code: a.failure_code,
        ip: a.ip_address,
        ua: a.user_agent,
      });
    });
    endedSessions.forEach((s) => {
      list.push({
        id: `${s.id}-end`,
        ts: s.ended_at ?? s.created_at,
        kind: s.end_reason === "FORCE_LOGOUT" ? "force" : "signout",
        ip: s.ip_address,
        ua: s.user_agent,
        device_label: s.device_label,
      });
    });
    return list.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [attempts, endedSessions]);

  const rangeMs = DATE_RANGES.find((r) => r.v === range)?.ms ?? Infinity;
  const now = useNow();

  const filteredItems = useMemo(
    () =>
      allItems
        .filter((i) => rangeMs === Infinity || now - new Date(i.ts).getTime() < rangeMs)
        .filter((i) => {
          if (filter === "All") return true;
          if (filter === "Successful") return i.kind === "signin";
          if (filter === "Failed") return i.kind === "failed";
          if (filter === "Blocked") return i.kind === "blocked";
          return true;
        }),
    [allItems, filter, rangeMs, now],
  );

  const monthAttempts = useMemo(
    () => attempts.filter((a) => now - new Date(a.created_at).getTime() < 30 * 86400_000),
    [attempts, now],
  );
  const stats = useMemo(
    () => ({
      signins: monthAttempts.filter((a) => a.result === "SUCCESS").length,
      failed: monthAttempts.filter((a) => a.result !== "SUCCESS").length,
      devices: new Set(monthAttempts.map((a) => parseUA(a.user_agent).browser)).size,
      ips: new Set(monthAttempts.map((a) => a.ip_address).filter(Boolean)).size,
    }),
    [monthAttempts],
  );

  const toggleRevealIp = (id: string) =>
    setRevealedIps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleReport = async () => {
    setIsReporting(true);
    try {
      await endAllMySessions().unwrap();
      toast.success("All sessions ended. Sign in again and change your password.");
      if (!impersonation) navigate(routesPath.AUTH.LOGIN);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsReporting(false);
      setReportModal(false);
    }
  };

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold font-mont text-gray-01">Login history</p>
            <p className="text-xs text-gray-01 mt-0.5">
              A complete record of sign-ins and sign-outs on your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="white" size="sm" onClick={() => setReportModal(true)}>
              <Flag className="size-3.5" />
              Something look wrong?
            </Button>
            <Button variant="white" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main content: table + sidebar */}
        {/* Phone: month-stats stack above the list (2×2); sm+: 200px sidebar. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-3">

            {/* Filter + range chip rows */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs rounded-full border transition ${
                      filter === f
                        ? "bg-black-01 text-white border-black-01"
                        : "bg-white text-gray-01 border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-1">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.v}
                    onClick={() => setRange(r.v)}
                    className={`px-3 py-1 text-xs rounded-full border transition ${
                      range === r.v
                        ? "bg-black-01 text-white border-black-01"
                        : "bg-white text-gray-01 border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {r.v === "all" ? "All" : r.v}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {isError ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 bg-white rounded-md border border-gray-100">
                <p className="text-sm font-medium text-destructive">Failed to load login history.</p>
              </div>
            ) : isLoading ? (
              <div className="bg-white rounded-md border border-gray-100 h-48 animate-pulse" />
            ) : (
              <div className="bg-white rounded-md border border-gray-100 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="w-9 px-3 py-2.5" />
                      <th className="px-3 py-2.5 text-left font-medium text-gray-01 whitespace-nowrap">Event</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-01 whitespace-nowrap">When</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-01 whitespace-nowrap">Device</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-01 whitespace-nowrap">IP</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-01 whitespace-nowrap">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-gray-01">
                          No activity in this range.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const ua = parseUA(item.ua);
                        const DevIcon = DEVICE_ICON[ua.type];
                        const KindIcon = KIND_ICON[item.kind];
                        const ipRevealed = revealedIps.has(item.id);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-grid place-items-center w-[22px] h-[22px] rounded-md bg-gray-50 ${KIND_COLOR[item.kind]}`}
                              >
                                <KindIcon size={11} strokeWidth={2.5} />
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                              {KIND_LABEL[item.kind]}
                            </td>
                            <td className="px-3 py-2.5 text-gray-01 whitespace-nowrap">
                              {formatRelativeDate(item.ts)}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="flex items-center gap-1.5">
                                <DevIcon size={12} className="text-gray-400 shrink-0" strokeWidth={1.5} />
                                <span className="flex flex-col leading-tight">
                                  <span className="font-medium truncate max-w-[120px]">{ua.browser}</span>
                                  <span className="text-gray-01 truncate max-w-[120px]">{ua.os}</span>
                                </span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="flex items-center gap-1.5">
                                <span className="font-mono">
                                  {ipRevealed ? (item.ip ?? "-") : maskIp(item.ip)}
                                </span>
                                <button
                                  onClick={() => toggleRevealIp(item.id)}
                                  className="text-gray-300 hover:text-gray-500 transition shrink-0"
                                  aria-label={ipRevealed ? "Hide IP" : "Show IP"}
                                >
                                  {ipRevealed ? <EyeOff size={10} /> : <Eye size={10} />}
                                </button>
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {item.kind === "signin" && (
                                <Badge variant="active" className="text-[10px]">Success</Badge>
                              )}
                              {item.kind === "failed" && (
                                <Badge variant="rejected" className="text-[10px]">
                                  {friendlyFailure(item.failure_code)}
                                </Badge>
                              )}
                              {item.kind === "blocked" && (
                                <Badge variant="locked" className="text-[10px]">Blocked</Badge>
                              )}
                              {item.kind === "force" && (
                                <Badge variant="suspended" className="text-[10px]">Admin ended</Badge>
                              )}
                              {item.kind === "signout" && (
                                <Badge variant="outline" className="text-[10px]">You signed out</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* "This month" stats sidebar */}
          <div className="order-first grid w-full shrink-0 grid-cols-2 gap-3 self-start rounded-md border border-gray-100 bg-white p-4 sm:order-none sm:flex sm:w-[200px] sm:flex-col">
            <p className="col-span-2 text-[10px] font-semibold text-gray-01 uppercase tracking-wide">This month</p>
            <div>
              <p className="text-xs text-gray-01">Sign-ins</p>
              <p className="text-xl font-semibold tabular-nums">{stats.signins}</p>
            </div>
            <div>
              <p className="text-xs text-gray-01">Failed attempts</p>
              <p className={`text-xl font-semibold tabular-nums ${stats.failed > 0 ? "text-amber-600" : ""}`}>
                {stats.failed}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-01">Devices used</p>
              <p className="text-xl font-semibold tabular-nums">{stats.devices}</p>
            </div>
            <div>
              <p className="text-xs text-gray-01">Distinct IPs</p>
              <p className="text-xl font-semibold tabular-nums">{stats.ips}</p>
            </div>
          </div>
        </div>

        {/* "Something look wrong?" report modal */}
        <Dialog open={reportModal} onOpenChange={setReportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Flag className="size-4 text-destructive" />
                Report unrecognized activity
              </DialogTitle>
            </DialogHeader>
            <div className="text-sm text-gray-01 space-y-3">
              <p>If you didn't sign in from one of these devices or IPs, we'll immediately:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>End every active session on your account</li>
                <li>Sign you out everywhere</li>
              </ul>
              <p>We recommend changing your password after signing back in.</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="white" size="sm" onClick={() => setReportModal(false)} disabled={isReporting}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-error-01 text-white hover:bg-error-01/90"
                onClick={handleReport}
                disabled={isReporting}
              >
                {isReporting ? "Securing…" : "Yes, secure my account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
