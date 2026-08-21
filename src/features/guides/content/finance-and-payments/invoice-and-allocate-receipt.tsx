import { CheckCircle2 } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function InvoiceAndAllocateReceiptArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the active entity, customer, approved charges, revenue and tax accounts, invoice date, due date, receipt evidence, payment method, and allocation instruction. The invoice and receipt are separate documents, and each posts its own accounting result.</p>
        <GuideCallout tone="warning" title="Use the source document, not a manual journal">
          Create, adjust, void, receive, refund, or write off through Receivables. A separate manual journal can make the general ledger look corrected while the customer's balance stays wrong.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="prepare-the-customer-and-fees" title="Prepare the customer and fees">
        <GuideSteps>
          <GuideStep title="Check the customer">Confirm the customer code, legal or display name, email address, status, opening balance, and any school or payer relationship before billing.</GuideStep>
          <GuideStep title="Check the fee structure">For repeated billing, verify every fee line, amount, tax code, revenue account, effective period, and target population before generating invoices.</GuideStep>
          <GuideStep title="Confirm posting dependencies">The active entity needs open fiscal periods and valid AR, revenue, tax, cash, customer-credit, write-off, and refund mappings for the actions you intend to use.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="create-and-issue-the-invoice" title="Create and issue the invoice">
        <GuideChecklist items={[
          "Select the intended customer and active entity.",
          "Use the approved invoice and due dates inside valid periods.",
          "Add only supported goods, services, fees, tax, and revenue accounts.",
          "Check quantity, unit price, tax, subtotal, total, narration, and reference.",
          "Review batch-generation scope before creating more than one invoice.",
          "After issue or posting, reopen the invoice and verify its document number, balance, lines, and GL postings.",
        ]} />
        <GuideCallout tone="danger" title="Posting changes the customer's balance">
          A posted invoice debits Accounts Receivable and credits revenue and tax as configured. Do not issue a draft until the customer, scope, dates, accounts, and amount have been checked.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="record-the-receipt" title="Record the receipt">
        <GuideSteps>
          <GuideStep title="Start from cleared evidence">Use the bank, cash, card, cheque, online, or approved other evidence. Match the customer, value date, method, amount, currency, reference, and receiving account.</GuideStep>
          <GuideStep title="Record the gross money received">The receipt posts the cash event. It can remain partly or fully unallocated as customer credit until you identify the correct open items.</GuideStep>
          <GuideStep title="Reopen the result">Verify the receipt number, posted status, customer, amount, method, reference, remaining credit, and receipt PDF before allocating it.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="allocate-the-receipt" title="Allocate the receipt">
        <p>Open the receipt from Receipts &amp; Allocation. Console can suggest oldest-first or largest-first allocation across the customer's open invoices and posted debit notes, or you can enter an approved split manually.</p>
        <GuideChecklist items={[
          "The receipt belongs to the same customer as every selected open item.",
          "No line exceeds that item's open balance.",
          "The total allocation does not exceed the receipt's remaining credit.",
          "Any remainder is intentionally left as customer credit.",
          "The allocation summary agrees with the approved remittance advice.",
        ]} />
        <GuideCallout tone="danger" title="Apply allocation is a posting action">
          Applying the split changes open balances and posts the reclassification between customer credit and AR. The walkthrough explains the controls but never selects Apply allocation.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="adjust-or-recover-a-balance" title="Adjust or recover a customer balance">
        <GuideSteps>
          <GuideStep title="Credit or debit note">Use a note tied to the business reason and supporting invoice when the amount billed must be reduced or increased.</GuideStep>
          <GuideStep title="Concession or fee waiver">Use an approved concession for a scholarship, discount, or waiver. Keep its policy, period, amount, and approver traceable.</GuideStep>
          <GuideStep title="Payment plan and dunning">Schedule a genuine agreed balance over installments, then use dunning to follow overdue items under the approved policy.</GuideStep>
          <GuideStep title="Refund or write-off">Refund only available customer credit through the approved bank path. Write off only authorized bad debt to the mapped expense account. Both require evidence and cannot be treated as routine allocation.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="verify-the-ledger-result" title="Verify the ledger result">
        <GuideChecklist items={[
          "Invoice total, settlements, credited amount, and balance due reconcile.",
          "Receipt amount, allocated amount, refunded amount, and remaining credit reconcile.",
          "AR control equals the receivables sub-ledger for the entity and period.",
          "Cash, revenue, tax, customer-credit, refund, and write-off postings use the intended accounts.",
          "The invoice, receipt, statement, and audit history tell the same story.",
        ]} />
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "The customer or fee is missing", body: "Check the active entity, record status, effective dates, and your customer or fee-structure permission." },
            { title: "The invoice date is refused", body: "Use the real approved date and ask the period owner to create or reopen the correct fiscal period." },
            { title: "The receipt has no open items", body: "Confirm the customer and document statuses. Leave genuine unapplied money as customer credit instead of forcing it onto another customer." },
            { title: "Apply allocation is disabled", body: "Choose an open item, allocate more than zero, stay within its balance, and do not exceed the remaining receipt credit." },
            { title: "A refunded receipt still looks available", body: "Use Remaining credit, not the gross unallocated figure, and verify the refund history before applying money again." },
            { title: "The balances disagree", body: "Stop new adjustments, compare source documents and GL postings, and resolve the first incorrect source event rather than adding an unsupported journal." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> The cycle is complete when the approved invoice and receipt are posted, allocation matches the remittance, customer and GL balances agree, any remainder is explained, and the documents and audit trail are available.</p>
      </GuideSection>
    </div>
  );
}
