import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routesPath";

const DUMMY_BATCHES = [
  { id: "bch_001", original_filename: "students_js1_term1.xlsx", dataset_type: "students", status: "imported", total_rows: 142, error_count: 0, uploaded_by: "Tunde Bakare", school: "Lekki Heights Academy", imported_at: "2026-05-08T09:21:14Z" },
  { id: "bch_002", original_filename: "students_ss3_intake.xlsx", dataset_type: "students", status: "validation_failed", total_rows: 87, error_count: 12, uploaded_by: "Folake Ojo", school: "Lekki Heights Academy", imported_at: null },
  { id: "bch_003", original_filename: "staff_september.xlsx", dataset_type: "staff", status: "importing", total_rows: 24, error_count: 0, uploaded_by: "Aminat Bello", school: "Greenwood International", imported_at: null },
  { id: "bch_004", original_filename: "fees_term1_2526.xlsx", dataset_type: "fees", status: "validated", total_rows: 36, error_count: 0, uploaded_by: "Folake Ojo", school: "Lekki Heights Academy", imported_at: null },
  { id: "bch_005", original_filename: "classes_2526.csv", dataset_type: "classes", status: "imported", total_rows: 18, error_count: 0, uploaded_by: "Tunde Bakare", school: "Lekki Heights Academy", imported_at: "2026-04-20T08:34:02Z" },
  { id: "bch_006", original_filename: "vendors_q1.xlsx", dataset_type: "vendors", status: "draft", total_rows: 0, error_count: 0, uploaded_by: "Folake Ojo", school: "Greenwood International", imported_at: null },
  { id: "bch_007", original_filename: "results_2021_2022.xlsx", dataset_type: "historical", status: "rolled_back", total_rows: 1840, error_count: 2, uploaded_by: "Olumide Bankole", school: "Lekki Heights Academy", imported_at: "2026-03-14T10:38:55Z" },
  { id: "bch_008", original_filename: "staff_lateral_hires.xlsx", dataset_type: "staff", status: "validating", total_rows: 11, error_count: 0, uploaded_by: "Aminat Bello", school: "Greenwood International", imported_at: null },
];

const STATUS_BADGE: Record<string, string> = {
  imported: "active",
  validation_failed: "suspended",
  importing: "locked",
  validated: "pending",
  draft: "inactive",
  rolled_back: "suspended",
  validating: "locked",
  import_queued: "pending",
  cancelled: "inactive",
};

const TABLE_HEADERS = ["File", "Dataset", "Status", "Rows", "Errors", "Uploaded By", "School", "Action"];

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-md px-5 py-4 flex items-center gap-4">
      <div className="size-12 rounded-lg bg-gray-100 grid place-content-center text-gray-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-01 font-mont">{label}</p>
        <p className="text-2xl font-semibold text-black-01">{value}</p>
      </div>
    </div>
  );
}

export default function ImportBatchesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      DUMMY_BATCHES.filter(
        (b) =>
          !search ||
          b.original_filename.toLowerCase().includes(search.toLowerCase()) ||
          b.dataset_type.toLowerCase().includes(search.toLowerCase()) ||
          b.school.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const totalBatches = DUMMY_BATCHES.length;
  const importedBatches = DUMMY_BATCHES.filter((b) => b.status === "imported").length;
  const failedBatches = DUMMY_BATCHES.filter((b) => b.status === "validation_failed").length;
  const inProgressBatches = DUMMY_BATCHES.filter((b) => ["importing", "validating", "import_queued", "validation_queued"].includes(b.status)).length;

  const tableData = filtered.map((batch) => ({
    file: (
      <div>
        <p className="font-medium text-sm text-black-01 truncate max-w-48">{batch.original_filename}</p>
      </div>
    ),
    dataset: <span className="capitalize text-xs">{batch.dataset_type}</span>,
    status: (
      <Badge variant={(STATUS_BADGE[batch.status] ?? "inactive") as any} className="text-xs capitalize">
        {batch.status.replace(/_/g, " ")}
      </Badge>
    ),
    rows: <span className="font-medium">{batch.total_rows}</span>,
    errors: batch.error_count > 0 ? (
      <span className="text-destructive font-medium">{batch.error_count}</span>
    ) : (
      <span className="text-gray-01">0</span>
    ),
    uploadedBy: <span className="text-sm">{batch.uploaded_by}</span>,
    school: <span className="text-sm">{batch.school}</span>,
    _id: batch.id,
  }));

  return (
    <DashboardLayout title="Import Batches">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Import Batches</p>
            <p className="text-xs text-gray-01 mt-0.5">Track all data import jobs across the platform.</p>
          </div>
          <Button size="lg" variant="white" disabled>
            <Upload size={16} /> New Import (Coming Soon)
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Upload size={22} />} label="Total Batches" value={totalBatches} />
          <StatCard icon={<CheckCircle2 size={22} />} label="Imported" value={importedBatches} />
          <StatCard icon={<XCircle size={22} />} label="Failed" value={failedBatches} />
          <StatCard icon={<Loader2 size={22} />} label="In Progress" value={inProgressBatches} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <CustomInput
            id="search-batches"
            canSearch
            placeholder="Search batches..."
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inline-flex items-center gap-3.5 shrink-0">
            <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont">
              <RefreshCw /> Refresh
            </Button>
          </div>
        </div>

        <CustomTable
          tableHeaderList={TABLE_HEADERS}
          tableBodyList={tableData}
          dropDown
          dropDownList={(row: { _id: string }) => [
            {
              label: "View Details",
              className: "",
              onActionClick: () => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.VIEW(row._id)),
            },
          ]}
          hidePagination
        />
      </main>
    </DashboardLayout>
  );
}
