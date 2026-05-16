import { useState, useMemo, useEffect } from "react";
import { Plus, RefreshCw, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DataType = "string" | "number" | "date" | "boolean" | "choice" | "fk";
type TemplateStatus = "draft" | "active" | "retired";

interface TemplateColumn {
  id: string;
  column_name: string;
  target_field: string;
  display_name: string;
  data_type: DataType;
  is_required: boolean;
  is_unique: boolean;
  help_text?: string;
  allowed_values?: string;
  reference_model?: string;
  column_order: number;
}

interface ImportTemplate {
  id: string;
  code: string;
  name: string;
  dataset_type: string;
  version: number;
  status: TemplateStatus;
  default_file_format: string;
  created_by: string;
  is_download_enabled: boolean;
  description?: string;
  instructions?: string;
  published_at: string | null;
  retired_at: string | null;
  columns: TemplateColumn[];
}

const INITIAL_TEMPLATES: ImportTemplate[] = [
  {
    id: "tpl_students_v3", code: "STUDENTS_STANDARD", name: "Students — Standard Enrollment",
    dataset_type: "students", version: 3, status: "active", default_file_format: "XLSX",
    created_by: "Olumide Bankole", is_download_enabled: true,
    description: "Standard student enrollment template for all supported schools.",
    instructions: "Header row must be row 1. Dates as YYYY-MM-DD. Admission number must be unique.",
    published_at: "2026-03-10T08:00:00Z", retired_at: null,
    columns: [
      { id: "c1", column_name: "admission_number", target_field: "admission_number", display_name: "Admission Number", data_type: "string", is_required: true, is_unique: true, help_text: "Unique identifier for the student.", column_order: 1 },
      { id: "c2", column_name: "first_name", target_field: "first_name", display_name: "First Name", data_type: "string", is_required: true, is_unique: false, column_order: 2 },
      { id: "c3", column_name: "last_name", target_field: "last_name", display_name: "Last Name", data_type: "string", is_required: true, is_unique: false, column_order: 3 },
      { id: "c4", column_name: "date_of_birth", target_field: "date_of_birth", display_name: "Date of Birth", data_type: "date", is_required: true, is_unique: false, help_text: "Format: YYYY-MM-DD", column_order: 4 },
      { id: "c5", column_name: "gender", target_field: "gender", display_name: "Gender", data_type: "choice", is_required: true, is_unique: false, allowed_values: "male,female,other", column_order: 5 },
      { id: "c6", column_name: "guardian_email", target_field: "guardian_email", display_name: "Guardian Email", data_type: "string", is_required: false, is_unique: false, column_order: 6 },
      { id: "c7", column_name: "class_code", target_field: "class_code", display_name: "Class Code", data_type: "fk", is_required: true, is_unique: false, reference_model: "Class", column_order: 7 },
      { id: "c8", column_name: "phone", target_field: "phone_number", display_name: "Phone Number", data_type: "string", is_required: false, is_unique: false, column_order: 8 },
    ],
  },
  {
    id: "tpl_staff_v2", code: "STAFF_FULL", name: "Staff — Full Onboarding",
    dataset_type: "staff", version: 2, status: "active", default_file_format: "XLSX",
    created_by: "Olumide Bankole", is_download_enabled: true,
    description: "Full staff onboarding template including department and role assignment.",
    instructions: "Staff ID must be unique per school. Role must match platform role codes.",
    published_at: "2026-02-01T08:00:00Z", retired_at: null,
    columns: [
      { id: "s1", column_name: "staff_id", target_field: "staff_id", display_name: "Staff ID", data_type: "string", is_required: true, is_unique: true, column_order: 1 },
      { id: "s2", column_name: "first_name", target_field: "first_name", display_name: "First Name", data_type: "string", is_required: true, is_unique: false, column_order: 2 },
      { id: "s3", column_name: "last_name", target_field: "last_name", display_name: "Last Name", data_type: "string", is_required: true, is_unique: false, column_order: 3 },
      { id: "s4", column_name: "email", target_field: "email", display_name: "Email Address", data_type: "string", is_required: true, is_unique: true, column_order: 4 },
      { id: "s5", column_name: "department", target_field: "department_code", display_name: "Department", data_type: "fk", is_required: false, is_unique: false, reference_model: "Department", column_order: 5 },
      { id: "s6", column_name: "role", target_field: "role_code", display_name: "Role", data_type: "string", is_required: false, is_unique: false, column_order: 6 },
    ],
  },
  {
    id: "tpl_classes_v1", code: "CLASSES_BASIC", name: "Classes / Sections",
    dataset_type: "classes", version: 1, status: "active", default_file_format: "CSV",
    created_by: "Tunde Bakare", is_download_enabled: true,
    published_at: "2025-11-15T08:00:00Z", retired_at: null,
    columns: [
      { id: "k1", column_name: "class_code", target_field: "class_code", display_name: "Class Code", data_type: "string", is_required: true, is_unique: true, column_order: 1 },
      { id: "k2", column_name: "class_name", target_field: "name", display_name: "Class Name", data_type: "string", is_required: true, is_unique: false, column_order: 2 },
      { id: "k3", column_name: "year_level", target_field: "year_level", display_name: "Year Level", data_type: "number", is_required: true, is_unique: false, column_order: 3 },
      { id: "k4", column_name: "capacity", target_field: "capacity", display_name: "Capacity", data_type: "number", is_required: false, is_unique: false, help_text: "Maximum number of students.", column_order: 4 },
    ],
  },
  {
    id: "tpl_fees_v2", code: "FEES_TERMLY", name: "Fee Schedule — Termly",
    dataset_type: "fees", version: 2, status: "active", default_file_format: "XLSX",
    created_by: "Folake Ojo", is_download_enabled: true,
    published_at: "2026-01-05T08:00:00Z", retired_at: null,
    columns: [],
  },
  {
    id: "tpl_branches_v1", code: "BRANCHES_GROUP", name: "Branches (Group Network)",
    dataset_type: "branches", version: 1, status: "active", default_file_format: "CSV",
    created_by: "Tunde Bakare", is_download_enabled: true,
    published_at: "2025-09-01T08:00:00Z", retired_at: null,
    columns: [],
  },
  {
    id: "tpl_vendors_v1", code: "VENDORS_BASIC", name: "Vendors / Suppliers",
    dataset_type: "vendors", version: 1, status: "draft", default_file_format: "XLSX",
    created_by: "Folake Ojo", is_download_enabled: false,
    published_at: null, retired_at: null,
    columns: [],
  },
  {
    id: "tpl_historical_v1", code: "HISTORICAL_RESULTS", name: "Historical Exam Results",
    dataset_type: "historical", version: 1, status: "active", default_file_format: "XLSX",
    created_by: "Olumide Bankole", is_download_enabled: true,
    published_at: "2025-08-20T08:00:00Z", retired_at: null,
    columns: [],
  },
  {
    id: "tpl_schools_v2", code: "SCHOOLS_ONBOARDING", name: "Schools — Platform Onboarding",
    dataset_type: "schools", version: 2, status: "active", default_file_format: "XLSX",
    created_by: "Olumide Bankole", is_download_enabled: true,
    published_at: "2025-07-01T08:00:00Z", retired_at: null,
    columns: [],
  },
  {
    id: "tpl_students_v2_old", code: "STUDENTS_LEGACY", name: "Students — Legacy v2",
    dataset_type: "students", version: 2, status: "retired", default_file_format: "CSV",
    created_by: "Olumide Bankole", is_download_enabled: false,
    published_at: "2024-01-10T08:00:00Z", retired_at: "2026-03-09T08:00:00Z",
    columns: [],
  },
];

const DATASET_TYPES = ["students", "staff", "classes", "fees", "branches", "vendors", "historical", "schools", "generic"];
const DATA_TYPES: DataType[] = ["string", "number", "date", "boolean", "choice", "fk"];
const FILE_FORMATS = ["XLSX", "CSV", "XLS"];

const STATUS_BADGE: Record<TemplateStatus, string> = {
  active: "active",
  draft: "pending",
  retired: "inactive",
};

type CardFilter = "all" | "active" | "draft" | "retired";

const BLANK_COLUMN: Omit<TemplateColumn, "id" | "column_order"> = {
  column_name: "", target_field: "", display_name: "", data_type: "string",
  is_required: false, is_unique: false, help_text: "", allowed_values: "", reference_model: "",
};

// ============================================================================
// Column add/edit sheet
// ============================================================================
function ColumnSheet({
  open, onClose, mode, item,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  item: Partial<TemplateColumn> | null;
  onSave: (col: Omit<TemplateColumn, "id" | "column_order">) => void;
}) {
  const [form, setForm] = useState({ ...BLANK_COLUMN });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(item ? { ...BLANK_COLUMN, ...item } : { ...BLANK_COLUMN });
      setErrors({});
    }
  }, [open, item]);

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.column_name.trim()) e.column_name = "Required";
    else if (!/^[a-z][a-z0-9_]*$/.test(form.column_name.trim())) e.column_name = "Lowercase letters, digits, underscores; must start with a letter.";
    if (!form.target_field.trim()) e.target_field = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, column_name: form.column_name.trim(), target_field: form.target_field.trim(), display_name: form.display_name.trim() });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b border-gray-100 pb-4 mb-5">
          <SheetTitle className="font-mont">{mode === "create" ? "Add Column" : "Edit Column"}</SheetTitle>
          <SheetDescription>Define how this column maps to a target field.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <CustomInput
            id="column_name" name="column_name" label="Column Name"
            placeholder="e.g. admission_number"
            value={form.column_name} onChange={(e) => set("column_name", e.target.value)}
            error={errors.column_name}
            disabled={mode === "edit"}
          />

          <CustomInput
            id="target_field" name="target_field" label="Target Field"
            placeholder="e.g. admission_number"
            value={form.target_field} onChange={(e) => set("target_field", e.target.value)}
            error={errors.target_field}
          />

          <CustomInput
            id="display_name" name="display_name" label="Display Name (optional)"
            placeholder="e.g. Admission Number"
            value={form.display_name} onChange={(e) => set("display_name", e.target.value)}
          />

          <CustomNativeSelect
            id="data_type" name="data_type" label="Data Type"
            value={form.data_type} onChange={(e) => set("data_type", e.target.value as DataType)}
            options={DATA_TYPES.map((d) => ({ value: d, label: d }))}
          />

          {form.data_type === "choice" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-black-01 font-mont">
                Allowed Values <span className="text-gray-01">(comma-separated)</span>
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="male,female,other"
                value={form.allowed_values ?? ""}
                onChange={(e) => set("allowed_values", e.target.value)}
              />
            </div>
          )}

          {form.data_type === "fk" && (
            <CustomInput
              id="reference_model" name="reference_model" label="Reference Model"
              placeholder="e.g. Class, Department"
              value={form.reference_model ?? ""} onChange={(e) => set("reference_model", e.target.value)}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-black-01 font-mont">Help Text <span className="text-gray-01">(optional)</span></label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Shown to users filling the template."
              value={form.help_text ?? ""}
              onChange={(e) => set("help_text", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-primary" checked={form.is_required}
                onChange={(e) => set("is_required", e.target.checked)} />
              <span className="text-sm text-black-01">Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-primary" checked={form.is_unique}
                onChange={(e) => set("is_unique", e.target.checked)} />
              <span className="text-sm text-black-01">Unique</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="white" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>{mode === "create" ? "Add Column" : "Save"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Template create/edit sheet (metadata only)
// ============================================================================
function TemplateSheet({
  open, onClose, mode, item, existingCodes, onSave,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  item: ImportTemplate | null;
  existingCodes: string[];
  onSave: (rec: Partial<ImportTemplate>, mode: "create" | "edit") => void;
}) {
  const [form, setForm] = useState({
    code: "", name: "", dataset_type: "generic" as string, description: "", version: 1,
    default_file_format: "XLSX", instructions: "", is_download_enabled: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(item ? {
        code: item.code, name: item.name, dataset_type: item.dataset_type,
        description: item.description ?? "", version: item.version,
        default_file_format: item.default_file_format, instructions: item.instructions ?? "",
        is_download_enabled: item.is_download_enabled,
      } : {
        code: "", name: "", dataset_type: "generic", description: "", version: 1,
        default_file_format: "XLSX", instructions: "", is_download_enabled: true,
      });
      setErrors({});
    }
  }, [open, item]);

  const lockedMeta = mode === "edit" && item && (item.status === "active" || item.status === "retired");
  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Required.";
    else if (!/^[A-Z][A-Z0-9_]*$/.test(form.code.trim())) e.code = "Uppercase letters, digits, underscores.";
    else if (mode === "create" && existingCodes.includes(form.code.trim())) e.code = "Code already exists.";
    if (!form.name.trim()) e.name = "Required.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSave({ ...form, code: form.code.trim(), name: form.name.trim() }, mode);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="border-b border-gray-100 pb-4 mb-5">
          <SheetTitle className="font-mont">{mode === "create" ? "New Import Template" : "Edit Import Template"}</SheetTitle>
          <SheetDescription>{mode === "edit" ? item?.code : "Define a new system import template."}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {lockedMeta && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Code and dataset type are locked — this template is published or retired. Bump the version to ship breaking changes.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              id="code" name="code" label="Code"
              placeholder="STUDENTS_STANDARD"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
              error={errors.code}
              disabled={!!lockedMeta}
            />
            <CustomNativeSelect
              id="dataset_type" name="dataset_type" label="Dataset Type"
              value={form.dataset_type} onChange={(e) => set("dataset_type", e.target.value)}
              options={DATASET_TYPES.map((d) => ({ value: d, label: d }))}
              disabled={!!lockedMeta}
            />
          </div>

          <CustomInput
            id="name" name="name" label="Template Name"
            placeholder="Students — Standard Enrollment"
            value={form.name} onChange={(e) => set("name", e.target.value)}
            error={errors.name}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-black-01 font-mont">Description <span className="text-gray-01">(optional)</span></label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="What does this template cover?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomNativeSelect
              id="default_file_format" name="default_file_format" label="File Format"
              value={form.default_file_format} onChange={(e) => set("default_file_format", e.target.value)}
              options={FILE_FORMATS.map((f) => ({ value: f, label: f }))}
            />
            <CustomInput
              id="version" name="version" label="Version"
              type="number"
              value={String(form.version)}
              onChange={(e) => set("version", parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-black-01 font-mont">Instructions <span className="text-gray-01">(optional)</span></label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Header row must be row 1. Dates as YYYY-MM-DD…"
              value={form.instructions}
              onChange={(e) => set("instructions", e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-primary" checked={form.is_download_enabled}
              onChange={(e) => set("is_download_enabled", e.target.checked)} />
            <span className="text-sm text-black-01">Download enabled</span>
          </label>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="white" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>{mode === "create" ? "Create Template" : "Save Changes"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Template detail sheet with embedded column management
// ============================================================================
function TemplateDetailSheet({
  open, onClose, template, onTemplateChange, onEdit,
}: {
  open: boolean;
  onClose: () => void;
  template: ImportTemplate | null;
  onTemplateChange: (t: ImportTemplate) => void;
  onEdit: () => void;
}) {
  const [colSheet, setColSheet] = useState<{ mode: "create" | "edit"; item: TemplateColumn | null } | null>(null);
  const [deleteColId, setDeleteColId] = useState<string | null>(null);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<"publish" | "retire" | null>(null);

  if (!template) return null;

  const cols = [...template.columns].sort((a, b) => a.column_order - b.column_order);

  const upsertCol = (rec: Omit<TemplateColumn, "id" | "column_order">, mode: "create" | "edit") => {
    if (mode === "create") {
      const nextOrder = cols.length === 0 ? 1 : Math.max(...cols.map((c) => c.column_order)) + 1;
      const newCol: TemplateColumn = { ...rec, id: "col_" + Math.random().toString(36).slice(2, 8), column_order: nextOrder };
      onTemplateChange({ ...template, columns: [...template.columns, newCol] });
      toast.success("Column added.");
    } else {
      const updated = template.columns.map((c) =>
        c.id === colSheet?.item?.id ? { ...c, ...rec } : c
      );
      onTemplateChange({ ...template, columns: updated });
      toast.success("Column updated.");
    }
  };

  const deleteCol = (id: string) => {
    onTemplateChange({ ...template, columns: template.columns.filter((c) => c.id !== id) });
    setDeleteColId(null);
    toast.success("Column removed.");
  };

  const moveCol = (id: string, delta: number) => {
    const idx = cols.findIndex((c) => c.id === id);
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= cols.length) return;
    const reordered = [...cols];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const renumbered = reordered.map((c, i) => ({ ...c, column_order: i + 1 }));
    onTemplateChange({ ...template, columns: renumbered });
  };

  const doLifecycle = () => {
    if (!lifecycleConfirm) return;
    if (lifecycleConfirm === "publish") {
      onTemplateChange({ ...template, status: "active", published_at: new Date().toISOString() });
      toast.success("Template published.");
    } else {
      onTemplateChange({ ...template, status: "retired", retired_at: new Date().toISOString() });
      toast.success("Template retired.");
    }
    setLifecycleConfirm(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto" showCloseButton>
          <SheetHeader className="border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <SheetTitle className="font-mont text-base">{template.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs mt-0.5">{template.code}</SheetDescription>
              </div>
              <Badge variant={(STATUS_BADGE[template.status] ?? "inactive") as any} className="capitalize shrink-0 mt-0.5">
                {template.status}
              </Badge>
            </div>
          </SheetHeader>

          <div className="px-4 space-y-6 pb-8">
            {/* Metadata grid */}
            <div className="bg-gray-50 rounded-md p-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-01 font-mont">Dataset</p>
                <p className="font-medium capitalize mt-0.5">{template.dataset_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-01 font-mont">Version</p>
                <p className="font-medium mt-0.5">v{template.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-01 font-mont">Format</p>
                <p className="font-mono font-medium mt-0.5">{template.default_file_format}</p>
              </div>
              <div>
                <p className="text-xs text-gray-01 font-mont">Download</p>
                <p className="font-medium mt-0.5">{template.is_download_enabled ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-01 font-mont">Published</p>
                <p className="font-medium mt-0.5">{template.published_at ? new Date(template.published_at).toLocaleDateString() : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-01 font-mont">Created By</p>
                <p className="font-medium mt-0.5">{template.created_by}</p>
              </div>
            </div>

            {template.description && (
              <div>
                <p className="text-xs text-gray-01 font-mont mb-1">Description</p>
                <p className="text-sm text-black-01">{template.description}</p>
              </div>
            )}

            {template.instructions && (
              <div>
                <p className="text-xs text-gray-01 font-mont mb-1">Instructions</p>
                <p className="text-sm text-black-01 leading-relaxed">{template.instructions}</p>
              </div>
            )}

            {/* Lifecycle actions */}
            <div className="flex items-center gap-3">
              <Button variant="white" size="sm" onClick={onEdit}>
                <Pencil size={13} /> Edit Metadata
              </Button>
              {template.status === "draft" && (
                <Button size="sm" onClick={() => setLifecycleConfirm("publish")}>
                  Publish Template
                </Button>
              )}
              {template.status === "active" && (
                <Button variant="white" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => setLifecycleConfirm("retire")}>
                  Retire Template
                </Button>
              )}
              {template.is_download_enabled && (
                <Button variant="white" size="sm" onClick={() => toast.success("Template download started. (Demo — no actual file)")}>
                  Download Scaffold
                </Button>
              )}
            </div>

            {/* Columns section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold font-mont text-black-01">
                  Columns <span className="text-gray-01 font-normal">({cols.length})</span>
                </p>
                <Button size="sm" variant="white" onClick={() => setColSheet({ mode: "create", item: null })}>
                  <Plus size={13} /> Add Column
                </Button>
              </div>

              {cols.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-200 px-4 py-8 text-center">
                  <p className="text-sm text-gray-01">No columns defined yet.</p>
                  <Button size="sm" variant="white" className="mt-3" onClick={() => setColSheet({ mode: "create", item: null })}>
                    <Plus size={13} /> Add First Column
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {cols.map((col, idx) => (
                    <div key={col.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 group">
                      <span className="text-xs text-gray-400 font-mono mt-0.5 w-4 shrink-0">{col.column_order}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-black-01">{col.column_name}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="font-mono text-xs text-gray-500">{col.target_field}</span>
                          <Badge variant="inactive" className="text-xs font-mono">{col.data_type}</Badge>
                          {col.is_required && <Badge variant="pending" className="text-xs">Req</Badge>}
                          {col.is_unique && <Badge variant="pending" className="text-xs">Uniq</Badge>}
                          {col.reference_model && <Badge variant="inactive" className="text-xs">FK: {col.reference_model}</Badge>}
                        </div>
                        {col.display_name && col.display_name !== col.column_name && (
                          <p className="text-xs text-gray-400 mt-0.5">{col.display_name}</p>
                        )}
                        {col.help_text && <p className="text-xs text-gray-400 mt-0.5 italic">{col.help_text}</p>}
                        {col.data_type === "choice" && col.allowed_values && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">[{col.allowed_values}]</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => moveCol(col.id, -1)} disabled={idx === 0}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30">
                          <ChevronUp size={12} />
                        </button>
                        <button onClick={() => moveCol(col.id, 1)} disabled={idx === cols.length - 1}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30">
                          <ChevronDown size={12} />
                        </button>
                        <button onClick={() => setColSheet({ mode: "edit", item: col })}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setDeleteColId(col.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ColumnSheet
        open={!!colSheet}
        onClose={() => setColSheet(null)}
        mode={colSheet?.mode ?? "create"}
        item={colSheet?.item ?? null}
        onSave={(rec) => upsertCol(rec, colSheet?.mode ?? "create")}
      />

      <AlertDialog open={!!deleteColId} onOpenChange={(o) => !o && setDeleteColId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the column from the template definition. Existing import batches are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteColId && deleteCol(deleteColId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!lifecycleConfirm} onOpenChange={(o) => !o && setLifecycleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lifecycleConfirm === "publish" ? "Publish Template?" : "Retire Template?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {lifecycleConfirm === "publish"
                ? "Publishing makes this template available for download and import. You cannot edit code or dataset type after publishing."
                : "Retiring disables downloads and marks the template as no longer active. Existing batches are not affected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doLifecycle}>
              {lifecycleConfirm === "publish" ? "Publish" : "Retire"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Main page
// ============================================================================
const TABLE_HEADERS = ["Code", "Template Name", "Dataset", "Ver.", "Format", "Status", "Columns", "Download", "Published"];

export default function ImportTemplatesList() {
  const [templates, setTemplates] = useState<ImportTemplate[]>(INITIAL_TEMPLATES);
  const [search, setSearch] = useState("");
  const [datasetFilter, setDatasetFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [detail, setDetail] = useState<ImportTemplate | null>(null);
  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; item: ImportTemplate | null } | null>(null);

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter((t) => t.status === "active").length,
    draft: templates.filter((t) => t.status === "draft").length,
    retired: templates.filter((t) => t.status === "retired").length,
  }), [templates]);

  const metricCards = [
    { title: "Total Templates", value: stats.total, key: "all" as CardFilter },
    { title: "Active", value: stats.active, key: "active" as CardFilter },
    { title: "Drafts", value: stats.draft, key: "draft" as CardFilter },
    { title: "Retired", value: stats.retired, key: "retired" as CardFilter },
  ];

  const filtered = useMemo(() => {
    let list = templates;
    if (cardFilter !== "all") list = list.filter((t) => t.status === cardFilter);
    if (datasetFilter !== "all") list = list.filter((t) => t.dataset_type === datasetFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
    }
    return list;
  }, [templates, cardFilter, datasetFilter, search]);

  const updateTemplate = (updated: ImportTemplate) => {
    setTemplates((s) => s.map((t) => t.id === updated.id ? updated : t));
    if (detail?.id === updated.id) setDetail(updated);
  };

  const tableData = filtered.map((tpl) => ({
    code: <span className="font-mono text-xs font-semibold text-black-01">{tpl.code}</span>,
    name: <p className="text-sm font-medium text-black-01">{tpl.name}</p>,
    dataset: <span className="capitalize text-xs">{tpl.dataset_type}</span>,
    version: <span className="text-sm font-mono font-medium">v{tpl.version}</span>,
    format: <span className="text-xs font-mono">{tpl.default_file_format}</span>,
    status: (
      <Badge variant={(STATUS_BADGE[tpl.status] ?? "inactive") as any} className="text-xs capitalize">
        {tpl.status}
      </Badge>
    ),
    columns: <Badge variant="inactive" className="text-xs">{tpl.columns.length}</Badge>,
    download: tpl.is_download_enabled
      ? <Badge variant="active" className="text-xs">Enabled</Badge>
      : <Badge variant="inactive" className="text-xs">Disabled</Badge>,
    published: <span className="text-xs text-gray-01">{tpl.published_at ? new Date(tpl.published_at).toLocaleDateString() : "—"}</span>,
    _id: tpl.id,
    _status: tpl.status,
    _downloadEnabled: tpl.is_download_enabled,
  }));

  return (
    <DashboardLayout title="Import Templates">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Import Templates</p>
            <p className="text-xs text-gray-01 mt-0.5">System-level templates defining column structure and validation rules for each dataset.</p>
          </div>
          <Button size="lg" onClick={() => setDrawer({ mode: "create", item: null })}>
            <Plus size={16} /> New Template
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
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <CustomInput
              id="search-templates" canSearch placeholder="Search by code or name…"
              className="h-10" containerClass="w-full sm:w-[260px]"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <CustomNativeSelect
              id="filter-dataset" name="filter-dataset" label=""
              value={datasetFilter} onChange={(e) => setDatasetFilter(e.target.value)}
              options={[{ value: "all", label: "All Datasets" }, ...DATASET_TYPES.map((d) => ({ value: d, label: d }))]}
            />
          </div>
          <Button variant="white" size="lg" className="[&_svg]:size-5 font-medium font-mont shrink-0">
            <RefreshCw /> Refresh
          </Button>
        </div>

        <CustomTable
          tableHeaderList={TABLE_HEADERS}
          tableBodyList={tableData}
          dropDown
          dropDownList={(row: { _id: string; _status: string; _downloadEnabled: boolean }) => {
            const tpl = templates.find((t) => t.id === row._id)!;
            return [
              {
                label: "View Details",
                className: "",
                onActionClick: () => setDetail(tpl),
              },
              {
                label: "Edit Metadata",
                className: "",
                onActionClick: () => setDrawer({ mode: "edit", item: tpl }),
              },
              ...(tpl.status === "draft" ? [{
                label: "Publish",
                className: "text-primary",
                onActionClick: () => {
                  updateTemplate({ ...tpl, status: "active", published_at: new Date().toISOString() });
                  toast.success("Template published.");
                },
              }] : []),
              ...(tpl.status === "active" ? [{
                label: "Retire",
                className: "text-amber-600",
                onActionClick: () => {
                  updateTemplate({ ...tpl, status: "retired", retired_at: new Date().toISOString() });
                  toast.success("Template retired.");
                },
              }] : []),
              {
                label: "Download Scaffold",
                className: row._downloadEnabled ? "" : "text-gray-400 cursor-not-allowed",
                onActionClick: () => {
                  if (!row._downloadEnabled) { toast.error("Download not available for this template."); return; }
                  toast.success("Template download started. (Demo — no actual file)");
                },
              },
            ];
          }}
          hidePagination
        />
      </main>

      <TemplateDetailSheet
        open={!!detail}
        onClose={() => setDetail(null)}
        template={detail}
        onTemplateChange={updateTemplate}
        onEdit={() => {
          const t = detail;
          setDetail(null);
          setDrawer({ mode: "edit", item: t });
        }}
      />

      <TemplateSheet
        open={!!drawer}
        onClose={() => setDrawer(null)}
        mode={drawer?.mode ?? "create"}
        item={drawer?.item ?? null}
        existingCodes={templates.map((t) => t.code)}
        onSave={(rec, mode) => {
          if (mode === "create") {
            const newTpl: ImportTemplate = {
              ...(rec as ImportTemplate),
              id: "tpl_" + Math.random().toString(36).slice(2, 8),
              version: rec.version ?? 1,
              status: "draft",
              columns: [],
              published_at: null,
              retired_at: null,
              created_by: "Olumide Bankole",
            };
            setTemplates((s) => [newTpl, ...s]);
            toast.success("Template created.");
          } else {
            updateTemplate({ ...drawer!.item!, ...rec } as ImportTemplate);
            toast.success("Template updated.");
          }
          setDrawer(null);
        }}
      />
    </DashboardLayout>
  );
}
