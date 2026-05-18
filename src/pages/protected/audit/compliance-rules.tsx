import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import PromptModal from "@/components/modal/prompt-modal";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import {
  useGetComplianceRulesQuery,
  useDeleteComplianceRuleMutation,
} from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate } from "@/utils/helpers";
import type { ComplianceRule } from "@/redux/services/dashboard/auditTypes";
import { toast } from "sonner";

const TABLE_HEADERS = ["Name", "Type", "Scope", "Module", "Action", "Retention", "Active", "Action"];

const TYPE_TONE: Record<string, "active" | "suspended" | "locked" | "inactive"> = {
  RETENTION: "active",
  MASKING: "locked",
  ACCESS: "inactive",
  EXPORT: "inactive",
};

export default function ComplianceRules() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<ComplianceRule | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (typeFilter) p.rule_type = typeFilter;
    return p;
  }, [page, typeFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetComplianceRulesQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteRule, { isLoading: deleting }] = useDeleteComplianceRuleMutation();

  const rules = data?.data ?? [];

  const tableData = rules.map((r) => ({
    name: <p className="text-xs font-medium">{r.name}</p>,
    type: (
      <Badge variant={(TYPE_TONE[r.rule_type] ?? "inactive") as any} className="text-[10px] uppercase">
        {r.rule_type}
      </Badge>
    ),
    scope: <span className="text-xs">{r.school?.name ?? "Global"}</span>,
    module: <span className="text-xs uppercase">{r.module_key || "—"}</span>,
    action: <span className="font-mono text-xs">{r.action_type || "—"}</span>,
    retention: <span className="text-xs">{r.retention_days ? `${r.retention_days} days` : "—"}</span>,
    active: r.is_active ? (
      <Badge variant="active" className="text-[10px] uppercase">Yes</Badge>
    ) : (
      <Badge variant="inactive" className="text-[10px] uppercase">No</Badge>
    ),
    _rule: r,
  }));

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteRule(confirmDelete.id)
      .unwrap()
      .then(() => {
        toast.success("Rule deleted.");
        setConfirmDelete(null);
      })
      .catch(() => {});
  };

  return (
    <DashboardLayout title="Compliance Rules">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Compliance Rules</p>
            <p className="text-xs text-gray-01 mt-0.5">Retention, masking, access and export policies.</p>
          </div>
          <div className="inline-flex items-center gap-3.5">
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
            <PermissionGate permission={P.MANAGE_AUDIT}>
              <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULE_CREATE)}>
                <Plus /> Add Rule
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="inline-flex bg-white rounded-md p-1 border border-gray-200 flex-wrap">
          {["", "RETENTION", "MASKING", "ACCESS", "EXPORT"].map((t) => (
            <button
              key={t || "all"}
              type="button"
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1 text-xs rounded ${
                typeFilter === t ? "bg-blue-600 text-white" : "text-gray-01"
              }`}
            >
              {t || "All"}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Failed to load rules.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            dropDown
            dropDownList={(row: { _rule: ComplianceRule }) => [
              ...(hasPermission(P.MANAGE_AUDIT)
                ? [{
                    label: "Edit",
                    className: "",
                    onActionClick: () =>
                      navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULE_EDIT(row._rule.id)),
                  }]
                : []),
              ...(hasPermission(P.MANAGE_AUDIT)
                ? [{
                    label: "Delete",
                    className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                    onActionClick: () => setConfirmDelete(row._rule),
                  }]
                : []),
            ]}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(p) => setPage(p as number)}
          />
        )}

        <PromptModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete rule?"
          description={`Permanently delete "${confirmDelete?.name}". This cannot be undone.`}
          onConfirmText="Delete"
          onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
          canCancel
          loading={deleting}
        />

        <p className="text-xs text-gray-01">
          Last updated{rules[0] ? ` ${formatRelativeDate((rules[0] as ComplianceRule & { updated_at?: string }).updated_at ?? "")}` : ""}
        </p>
      </main>
    </DashboardLayout>
  );
}
