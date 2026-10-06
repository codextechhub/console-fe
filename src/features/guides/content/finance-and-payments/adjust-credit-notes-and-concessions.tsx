import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function AdjustCreditNotesAndConcessionsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <GuideChecklist items={[
          "The active ledger entity and posting date are correct",
          "The customer and affected invoice were independently verified",
          "The approved reason, amount, revenue treatment, and supporting evidence are available",
          "The posting period is open and the required revenue or allowance account is active and postable",
          "The person preparing the adjustment is not relying on it to hide an incorrect receipt or invoice",
        ]} />
        <GuideCallout tone="warning" title="Correct the source when the source is wrong">Use a note or concession only for its intended business adjustment. If the invoice, receipt, tax, or allocation itself is wrong, void or correct that source record through its controlled workflow instead of layering an unrelated reduction over it.</GuideCallout>
      </GuideSection>

      <GuideSection id="choose-the-right-adjustment" title="Choose the right adjustment">
        <GuideSteps>
          <GuideStep title="Credit note">Reduces a customer's balance and reverses recognised revenue. It may target an invoice, apply to the oldest open invoices, or remain as customer credit for later allocation or refund.</GuideStep>
          <GuideStep title="Debit note">Adds a new charge, increases Accounts Receivable, and credits the selected income account. It cannot be applied as customer credit.</GuideStep>
          <GuideStep title="Concession">Records an approved waiver, discount, or scholarship against one posted invoice. It reduces recognised revenue through the allowance account and clears the same amount from Accounts Receivable.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="issue-a-credit-or-debit-note" title="Issue a credit or debit note">
        <GuideSteps>
          <GuideStep title="Choose the type first">Confirm whether the approved event reduces or increases the balance. Changing the type changes both the customer effect and the debit or credit direction in the posting preview.</GuideStep>
          <GuideStep title="Set the accounting date and customer">Use the date the adjustment belongs to, not the day someone noticed it. Choose the exact customer before searching their open invoices.</GuideStep>
          <GuideStep title="Choose the revenue account and evidence">For a credit, select the revenue account being reversed. For a debit, select the income account being credited. Add the approved amount, cost centre where needed, and a reason another reviewer can understand.</GuideStep>
          <GuideStep title="Decide how credit is held">For a credit note, Apply to oldest invoices clears open balances immediately after posting. Leave as credit keeps the amount in customer credit until a later allocation or refund. Verify the intended destination before issuing.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="grant-a-concession" title="Grant a concession">
        <GuideSteps>
          <GuideStep title="Choose the policy type">Use waiver, discount, or scholarship according to the approved policy and evidence. The visible label does not replace the reason.</GuideStep>
          <GuideStep title="Select one open invoice">A concession cannot predate the invoice and cannot exceed its open balance. Console can accept either a fixed amount or a percentage and shows the calculated equivalent.</GuideStep>
          <GuideStep title="Review the allowance posting">Confirm the allowance account, amount, and preview. The posting debits discounts and allowances and credits Accounts Receivable.</GuideStep>
          <GuideStep title="Save or continue">Save draft when evidence or review is incomplete. Otherwise Console posts directly below the configured threshold or submits for approval when the amount is gated.</GuideStep>
        </GuideSteps>
        <p>The tiles above the list give <strong>Posted (YTD)</strong>, <strong>Draft (pending)</strong>, <strong>Sent back</strong> and <strong>Active concessions</strong>. Active concessions counts only the concessions in force: posted and not voided. A draft, one awaiting approval, one sent back and one voided are not counted, so the figure matches what the <strong>Posted</strong> filter lists.</p>
      </GuideSection>

      <GuideSection id="follow-approval-and-posting" title="Follow approval and posting">
        <p>Console uses the current workflow rule and the created document's server-calculated approval requirement. A threshold-gated note or concession is submitted and leaves the ledger untouched until final approval. A permitted item below the threshold posts immediately. If no eligible approver exists, keep the parked submission visible and escalate the missing approver instead of recreating the adjustment.</p>
        <p>A draft credit or debit note is sent from its detail panel with <strong>Submit for approval</strong>, or posted with <strong>Post note</strong> when its amount does not need approval. Any draft credit note, debit note or concession, including one whose approval was rejected or withdrawn, can be corrected with <strong>Edit</strong> before it is sent again. Edit needs the create permission for that kind of document.</p>
        <p>If an approver sends a note or concession back, the person who sent it for approval sees <strong>Sent back to you</strong> on it, with the approver&rsquo;s reason. <strong>Edit</strong> corrects it in place, and <strong>Resume</strong> sends the corrected version back into the same approval. On a note with several lines, Edit changes the date, reference and reason, and the lines stay as they are. Nobody else gets these buttons, including the approver. Meanwhile its status reads <strong>Sent back</strong>, on its row and when you open it. The status filters on credit notes and on concessions have a <strong>Sent back</strong> choice that lists them, and no other status lists them. On credit notes the other choices are <strong>Draft</strong>, <strong>Awaiting approval</strong>, <strong>Issued</strong>, <strong>Applied</strong> and <strong>Voided</strong>, the words the notes themselves read.</p>
        <GuideCallout title="The final action is consequential">Issue note, Post concession, and Submit for approval create or advance a financial document. The walkthrough explains these controls but never presses them.</GuideCallout>
      </GuideSection>

      <GuideSection id="verify-and-recover" title="Verify and recover">
        <p>Reopen the document and confirm its type, customer, invoice, amount, status, reason, and posting recap. Check the customer balance and the affected invoice. For a credit note, confirm whether the amount is Applied or remains Issued as customer credit. If a posted document is wrong, use the permitted void action and preserve the original trail; do not create an opposite adjustment just to hide it.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>No open invoice appears: confirm the customer, posted status, remaining balance, and entity.</li>
          <li>The posting date is rejected: choose an open period and do not predate the invoice for a concession.</li>
          <li>Submit or Resume is refused for a closed month: a note or concession is checked against its own branch&rsquo;s month when it is sent or resumed. If Ikeja Branch has closed September 2026, an Ikeja credit note dated in September is refused at once, with a message naming Ikeja Branch and September 2026. Re-open the month for that branch or use a date it still has open. At a one-branch school the message names only the month.</li>
          <li>The amount needs approval: submit it and track the existing workflow instead of reducing or splitting the amount to avoid review.</li>
          <li>A credit stayed Issued: it remains customer credit until an authorised allocation or refund is posted.</li>
          <li>The expected account is unavailable: correct the account mapping or account status before continuing.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={[
          "The selected adjustment matches the approved business reason",
          "Customer, invoice, date, amount, account, and evidence are correct",
          "The posting preview matches the intended customer and ledger effect",
          "The item was posted or submitted through the required approval path",
          "The final document status and customer balance were verified",
          "Any correction preserved the original document and audit trail",
        ]} />
      </GuideSection>
    </div>
  );
}
