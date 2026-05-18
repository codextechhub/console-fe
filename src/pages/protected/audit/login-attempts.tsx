import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { useGetAuthAttemptsQuery } from "@/redux/services/dashboard/securityApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";

const TABLE_HEADERS = ["When", "Email entered", "User", "School", "IP", "Result", "Failure code"];

const RESULT_TONE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  SUCCESS: "active",
  FAIL: "suspended",
  BLOCKED: "locked",
};

export default function LoginAttempts() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [page, setPage] = useState(1);
  const [resultFilter, setResultFilter] = useState<"" | "SUCCESS" | "FAIL" | "BLOCKED">("");

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.email = debouncedSearch;
    if (resultFilter) p.result = resultFilter;
    return p;
  }, [page, debouncedSearch, resultFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuthAttemptsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const attempts = data?.data ?? [];

  const tableData = attempts.map((a) => ({
    when: <span className="text-xs">{formatRelativeDate(a.created_at)}</span>,
    email: <span className="font-mono text-xs">{a.email_entered}</span>,
    user: <span className="text-xs">{a.user?.email ?? "—"}</span>,
    school: <span className="text-xs">{a.school?.name ?? "—"}</span>,
    ip: <span className="font-mono text-xs">{a.ip_address ?? "—"}</span>,
    result: (
      <Badge variant={RESULT_TONE[a.result] as any} className="text-[10px] uppercase">
        {a.result}
      </Badge>
    ),
    failure_code: <span className="font-mono text-xs text-gray-01">{a.failure_code || "—"}</span>,
  }));

  return (
    <DashboardLayout title="Login Attempts">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Login Attempts</p>
            <p className="text-xs text-gray-01 mt-0.5">Forensic view of every authentication outcome.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <CustomInput
            id="search-attempts"
            canSearch
            placeholder="Search by email..."
            className="h-10"
            containerClass="w-full sm:max-w-[320px]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <div className="inline-flex bg-white rounded-md p-1 border border-gray-200">
            {([
              { v: "", l: "All" },
              { v: "SUCCESS", l: "Success" },
              { v: "FAIL", l: "Failed" },
              { v: "BLOCKED", l: "Blocked" },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => { setResultFilter(opt.v as any); setPage(1); }}
                className={`px-3 py-1 text-xs rounded ${
                  resultFilter === opt.v ? "bg-blue-600 text-white" : "text-gray-01"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load attempts.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            dropDown={false}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(p) => setPage(p as number)}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
