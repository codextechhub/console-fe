import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ReviewAndActOnApprovalArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Use this guide when an item is waiting in <strong>Pending Approvals</strong>. You can act only when the active stage names you, or a valid delegation puts the item in your queue.</p>
        <GuideChecklist items={[
          "Read Summary and the document-specific Details shown inside the approval.",
          "Open the source document only when you need attachments, current state, or evidence not included in Details.",
          "Read the active stage label and the approval rule shown beside the workflow.",
          "Resolve conflicts of interest or missing evidence before recording a decision.",
        ]} />
        <GuideCallout tone="danger" title="Your decision is recorded">Approve, Reject, and Return to requester create an audit action. The walkthrough explains these choices but never selects or confirms one for you.</GuideCallout>
      </GuideSection>

      <GuideSection id="find-an-approval" title="Find an approval">
        <GuideSteps>
          <GuideStep title="Open Pending Approvals">The list contains only pending items you can currently act on. Items you already voted on are hidden.</GuideStep>
          <GuideStep title="Narrow the queue">Filter by document type or choose <strong>My queue</strong> and <strong>On behalf of</strong>. Search accepts an ID, document type, or requester.</GuideStep>
          <GuideStep title="Open Review">Check the requester, stage, and time in queue, then select <strong>Review</strong>.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="review-the-request" title="Review the request">
        <p>Start with the concise <strong>Summary</strong>, then inspect <strong>Details</strong> directly below it. Details adds supporting evidence without repeating the Summary. Each document type chooses the layout that fits its evidence: labelled fields, a line-item table, or an added and removed change list. Restricted permission changes are marked individually. The details are the request snapshot captured for this approval, so they do not silently change while you review.</p>
        <p>Read the visible workflow stages and <strong>Activity</strong> beside those details. Skipped stages are omitted from progress. If a returned request was resubmitted, Console uses the newest attempt and its refreshed approver list.</p>
        <p><strong>View full document</strong> is a smaller secondary action below Details. Use it when you need attachments, the source record's current state, or evidence that the built-in layout does not carry. Older approvals may not have a built-in detail snapshot, so their source link remains the review fallback. If the source area denies access, ask an authorized owner to review the missing evidence instead of acting from the summary alone.</p>
        <GuideCallout tone="warning" title="Do not approve from the title alone">The queue and summary identify the request. The document-specific Details, required attachments, workflow rule, and activity provide the evidence for your decision.</GuideCallout>
      </GuideSection>

      <GuideSection id="choose-a-decision" title="Choose a decision">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["Approve", "Records your approval. ANY needs one approval, QUORUM needs the configured count, and UNANIMOUS needs every eligible approver."],
            ["Reject", "Requires a reason. The template decides whether rejection ends the workflow or returns it to the requester."],
            ["Return to requester", "Requires a reason and pauses the request for correction. The owner can amend and resubmit at the returned stage."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
        <p>For Reject or Return to requester, enter a specific reason between 5 and 500 characters. Review the confirmation dialog before selecting the final confirmation button.</p>
      </GuideSection>

      <GuideSection id="understand-the-result" title="Understand the result">
        <p>After approval, Console states whether your vote completed the stage, moved the request to another stage, or fully approved it. A rejection may become terminal. A returned request stays available to its owner for amendment and resubmission.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["The request disappeared from my queue", "It may have advanced, ended, been withdrawn, or received your earlier vote. Search its source record or ask an authorized workflow administrator to inspect the instance."],
            ["Console says I am not eligible", "Confirm the active stage, current attempt, approver group or role, and any active delegation. Do not ask someone to bypass the queue."],
            ["Details are unavailable", "Use View full document to inspect the source evidence. Report the workflow instance ID if a new approval should have details but they are missing or cannot be displayed."],
            ["View full document shows no match", "Clear any extra source-area filters, confirm the active entity, and search the displayed document reference. Report the workflow instance ID if the link opens another module or a missing page."],
            ["The stage is stalled", "An approver source may resolve to nobody, a quorum may be unreachable, or an inclusion condition may be wrong. An administrator should inspect the instance and template."],
            ["I made the wrong decision", "Do not add a compensating vote. Contact an administrator with reverse-action access so the original action stays visible in the audit trail."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The confirmation succeeds, the activity timeline contains your action, and the status or active stage reflects the expected result.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> If the result differs from the confirmation copy, stop and report the instance ID to support.</p>
      </GuideSection>
    </div>
  );
}
