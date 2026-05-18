import { Database, Download, FileText } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useCreateAuditExportMutation } from "@/redux/services/dashboard/auditApi";
import { useAppSelector } from "@/redux/store";
import { toast } from "sonner";

export default function MyPrivacy() {
  const user = useAppSelector((s) => s.auth.user);
  const [createExport, { isLoading }] = useCreateAuditExportMutation();

  const handleExportMyActivity = () => {
    if (!user?.id) return;
    createExport({
      filter_payload: { actor_user_id: user.id },
      export_format: "CSV",
    })
      .unwrap()
      .then(() => {
        toast.success("Your activity export is ready. Check the Audit Exports page.");
      })
      .catch(() => {});
  };

  return (
    <DashboardLayout title="Data & Privacy">
      <main className="px-4.5 py-6 space-y-5 text-black-01 max-w-2xl">
        <div className="flex items-center gap-3">
          <Database className="size-6 text-blue-600" />
          <div>
            <p className="font-semibold font-mont text-gray-01">Data & privacy</p>
            <p className="text-xs text-gray-01 mt-0.5">Download a copy of your account activity.</p>
          </div>
        </div>

        <div className="bg-white rounded-md p-5 space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="size-5 text-gray-01 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Account activity export</p>
              <p className="text-xs text-gray-01 mt-1">
                Generates a CSV containing every audit event attributed to your account. The file is
                available from the Audit Exports page once it finishes processing.
              </p>
            </div>
          </div>
          <Button onClick={handleExportMyActivity} disabled={isLoading || !user?.id}>
            <Download className="size-3.5" />
            {isLoading ? "Preparing…" : "Request export"}
          </Button>
        </div>

        <div className="bg-white rounded-md p-5 space-y-2">
          <p className="font-semibold text-sm">Your data, your control</p>
          <p className="text-xs text-gray-01">
            We retain audit events to meet compliance and security obligations. To request deletion of
            personal data outside the audit log, contact your administrator.
          </p>
        </div>
      </main>
    </DashboardLayout>
  );
}
