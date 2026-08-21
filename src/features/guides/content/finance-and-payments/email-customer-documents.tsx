import { CheckCircle2 } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function EmailCustomerDocumentsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Open the final posted document in the correct entity. Confirm the customer, document number, amount or statement period, recipient address, and whether the customer has already received it.</p>
        <GuideCallout tone="danger" title="A sent finance email cannot be recalled">
          The preview names the subject, To recipients, BCC recipients, and attached PDF before sending. Stop if any of them is wrong. Correct the source customer or document through the approved process first.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="choose-the-document" title="Choose the correct document">
        <GuideSteps>
          <GuideStep title="Invoice">Open Customer Invoices, select the posted invoice, check its customer and balance, then choose Email invoice.</GuideStep>
          <GuideStep title="Receipt">Open Receipts &amp; Allocation, select the posted receipt, check its customer and amount, then choose Email receipt.</GuideStep>
          <GuideStep title="Statement">Open Customers, select the customer statement, set the intended period when offered, then choose the statement email action.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="preview-the-delivery" title="Preview the delivery">
        <GuideChecklist items={[
          "The document number or statement period is the one the customer requested.",
          "The subject clearly identifies the document.",
          "Every To address belongs to an intended recipient.",
          "Every BCC address is authorized for finance copies.",
          "The PDF and optional covering note contain no unrelated customer data.",
          "Previously sent history does not already satisfy the request.",
        ]} />
      </GuideSection>

      <GuideSection id="send-and-check-history" title="Send and check delivery history">
        <p>Select Send only after completing the preview. A successful request creates a delivery record. Reopen the action and check its status, requestor, time, recipients, and source before telling the customer it was delivered.</p>
        <GuideCallout tone="warning" title="Sending is not the same as reading">
          Sent means the delivery provider accepted the message. It does not prove that the recipient opened it. Use the recorded status and approved support process when a customer reports that it is missing.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="retry-a-failed-delivery" title="Retry a failed delivery">
        <GuideSteps>
          <GuideStep title="Read the recorded reason">Confirm whether the failure is a temporary provider problem, a blocked send, or an invalid recipient.</GuideStep>
          <GuideStep title="Correct the source problem">If the address or document is wrong, update it through the authorized source workflow. Retrying the same bad input creates another failure.</GuideStep>
          <GuideStep title="Preview the retry">The retry is a new delivery attempt. Recheck recipients, subject, attachment, note, and failure history before selecting Retry.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Email action is missing", body: "The document may not be posted, or your role may not include the specific invoice, receipt, or statement email permission." },
            { title: "No recipient is shown", body: "The customer has no usable email address. Correct the customer record before attempting delivery." },
            { title: "Send is disabled", body: "Wait for the preview to load and read the blocked reason. Do not bypass it with another document type." },
            { title: "The customer did not receive it", body: "Check delivery status and address, ask them to inspect filtering, then follow the approved retry or support path." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> The task is complete when the intended document was sent to the verified recipients, the delivery record has the expected status, and any failure or retry remains visible in history.</p>
      </GuideSection>
    </div>
  );
}
