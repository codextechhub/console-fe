import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routesPath";

const DUMMY_BATCHES = [
  { id: "bch_001", original_filename: "students_js1_term1.xlsx", dataset_type: "students", status: "imported", total_rows: 142, error_count: 0, warning_count: 3, has_critical_errors: false, uploaded_by: "Tunde Bakare", school: "Lekki Heights Academy", imported_at: "2026-05-08T09:21:14Z" },
  { id: "bch_002", original_filename: "students_ss3_intake.xlsx", dataset_type: "students", status: "validation_failed", total_rows: 87, error_count: 12, warning_count: 5, has_critical_errors: true, uploaded_by: "Folake Ojo", school: "Lekki Heights Academy", imported_at: null },
  { id: "bch_003", original_filename: "staff_september.xlsx", dataset_type: "staff", status: "importing", total_rows: 24, error_count: 0, warning_count: 0, has_critical_errors: false, uploaded_by: "Aminat Bello", school: "Greenwood International", imported_at: null },
  { id: "bch_004", original_filename: "fees_term1_2526.xlsx", dataset_type: "fees", status: "validated", total_rows: 36, error_count: 0, warning_count: 1, has_critical_errors: false, uploaded_by: "Folake Ojo", school: "Lekki Heights Academy", imported_at: null },
  { id: "bch_005", original_filename: "classes_2526.csv", dataset_type: "classes", status: "imported", total_rows: 18, error_count: 0, warning_count: 0, has_critical_errors: false, uploaded_by: "Tunde Bakare", school: "Lekki Heights Academy", imported_at: "2026-04-20T08:34:02Z" },
  { id: "bch_006", original_filename: "vendors_q1.xlsx", dataset_type: "vendors", status: "draft", total_rows: 0, error_count: 0, warning_count: 0, has_critical_errors: false, uploaded_by: "Folake Ojo", school: "Greenwood International", imported_at: null },
  { id: "bch_007", original_filename: "results_2021_2022.xlsx", dataset_type: "historical", status: "rolled_back", total_rows: 1840, error_count: 2, warning_count: 0, has_critical_errors: false, uploaded_by: "Olumide Bankole", school: "Lekki Heights Academy", imported_at: "2026-03-14T10:38:55Z" },
  { id: "bch_008", original_filename: "staff_lateral_hires.xlsx", dataset_type: "staff", status: "validating", total_rows: 11, error_count: 0, warning_count: 0, has_critical_errors: false, uploaded_by: "Aminat Bello", school: "Greenwood International", imported_at: null },
];

const IN_FLIGHT_STATUSES = new Set(["uploaded", "parsing", "parsed", "validation_queued", "validating", "validated", "import_queued", "importing"]);

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

const DATASET_TYPES = ["students", "staff", "classes", "fees", "branches", "vendors", "historical", "schools", "generic"];
const ALL_STATUSES = ["draft", "uploaded", "parsing", "parsed", "validation_queued", "validating", "validation_failed", "validated", "import_queued", "importing", "imported", "rolled_back", "cancelled"];

const TABLE_HEADERS = ["File", "Dataset", "Status", "Rows", "Issues", "Uploaded By", "School", "Imported", "Action"];

type CardFilter = "all" | "inflight" | "critical" | "imported";

export default function ImportBatchesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [datasetFilter, setDatasetFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => ({
    total: DUMMY_BATCHES.length,
    inFlight: DUMMY_BATCHES.filter((b) => IN_FLIGHT_STATUSES.has(b.status)).length,
    critical: DUMMY_BATCHES.filter((b) => b.has_critical_errors || b.status === "validation_failed").length,
    imported: DUMMY_BATCHES.filter((b) => b.status === "imported").length,
  }), []);

  const metricCards = [
    { title: "Total Batches", value: stats.total, key: "all" as CardFilter, hint: "Lifetime" },
    { title: "In Flight", value: stats.inFlight, key: "inflight" as CardFilter, hint: "Currently processing" },
    { title: "Critical Failures", value: stats.critical, key: "critical" as CardFilter, hint: "Need triage" },
    { title: "Imported", value: stats.imported, key: "imported" as CardFilter, hint: "Successfully landed" },
  ];

  const filtered = useMemo(() => {
    let list = DUMMY_BATCHES;
    if (cardFilter === "inflight") list = list.filter((b) => IN_FLIGHT_STATUSES.has(b.status));
    else if (cardFilter === "critical") list = list.filter((b) => b.has_critical_errors || b.status === "validation_failed");
    else if (cardFilter === "imported") list = list.filter((b) => b.status === "imported");

    if (datasetFilter !== "all") list = list.filter((b) => b.dataset_type === datasetFilter);
    if (statusFilter !== "all") list = list.filter((b) => b.status === statusFilter);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.original_filename.toLowerCase().includes(q) ||
          b.dataset_type.toLowerCase().includes(q) ||
          b.school.toLowerCase().includes(q) ||
          b.uploaded_by.toLowerCase().includes(q),
      );
    }
    return list;
  }, [cardFilter, datasetFilter, statusFilter, search]);

  const tableData = filtered.map((batch) => ({
    file: (
      <div>
        <p className="font-medium text-sm text-black-01 truncate max-w-48">{batch.original_filename}</p>
        <p className="text-xs text-gray-400 mt-0.5">{batch.school}</p>
      </div>
    ),
    dataset: <span className="capitalize text-xs">{batch.dataset_type}</span>,
    status: (
      <Badge variant={(STATUS_BADGE[batch.status] ?? "inactive") as any} className="text-xs capitalize">
        {batch.status.replace(/_/g, " ")}
      </Badge>
    ),
    rows: <span className="font-medium">{batch.total_rows.toLocaleString()}</span>,
    issues: (
      <div className="flex gap-1.5 items-center">
        {batch.error_count > 0 && <Badge variant="suspended" className="text-xs">{batch.error_count} err</Badge>}
        {batch.warning_count > 0 && <Badge variant="locked" className="text-xs">{batch.warning_count} warn</Badge>}
        {batch.has_critical_errors && <Badge variant="suspended" className="text-xs">Critical</Badge>}
        {batch.error_count === 0 && batch.warning_count === 0 && <span className="text-xs text-gray-400">—</span>}
      </div>
    ),
    uploadedBy: <span className="text-sm">{batch.uploaded_by}</span>,
    school: <span className="text-sm">{batch.school}</span>,
    importedAt: (
      <span className="text-xs text-gray-01">
        {batch.imported_at ? new Date(batch.imported_at).toLocaleDateString() : "—"}
      </span>
    ),
    _id: batch.id,
  }));

  const hasFilters = datasetFilter !== "all" || statusFilter !== "all" || !!search;

  return (
    <DashboardLayout title="Import Batches">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Import Batches</p>
            <p className="text-xs text-gray-01 mt-0.5">All batches uploaded across the platform. Monitor pipeline health, triage validation failures and trigger rollbacks.</p>
          </div>
          <Button size="lg" variant="white" disabled>
            <Upload size={16} /> New Import (Coming Soon)
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <div
              key={card.key}
              className={cn(
                "bg-white rounded-md h-26 w-full px-5.5 pt-5 space-y-2.5 cursor-pointer transition-colors",
                cardFilter === card.key && "bg-pry-01",
              )}
              onClick={() => setCardFilter(cardFilter === card.key ? "all" : card.key)}
            >
              <h5 className="font-mont text-sm font-medium text-gray-01">{card.title}</h5>
              <p className="font-semibold text-2xl text-[#221122]">{card.value}</p>
              <p className="text-xs text-gray-400">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CustomInput
              id="search-batches" canSearch placeholder="Search filename, uploader or school…"
              className="h-10" containerClass="w-full sm:w-[280px]"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <CustomNativeSelect
              id="filter-dataset" name="filter-dataset" label=""
              value={datasetFilter} onChange={(e) => setDatasetFilter(e.target.value)}
              options={[{ value: "all", label: "All Datasets" }, ...DATASET_TYPES.map((d) => ({ value: d, label: d }))]}
            />
            <CustomNativeSelect
              id="filter-status" name="filter-status" label=""
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: "all", label: "All Statuses" }, ...ALL_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))]}
            />
            {hasFilters && (
              <Button variant="white" size="sm" onClick={() => { setDatasetFilter("all"); setStatusFilter("all"); setSearch(""); }}>
                Clear
              </Button>
            )}
          </div>
          <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont shrink-0">
            <RefreshCw /> Refresh
          </Button>
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
