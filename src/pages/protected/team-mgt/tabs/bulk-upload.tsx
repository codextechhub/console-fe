import { useNavigate } from "react-router";
import ImportWizard from "@/components/custom/import-wizard";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";

/**
 * Bulk-add CX staff through the shared Data Imports framework (same wizard the
 * schools/branches imports use), locked to the cx_users template. Imported rows
 * are created and submitted for approval, then appear in the Members tab — no
 * drafts. On finish we drop the user back on Members.
 */
export default function BulkUploadTab() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  if (!hasPermission(P.UPLOAD_IMPORT_BATCH)) {
    return (
      <div className="rounded-md border border-dashed border-gray-03 bg-gray-06/30 px-8 py-14 text-center">
        <p className="text-sm font-medium text-gray-01">
          You don't have permission to bulk-upload users.
        </p>
        <p className="mt-1 text-xs text-gray-01">
          Ask an administrator for the import upload permission.
        </p>
      </div>
    );
  }

  const backToMembers = () =>
    navigate(`${routesPath.PROTECTED.TEAM_MGT.CX}?tab=members`, { replace: true });

  return (
    <div className="max-w-5xl">
      <div className="mb-5 space-y-1">
        <h4 className="font-medium text-lg text-black-01">Bulk upload CX users</h4>
        <p className="text-gray-01 font-mont text-xs max-w-140">
          Download the template, fill one staff member per row, then upload and
          validate. Valid rows are created and submitted for approval, and show
          up under Members.
        </p>
      </div>
      <ImportWizard
        datasetType="cx_users"
        lockTemplate
        onComplete={(batchId) =>
          navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.VIEW(String(batchId)))
        }
        onReturn={backToMembers}
        returnLabel="Back to Members"
        onCancel={backToMembers}
      />
    </div>
  );
}
