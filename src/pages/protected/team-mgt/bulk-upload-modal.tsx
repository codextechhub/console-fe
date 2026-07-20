import { useState } from "react";
import { Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useLazyGetBulkUserTemplateQuery,
  useBulkUploadUsersMutation,
  type BulkUploadRes,
} from "@/redux/services/dashboard/team-mgt-api";
import { toast } from "sonner";

/**
 * Bulk-add CX staff as drafts: download the CSV template, fill it in, upload it.
 * Each row is validated on the server; valid rows become DRAFT users and invalid
 * rows come back with per-row errors, shown here.
 */
export function BulkUploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkUploadRes["data"] | null>(null);

  const [fetchTemplate, { isFetching: downloading }] = useLazyGetBulkUserTemplateQuery();
  const [bulkUpload, { isLoading: uploading }] = useBulkUploadUsersMutation();

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      onClose();
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await fetchTemplate().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cx-staff-bulk-template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't download the template. Please try again.");
    }
  };

  const upload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await bulkUpload(formData).unwrap();
      setResult(res.data);
      toast.success(res.message);
    } catch {
      // Global interceptor surfaces the error toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk upload CX staff</DialogTitle>
          <DialogDescription>
            Add many staff at once. They're saved as drafts you can review and
            submit for approval afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="rounded-md border border-gray-03 p-4">
            <p className="font-medium">1. Download the template</p>
            <p className="mt-0.5 text-xs text-gray-01">
              A CSV with the expected columns. Role is optional — you can set it
              before submitting each draft.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              loading={downloading}
              className="mt-3 w-fit gap-1.5 px-4"
            >
              <Download className="size-4" /> Download CSV template
            </Button>
          </div>

          <div className="rounded-md border border-gray-03 p-4">
            <p className="font-medium">2. Upload the filled file</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="mt-3 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white"
            />
            <Button
              type="button"
              onClick={upload}
              disabled={!file || uploading}
              loading={uploading}
              className="mt-3 w-fit gap-1.5 px-4"
            >
              <Upload className="size-4" /> Upload
            </Button>
          </div>

          {result && (
            <div className="rounded-md border border-gray-03 p-4">
              <p className="font-medium">
                {result.summary.created} draft(s) created
                {result.summary.failed > 0 ? `, ${result.summary.failed} row(s) failed` : ""}.
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-xs">
                  {result.errors.map((err) => (
                    <li key={`${err.row}-${err.email}`} className="text-destructive">
                      Row {err.row}
                      {err.email ? ` (${err.email})` : ""}:{" "}
                      {Object.entries(err.errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : String(msgs)}`)
                        .join("; ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
