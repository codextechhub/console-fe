import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function DelegateAndTrackApprovalsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Use <strong>My Submissions</strong> for requests you started and <strong>Approval Delegations</strong> when another approver must cover your queue for a defined period.</p>
        <GuideChecklist items={[
          "Confirm the delegate is an active approver and understands the covered document types.",
          "Choose exact start and end dates and decide whether both people may act.",
          "Keep the workflow instance ID when escalating a stalled or unexpected result.",
        ]} />
      </GuideSection>

      <GuideSection id="track-a-submission" title="Track a personal submission">
        <GuideSteps>
          <GuideStep title="Open My Submissions">Filter by All, In Progress, Returned, Approved, or Rejected, then open the request.</GuideStep>
          <GuideStep title="Read the current stage">Use the stage tracker and activity timeline to see who or what the request is waiting for. Skipped stages do not appear in progress.</GuideStep>
          <GuideStep title="Correct a returned request">Amend the record in its source module, then select <strong>Resubmit</strong>. Console resumes at the returned stage with a fresh approver list.</GuideStep>
          <GuideStep title="Withdraw only when the request should stop">The owner may withdraw a Submitted, In Progress, or Returned instance. Withdrawal ends that instance; restarting begins in the source module. The confirm says what happens to the document: a petty cash return is cancelled, and so is money sent to another branch without being asked, while money another branch asked for goes back to waiting to be sent.</GuideStep>
        </GuideSteps>
        <p><strong>Finance and Procurement documents</strong> are corrected and resumed on their own screen, without coming back here. Open the document, for example the requisition in Procurement or the credit note in Receivables. A note headed <strong>Sent back to you</strong> says who sent it back, when, and why. Under it:</p>
        <GuideChecklist items={[
          "Edit corrects the document in place. Your role must also hold the edit permission for that kind of document.",
          "Resume sends the corrected version back into the same approval, at the stage that sent it back. The approvers then see the corrected version.",
        ]} />
        <p>Edit is offered on requisitions, purchase orders, vendor invoices, vendor payments, vendor credit notes, credit and debit notes, concessions, manual journals, and bank transactions and transfers. On an expense claim the sender attaches or removes receipts instead. Refunds, write-offs, petty cash returns, credit transfers, doubtful-debt provision runs, inter-branch sends and journals raised by another document can only be resumed as they are: to change one, withdraw it here and send it again from its own screen. Withdrawing a petty cash return, or money sent to another branch without being asked, cancels it, so raise a new one instead.</p>
        <p>A document sent back can be spotted before it is opened. Its badge reads <strong>Sent back</strong>, in its own colour, on its row in the list and in its drawer, while a document still with its approver keeps its usual word. Every list&rsquo;s status filter has a <strong>Sent back</strong> choice that lists only what an approver sent back. Lists with no other status choices, such as refunds and write-offs, provision runs, bank transactions and transfers, petty cash returns and vendor payments, have a filter with just that one. No other choice lists it: a sent-back requisition or purchase order is not under <strong>Pending Approval</strong>, and a sent-back finance document is not under <strong>Draft</strong>.</p>
        <p>Nothing can be cancelled or ended while its approval request is open, including after an approver sends it back. <strong>Cancel return</strong> on a petty cash return, <strong>Reject</strong> on an expense claim and <strong>Decline</strong> on an inter-branch request are not offered meanwhile, and the server refuses the attempt with a message to withdraw the approval request first. Withdraw it here first, then end the document on its own screen. A petty cash return needs no second step: withdrawing it cancels it.</p>
        <GuideCallout tone="info" title="Only the person who sent it gets Edit and Resume">
          Ngozi Ibe sends back a stationery requisition that Tunde Bello sent for approval, asking for a cheaper supplier. Tunde opens the requisition, selects <strong>Edit</strong>, changes the supplier, then selects <strong>Resume</strong>. Amaka Obi, who may also edit requisitions, sees the note headed <strong>Sent back</strong> but neither button, and so does Ngozi. While a document is with its approvers, nobody can change it: its screen says <em>With the approver.</em>
        </GuideCallout>
      </GuideSection>

      <GuideSection id="create-a-delegation" title="Create a delegation">
        <GuideSteps>
          <GuideStep title="Select New Delegation">Choose an active approver other than yourself.</GuideStep>
          <GuideStep title="Set the period">Start date begins at the start of that day and end date lasts through the end of that day. The end cannot precede the start.</GuideStep>
          <GuideStep title="Limit the document type if needed">Enter the exact document type, such as <strong>leave.request</strong>, or leave it blank to cover every type.</GuideStep>
          <GuideStep title="Choose exclusive or shared coverage">With <strong>Exclusive delegation</strong> off, either you or the delegate can act and the first valid vote counts. With it on, only the delegate appears for your authority during the period.</GuideStep>
          <GuideStep title="Add a reason and review the summary">The optional reason is limited to 240 characters. Select <strong>Save delegation</strong> only after checking the person, dates, scope, and exclusivity.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="danger" title="Delegation transfers decision authority">It does not transfer your account, role, or password. Never share credentials. Revoke an Active or Scheduled delegation when coverage is no longer authorized.</GuideCallout>
      </GuideSection>

      <GuideSection id="monitor-workflow-load" title="Manage Approvals and team load">
        <p>Users with workflow-instance access can use <strong>Manage Approvals</strong> to filter every request by document type, status, stage, who raised it, who it waits on and how long it has waited, and <strong>Team Load</strong> to compare active-stage counts by document type. Open a request to inspect its document, stages, approvers, and audit history. Users who may also change approvers can swap, add or remove who approves a stage that has not finished, assign an upcoming stage in advance, or select several requests and replace one approver with another across all of them. Every change needs a reason and is kept in the request's history.</p>
        <GuideCallout tone="warning" title="Administrative recovery is exceptional"><strong>Cancel</strong> permanently ends a non-terminal instance and requires a reason. <strong>Reverse action</strong> preserves the original vote, records the reversal, and reopens the affected stage. Use these only with documented authority.</GuideCallout>
      </GuideSection>

      <GuideSection id="diagnose-workflow-status" title="Diagnose workflow status">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Returned", "The owner must correct the source record and resubmit. A return is not a new request. A Finance or Procurement document reads Sent back on its own screen, and its sender corrects it there with Edit and sends it on with Resume."],
            ["Rejected", "Check the stage's On rejection rule. Terminal rejection cannot be resubmitted on that instance."],
            ["Skipped", "The stage condition was false, or the template allowed an empty approver result to be skipped."],
            ["Stalled or unavailable", "Check active approver resolution, group membership, dynamic rules, organogram seats, scope, quorum, delegation dates, and permission access."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <GuideChecklist items={[
          "If a delegate is missing, confirm the person is active, the current date is inside the period, and the document type matches exactly.",
          "If both people appear unexpectedly, check whether Exclusive delegation was left off.",
          "If Resubmit is unavailable, confirm you own the request and its status is Returned.",
          "If Edit and Resume are missing on a document sent back, only the person who sent it for approval gets them, and Edit also needs the edit permission for that kind of document.",
          "If Cancel, Reject or Decline is missing on a document, its approval request is still open, perhaps because it was sent back. Withdraw the request here first.",
          "If Manage Approvals or Team Load is missing, request the workflow-instance viewing permission instead of relying on another user's session.",
        ]} />
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">Your submission shows the expected status or current stage, and any delegation shows the correct person, period, document scope, exclusivity, and Active or Scheduled state.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Use the On behalf of queue filter to confirm delegated work is reaching the intended approver.</p>
      </GuideSection>
    </div>
  );
}
