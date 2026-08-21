import { CheckCircle2 } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function CloseLockOrReopenPeriodArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Period control affects every Finance and Procurement posting in the active entity. Confirm the entity, fiscal year, period dates, close approval, reconciliation evidence, draft-journal plan, depreciation status, and correction window before changing a status.</p>
        <GuideCallout tone="danger" title="Locked means permanent">
          A locked period cannot be reopened. Corrections must be posted in a later open period. Use a lock only after the close, year-end requirements, audit evidence, and retention policy are complete.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="create-the-calendar" title="Create and extend the fiscal calendar">
        <GuideSteps>
          <GuideStep title="Choose the next year">New fiscal year creates one complete calendar for the active entity without changing earlier years.</GuideStep>
          <GuideStep title="Confirm the start and frequency">Use the approved year label, starting month and day, and monthly or quarterly frequency. Short months use their final calendar day.</GuideStep>
          <GuideStep title="Create the next year before the current one expires">When no period covers a date, all posting is rejected. Extend the calendar before the final open window ends.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="understand-period-statuses" title="Understand period statuses">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Open", body: "Ordinary Finance and Procurement postings are allowed inside the period dates." },
            { title: "Soft-closed", body: "Ordinary postings are blocked while controlled close-process entries can continue. Authorized users can reopen it." },
            { title: "Closed", body: "The close steps have run and further posting is blocked. It remains reopenable by permission until locked." },
            { title: "Locked", body: "The period is permanently sealed and cannot be reopened." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="inspect-the-checklist" title="Inspect the close checklist">
        <p>Select a period to load its current checklist. Passed items are ready. Failed blockers must be resolved. Warning-only items remain visible for judgment but do not prevent the close.</p>
        <GuideChecklist items={[
          "Trial balance is balanced.",
          "Draft journals are resolved or deliberately handled.",
          "AR and AP reconcile to their control accounts.",
          "GR/IR differences are understood and evidenced.",
          "Required depreciation has been posted.",
          "Every remaining warning has an owner and explanation.",
        ]} />
      </GuideSection>

      <GuideSection id="soft-close-or-close" title="Soft-close or run the period close">
        <GuideSteps>
          <GuideStep title="Use Soft close during controlled month-end">This blocks ordinary posting while allowing approved close work. It is reversible and does not replace the final checklist review.</GuideStep>
          <GuideStep title="Resolve blockers">Open the records behind every blocker and correct the source. Do not force a close or create offsetting entries merely to make the checklist green.</GuideStep>
          <GuideStep title="Run close steps">After review, the authorized user selects Run close steps and confirms. The period becomes Closed and the audit trail records the action.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="close-the-fiscal-year" title="Close the fiscal year">
        <p>Every period must stop ordinary posting before the fiscal year is ready. Closing the year posts the formal closing journal, zeros income and expense accounts, moves the net result into Retained Earnings, and seals the year. The final period must not already be locked because it must accept that year-end journal.</p>
        <GuideCallout tone="warning" title="Close the year before locking its final period">
          Console disables the final-period lock while the fiscal year is still open. Complete and verify the year-end close first, then apply permanent locks only when policy requires them.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="reopen-or-lock" title="Reopen or permanently lock">
        <GuideSteps>
          <GuideStep title="Reopen only with an approved correction plan">Reopening a soft-closed or closed period allows ordinary documents and journals to post into it again. Record the reason, expected entries, owner, and deadline for closing it again.</GuideStep>
          <GuideStep title="Verify changes after reopening">Review every new posting, rerun reconciliations and reports, and repeat the complete close checklist.</GuideStep>
          <GuideStep title="Lock only when no historical posting should return">A closed period may be locked after the fiscal-year boundary and audit requirements are satisfied. This action cannot be reversed.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "The close is blocked", body: "Open the checklist and resolve each item marked Blocks the close. Warning-only items do not cause the refusal." },
            { title: "Close fiscal year is disabled", body: "Every period must stop ordinary posting, the calendar must be complete, and the final period must not be locked." },
            { title: "A posting date is rejected", body: "The period may be closed or no fiscal calendar covers the date. Use the approved period action rather than changing the transaction date." },
            { title: "Re-open or Lock is missing", body: "The current status may not allow the action, the final year is not closed, or your account lacks the specific permission." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> The close is complete when the intended entity and period show the approved status, blockers are resolved, warnings are explained, reports and reconciliations agree, and the audit trail contains the action.</p>
      </GuideSection>
    </div>
  );
}
