import { useNavigate, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { routesPath } from "@/routes/routesPath";

const DUMMY_BATCHES: Record<string, {
  id: string; original_filename: string; dataset_type: string; status: string;
  total_rows: number; error_count: number; warning_count: number;
  uploaded_by: string; school: string; imported_at: string | null;
  notes: string;
  issues: Array<{ id: string; severity: string; code: string; message: string; row_number: number; column_name: string }>;
}> = {
  bch_001: {
    id: "bch_001", original_filename: "students_js1_term1.xlsx", dataset_type: "students",
    status: "imported", total_rows: 142, error_count: 0, warning_count: 3,
    uploaded_by: "Tunde Bakare", school: "Lekki Heights Academy",
    imported_at: "2026-05-08T09:21:14Z", notes: "",
    issues: [
      { id: "i20", severity: "warning", code: "value_too_long", message: "address_line near max length.", row_number: 8, column_name: "address_line" },
    ],
  },
  bch_002: {
    id: "bch_002", original_filename: "students_ss3_intake.xlsx", dataset_type: "students",
    status: "validation_failed", total_rows: 87, error_count: 12, warning_count: 5,
    uploaded_by: "Folake Ojo", school: "Lekki Heights Academy",
    imported_at: null, notes: "",
    issues: [
      { id: "i1", severity: "error", code: "required_value_missing", message: "guardian_email is required.", row_number: 4, column_name: "guardian_email" },
      { id: "i2", severity: "error", code: "invalid_email", message: "Not a valid email address.", row_number: 9, column_name: "guardian_email" },
      { id: "i4", severity: "error", code: "foreign_key_not_found", message: "Class 'JS9X' does not exist.", row_number: 18, column_name: "class_code" },
      { id: "i5", severity: "error", code: "duplicate_value", message: "admission_number 'ADM-2025-0101' appears twice.", row_number: 27, column_name: "admission_number" },
    ],
  },
};

const STATUS_BADGE: Record<string, string> = {
  imported: "active", validation_failed: "suspended", importing: "locked",
  validated: "pending", draft: "inactive", rolled_back: "suspended",
};

const SEVERITY_BADGE: Record<string, string> = {
  error: "suspended", warning: "locked", info: "inactive",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6">
      <p className="text-sm text-gray-01 font-mont w-36 shrink-0">{label}</p>
      <p className="text-sm font-semibold text-black-01">{value ?? "—"}</p>
    </div>
  );
}

export default function ViewBatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const batch = id ? DUMMY_BATCHES[id] : null;

  if (!batch) {
    return (
      <DashboardLayout title="Batch Detail">
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Batch not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Batch Detail">
      <main className="px-4.5 py-6 text-black-01 space-y-5">
        <button
          onClick={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}
          className="flex items-center gap-1 text-sm text-gray-01 hover:text-black-01 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Import Batches
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold font-mont text-black-01">{batch.original_filename}</h1>
            <p className="text-xs text-gray-01 mt-0.5 capitalize">{batch.dataset_type} · {batch.school}</p>
          </div>
          <Badge variant={(STATUS_BADGE[batch.status] ?? "inactive") as any} className="capitalize">
            {batch.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="bg-white rounded-md p-5 space-y-3">
          <p className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">Batch Info</p>
          <InfoRow label="File" value={batch.original_filename} />
          <InfoRow label="Dataset Type" value={<span className="capitalize">{batch.dataset_type}</span>} />
          <InfoRow label="School" value={batch.school} />
          <InfoRow label="Uploaded By" value={batch.uploaded_by} />
          <InfoRow label="Total Rows" value={batch.total_rows} />
          <InfoRow label="Errors" value={batch.error_count} />
          <InfoRow label="Warnings" value={batch.warning_count} />
          <InfoRow label="Imported At" value={batch.imported_at ? new Date(batch.imported_at).toLocaleString() : "—"} />
          {batch.notes && <InfoRow label="Notes" value={batch.notes} />}
        </div>

        {batch.issues.length > 0 && (
          <div className="bg-white rounded-md p-5">
            <p className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3 mb-4">
              Validation Issues ({batch.issues.length})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-01">Severity</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-01">Row</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-01">Column</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-01">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.issues.map((issue) => (
                    <tr key={issue.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <Badge variant={(SEVERITY_BADGE[issue.severity] ?? "inactive") as any} className="text-xs capitalize">
                          {issue.severity}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-gray-01">{issue.row_number || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{issue.column_name || "—"}</td>
                      <td className="py-2.5 px-3 text-black-01">{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="white" onClick={() => navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX)}>
            Back to List
          </Button>
        </div>
      </main>
    </DashboardLayout>
  );
}
