import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type DataType = "string" | "number" | "date" | "boolean" | "choice" | "fk";
type TemplateStatus = "draft" | "active" | "retired";

interface FlatColumn {
  id: string;
  column_name: string;
  target_field: string;
  display_name: string;
  data_type: DataType;
  is_required: boolean;
  is_unique: boolean;
  reference_model?: string;
  tpl_id: string;
  tpl_code: string;
  tpl_name: string;
  tpl_dataset: string;
  tpl_status: TemplateStatus;
}

const ALL_COLUMNS: FlatColumn[] = [
  // STUDENTS_STANDARD
  { id: "c1", column_name: "admission_number", target_field: "admission_number", display_name: "Admission Number", data_type: "string", is_required: true, is_unique: true, tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  { id: "c2", column_name: "first_name", target_field: "first_name", display_name: "First Name", data_type: "string", is_required: true, is_unique: false, tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  { id: "c3", column_name: "last_name", target_field: "last_name", display_name: "Last Name", data_type: "string", is_required: true, is_unique: false, tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  { id: "c4", column_name: "date_of_birth", target_field: "date_of_birth", display_name: "Date of Birth", data_type: "date", is_required: true, is_unique: false, tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  { id: "c5", column_name: "gender", target_field: "gender", display_name: "Gender", data_type: "choice", is_required: true, is_unique: false, tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  { id: "c6", column_name: "guardian_email", target_field: "guardian_email", display_name: "Guardian Email", data_type: "string", is_required: false, is_unique: false, tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  { id: "c7", column_name: "class_code", target_field: "class_code", display_name: "Class Code", data_type: "fk", is_required: true, is_unique: false, reference_model: "Class", tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  { id: "c8", column_name: "phone", target_field: "phone_number", display_name: "Phone Number", data_type: "string", is_required: false, is_unique: false, tpl_id: "tpl_students_v3", tpl_code: "STUDENTS_STANDARD", tpl_name: "Students — Standard Enrollment", tpl_dataset: "students", tpl_status: "active" },
  // STAFF_FULL
  { id: "s1", column_name: "staff_id", target_field: "staff_id", display_name: "Staff ID", data_type: "string", is_required: true, is_unique: true, tpl_id: "tpl_staff_v2", tpl_code: "STAFF_FULL", tpl_name: "Staff — Full Onboarding", tpl_dataset: "staff", tpl_status: "active" },
  { id: "s2", column_name: "first_name", target_field: "first_name", display_name: "First Name", data_type: "string", is_required: true, is_unique: false, tpl_id: "tpl_staff_v2", tpl_code: "STAFF_FULL", tpl_name: "Staff — Full Onboarding", tpl_dataset: "staff", tpl_status: "active" },
  { id: "s3", column_name: "last_name", target_field: "last_name", display_name: "Last Name", data_type: "string", is_required: true, is_unique: false, tpl_id: "tpl_staff_v2", tpl_code: "STAFF_FULL", tpl_name: "Staff — Full Onboarding", tpl_dataset: "staff", tpl_status: "active" },
  { id: "s4", column_name: "email", target_field: "email", display_name: "Email Address", data_type: "string", is_required: true, is_unique: true, tpl_id: "tpl_staff_v2", tpl_code: "STAFF_FULL", tpl_name: "Staff — Full Onboarding", tpl_dataset: "staff", tpl_status: "active" },
  { id: "s5", column_name: "department", target_field: "department_code", display_name: "Department", data_type: "fk", is_required: false, is_unique: false, reference_model: "Department", tpl_id: "tpl_staff_v2", tpl_code: "STAFF_FULL", tpl_name: "Staff — Full Onboarding", tpl_dataset: "staff", tpl_status: "active" },
  { id: "s6", column_name: "role", target_field: "role_code", display_name: "Role", data_type: "string", is_required: false, is_unique: false, tpl_id: "tpl_staff_v2", tpl_code: "STAFF_FULL", tpl_name: "Staff — Full Onboarding", tpl_dataset: "staff", tpl_status: "active" },
  // CLASSES_BASIC
  { id: "k1", column_name: "class_code", target_field: "class_code", display_name: "Class Code", data_type: "string", is_required: true, is_unique: true, tpl_id: "tpl_classes_v1", tpl_code: "CLASSES_BASIC", tpl_name: "Classes / Sections", tpl_dataset: "classes", tpl_status: "active" },
  { id: "k2", column_name: "class_name", target_field: "name", display_name: "Class Name", data_type: "string", is_required: true, is_unique: false, tpl_id: "tpl_classes_v1", tpl_code: "CLASSES_BASIC", tpl_name: "Classes / Sections", tpl_dataset: "classes", tpl_status: "active" },
  { id: "k3", column_name: "year_level", target_field: "year_level", display_name: "Year Level", data_type: "number", is_required: true, is_unique: false, tpl_id: "tpl_classes_v1", tpl_code: "CLASSES_BASIC", tpl_name: "Classes / Sections", tpl_dataset: "classes", tpl_status: "active" },
  { id: "k4", column_name: "capacity", target_field: "capacity", display_name: "Capacity", data_type: "number", is_required: false, is_unique: false, tpl_id: "tpl_classes_v1", tpl_code: "CLASSES_BASIC", tpl_name: "Classes / Sections", tpl_dataset: "classes", tpl_status: "active" },
];

const DATA_TYPES: DataType[] = ["string", "number", "date", "boolean", "choice", "fk"];
const TEMPLATES = [
  { id: "tpl_students_v3", code: "STUDENTS_STANDARD" },
  { id: "tpl_staff_v2", code: "STAFF_FULL" },
  { id: "tpl_classes_v1", code: "CLASSES_BASIC" },
];

const STATUS_BADGE: Record<TemplateStatus, string> = {
  active: "active",
  draft: "pending",
  retired: "inactive",
};

const TABLE_HEADERS = ["Column", "Target Field", "Type", "Flags", "Template", "Dataset", "Status"];

export default function TemplateColumnsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tplFilter, setTplFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = ALL_COLUMNS;
    if (typeFilter !== "all") list = list.filter((c) => c.data_type === typeFilter);
    if (tplFilter !== "all") list = list.filter((c) => c.tpl_id === tplFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.column_name.toLowerCase().includes(q) ||
          c.target_field.toLowerCase().includes(q) ||
          c.display_name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [typeFilter, tplFilter, search]);

  const clearFilters = () => { setTypeFilter("all"); setTplFilter("all"); setSearch(""); };
  const hasFilters = typeFilter !== "all" || tplFilter !== "all" || !!search;

  const tableData = filtered.map((col) => ({
    column: (
      <div>
        <p className="font-mono text-xs font-semibold text-black-01">{col.column_name}</p>
        {col.display_name && col.display_name !== col.column_name && (
          <p className="text-xs text-gray-400 mt-0.5">{col.display_name}</p>
        )}
      </div>
    ),
    targetField: <span className="font-mono text-xs text-gray-500">{col.target_field}</span>,
    type: <Badge variant="inactive" className="text-xs font-mono">{col.data_type}</Badge>,
    flags: (
      <div className="flex gap-1">
        {col.is_required && <Badge variant="pending" className="text-xs">Req</Badge>}
        {col.is_unique && <Badge variant="pending" className="text-xs">Uniq</Badge>}
        {col.reference_model && <Badge variant="inactive" className="text-xs">FK</Badge>}
      </div>
    ),
    template: (
      <div>
        <p className="font-mono text-xs font-semibold text-black-01">{col.tpl_code}</p>
        <p className="text-xs text-gray-400 mt-0.5">{col.tpl_name}</p>
      </div>
    ),
    dataset: <span className="capitalize text-xs">{col.tpl_dataset}</span>,
    status: (
      <Badge variant={(STATUS_BADGE[col.tpl_status] ?? "inactive") as any} className="text-xs capitalize">
        {col.tpl_status}
      </Badge>
    ),
    _id: `${col.tpl_id}::${col.id}`,
  }));

  return (
    <DashboardLayout title="Template Columns">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Template Columns</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Cross-template column directory — read-only. Useful for auditing which templates write to a given target field. Edits happen on the template detail.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CustomInput
              id="search-columns" canSearch placeholder="Search column, target field or display name…"
              className="h-10" containerClass="w-full sm:w-[300px]"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <CustomNativeSelect
              id="filter-type" name="filter-type" label=""
              value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              options={[{ value: "all", label: "All Types" }, ...DATA_TYPES.map((d) => ({ value: d, label: d }))]}
            />
            <CustomNativeSelect
              id="filter-template" name="filter-template" label=""
              value={tplFilter} onChange={(e) => setTplFilter(e.target.value)}
              options={[{ value: "all", label: "All Templates" }, ...TEMPLATES.map((t) => ({ value: t.id, label: t.code }))]}
            />
            {hasFilters && (
              <Button variant="white" size="sm" onClick={clearFilters}>Clear</Button>
            )}
          </div>
          <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont shrink-0">
            <RefreshCw /> Refresh
          </Button>
        </div>

        <CustomTable
          tableHeaderList={TABLE_HEADERS}
          tableBodyList={tableData}
          hidePagination
        />

        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-01">
            No columns match the current filters.
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
