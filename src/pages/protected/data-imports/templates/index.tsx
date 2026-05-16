import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { cn } from "@/lib/utils";
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

type CardFilter = "all" | "active" | "draft" | "retired";

export default function ImportTemplatesList() {
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  const activeCount = DUMMY_TEMPLATES.filter((t) => t.status === "active").length;
  const draftCount = DUMMY_TEMPLATES.filter((t) => t.status === "draft").length;
  const retiredCount = DUMMY_TEMPLATES.filter((t) => t.status === "retired").length;

  const metricCards = [
    { title: "Total Templates", value: DUMMY_TEMPLATES.length, key: "all" as CardFilter, active: cardFilter === "all" },
    { title: "Active", value: activeCount, key: "active" as CardFilter, active: cardFilter === "active" },
    { title: "Draft", value: draftCount, key: "draft" as CardFilter, active: cardFilter === "draft" },
    { title: "Retired", value: retiredCount, key: "retired" as CardFilter, active: cardFilter === "retired" },
  ];

  const filtered = useMemo(() => {
    let list = DUMMY_TEMPLATES;
    if (cardFilter !== "all") list = list.filter((t) => t.status === cardFilter);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.dataset_type.toLowerCase().includes(q),
      );
    }
    return list;
  }, [cardFilter, search]);

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

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card, idx) => (
            <div
              key={idx}
              className={cn(
                "bg-white rounded-md h-26 w-full px-5.5 pt-5 space-y-2.5 cursor-pointer",
                card.active && "bg-pry-01",
              )}
              onClick={() => setCardFilter(card.key)}
            >
              <h5 className="font-mont text-sm font-medium text-gray-01">{card.title}</h5>
              <p className="font-semibold text-2xl text-[#221122]">{card.value}</p>
            </div>
          ))}
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
