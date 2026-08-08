import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Copy, Edit2, MoreVertical, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SearchSelect } from "@/components/custom/search-select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PermissionGate from "@/components/custom/permission-gate";
import PromptModal from "@/components/modal/prompt-modal";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import {
  useGetComplianceRulesQuery,
  useUpdateComplianceRuleMutation,
  useDeleteComplianceRuleMutation,
  useCreateComplianceRuleMutation,
} from "@/redux/services/dashboard/audit-api";
import { useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import { formatRelativeDate } from "@/utils/helpers";
import type { ComplianceRule } from "@/redux/services/dashboard/audit-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const RULE_TYPES = ["RETENTION", "MASKING", "ACCESS", "EXPORT"] as const;

const MODULE_KEYS = [
  "ONBOARDING", "IDENTITY", "USER", "RBAC", "IMPORT",
  "CONFIG", "FINANCE", "PROCUREMENT", "SCHOOL", "BRANCH", "SYSTEM",
] as const;

const TYPE_STYLE: Record<string, string> = {
  RETENTION: "bg-blue-50 text-blue-700 border-blue-100",
  MASKING:   "bg-purple-50 text-purple-700 border-purple-100",
  ACCESS:    "bg-red-50 text-red-700 border-red-100",
  EXPORT:    "bg-green-50 text-green-700 border-green-100",
};

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  currentPage, totalPages, onPageChange,
}: {
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | string)[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);
  return (
    <div className="flex items-center justify-end gap-2 mt-3.5">
      <button onClick={() => currentPage > 1 && onPageChange(currentPage - 1)} disabled={currentPage <= 1}
        className={cn("grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage <= 1 ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer")}>Prev</button>
      {pages.map((p, i) => typeof p === "string" ? (
        <span key={`e-${i}`} className="px-2 text-black-02">...</span>
      ) : (
        <button key={p} onClick={() => onPageChange(p)}
          className={cn("grid size-7.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage === p ? "bg-primary text-white" : "text-black-02 hover:bg-gray-100")}>{p}</button>
      ))}
      <button onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}
        className={cn("grid h-7.5 px-2.5 place-content-center rounded-md text-sm font-medium transition-colors", currentPage >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-black-02 hover:bg-gray-100 cursor-pointer")}>Next</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComplianceRules() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(P.MANAGE_AUDIT);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<ComplianceRule | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (typeFilter)   p.rule_type  = typeFilter;
    if (activeFilter) p.is_active  = activeFilter;
    if (moduleFilter) p.module_key = moduleFilter;
    if (schoolFilter) p.i_slug     = schoolFilter;
    return p;
  }, [page, typeFilter, activeFilter, moduleFilter, schoolFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetComplianceRulesQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const { data: schoolsData } = useGetSchoolsQuery({ page_size: 200 });
  const [updateRule] = useUpdateComplianceRuleMutation();
  const [deleteRule, { isLoading: deleting }] = useDeleteComplianceRuleMutation();
  const [createRule] = useCreateComplianceRuleMutation();

  const rules = data?.data ?? [];
  const schools = schoolsData?.data ?? [];

  const resetPage = () => setPage(1);

  const handleToggleActive = (r: ComplianceRule) => {
    updateRule({ id: r.id, body: { is_active: !r.is_active } })
      .unwrap()
      .then(() => toast.success(`${r.name}: ${!r.is_active ? "Activated" : "Deactivated"}`))
      .catch(() => {});
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteRule(confirmDelete.id)
      .unwrap()
      .then(() => { toast.success("Rule deleted."); setConfirmDelete(null); })
      .catch(() => {});
  };

  const handleDuplicate = (r: ComplianceRule) => {
    createRule({
      name: `${r.name} (copy)`,
      description: r.description,
      rule_type: r.rule_type,
      school: r.school?.id ?? null,
      module_key: r.module_key,
      action_type: r.action_type,
      is_active: false,
      retention_days: r.retention_days,
    })
      .unwrap()
      .then(() => toast.success("Rule duplicated."))
      .catch(() => {});
  };

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Compliance Rules</p>
            <p className="text-xs text-gray-01 mt-0.5">Retention, masking, access and export policies.</p>
          </div>
          <div className="inline-flex items-center gap-3.5">
            <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} /> Refresh
            </Button>
            <PermissionGate permission={P.MANAGE_AUDIT}>
              <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULE_CREATE)}>
                <Plus /> New rule
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center overflow-x-auto pb-1">
          <div className="w-40 shrink-0">
            <SearchSelect
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); resetPage(); }}
              placeholder="Any type"
              options={RULE_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <div className="w-52 shrink-0">
            <SearchSelect
              value={schoolFilter}
              onChange={(e) => { setSchoolFilter(e.target.value); resetPage(); }}
              placeholder="All schools / Global"
              options={schools.map((s) => ({ value: s.slug, label: s.name }))}
            />
          </div>

          <div className="w-36 shrink-0">
            <SearchSelect
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); resetPage(); }}
              placeholder="Any state"
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </div>

          <div className="w-40 shrink-0">
            <SearchSelect
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); resetPage(); }}
              placeholder="All modules"
              options={MODULE_KEYS.map((m) => ({ value: m, label: m }))}
            />
          </div>
        </div>

        {/* Body */}
        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md border">
            <p className="text-sm font-medium text-destructive">Failed to load rules.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-md border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F1F1F1] border-b">
                    {["Name", "Type", "Scope", "Module", "Action", "Retention", "Active", "Updated", ""].map((h, i) => (
                      <th key={i} className="px-3 py-3 text-left text-xs font-semibold font-mont text-gray-01 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-03">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="h-60 text-center">
                        <div className="flex justify-center"><div className="loader" /></div>
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="h-48 text-center">
                        <p className="text-xs text-gray-01">No rules match these filters.</p>
                      </td>
                    </tr>
                  ) : (
                    rules.map((r) => (
                      <RuleRow
                        key={r.id}
                        rule={r}
                        canManage={canManage}
                        onEdit={() => navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULE_EDIT(r.id))}
                        onToggleActive={() => handleToggleActive(r)}
                        onDuplicate={() => handleDuplicate(r)}
                        onDelete={() => setConfirmDelete(r)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={data?.pagination?.currentPage ?? 1}
              totalPages={data?.pagination?.totalPages ?? 0}
              onPageChange={setPage}
            />
          </div>
        )}
      </main>

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
    </>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

function RuleRow({
  rule: r, canManage, onEdit, onToggleActive, onDuplicate, onDelete,
}: {
  rule: ComplianceRule;
  canManage: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={onEdit}>

      {/* Name + description */}
      <td className="px-3 py-3 max-w-[280px]">
        <p className="text-xs font-medium leading-snug">{r.name}</p>
        {r.description && (
          <p className="text-[10px] text-gray-01 mt-0.5 truncate">{r.description}</p>
        )}
      </td>

      {/* Type */}
      <td className="px-3 py-3">
        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", TYPE_STYLE[r.rule_type] ?? "bg-gray-100 text-gray-600")}>
          {r.rule_type}
        </span>
      </td>

      {/* Scope */}
      <td className="px-3 py-3">
        {r.school ? (
          <span className="text-xs">{r.school.name}</span>
        ) : (
          <Badge variant="outline" className="text-[10px] font-medium">Global</Badge>
        )}
      </td>

      {/* Module */}
      <td className="px-3 py-3">
        {r.module_key ? (
          <span className="text-xs font-mono uppercase">{r.module_key}</span>
        ) : (
          <span className="text-xs text-gray-01">Any</span>
        )}
      </td>

      {/* Action */}
      <td className="px-3 py-3">
        {r.action_type ? (
          <span className="font-mono text-xs">{r.action_type}</span>
        ) : (
          <span className="text-xs text-gray-01">Any</span>
        )}
      </td>

      {/* Retention */}
      <td className="px-3 py-3 tabular-nums">
        <span className="text-xs">
          {r.retention_days ? `${r.retention_days}d` : <span className="text-gray-01">-</span>}
        </span>
      </td>

      {/* Active toggle */}
      <td className="px-3 py-3" onClick={(e) => { e.stopPropagation(); if (canManage) onToggleActive(); }}>
        <Switch
          checked={r.is_active}
          disabled={!canManage}
          onCheckedChange={onToggleActive}
          data-size="sm"
        />
      </td>

      {/* Updated */}
      <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-01">
        {r.updated_at ? formatRelativeDate(r.updated_at) : "-"}
      </td>

      {/* DotMenu */}
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid size-7 place-content-center rounded-md hover:bg-gray-100 transition-colors">
                <MoreVertical className="size-4 text-gray-01" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ width: 180 }}>
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="size-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="size-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}
