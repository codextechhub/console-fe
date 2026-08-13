import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import { useGetWorkflowTemplatesQuery } from "@/redux/services/dashboard/workflow-api";
import type { WorkflowTemplate } from "@/redux/services/dashboard/workflow-types";
import { humanizeDocumentType } from "../components/workflow-format";

const TABLE_HEADERS = ["Name", "Document Type", "Code", "Stages", "Scope", "Updated"];

export default function WorkflowTemplates() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetWorkflowTemplatesQuery(
    { page },
    { refetchOnMountOrArgChange: true },
  );

  const items = useMemo(() => data?.data ?? [], [data]);

  const tableData = useMemo(
    () =>
      items.map((t: WorkflowTemplate) => ({
        name: <span className="text-sm font-medium text-black-01">{t.name}</span>,
        documentType: <span className="text-sm">{humanizeDocumentType(t.document_type)}</span>,
        code: <span className="font-mono text-xs text-gray-01">{t.code}</span>,
        stages: <Badge variant="inactive">{t.stages.length} stages</Badge>,
        scope: (
          <Badge variant="outline">
            {t.branch ? "Branch" : t.tenant ? "School" : "Platform"}
          </Badge>
        ),
        updated: <span className="text-xs text-gray-01">{formatRelativeDate(t.updated_at)}</span>,
        _raw: t,
        _id: t.id,
      })),
    [items],
  );

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Workflow Templates</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Reusable approval blueprints. Each defines the stages and routing for a document type.
            </p>
          </div>
          <PermissionGate permission={P.MANAGE_WORKFLOW_TEMPLATES}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.WORKFLOW.TEMPLATE_NEW)}>
              <Plus /> New Template
            </Button>
          </PermissionGate>
        </div>

        <div className="flex justify-end">
          <Button
            variant="white"
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn(isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>

        <CustomTable
          tableHeaderList={TABLE_HEADERS}
          tableBodyList={tableData}
          loading={isLoading}
          emptyText="No workflow templates published yet."
          onRowClick={(row) => navigate(routesPath.PROTECTED.WORKFLOW.TEMPLATE_DETAIL(row._id))}
          perPage={data?.pagination?.pageSize}
          totalPage={data?.pagination?.totalPages}
          currentPage={data?.pagination?.currentPage}
          onPageChange={(p) => setPage(p as number)}
        />
      </main>
    </>
  );
}
