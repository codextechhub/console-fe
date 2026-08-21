import { CheckCircle2 } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function CreateAndPostJournalArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Use a manual journal only for an approved accounting adjustment, accrual, opening balance, capital entry, loan, or correction that does not belong to a source document. Invoices, receipts, payroll, procurement, and bank work should create their own journals so the sub-ledger and general ledger stay together.</p>
        <GuideCallout tone="danger" title="New journal posts immediately">
          The New journal drawer is a direct-entry flow. Selecting Post entry sends a balanced journal straight to the ledger. It does not save a draft or wait for a second confirmation, so finish the review before selecting it.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="choose-the-journal-path" title="Choose the correct journal path">
        <GuideChecklist items={[
          "Use the source document when correcting an invoice, receipt, payroll run, purchase, bank item, or other subsystem transaction.",
          "Use New journal only when a raw debit and credit entry is the approved accounting treatment.",
          "Use Submit only for an existing Draft journal that is meant to enter the shared approval workflow.",
          "Reverse a posted manual journal; void the source document when the journal came from a subsystem.",
        ]} />
      </GuideSection>

      <GuideSection id="prepare-the-entry" title="Prepare the entry">
        <GuideSteps>
          <GuideStep title="Confirm entity and posting date">The active entity owns the journal. Choose a date inside an open posting period. Never move the date only to avoid a closed period.</GuideStep>
          <GuideStep title="Write a useful narration">State the business reason and link it to approved evidence. Add the external or internal reference when one exists.</GuideStep>
          <GuideStep title="Prepare balanced lines">For every line, identify one active postable account, debit or credit side, amount, and any required cost centre or dimensions.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="build-balanced-lines" title="Build balanced debit and credit lines">
        <p>Start with at least two lines. Add lines only when the accounting event genuinely has more components. Console totals debit and credit separately and enables posting only when both totals are equal, greater than zero, and every non-zero line has an account.</p>
        <GuideCallout tone="warning" title="Balanced does not mean correct">
          Equal debits and credits prove only that the entry balances. They do not prove the accounts, amount, entity, date, tax treatment, cost centre, dimensions, narration, or evidence are correct.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="tag-and-review" title="Tag and review the journal">
        <GuideChecklist items={[
          "The debit and credit sides reflect the approved accounting treatment.",
          "Every account is active, postable, and belongs to the active entity.",
          "Cost centres identify responsibility where required.",
          "Dimension values use the approved list and are consistent across related postings.",
          "The narration and reference are enough for another reviewer to understand the entry.",
          "The total amount agrees with the supporting evidence.",
        ]} />
      </GuideSection>

      <GuideSection id="post-or-submit" title="Post a direct entry or submit a draft">
        <GuideSteps>
          <GuideStep title="Direct entry">Select Post entry only after the full review. A successful response creates the posted journal and updates ledger reports immediately.</GuideStep>
          <GuideStep title="Existing draft">Open a Draft row and select Submit if it should enter the shared approval workflow. It posts only after the configured final approval.</GuideStep>
          <GuideStep title="Check the result">Reopen the journal, confirm its document number, status, date, source, totals, lines, tags, creator, and posting time. Use the audit and reports when independent confirmation is required.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="reverse-or-void" title="Reverse or void safely">
        <p>A posted manual journal can show Reverse. Reversal creates a contra entry and cannot be undone. A journal created by a source document shows the source document's void path instead, which keeps the sub-ledger and general ledger synchronized.</p>
        <GuideCallout tone="danger" title="Never correct a source journal with an isolated contra entry">
          If the journal came from an invoice, receipt, payroll run, procurement document, or another subsystem, use that document's approved void or correction action. A separate manual reversal can leave the source balance wrong while the ledger appears corrected.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Post entry is disabled", body: "Make both totals equal and greater than zero, and select an account for every non-zero line." },
            { title: "The date is unavailable", body: "The date is outside the open posting window. Ask the authorized owner to create or reopen the correct period." },
            { title: "An account is missing", body: "Only active postable accounts in the selected entity are available. Check the chart and entity scope." },
            { title: "Reverse is not shown", body: "You may lack reverse permission, the journal may not be posted, or its source requires the original document to be voided instead." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> The work is complete when the intended journal has the expected status, balanced lines, entity, date, source, tags, evidence, and downstream report effect.</p>
      </GuideSection>
    </div>
  );
}
