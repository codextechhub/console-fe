import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function PayerPaymentsAndCreditTransfersArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>A parent or sponsor often pays once for several children. Record that money once, as a <strong>payer payment</strong>, and it is split into one receipt per child, each settling only that child&rsquo;s own bills. When one customer has credit another should use, a <strong>credit transfer</strong> moves it, with a second person&rsquo;s approval.</p>
        <GuideChecklist items={[
          "The payer has a customer account of their own.",
          "Each child they pay for has a customer account.",
          "You have the bank evidence: amount, date, account it landed in, reference.",
          "You know how the school splits a payer's money (Settings, Receivables).",
        ]} />
      </GuideSection>

      <GuideSection id="link-payers" title="Link a payer to the customers they pay for">
        <GuideSteps>
          <GuideStep title="Open the payer's record">On <strong>Customers / Payers</strong>, open the payer&rsquo;s customer record and choose the <strong>Payers</strong> tab.</GuideStep>
          <GuideStep title="Add each customer they pay for">Under <strong>Pays for</strong>, use <strong>Add a customer they pay for</strong> and select <strong>Link</strong>. A payer can pay for many customers, and a customer can have several payers; <strong>Paid by</strong> on the child&rsquo;s record lists theirs.</GuideStep>
          <GuideStep title="End a link that no longer applies">Select <strong>End</strong>, then <strong>End link</strong>. Payments already made keep their shares, and the link can be switched back on by linking them again.</GuideStep>
        </GuideSteps>
        <p>Adding and ending links needs the customer update key.</p>
      </GuideSection>

      <GuideSection id="record-a-payer-payment" title="Record a payer payment">
        <GuideSteps>
          <GuideStep title="Start the payment">On <strong>Payer Payments</strong>, select <strong>Record payer payment</strong>. Choose the <strong>Payer</strong>, the account it was <strong>Received into</strong>, the <strong>Amount</strong>, <strong>Payment date</strong>, <strong>Method</strong> and <strong>Reference</strong>.</GuideStep>
          <GuideStep title="Choose how to split it">Under <strong>How to split it</strong>, keep the school setting, or choose <strong>Oldest bill first</strong>, <strong>In proportion to what each owes</strong>, or <strong>I will enter each customer&rsquo;s amount</strong>. An amount entered above a customer&rsquo;s bills stays as that customer&rsquo;s credit.</GuideStep>
          <GuideStep title="Preview, then record">Select <strong>Preview split</strong>. The preview shows each customer, the branch their bills are at, what each share settles, and anything left as credit. <strong>Record payment</strong> stays off until the preview matches the form; change anything and preview again.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="An example">
          Funmi Adebayo sends ₦500,000 for Tolu and Kunle. Tolu owes ₦300,000 at Ikeja on the older bill, and Kunle owes ₦250,000 at Lekki. Split oldest bill first, the preview settles Tolu&rsquo;s ₦300,000 at Ikeja and puts ₦200,000 towards Kunle&rsquo;s bill. The money landed in Ikeja&rsquo;s bank, so Kunle&rsquo;s share reads <strong>Held for Lekki, from Ikeja</strong> until it is forwarded.
        </GuideCallout>
        <p>A share for a customer billed at another branch is held for that branch and forwarded through the approval route for money sent between branches; no branch&rsquo;s receipt settles another branch&rsquo;s bill. A payer who is not linked to anyone can only settle their own bills.</p>
      </GuideSection>

      <GuideSection id="void-a-payer-payment" title="Void a payer payment">
        <p>Open the payment and select <strong>Void payment</strong>. It voids every receipt and held share the payment made together, and reopens the bills they settled; none of them can be voided on its own. It needs the receipt reverse key, and it is refused once its bank line is matched, or while a share has been forwarded to another branch (void the forward first).</p>
      </GuideSection>

      <GuideSection id="move-credit" title="Move credit from one customer to another">
        <GuideSteps>
          <GuideStep title="Raise the transfer">On <strong>Credit Transfers</strong>, select <strong>New transfer</strong>. Choose <strong>From customer</strong>, <strong>To customer</strong>, the <strong>Amount</strong> (the drawer shows the unused credit available), the date and a <strong>Reason</strong>.</GuideStep>
          <GuideStep title="Name the branch when asked">A transfer belongs to the giving customer&rsquo;s branch. For a customer every branch shares, the drawer asks which branch it is for.</GuideStep>
          <GuideStep title="Send it for approval">Select <strong>Save draft</strong> or <strong>Submit for approval</strong>. A second person approves it under <strong>Workflow, Approvals</strong>, and it posts once approved. Until then neither customer&rsquo;s credit changes.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="An example">
          Tunde&rsquo;s family overpaid by ₦45,000 and asked for it to pay Ada&rsquo;s fees. Bisi Afolabi raises a ₦45,000 transfer from Tunde to Ada with that reason and submits it. Once Musa Danjuma approves it, Tunde&rsquo;s credit falls by ₦45,000 and it settles Ada&rsquo;s open bill.
        </GuideCallout>
        <p><strong>Void</strong> on a posted transfer gives the credit back to the first customer and reopens any bill of the second customer&rsquo;s it paid.</p>
        <p>If the approver sends a transfer back, its status reads <strong>Sent back</strong>, on its row and when you open it, and the status filter lists it under <strong>Sent back</strong>, which shows only the transfers sent back, as well as under <strong>Draft</strong>. The person who sent it for approval sees <strong>Sent back to you</strong> and <strong>Resume</strong>, which sends it back to the approver as it is. A credit transfer has no Edit: to change one, withdraw it under Workflow, My Submissions and submit it again.</p>
        <GuideCallout tone="warning" title="Do not skip the second person">
          If nobody can approve yet, a dialog offers <strong>Continue anyway</strong>, which approves it without review, or <strong>Leave it waiting</strong>. Leave it waiting and fill the approver group instead.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>The payer&rsquo;s children are not in the split: they are not linked on the payer&rsquo;s Payers tab, or a link was ended.</li>
          <li>Record payment stays off: preview again; the form has changed since the last preview.</li>
          <li>A share reads Held for another branch: the child&rsquo;s bills are at a different branch from the bank account. It settles there once forwarded.</li>
          <li>Void payment is refused: a held share was forwarded, or the bank line is matched. Void the forward or unmatch the line first.</li>
          <li>A credit transfer has not moved anything: it is waiting for approval under Workflow, Approvals.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={[
          "Each payer is linked to the customers they pay for",
          "Each payer payment was previewed before it was recorded",
          "Held shares for other branches have been forwarded",
          "Every credit transfer has a reason and a second person's approval",
        ]} />
      </GuideSection>
    </div>
  );
}
