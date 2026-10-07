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
        <p>Where the books run more than one branch, <strong>each branch closes its own months and year</strong>. The school&rsquo;s month reads closed once every branch has closed it, and the school&rsquo;s year once every branch has closed its year.</p>
        <GuideCallout tone="danger" title="Locked means permanent">
          A locked period cannot be reopened. Corrections must be posted in a later open period. Use a lock only after the close, year-end requirements, audit evidence, and retention policy are complete.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="work-by-branch" title="Work branch by branch">
        <p>Open <strong>Fiscal Periods</strong> (or <strong>Periods &amp; Close</strong> under Reports). At books with several branches, the <strong>Branch</strong> picker offers <strong>All branches</strong> and each branch. A one-branch school sees no picker and is never asked.</p>
        <GuideSteps>
          <GuideStep title="Read the school's calendar">Under <strong>All branches</strong>, the calendar is the school&rsquo;s, and <strong>Each branch&rsquo;s year</strong> shows where every branch stands. Open a period to see <strong>Each branch</strong> with its own month status.</GuideStep>
          <GuideStep title="Pick a branch to act">Choose a branch to see its own months, or stay on All branches: every close, soft close, force close, re-open, lock, year close and year re-open there asks which branch it is for, and its confirm button stays off until you choose.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="An example">
          Ikeja finishes its September close on 3 October, Lekki on 6 October. On 3 October the school&rsquo;s September still reads open; it reads closed on 6 October, when the last branch closes. Re-opening Lekki&rsquo;s September later re-opens the school&rsquo;s too.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="create-the-calendar" title="Create and extend the fiscal calendar">
        <GuideSteps>
          <GuideStep title="Choose the next year">New fiscal year creates one complete calendar for the active entity without changing earlier years. It covers every branch, so it needs someone who covers the whole school and asks no branch.</GuideStep>
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
        <p>Select a period to load its current checklist. Passed items are ready. Failed blockers must be resolved. Warning-only items remain visible for judgment but do not prevent the close. Items marked <strong>Done by the close</strong> are work the close does itself before it checks, such as posting depreciation that has fallen due and releasing deferred income, so they need no action. A check named by an accounting term carries the plain words beside it, for example <strong>Trial balance agrees (debits equal credits)</strong> or <strong>AP reconciled (what is owed to suppliers)</strong>; one already in plain words, such as <strong>Earlier months closed</strong>, stands alone. Each shows what it found.</p>
        <GuideChecklist items={[
          "Earlier months closed: every earlier month is closed (while months close in order).",
          "Trial balance agrees (debits equal credits).",
          "No draft journals left in the month: drafts are resolved or deliberately handled.",
          "AR reconciled (what customers owe) and AP reconciled (what is owed to suppliers): each matches its control account.",
          "GR/IR explained (goods received, not yet billed): every difference is understood and evidenced.",
          "Depreciation posted and Deferred income released (fees billed ahead, now earned): the close does both itself for what is due.",
          "Gateway clearing current (online payments paid into the bank): a warning when online payments have waited too long for the provider.",
          "Inter-branch balances agree (what branches owe each other).",
          "Closed figures unchanged: the figures sealed by earlier closes still match the ledger.",
          "Every remaining warning has an owner and explanation.",
        ]} />
      </GuideSection>

      <GuideSection id="soft-close-or-close" title="Soft-close or run the period close">
        <GuideSteps>
          <GuideStep title="Use Soft close during controlled month-end">This blocks ordinary posting while allowing approved close work. It is reversible and does not replace the final checklist review.</GuideStep>
          <GuideStep title="Resolve blockers">Open the records behind every blocker and correct the source. Do not create offsetting entries merely to make the checklist green. A force close exists for an agreed exception, below; it is not a way round a fix that can be made.</GuideStep>
          <GuideStep title="Run close steps">After review, the authorized user selects Run close steps and confirms. The period becomes Closed and the audit trail records the action.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="close-in-order" title="Months close in order">
        <p>By default a month closes only once every earlier month is closed, and re-opens only while every later month is open. The order runs across the year end: January waits for December of the year before, though that fiscal year may stay open for the auditors. At books with several branches each branch keeps its own order.</p>
        <GuideCallout tone="info" title="An example">
          Lekki has closed July but not August. Lekki&rsquo;s September close is refused and names August; Ikeja, which has closed August, closes its September. To correct Ikeja&rsquo;s August afterwards, Ikeja&rsquo;s September is re-opened first.
        </GuideCallout>
        <p>Under <strong>All branches</strong>, <strong>Earlier months closed</strong> answers branch by branch: it names each branch whose earlier month is still open, and the branches that can close now. While some branch can still close the month it is a warning, not a blocker, so that branch&rsquo;s close, and a force close of it, stay available. It blocks only when no branch still to close the month can close it.</p>
        <GuideCallout tone="info" title="An example under All branches">
          Ikeja has closed August and Lekki has not. Viewing September under All branches, the check reads that Lekki has not closed August yet, and that Ikeja can close September now. Halima Sule closes September from the same view, choosing Ikeja in the dialog; Lekki&rsquo;s waits for its August.
        </GuideCallout>
        <p>Force close does not get past the order at the branch it closes. A school that closes months out of turn can turn it off in <strong>Finance Settings, Fiscal calendar</strong>, under <strong>Closing months</strong>; that needs the settings update key and someone who covers the whole school.</p>
      </GuideSection>

      <GuideSection id="force-close" title="Force a month closed over a failing check">
        <p>Sometimes a month has to close although a blocking check still fails, for example when a bank statement is late and the accountant has agreed the balance. Holders of the force close key see <strong>Force close</strong> on the period when at least one blocking check fails.</p>
        <GuideSteps>
          <GuideStep title="Read what you are overriding">The dialog lists the <strong>Checks you are overriding</strong>.</GuideStep>
          <GuideStep title="Give the reason">Enter the reason, up to 500 characters. The overridden checks and your reason are kept on the audit trail with your name.</GuideStep>
          <GuideStep title="Confirm">Select <strong>Force close</strong>. Only the chosen branch&rsquo;s month closes; the school&rsquo;s month closes once every branch has closed it.</GuideStep>
        </GuideSteps>
        <p>Force close is for months only. A year close has no force option on screen.</p>
      </GuideSection>

      <GuideSection id="close-the-fiscal-year" title="Close the fiscal year">
        <p>Every period must stop ordinary posting before the fiscal year is ready. Closing the year posts the formal closing journal, zeros income and expense accounts, moves the net result into Retained Earnings, and seals the year. At books with several branches each branch closes its own year: the closing journal is that branch&rsquo;s, and the school&rsquo;s year closes once every branch has closed its year. The final period must not already be locked because it must accept that year-end journal.</p>
        <GuideCallout tone="warning" title="Close the year before locking its final period">
          Console disables the final-period lock while the fiscal year is still open. Complete and verify the year-end close first, then apply permanent locks only when policy requires them.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="reopen-or-lock" title="Reopen or permanently lock">
        <GuideSteps>
          <GuideStep title="Reopen only with an approved correction plan">Select <strong>Re-open</strong> on a soft-closed or closed month and give a reason; it is kept on the audit trail. Ordinary documents and journals can post into it again. A month of a closed year stays shut until the year is re-opened.</GuideStep>
          <GuideStep title="Verify changes after reopening">Review every new posting, rerun reconciliations and reports, and repeat the complete close checklist.</GuideStep>
          <GuideStep title="Lock only when no historical posting should return">A closed period may be locked after the fiscal-year boundary and audit requirements are satisfied. This action cannot be reversed.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="reopen-the-year" title="Re-open a closed year">
        <p><strong>Re-open year</strong> reverses a branch&rsquo;s year-end closing entry so a month can be corrected; the year must then be closed again for that branch. It needs the fiscal year re-open key and someone who covers the whole school, even though it names one branch: a branch&rsquo;s own bursar closes their year but does not re-open it. A reason is required, and the school&rsquo;s year re-opens with it.</p>
        <p>An archived year must be unarchived first. A locked year cannot be re-opened.</p>
      </GuideSection>

      <GuideSection id="archive-a-year" title="Archive an old year">
        <p>A closed or locked year older than the archive age (set under Record keeping) can be archived by someone who covers the whole school and holds the archive key. It is offered under All branches, or at a one-branch school, and needs a reason.</p>
        <p>An archived year leaves the year pickers, the period pickers and the document lists for every branch. Nothing is deleted, and bills still unpaid stay in the lists. Tick <strong>Show archived years</strong> to read and report on it again; the box appears once the school has an archived year. <strong>Unarchive year</strong> brings it back, still closed.</p>
        <GuideCallout tone="info" title="An example">
          With the archive age at two years, Halima Sule can archive FY2023 from the day it has been over two years since it ended. Until then <strong>Archive year</strong> is off and says the date it becomes available.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="sealed-figures" title="Check the closed figures">
        <p>Every month close, month lock and year close stores each account&rsquo;s balance per branch as a seal. <strong>Closed figures</strong>, under Reports &amp; Close, recomputes every closed month and year from the ledger and compares it with its seal when you select <strong>Verify sealed figures</strong>. Each seal reads <strong>Matches</strong> or <strong>Differs</strong>, with the accounts and branches that moved.</p>
        <p>It needs the seal view key and someone who covers the whole school, because the seals cover every branch. The check only reports; it repairs nothing. The close checklist also warns, under <strong>Closed figures unchanged</strong>, when a seal no longer matches.</p>
      </GuideSection>

      <GuideSection id="record-keeping" title="Set how long records are kept">
        <p>Open <strong>Finance Settings, Fiscal calendar</strong>. <strong>Record keeping</strong> shows the <strong>Statutory floor</strong>, set by CodeX for every school, and the <strong>Period in force</strong>, the longer of the floor and the school&rsquo;s own choice. A school may keep its records longer, never shorter. Records are kept from the end of each fiscal year, and a kept record cannot be deleted, whatever its screen offers.</p>
        <p><strong>Archive a closed year after (years)</strong> sets the archive age. The same section, under <strong>Opening the next year</strong>, sets how the next fiscal year opens, <strong>Open the next fiscal year automatically</strong> or <strong>Warn finance staff only</strong>, and how many days ahead. Saving needs the settings update key and someone who covers the whole school.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "The close is blocked", body: "Open the checklist and resolve each item marked Blocks the close. Warning-only and Done by the close items do not cause the refusal." },
            { title: "A month is refused for an earlier one", body: "Months close in order. Close the earlier month the message names first; force close does not get past it." },
            { title: "Re-open is refused for a later month", body: "Months re-open from the latest back. Re-open the later month the message names first; a locked later month means this one can no longer be re-opened." },
            { title: "Close fiscal year is disabled", body: "Every period must stop ordinary posting, the calendar must be complete, and the final period must not be locked." },
            { title: "A posting date is rejected", body: "The period may be closed or no fiscal calendar covers the date. Use the approved period action rather than changing the transaction date." },
            { title: "A document is refused when sent or resumed", body: "A journal, credit note or other finance document is checked against its own branch's month when it is sent for approval or resumed. If Ikeja Branch has closed September 2026, an Ikeja document dated in September is refused at once, with a message naming Ikeja Branch and September 2026, while Lekki's still go. At a one-branch school the message names only the month. Re-open that branch's month, or use a date it still has open." },
            { title: "Re-open or Lock is missing", body: "The current status may not allow the action, the final year is not closed, or your account lacks the specific permission." },
            { title: "The confirm button stays off", body: "Under All branches every period action asks which branch it is for. Choose the branch in the dialog." },
            { title: "Re-open year is off", body: "The year is archived. Unarchive it first. A locked year cannot be re-opened at all." },
            { title: "The month will not close for one branch", body: "A blocking check fails for that branch, such as branches disagreeing on what they owe each other. Fix the source, or force close with an agreed reason." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> The close is complete when the intended entity and period show the approved status, blockers are resolved, warnings are explained, reports and reconciliations agree, and the audit trail contains the action.</p>
      </GuideSection>
    </div>
  );
}
