import { CheckCircle2 } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function ReconcileBankStatementArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Obtain the complete bank statement for the approved account and date range. Confirm the active entity, bank account, currency, opening and closing balances, statement period, last completed reconciliation, and current ledger posting status.</p>
        <GuideCallout tone="warning" title="Reconciliation links evidence, it does not create missing money">
          Matching explains how existing bank and book lines correspond. A genuine bank charge, interest entry, error, or missing source transaction needs its own authorized source or adjusting-entry workflow before it can be matched.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="prepare-the-account" title="Prepare the bank account">
        <GuideSteps>
          <GuideStep title="Create the banking record only once">From Bank Accounts, select <strong>New bank account</strong>. First confirm that the active entity does not already contain the real account.</GuideStep>
          <GuideStep title="Link the controlled identity">Enter the approved account name, bank name, masked or permitted account number, currency, and the single postable GL cash account that represents its book balance.</GuideStep>
          <GuideStep title="Choose operational flags deliberately">Mark the account active only when it is ready for use. Set primary operating or invoice and receipt display flags only when finance policy approves that role.</GuideStep>
          <GuideStep title="Create and verify">Select <strong>Create account</strong>, then reopen the record and confirm its entity, currency, GL mapping, status, and primary flags before importing a statement or using it in cash activity.</GuideStep>
        </GuideSteps>
        <GuideCallout title="Creating the account does not move money">This creates banking metadata and its one-to-one GL anchor. Receipts, payments, transfers, journals, and reconciliations remain separate controlled actions.</GuideCallout>
        <GuideChecklist items={[
          "The bank account belongs to the active entity and maps to the intended GL cash account.",
          "Currency, masked account identity, and opening balance agree with controlled records.",
          "All expected receipts, payments, transfers, fees, and interest are posted through their source workflows.",
          "The prior reconciliation is complete and its closing balance is the next opening basis.",
        ]} />
      </GuideSection>

      <GuideSection id="record-bank-money" title="Record bank money with no customer or supplier">
        <p>Under the accounts on <strong>Bank Accounts</strong>, two tabs record money that is not a receipt, a bill or payroll:</p>
        <GuideSteps>
          <GuideStep title="Bank transaction">Select <strong>Bank transaction</strong> for money in or out with no customer or supplier behind it: owner&rsquo;s capital, a loan, drawings, interest or charges. Choose <strong>Money in</strong> or <strong>Money out</strong>, the bank account, amount, date, and the ordinary account it came from or paid for, with a <strong>Narration</strong>. Receivables, payables, tax and other accounts kept by their own documents are refused, with the document to use instead.</GuideStep>
          <GuideStep title="Bank transfer">Select <strong>Bank transfer</strong> to move money between two accounts of the same branch. <strong>To</strong> only offers accounts of the <strong>From</strong> account&rsquo;s branch. Money between branches is an inter-branch transfer instead.</GuideStep>
        </GuideSteps>
        <p>A document may wait for approval under Workflow, Approvals, reading <strong>Pending Approval</strong>; it reaches the books once approved. One that was rejected reads <strong>Rejected</strong> and never reached the books; record it again if the money still needs recording. A posted one can be voided until its bank line is reconciled; for a transfer, while either side is reconciled it is refused. Unmatch the line first.</p>
        <GuideCallout tone="warning" title="Give every account its branch">
          At books with several branches, an account that has not been given a branch cannot move money. Give it its branch first, or split a shared account by branch.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="split-by-branch" title="Split a shared bank account by branch">
        <p>When one real bank account has served several branches, <strong>Split by branch</strong> retires it and opens a bank account for each branch, sharing its book balance between them. It is offered on an active account with no branch, at books with several branches, to someone who covers the whole school and holds the bank account update key.</p>
        <GuideSteps>
          <GuideStep title="Share the balance">For each branch included, enter its <strong>Agreed share</strong> (tick <strong>This share is an overdraft</strong> where it is), the new bank account name, and the new ledger code and name. The shares must add up exactly to the book balance; <strong>Left to place</strong> shows what remains. Mark one <strong>Main account</strong> and any collection account.</GuideStep>
          <GuideStep title="Choose how differences are treated">Where a branch&rsquo;s own entries on the shared account differ from its agreed share, choose <strong>Debt between branches (usual)</strong>, so the branch that kept more owes the branch that kept less, or <strong>Permanent move through retained earnings</strong>, so nothing is owed. The drawer cannot read each branch&rsquo;s entries on the account beforehand: the differences are worked out when the split is made and listed afterwards, under <strong>Now owed between branches</strong>.</GuideStep>
          <GuideStep title="Date it and cite the agreement">Set the <strong>Split date</strong> (nothing may be booked on the account after it) and the <strong>Agreement reference</strong>, then <strong>Split account</strong>. This cannot be undone.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="An example">
          Bright Star&rsquo;s shared GTBank account holds ₦10,000,000. The bursars agree Ikeja ₦6,000,000 and Lekki ₦4,000,000, but Ikeja&rsquo;s own entries on it come to ₦6,500,000. Under Debt between branches, Ikeja opens with ₦6,000,000 and owes Lekki ₦500,000, shown on Inter-branch Balances until Ikeja repays it with a cash transfer.
        </GuideCallout>
        <p>The old account stays as read-only history. Differences booked as debts between branches are never voided; the branch that owes repays with a cash transfer.</p>
      </GuideSection>

      <GuideSection id="import-the-statement" title="Import the statement">
        <GuideSteps>
          <GuideStep title="Use the account template">Download or follow the expected columns and formats. Keep one bank line per real statement entry with its date, amount, direction, reference, and description.</GuideStep>
          <GuideStep title="Check the range and totals">Remove headers, subtotals, duplicates, and lines outside the approved period. Compare imported opening, movement, and closing values with the source statement.</GuideStep>
          <GuideStep title="Review before continuing">Inspect the imported statement lines and correct an import mistake before matching. Do not ignore a bad line merely to make the count disappear.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="match-clear-evidence" title="Match clear evidence">
        <p>Use automatic matching only for the approved date tolerance and grouping policy. Review every proposed result. For manual work, select bank and book evidence whose totals are equal and whose dates, references, parties, and business purpose agree.</p>
        <GuideChecklist items={[
          "One-to-one matches identify the same event on both sides.",
          "Grouped matches contain a complete, explainable set with equal totals.",
          "Split matching is supported by one source event and auditable evidence.",
          "No line is reused to hide an unexplained difference.",
          "Matching does not replace the source correction for a wrong amount or account.",
        ]} />
      </GuideSection>

      <GuideSection id="resolve-exceptions" title="Resolve exceptions">
        <GuideSteps>
          <GuideStep title="Timing difference">Leave legitimate deposits or payments in transit unmatched and carry them with evidence into the next period.</GuideStep>
          <GuideStep title="Missing book entry">Create the authorized source document or adjusting journal for charges, interest, or another real bank event, then return to matching.</GuideStep>
          <GuideStep title="Duplicate or opening line">Ignore only a known duplicate or opening-balance line with a recorded explanation. Ignored lines have no ledger effect.</GuideStep>
          <GuideStep title="Wrong match">Unmatch the pair, preserve the audit trail, and rebuild the correct evidence set. Do not compensate with a second incorrect match.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="complete-and-review" title="Complete and review reconciliation">
        <GuideCallout tone="danger" title="Complete only after every difference is explained">
          The walkthrough never confirms matches or completes reconciliation. Before you do, verify the account, date range, statement balance, book balance, unmatched and ignored items, approved adjustments, and final difference.
        </GuideCallout>
        <GuideChecklist items={[
          "Every matched group has equal bank and book totals.",
          "Every unmatched item is a genuine documented timing difference or active correction.",
          "Every ignored line has an approved reason and no required ledger effect.",
          "The reconciled balance agrees with the bank statement and GL cash account.",
          "The completed run and printable report are retained for review.",
        ]} />
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "No account is available", body: "Create or activate the bank account, map it to the correct cash GL account, and confirm your entity and permission." },
            { title: "Automatic matching finds nothing", body: "Check date tolerance, amount direction, grouping policy, and whether the corresponding book transactions are posted." },
            { title: "Match is disabled", body: "Select bank and book lines whose totals are equal. Then verify they represent the same business evidence." },
            { title: "The difference remains", body: "Trace unmatched lines, duplicates, missing source entries, charges, interest, and timing items. Do not force a balancing match." },
            { title: "Complete is unavailable", body: "Resolve or explain the remaining count and difference, and confirm you have reconcile permission for the active entity." },
            { title: "A prior match was wrong", body: "Use the authorized unmatch action, document why, and reconstruct the correct match before completing the run." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Reconciliation is complete when the intended bank and book period agree, every exception is explained, approved corrections are posted, and the completed run and audit evidence can be reviewed independently.</p>
      </GuideSection>
    </div>
  );
}
