import { useState, useMemo } from "react";
import { RefreshCw, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { toast } from "sonner";

const DUMMY_TEMPLATES = [
  { id: "tpl_students_v3", code: "STUDENTS_STANDARD", name: "Students — Standard Enrollment", dataset_type: "students", version: 3, status: "active", default_file_format: "XLSX", created_by: "Olumide Bankole", is_download_enabled: true },
  { id: "tpl_staff_v2", code: "STAFF_FULL", name: "Staff — Full Onboarding", dataset_type: "staff", version: 2, status: "active", default_file_format: "XLSX", created_by: "Olumide Bankole", is_download_enabled: true },
  { id: "tpl_classes_v1", code: "CLASSES_BASIC", name: "Classes / Sections", dataset_type: "classes", version: 1, status: "active", default_file_format: "CSV", created_by: "Tunde Bakare", is_download_enabled: true },
  { id: "tpl_fees_v2", code: "FEES_TERMLY", name: "Fee Schedule — Termly", dataset_type: "fees", version: 2, status: "active", default_file_format: "XLSX", created_by: "Folake Ojo", is_download_enabled: true },
  { id: "tpl_branches_v1", code: "BRANCHES_GROUP", name: "Branches (Group Network)", dataset_type: "branches", version: 1, status: "active", default_file_format: "CSV", created_by: "Tunde Bakare", is_download_enabled: true },
  { id: "tpl_vendors_v1", code: "VENDORS_BASIC", name: "Vendors / Suppliers", dataset_type: "vendors", version: 1, status: "draft", default_file_format: "XLSX", created_by: "Folake Ojo", is_download_enabled: false },
  { id: "tpl_historical_v1", code: "HISTORICAL_RESULTS", name: "Historical Exam Results", dataset_type: "historical", version: 1, status: "active", default_file_format: "XLSX", created_by: "Olumide Bankole", is_download_enabled: true },
  { id: "tpl_schools_v2", code: "SCHOOLS_ONBOARDING", name: "Schools — Platform Onboarding", dataset_type: "schools", version: 2, status: "active", default_file_format: "XLSX", created_by: "Olumide Bankole", is_download_enabled: true },
  { id: "tpl_students_v2_old", code: "STUDENTS_LEGACY", name: "Students — Legacy v2", dataset_type: "students", version: 2, status: "retired", default_file_format: "CSV", created_by: "Olumide Bankole", is_download_enabled: false },
];

const STATUS_BADGE: Record<string, string> = {
  active: "active",
  draft: "pending",
  retired: "inactive",
};

const TABLE_HEADERS = ["Template Name", "Code", "Dataset", "Version", "Format", "Status", "Created By", "Action"];

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

export default function ImportTemplatesList() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      DUMMY_TEMPLATES.filter(
        (t) =>
          !search ||
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.code.toLowerCase().includes(search.toLowerCase()) ||
          t.dataset_type.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const activeTemplates = DUMMY_TEMPLATES.filter((t) => t.status === "active").length;
  const draftTemplates = DUMMY_TEMPLATES.filter((t) => t.status === "draft").length;

  const tableData = filtered.map((tpl) => ({
    name: (
      <div>
        <p className="font-medium text-sm text-black-01">{tpl.name}</p>
      </div>
    ),
    code: <span className="font-mono text-xs text-gray-01">{tpl.code}</span>,
    dataset: <span className="capitalize text-xs">{tpl.dataset_type}</span>,
    version: <span className="text-sm font-medium">v{tpl.version}</span>,
    format: <span className="text-xs font-mono">{tpl.default_file_format}</span>,
    status: (
      <Badge variant={(STATUS_BADGE[tpl.status] ?? "inactive") as any} className="text-xs capitalize">
        {tpl.status}
      </Badge>
    ),
    createdBy: <span className="text-sm">{tpl.created_by}</span>,
    _id: tpl.id,
    _downloadEnabled: tpl.is_download_enabled,
  }));

  return (
    <DashboardLayout title="Import Templates">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Import Templates</p>
            <p className="text-xs text-gray-01 mt-0.5">Download CSV/XLSX templates for bulk data imports.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard icon={<FileText size={22} />} label="Total Templates" value={DUMMY_TEMPLATES.length} />
          <StatCard icon={<FileText size={22} />} label="Active" value={activeTemplates} />
          <StatCard icon={<FileText size={22} />} label="Draft" value={draftTemplates} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <CustomInput
            id="search-templates"
            canSearch
            placeholder="Search templates..."
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
          dropDownList={(row: { _id: string; _downloadEnabled: boolean }) => [
            {
              label: "Download Template",
              className: row._downloadEnabled ? "" : "text-gray-400 cursor-not-allowed",
              onActionClick: () => {
                if (!row._downloadEnabled) {
                  toast.error("Download not available for this template.");
                  return;
                }
                toast.success("Template download started. (Demo — no actual file)");
              },
            },
          ]}
          hidePagination
        />
      </main>
    </DashboardLayout>
  );
}
