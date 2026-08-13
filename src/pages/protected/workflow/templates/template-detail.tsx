import { useParams, useNavigate } from "react-router";
import { ArrowRight, GitBranch, Loader2, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { useGetWorkflowTemplateQuery } from "@/redux/services/dashboard/workflow-api";
import { advanceRuleLabel, approverSummary, humanizeDocumentType } from "../components/workflow-format";
import { ConditionView } from "../components/condition-view";

export default function TemplateDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: template, isLoading, isError, refetch } = useGetWorkflowTemplateQuery(id, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <>
      <main className="px-4.5 py-6 text-black-01">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : isError || !template ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-destructive">Failed to load this template.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white-02 bg-white p-5">
              <div>
                <h1 className="text-lg font-semibold">{template.name}</h1>
                <p className="mt-1 text-xs text-gray-01">
                  {humanizeDocumentType(template.document_type)} ·{" "}
                  <span className="font-mono">{template.code}</span> ·{" "}
                  {template.branch ? "Branch" : template.tenant ? "School" : "Platform"} scope
                </p>
                {template.description && (
                  <p className="mt-2 max-w-2xl text-sm text-gray-01">{template.description}</p>
                )}
              </div>
              <PermissionGate permission={P.MANAGE_WORKFLOW_TEMPLATES}>
                <Button
                  variant="outline"
                  onClick={() => navigate(routesPath.PROTECTED.WORKFLOW.TEMPLATE_EDIT(template.id))}
                >
                  <Pencil className="size-4" /> Edit
                </Button>
              </PermissionGate>
            </div>

            {/* Stages */}
            <div className="rounded-lg border border-white-02 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold">Stages</h3>
              <div className="space-y-3">
                {[...template.stages]
                  .sort((a, b) => a.order - b.order)
                  .map((s, i) => (
                    <div key={s.id} className="rounded-md border border-white-02 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid size-6 place-content-center rounded-full bg-pry-01 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold">{s.label}</span>
                        <span className="font-mono text-xs text-gray-01">{s.code}</span>
                        <Badge variant={s.kind === "BRANCH" ? "outline" : "inactive"}>
                          {s.kind === "BRANCH" ? (
                            <>
                              <GitBranch className="size-3" /> Branch
                            </>
                          ) : (
                            "Approval"
                          )}
                        </Badge>
                      </div>
                      {s.kind === "APPROVAL" && (
                        <>
                          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-01 sm:grid-cols-3">
                            <Detail label="Approved by" value={approverSummary(s)} />
                            <Detail label="Scope" value={s.approver_scope} />
                            <Detail label="Advance rule" value={advanceRuleLabel(s.advance_rule, s.quorum_count)} />
                            <Detail label="On rejection" value={s.on_rejection === "TERMINAL" ? "Ends workflow" : "Returns to requester"} />
                            <Detail label="Skip if no approvers" value={s.skip_if_no_approvers ? "Yes" : "No"} />
                          </div>
                          {/* A dynamic stage's answer IS its rule order, so the
                              ladder is spelled out rather than summarised. */}
                          {s.approver_source === "DYNAMIC_ROLE" && (
                            <ol className="mt-2 space-y-1 border-l-2 border-white-02 pl-3">
                              {[...(s.dynamic_role_rules ?? [])]
                                .sort((a, b) => a.order - b.order)
                                .map((r, ri) => (
                                  <li key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-gray-01 tabular-nums">{ri + 1}.</span>
                                    {r.is_fallback ? (
                                      <span className="text-gray-01 italic">Otherwise</span>
                                    ) : (
                                      <ConditionView condition={r.condition} />
                                    )}
                                    <span aria-hidden className="text-gray-01">→</span>
                                    <span className="font-medium text-black-01">
                                      {r.role_name || r.role_key}
                                    </span>
                                    {r.label && <span className="text-gray-01">{r.label}</span>}
                                  </li>
                                ))}
                            </ol>
                          )}
                        </>
                      )}
                      {s.inclusion_condition != null && (
                        <p className="mt-2 text-xs text-gray-01">
                          Included only when <ConditionView condition={s.inclusion_condition} />
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Routes */}
            <div className="rounded-lg border border-white-02 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold">Routing</h3>
              {template.routes.length === 0 ? (
                <p className="text-sm text-gray-01">
                  No explicit routes - stages run linearly in order.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...template.routes]
                    .sort((a, b) => a.order - b.order)
                    .map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">{r.from_stage_code ?? "ENTRY"}</Badge>
                        <ArrowRight className="size-3.5 text-gray-01" />
                        <Badge variant="outline">{r.to_stage_code ?? "EXIT (approved)"}</Badge>
                        <span className="text-xs text-gray-01">
                          when <ConditionView condition={r.condition} />
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Notification events */}
            {Object.keys(template.notification_events).length > 0 && (
              <div className="rounded-lg border border-white-02 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold">Notification events</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(template.notification_events).map(([k, v]) => (
                    <Badge key={k} variant={v ? "active" : "inactive"}>
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-05">{label}</p>
      <p className={mono ? "font-mono text-black-01" : "text-black-01"}>{value}</p>
    </div>
  );
}
