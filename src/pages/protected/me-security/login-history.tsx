import { useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import { useGetAuthAttemptsQuery } from "@/redux/services/dashboard/securityApi";
import { useAppSelector } from "@/redux/store";
import { formatRelativeDate } from "@/utils/helpers";

const TABLE_HEADERS = ["When", "IP", "Result", "Failure code", "Device"];

const RESULT_TONE: Record<string, "active" | "suspended" | "locked"> = {
  SUCCESS: "active",
  FAIL: "suspended",
  BLOCKED: "locked",
};

export default function MyLoginHistory() {
  const user = useAppSelector((s) => s.auth.user);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuthAttemptsQuery(
    { page, ...(user?.id ? { user_id: user.id } : {}) },
    { refetchOnMountOrArgChange: true },
  );

  const attempts = data?.data ?? [];

  const tableData = attempts.map((a) => ({
    when: <span className="text-xs">{formatRelativeDate(a.created_at)}</span>,
    ip: <span className="font-mono text-xs">{a.ip_address ?? "—"}</span>,
    result: (
      <Badge variant={(RESULT_TONE[a.result] ?? "inactive") as any} className="text-[10px] uppercase">
        {a.result}
      </Badge>
    ),
    failure_code: <span className="font-mono text-xs text-gray-01">{a.failure_code || "—"}</span>,
    device: <span className="text-xs text-gray-01">{a.user_agent?.slice(0, 60) || "—"}</span>,
  }));

  return (
    <DashboardLayout title="Login History">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Login history</p>
            <p className="text-xs text-gray-01 mt-0.5">Recent sign-in attempts on your account.</p>
          </div>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load login history.</p>
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
