import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ReviewChangesAndTransferSuperAdminArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Role change requests alter a role through reviewed ADD or REMOVE permission deltas. Super Admin transfer is different: it hands the platform&apos;s single highest-privilege ownership role to another active CX staff member.</p>
        <GuideChecklist items={[
          "Confirm the business reason and target role for every permission delta.",
          "Check dependencies and downstream users before removing access.",
          "For ownership transfer, verify the successor is active, trusted, and prepared.",
          "Use reviewer notes to leave a clear audit explanation.",
        ]} />
      </GuideSection>

      <GuideSection id="submit-a-change-request" title="Submit a change request">
        <GuideSteps>
          <GuideStep title="Open Role Change Requests">Select <strong>New Request</strong>.</GuideStep>
          <GuideStep title="Choose the target">Select <strong>Target Role</strong> and write a specific Justification.</GuideStep>
          <GuideStep title="Build the deltas">For each <strong>Delta Item</strong>, choose ADD or REMOVE and the exact permission key. Use <strong>Add Delta</strong> for more changes.</GuideStep>
          <GuideStep title="Submit for review">Re-read the target, justification, and every delta, then select <strong>Submit Request</strong>.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="review-and-decide" title="Review and decide">
        <GuideSteps>
          <GuideStep title="Open the request">Use <strong>View Details</strong>. Verify the requestor, target role, justification, and complete ADD or REMOVE list.</GuideStep>
          <GuideStep title="Check the actual effect">Confirm additions are necessary, removals do not break required work, and dependencies remain valid.</GuideStep>
          <GuideStep title="Record the decision">Choose <strong>Approve &amp; Apply</strong> or <strong>Deny</strong>, add useful Reviewer Notes, and confirm deliberately.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="warning" title="Approval applies the permission change">Approve &amp; Apply is not merely an acknowledgement. It changes the target role, so the walkthrough never selects it.</GuideCallout>
      </GuideSection>

      <GuideSection id="understand-request-status" title="Understand request status">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Pending", "Awaiting a reviewer decision."],
            ["Approved or Applied", "Approved and successfully applied to the target role."],
            ["Denied", "Rejected without applying the requested deltas."],
            ["Apply Failed", "The decision succeeded but the permission update failed, often because the dependency graph needs attention."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="transfer-super-admin" title="Transfer super admin">
        <GuideSteps>
          <GuideStep title="Confirm the current owner">On <strong>Transfer Super Admin Role</strong>, verify the Current super admin. Only that person can perform the transfer.</GuideStep>
          <GuideStep title="Choose the successor">Select an active CX staff member. The current owner is excluded.</GuideStep>
          <GuideStep title="Understand the immediate effect">The successor becomes the only Super Admin. The current owner is demoted to Platform Admin and loses super-admin-only capabilities immediately.</GuideStep>
          <GuideStep title="Use the final confirmation">Select <strong>Transfer Super Admin</strong>, compare From and To, type the new owner&apos;s email exactly, then select <strong>Confirm Transfer</strong> only when the handover is authorized.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="danger" title="This is a one-way ownership action">After transfer, only the new Super Admin can initiate a future transfer. The walkthrough explains the screen and stops before both transfer buttons.</GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Apply Failed appears", "Open the request, inspect the deltas and dependency graph, correct the underlying catalogue issue, then follow the approved recovery process."],
            ["The transfer control is disabled", "Only the current Super Admin can transfer ownership, and an eligible active CX successor must be selected."],
            ["No active Super Admin is found", "Stop and contact engineering. The platform must always have exactly one active Super Admin."],
            ["The confirmation email does not match", "Recheck the selected successor. Never paste a different address merely to enable confirmation."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">A role request shows its final status and reviewer record, or the Super Admin assignment shows the intended new owner and the former owner&apos;s access has changed as expected.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Preserve the business justification and verify the audit trail after every high-privilege change.</p>
      </GuideSection>
    </div>
  );
}
