import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function RefundOrWriteOffBalanceArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <GuideChecklist items={[
          "The active entity, customer, accounting date, and supporting evidence are verified",
          "A refund has customer credit available on the selected date and an approved destination bank account",
          "A write-off has an identified posted invoice, collection evidence, and authorised bad-debt decision",
          "The posting period, customer-credit mapping, bank account, and bad-debt expense account are ready",
          "The existing document and workflow were checked so this action will not be duplicated",
        ]} />
        <GuideCallout tone="warning" title="These are different losses">A refund returns money the customer owns and credits the bank. A write-off concedes money the customer still owes and debits bad-debt expense. Never choose one because the other is unavailable.</GuideCallout>
      </GuideSection>

      <GuideSection id="separate-refund-and-write-off" title="Separate a refund from a write-off">
        <GuideSteps>
          <GuideStep title="Refund customer credit">Use when receipts, overpayments, or unapplied credit leave a genuine refundable balance. The posting debits customer credit and credits the selected bank account.</GuideStep>
          <GuideStep title="Write off bad debt">Use when an open invoice balance has been authorised as uncollectible. The posting debits bad-debt expense and credits Accounts Receivable for that invoice.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="process-a-refund" title="Process a refund">
        <GuideSteps>
          <GuideStep title="Choose the refund date first">Console calculates available customer credit as at this date. Credit received later cannot fund an earlier refund.</GuideStep>
          <GuideStep title="Select an eligible customer">Search the server-backed list of customers with refundable credit, then compare the displayed amount with receipt, allocation, and earlier refund history.</GuideStep>
          <GuideStep title="Choose the destination bank account">Confirm the approved account and beneficiary evidence outside Console. The refund screen records the bank account but does not prove the beneficiary instruction is genuine.</GuideStep>
          <GuideStep title="Keep the amount within available credit">A partial or full refund is allowed, but zero and over-refunds are rejected. Add a reason that connects the refund to its evidence.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="write-off-bad-debt" title="Write off bad debt">
        <GuideSteps>
          <GuideStep title="Select the customer and exact invoice">Only posted invoices with a balance due are eligible. A write-off is invoice-specific and cannot predate the debt it clears.</GuideStep>
          <GuideStep title="Confirm the approved amount">Do not exceed the open balance or combine unrelated invoices. Preserve collection attempts and the authorised bad-debt decision.</GuideStep>
          <GuideStep title="Review the expense treatment">Use the approved bad-debt expense account or the configured default. Confirm that the preview debits expense and credits Accounts Receivable.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="follow-approval-and-posting" title="Follow approval and posting">
        <p>Choose Save draft only when work is incomplete. Choose Submit for approval whenever the current rule requires a second person. Post now appears only when the active rule permits direct posting, and the created document's server result remains authoritative. Refunds move cash and write-offs concede income, so never split one action into smaller documents to avoid approval.</p>
        <GuideCallout title="Stop before the final action">The interactive walkthrough can open the form and explain the preview. It never processes a refund, posts a write-off, saves a draft, or submits an approval.</GuideCallout>
      </GuideSection>

      <GuideSection id="verify-and-recover" title="Verify and recover">
        <p>Confirm the final status, customer, date, amount, reason, workflow, and journal. For a refund, reconcile the customer-credit reduction and bank movement, and check that the same credit is no longer available. For a write-off, confirm the invoice balance and expense posting. If the screen times out, inspect the existing adjustment and ledger result before retrying. Void through the controlled action when permitted; do not post a compensating duplicate.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>No refundable customer appears: move the date to when the credit existed, or verify that it was not already allocated or refunded.</li>
          <li>The amount exceeds available credit: reduce it to the verified balance, not the gross receipt amount.</li>
          <li>No write-off invoice appears: verify customer, entity, posted status, date, and remaining balance.</li>
          <li>The document is awaiting approval: track that workflow instead of recreating the adjustment.</li>
          <li>The screen failed after submission: verify the document and ledger before any retry.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={[
          "Refund or write-off was chosen for the correct economic event",
          "Customer, date, amount, destination or invoice, reason, and evidence are correct",
          "The posting preview matches the intended cash, credit, receivable, and expense effect",
          "The required approval path was followed without splitting or bypassing it",
          "The final adjustment, customer balance, invoice, bank, and ledger result were verified",
          "No retry or correction duplicated an existing financial result",
        ]} />
      </GuideSection>
    </div>
  );
}
