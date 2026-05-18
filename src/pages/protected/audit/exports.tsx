import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { useGetAuditExportsQuery, useGetAuditExportDetailQuery } from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routesPath";
import { P } from "@/permissions";

const TABLE_HEADERS = ["Requested", "Requested by", "Status", "Format", "Rows", "File", "Completed", "Expires", "Action"];

const STATUS_TONE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  COMPLETED: "active",
  RUNNING: "locked",
  PENDING: "locked",
  FAILED: "suspended",
  EXPIRED: "inactive",
};

export default function AuditExports() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditExportsQuery(
    { page },
    { refetchOnMountOrArgChange: true },
  );
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const { data: detailData } = useGetAuditExportDetailQuery(downloadId ?? "", { skip: !downloadId });

  // When the detail loads, trigger the browser download from the inline CSV stored in `file_path`.
  if (detailData?.data && downloadId) {
    const job = detailData.data;
    if (job.file_path && job.file_name && typeof window !== "undefined") {
      const blob = new Blob([job.file_path], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = job.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadId(null);
    }
  }

  const exports = data?.data ?? [];

  const tableData = exports.map((j) => ({
    requested: <span className="text-xs">{formatRelativeDate(j.requested_at)}</span>,
    requested_by: <span className="text-xs">{j.requested_by?.email ?? "—"}</span>,
    status: (
      <Badge variant={(STATUS_TONE[j.status] ?? "inactive") as any} className="text-[10px] uppercase">
        {j.status}
      </Badge>
    ),
    format: <span className="text-xs">{j.export_format}</span>,
    rows: <span className="text-xs font-medium">{j.row_count.toLocaleString()}</span>,
    file: <span className="font-mono text-xs">{j.file_name || "—"}</span>,
    completed: <span className="text-xs">{j.completed_at ? formatRelativeDate(j.completed_at) : "—"}</span>,
    expires: <span className="text-xs">{j.expires_at ? formatRelativeDate(j.expires_at) : "—"}</span>,
    _id: j.id,
    _status: j.status,
  }));

  return (
    <DashboardLayout title="Audit Exports">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Audit Exports</p>
            <p className="text-xs text-gray-01 mt-0.5">Background jobs that package audit data for download.</p>
          </div>
          <div className="inline-flex items-center gap-3.5">
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
            <PermissionGate permission={P.EXPORT_AUDIT}>
              <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.AUDIT.EXPORT_NEW)}>
                <Plus /> New export
              </Button>
            </PermissionGate>
          </div>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load exports.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            dropDown
            dropDownList={(row: { _id: string; _status: string }) =>
              row._status === "COMPLETED"
                ? [
                    {
                      label: "Download CSV",
                      className: "",
                      onActionClick: () => setDownloadId(row._id),
                    },
                  ]
                : []
            }
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
