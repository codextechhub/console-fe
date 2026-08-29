import { useMemo, useState } from "react";
import { RefreshCw, Laptop, Smartphone, Tablet, Radar, UserX, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomInput } from "@/components/custom/custom-input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import { SearchSelect } from "@/components/custom/search-select";
import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from "@/components/ui/combobox";
import { useGetAuthAttemptsQuery } from "@/redux/services/dashboard/security-api";
import { useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import { ActorCell } from "./components/audit-cells";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { cn } from "@/lib/utils";
import type { AuthAttempt } from "@/redux/services/dashboard/security-types";
import { routesPath } from "@/routes/routes-path";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Constants ────────────────────────────────────────────────────────────────

const FAILURE_CODES = [
  "INVALID_CREDENTIALS",
  "SCHOOL_MISMATCH",
  "LOCKED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_NOT_FOUND",
  "MFA_REQUIRED",
] as const;

type DateRange = "1h" | "24h" | "7d" | "30d" | "all";

function dateRangeToFrom(range: DateRange): string {
  if (range === "all") return "";
  const now = new Date();
  const ms: Record<DateRange, number> = { "1h": 3600_000, "24h": 86400_000, "7d": 604800_000, "30d": 2592000_000, all: 0 };
  const d = new Date(now.getTime() - ms[range]);
  return d.toISOString().slice(0, 10);
}

// ── Device helpers ───────────────────────────────────────────────────────────

type DeviceType = "desktop" | "mobile" | "tablet";

function parseUA(ua: string): { type: DeviceType; browser: string; os: string } {
  const type: DeviceType = /tablet|ipad/i.test(ua) ? "tablet" : /mobile|android.*mobile|iphone/i.test(ua) ? "mobile" : "desktop";
  const browser = /edg\//i.test(ua) ? "Edge" : /opr\//i.test(ua) ? "Opera" : /chrome\/[\d]+/i.test(ua) ? "Chrome" : /firefox\/[\d]+/i.test(ua) ? "Firefox" : /safari\/[\d]+/i.test(ua) ? "Safari" : "Browser";
  const os = /windows nt/i.test(ua) ? "Windows" : /mac os x/i.test(ua) ? "Mac OS" : /android/i.test(ua) ? "Android" : /iphone os|ios/i.test(ua) ? "iOS" : /linux/i.test(ua) ? "Linux" : "Unknown";
  return { type, browser, os };
}

const DEVICE_ICONS: Record<DeviceType, React.ElementType> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

// ── Result badge ─────────────────────────────────────────────────────────────

function ResultBadge({ result }: { result: AuthAttempt["result"] }) {
  if (result === "SUCCESS") return <Badge variant="active" className="text-[10px] gap-1 uppercase"><span className="size-1.5 rounded-full bg-green-01" />{result}</Badge>;
  if (result === "FAIL") return <Badge variant="suspended" className="text-[10px] gap-1 uppercase"><span className="size-1.5 rounded-full bg-destructive" />{result}</Badge>;
  return <Badge variant="locked" className="text-[10px] gap-1 uppercase"><span className="size-1.5 rounded-full bg-yellow-01" />{result}</Badge>;
}

// ── Pagination ───────────────────────────────────────────────────────────────

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

// ── Pattern detection ────────────────────────────────────────────────────────

interface Patterns {
  repeatFailsByIp: [string, number][];
  unknownEmails: string[];
  successAfterFails: { email: string; fails: number; at: string }[];
}

function computePatterns(attempts: AuthAttempt[]): Patterns {
  const now = Date.now();

  // Repeated failures by IP (last 1h window within data)
  const failsByIp: Record<string, number> = {};
  attempts.filter((a) => a.result !== "SUCCESS" && now - new Date(a.created_at).getTime() < 3_600_000)
    .forEach((a) => { if (a.ip_address) failsByIp[a.ip_address] = (failsByIp[a.ip_address] || 0) + 1; });
  const repeatFailsByIp = Object.entries(failsByIp).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);

  // Unknown emails - possible enumeration (last 24h in data)
  const unknownEmails = [
    ...new Set(
      attempts
        .filter((a) => a.failure_code === "ACCOUNT_NOT_FOUND" && now - new Date(a.created_at).getTime() < 86_400_000)
        .map((a) => a.email_entered),
    ),
  ];

  // Success after ≥3 prior failures on same email
  const byEmail: Record<string, AuthAttempt[]> = {};
  attempts.forEach((a) => { (byEmail[a.email_entered] = byEmail[a.email_entered] || []).push(a); });
  const successAfterFails: Patterns["successAfterFails"] = [];
  Object.entries(byEmail).forEach(([email, arr]) => {
    const sorted = [...arr].sort((a, b) => a.created_at.localeCompare(b.created_at));
    let recentFails = 0;
    for (const a of sorted) {
      if (a.result === "SUCCESS" && recentFails >= 3) {
        successAfterFails.push({ email, fails: recentFails, at: a.created_at });
        recentFails = 0;
      } else if (a.result !== "SUCCESS") {
        recentFails++;
      } else {
        recentFails = 0;
      }
    }
  });

  return { repeatFailsByIp, unknownEmails, successAfterFails };
}

function PatternSidebar({ attempts, onIpClick }: { attempts: AuthAttempt[]; onIpClick: (ip: string) => void }) {
  const patterns = useMemo(() => computePatterns(attempts), [attempts]);
  const hasAny = patterns.repeatFailsByIp.length > 0 || patterns.unknownEmails.length > 0 || patterns.successAfterFails.length > 0;

  return (
    <div className="rounded-md border bg-white">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Radar className="size-3.5 text-gray-01" />
        <span className="text-xs font-semibold font-mont text-gray-01">Pattern detection</span>
      </div>

      {!hasAny ? (
        <div className="px-4 py-6 text-xs text-gray-01 text-center">No suspicious patterns in current data.</div>
      ) : (
        <div className="divide-y">
          {/* Repeat failures by IP */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">Repeat failures by IP (1h)</p>
            {patterns.repeatFailsByIp.length === 0 ? (
              <p className="text-xs text-gray-01">No suspicious clustering.</p>
            ) : (
              patterns.repeatFailsByIp.map(([ip, n]) => (
                <button
                  key={ip}
                  type="button"
                  onClick={() => onIpClick(ip)}
                  className="flex items-center justify-between w-full py-1.5 border-b last:border-0 hover:bg-gray-50 px-1 rounded text-left"
                >
                  <span className="font-mono text-xs">{ip}</span>
                  <Badge variant="suspended" className="text-[9px] px-1.5">{n} fails</Badge>
                </button>
              ))
            )}
          </div>

          {/* Unknown emails */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">Unknown emails (24h)</p>
            {patterns.unknownEmails.length === 0 ? (
              <p className="text-xs text-gray-01">None.</p>
            ) : (
              patterns.unknownEmails.slice(0, 6).map((em) => (
                <div key={em} className="flex items-center gap-1.5 py-1 text-xs">
                  <UserX className="size-3 text-gray-01 shrink-0" />
                  <span className="font-mono truncate">{em}</span>
                </div>
              ))
            )}
          </div>

          {/* Success after failures */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">Success after ≥3 failures</p>
            {patterns.successAfterFails.length === 0 ? (
              <p className="text-xs text-gray-01">No matches.</p>
            ) : (
              patterns.successAfterFails.map((s, i) => (
                <div key={i} className="py-1.5 border-b last:border-0">
                  <span className="font-mono text-xs">{s.email}</span>
                  <div className="text-[10px] text-gray-01">{s.fails} fails then success · {formatRelativeDate(s.at)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LoginAttempts() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.includes("lockouts") ? "lockouts" : "attempts";

  const [search, setSearch] = useState("");
  const [ipSearch, setIpSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [failureCodeFilter, setFailureCodeFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("24h");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<AuthAttempt | null>(null);

  const debouncedSearch = useDebounce(search, 600);
  const debouncedIp = useDebounce(ipSearch, 600);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.email = debouncedSearch;
    if (debouncedIp) p.ip_address = debouncedIp;
    if (resultFilter) p.result = resultFilter;
    if (failureCodeFilter) p.failure_code = failureCodeFilter;
    if (schoolFilter) p.school_id = schoolFilter;
    const from = dateRangeToFrom(dateRange);
    if (from) p.date_from = from;
    return p;
  }, [page, debouncedSearch, debouncedIp, resultFilter, failureCodeFilter, dateRange, schoolFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuthAttemptsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const { data: schoolsData } = useGetSchoolsQuery({ page_size: 200 });

  const attempts = data?.data ?? [];
  const schools = schoolsData?.data ?? [];

  const resetPage = () => setPage(1);

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div data-guide="audit-login-attempts.heading" className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Login Attempts & Lockouts</p>
            <p className="text-xs text-gray-01 mt-0.5">Forensic view of authentication outcomes.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="inline-flex bg-white rounded-md p-1 border border-gray-200">
          <button
            type="button"
            onClick={() => navigate(routesPath.PROTECTED.AUDIT.LOGIN_ATTEMPTS)}
            className={cn("px-4 py-1.5 text-xs rounded transition-colors", activeTab === "attempts" ? "bg-blue-600 text-white" : "text-gray-01 hover:bg-gray-100")}
          >
            Login Attempts
          </button>
          <button
            type="button"
            onClick={() => navigate(routesPath.PROTECTED.AUDIT.LOCKOUTS)}
            className={cn("px-4 py-1.5 text-xs rounded transition-colors", activeTab === "lockouts" ? "bg-blue-600 text-white" : "text-gray-01 hover:bg-gray-100")}
          >
            Account Lockouts
          </button>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="flex gap-3 items-center overflow-x-auto pb-1">
          <div className="w-36 shrink-0">
            <SearchSelect
              value={resultFilter}
              onChange={(e) => { setResultFilter(e.target.value); resetPage(); }}
              placeholder="Any result"
              options={[
                { value: "SUCCESS", label: "SUCCESS" },
                { value: "FAIL", label: "FAIL" },
                { value: "BLOCKED", label: "BLOCKED" },
              ]}
            />
          </div>

          <div className="w-52 shrink-0">
            <SearchSelect
              value={failureCodeFilter}
              onChange={(e) => { setFailureCodeFilter(e.target.value); resetPage(); }}
              placeholder="Any failure code"
              options={FAILURE_CODES.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="w-36 shrink-0">
            <SearchSelect
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value as DateRange); resetPage(); }}
              clearable={false}
              options={[
                { value: "1h", label: "Last hour" },
                { value: "24h", label: "Last 24h" },
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "all", label: "All time" },
              ]}
            />
          </div>

          <Combobox
            value={schoolFilter || null}
            onValueChange={(v) => { setSchoolFilter(v ?? ""); resetPage(); }}
          >
            <ComboboxInput
              placeholder="All schools"
              showTrigger
              showClear={!!schoolFilter}
              className="w-48 h-10 shrink-0"
            />
            <ComboboxContent>
              <ComboboxList>
                {schools.map((s) => (
                  <ComboboxItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>No schools found</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          <CustomInput
            id="search-email"
            canSearch
            placeholder="Email contains..."
            className="h-10"
            containerClass="w-48 shrink-0"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />

          <CustomInput
            id="search-ip"
            canSearch
            placeholder="IP contains..."
            className="h-10 font-mono"
            containerClass="w-40 shrink-0"
            value={ipSearch}
            onChange={(e) => { setIpSearch(e.target.value); resetPage(); }}
          />
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md border">
            <p className="text-sm font-medium text-destructive">Failed to load attempts.</p>
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
                        {["When", "Email entered", "User", "School", "IP", "Result", "Failure code", "Device"].map((h, i) => (
                          <th key={i} className="px-3 py-3 text-left text-xs font-semibold font-mont text-gray-01 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-03">
                      {attempts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="h-48 text-center">
                            <p className="text-xs text-gray-01">No login attempts match these filters.</p>
                          </td>
                        </tr>
                      ) : (
                        attempts.map((a) => {
                          const ua = parseUA(a.user_agent || "");
                          const DevIcon = DEVICE_ICONS[ua.type];
                          return (
                            <tr
                              key={a.id}
                              onClick={() => setDrawer(a)}
                              className="hover:bg-primary/5 cursor-pointer transition-colors"
                            >
                              <td className="px-3 py-3 text-xs whitespace-nowrap">{formatRelativeDate(a.created_at)}</td>
                              <td className="px-3 py-3"><span className="font-mono text-xs">{a.email_entered}</span></td>
                              <td className="px-3 py-3">
                                {a.user ? (
                                  <ActorCell label={a.user.full_name || a.user.email} email={a.user.email} userId={a.user.id} />
                                ) : (
                                  <span className="text-xs text-gray-01">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3"><span className="text-xs">{a.school?.name ?? <span className="text-gray-01">-</span>}</span></td>
                              <td className="px-3 py-3"><span className="font-mono text-xs">{a.ip_address ?? "-"}</span></td>
                              <td className="px-3 py-3"><ResultBadge result={a.result} /></td>
                              <td className="px-3 py-3">
                                {a.failure_code ? (
                                  <Badge variant="outline" className="font-mono text-[10px]">{a.failure_code}</Badge>
                                ) : (
                                  <span className="text-xs text-gray-01">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <DevIcon className="size-3.5 text-gray-01 shrink-0" />
                                  <div>
                                    <div className="text-xs">{ua.os}</div>
                                    <div className="text-[10px] text-gray-01">{ua.browser}</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
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

            {/* Pattern detection sidebar */}
            <PatternSidebar
              attempts={attempts}
              onIpClick={(ip) => { setIpSearch(ip); resetPage(); }}
            />
          </div>
        )}

        {/* ── Attempt detail drawer ────────────────────────────────────────── */}
        <Sheet open={!!drawer} onOpenChange={(open) => { if (!open) setDrawer(null); }}>
          <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0" showCloseButton={false}>
            {drawer && (() => {
              const ua = parseUA(drawer.user_agent || "");
              const DevIcon = DEVICE_ICONS[ua.type];
              return (
                <>
                  <SheetHeader className="border-b px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ResultBadge result={drawer.result} />
                          <span className="text-xs text-gray-01">{formatRelativeDate(drawer.created_at)}</span>
                        </div>
                        <SheetTitle className="text-sm font-semibold">Login attempt</SheetTitle>
                      </div>
                      <SheetClose asChild>
                        <button type="button" className="p-1 rounded hover:bg-gray-100 shrink-0">
                          <X className="size-4" />
                        </button>
                      </SheetClose>
                    </div>
                  </SheetHeader>

                  <ScrollArea className="flex-1">
                    <div className="px-4 py-4 space-y-4">
                      {/* Stat strip */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Email", value: drawer.email_entered, mono: true },
                          { label: "IP", value: drawer.ip_address ?? "-", mono: true },
                          { label: "Browser", value: ua.browser },
                          { label: "OS", value: ua.os },
                        ].map(({ label, value, mono }) => (
                          <div key={label} className="rounded-lg border p-3">
                            <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-1">{label}</p>
                            <p className={cn("text-sm font-medium truncate", mono && "font-mono text-xs")}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Device */}
                      <div className="rounded-lg border p-3">
                        <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">Device</p>
                        <div className="flex items-center gap-2">
                          <DevIcon className="size-4 text-gray-01" />
                          <span className="text-sm">{ua.browser} · {ua.os}</span>
                        </div>
                      </div>

                      {/* Resolved user */}
                      {drawer.user && (
                        <div className="rounded-lg border p-3">
                          <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">Resolved to user</p>
                          <div className="flex items-center gap-2">
                            <ActorCell label={drawer.user.full_name || drawer.user.email} email={drawer.user.email} userId={drawer.user.id} />
                            <div>
                              <p className="text-sm font-medium">{drawer.user.full_name || "-"}</p>
                              <p className="text-xs text-gray-01">{drawer.user.email}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Failure code */}
                      {drawer.failure_code && (
                        <div className="rounded-lg border p-3">
                          <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">Failure code</p>
                          <Badge variant="outline" className="font-mono text-xs">{drawer.failure_code}</Badge>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="rounded-lg border p-3">
                        <p className="text-[10px] font-semibold text-gray-01 uppercase tracking-wide mb-2">Metadata</p>
                        <pre className="text-[11px] font-mono bg-gray-50 p-2.5 rounded overflow-x-auto leading-relaxed text-black-01">
                          {JSON.stringify(
                            { id: drawer.id, result: drawer.result, failure_code: drawer.failure_code || null, ip_address: drawer.ip_address, user_agent: drawer.user_agent },
                            null, 2,
                          )}
                        </pre>
                      </div>
                  </div>
                  </ScrollArea>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>

      </main>
    </>
  );
}
