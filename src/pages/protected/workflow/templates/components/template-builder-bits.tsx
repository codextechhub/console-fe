import { Network, KeyRound, Eye, TriangleAlert, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePreviewApproversMutation } from "@/redux/services/dashboard/workflow-api";
import type { StageForm } from "./stage-form";

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border border-white-02 bg-white p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// Live "who would approve?" preview for a single stage, resolved against the
// sample requester via the backend resolver (organogram climb modes + RBAC).
export function ApproverPreview({ stage, requester }: { stage: StageForm; requester: string }) {
  const [preview, { data, isLoading, error }] = usePreviewApproversMutation();

  const ready =
    !!requester &&
    (stage.approver_source === "RBAC_PERMISSION"
      ? !!stage.approver_permission_key.trim()
      : !!stage.organogram_target &&
        (stage.organogram_target !== "SPECIFIC_POSITION" || !!stage.organogram_position_code));

  const run = () => {
    if (!ready) return;
    preview({
      requester,
      approver_source: stage.approver_source,
      approver_permission_key: stage.approver_permission_key.trim(),
      approver_scope: stage.approver_scope,
      organogram_target: stage.approver_source === "ORGANOGRAM" ? stage.organogram_target : "",
      organogram_levels: Number(stage.organogram_levels) || 1,
      organogram_position_code: stage.organogram_position_code,
    });
  };

  const isOrg = stage.approver_source === "ORGANOGRAM";
  const empty = data && data.count === 0;

  return (
    <div className={cn("mt-3 rounded-md border px-3 py-2.5", empty ? "border-yellow-01/40 bg-yellow-01/5" : "border-white-02 bg-gray-06/30")}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-01">
          {isOrg ? <Network className="size-3 text-teal-600" /> : <KeyRound className="size-3 text-violet-600" />}
          Who would approve?
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={!ready || isLoading}
          onClick={run}
          title={!requester ? "Pick a sample requester above" : !ready ? "Complete the approver config" : "Resolve approvers"}
        >
          <Eye className="size-3.5" /> {isLoading ? "Resolving…" : "Preview"}
        </Button>
      </div>

      {!requester && <p className="mt-1.5 text-[11px] text-gray-01">Pick a sample requester above to preview.</p>}

      {error && <p className="mt-1.5 text-[11px] text-destructive">Could not resolve approvers.</p>}

      {data && (
        empty ? (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-yellow-01">
            <TriangleAlert className="size-3.5" /> No eligible approvers{stage.skip_if_no_approvers ? " - stage auto-skips" : " - stage would stall"}.
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.approvers.map((a) => (
              <span key={a.user.id} className="inline-flex items-center gap-1.5 rounded-full border border-white-02 bg-white px-2 py-0.5 text-[12px] text-black-01">
                {a.user.full_name}
                {a.on_behalf_of && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-01">
                    <CornerDownRight className="size-2.5" /> for {a.on_behalf_of.full_name}
                  </span>
                )}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  );
}
