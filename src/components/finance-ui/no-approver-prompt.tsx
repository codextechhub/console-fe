// <useNoApproverPrompt> - warn at submission when nobody can approve what was
// just submitted, and offer to continue anyway.
//
// A workflow stage whose approving permission nobody holds activates with an
// empty approver snapshot, and the document *parks*: submitted, waiting, and
// with no human able to move it. Without this the submit looks like it worked
// and the document quietly sits there. Every submit-for-approval endpoint now
// returns an `approval` block saying whether that happened; pass it here.
//
// The dialog is deliberately blunt about the trade. Continuing takes the
// document to its terminal state with no second pair of eyes, which on a payout
// or a purchase order is the entire maker-checker control, so the copy says so
// rather than reading like a routine confirmation. The backend records who
// continued and refuses the release outright if anybody can still decide the
// stage, so a dialog left open while an approver is appointed cannot bypass
// them.
//
//   const { promptIfParked, noApproverDialog } = useNoApproverPrompt();
//   const res = await submitForApproval(...).unwrap();
//   promptIfParked(res.data?.approval);
//   ...
//   {noApproverDialog}

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmActionModal } from "@/components/finance-ui/confirm-action-modal";
import { useContinueWithoutApprovalMutation } from "@/redux/services/dashboard/workflow-api";
import type { ApprovalParkState } from "@/redux/services/dashboard/workflow-types";

interface Options {
  /** What the user submitted, lowercase, for the dialog copy ("payout batch"). */
  documentLabel?: string;
  /** Ran after a successful release, e.g. to close a drawer or refetch. */
  onContinued?: () => void;
}

export function useNoApproverPrompt({ documentLabel = "document", onContinued }: Options = {}) {
  const [park, setPark] = useState<ApprovalParkState | null>(null);
  const [continueWithoutApproval, { isLoading }] = useContinueWithoutApprovalMutation();

  /**
   * Open the warning if the submission parked. Safe to call unconditionally
   * with whatever the submit response returned: an approved or ordinarily
   * routed document passes `parked: false` and nothing happens.
   */
  const promptIfParked = useCallback((approval?: ApprovalParkState | null) => {
    if (approval?.parked) setPark(approval);
  }, []);

  const confirm = useCallback(async () => {
    if (!park) return;
    try {
      await continueWithoutApproval({ id: park.instance_id }).unwrap();
      toast.success(`Continued without approval. This ${documentLabel} has been recorded as approved.`);
      setPark(null);
      onContinued?.();
    } catch (err) {
      // The commonest failure is not a failure: somebody was granted the
      // approving permission between the warning and the click, so the backend
      // refused the bypass. That is the right outcome and reads as good news.
      const code = (err as { data?: { error?: { code?: string } } })?.data?.error?.code;
      if (code === "NOT_PARKED") {
        toast.success("Someone can approve this now, so it has gone for review instead.");
        setPark(null);
        onContinued?.();
        return;
      }
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Could not continue without approval.");
    }
  }, [park, continueWithoutApproval, documentLabel, onContinued]);

  const noApproverDialog = (
    <ConfirmActionModal
      open={!!park}
      onOpenChange={(open) => { if (!open) setPark(null); }}
      title="Nobody can approve this"
      description={`This ${documentLabel} was submitted, but no one currently holds the permission to approve it, so it will wait indefinitely.`}
      confirmText="Continue anyway"
      cancelText="Leave it waiting"
      onConfirm={confirm}
      loading={isLoading}
      destructive
    >
      <div className="space-y-3 text-sm text-gray-01">
        <p>
          Continuing approves it <span className="font-semibold">without review</span>.
          Your name and the time are recorded against it.
        </p>
        {park?.stage_label && (
          <p className="text-xs text-gray-500">
            Waiting on: <span className="font-medium text-black-01">{park.stage_label}</span>
          </p>
        )}
        {park?.permission_key && (
          <p className="text-xs text-gray-500">
            To fix this properly, grant someone{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px] text-black-01">
              {park.permission_key}
            </code>{" "}
            and leave this waiting. It will reach them as soon as they have it.
          </p>
        )}
      </div>
    </ConfirmActionModal>
  );

  return { promptIfParked, noApproverDialog };
}
