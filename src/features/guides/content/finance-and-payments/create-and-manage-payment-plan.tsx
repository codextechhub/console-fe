import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function CreateAndManagePaymentPlanArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <GuideChecklist items={[
          "The active entity, customer, and posted invoice are correct",
          "The invoice still has a balance due after receipts, credits, concessions, and write-offs",
          "The customer agreement states the total, first due date, frequency, and number of installments",
          "You have both create and activate permission because Console activates a new plan immediately",
          "The deposit account and receipt evidence process are ready for later installments",
        ]} />
        <GuideCallout title="A plan does not replace the invoice">The invoice remains the accounting debt. The plan schedules and tracks collection of that balance; each real installment is still recorded as a receipt against the invoice.</GuideCallout>
      </GuideSection>

      <GuideSection id="build-the-schedule" title="Build the schedule">
        <GuideSteps>
          <GuideStep title="Choose the customer and open invoice">Only posted invoices with a balance due appear. Confirm earlier credit and payments before using the remaining balance as the plan total.</GuideStep>
          <GuideStep title="Set the agreed total">The total defaults to the invoice balance. Reduce it only when the signed agreement intentionally schedules part of the balance and the remainder has a separate approved treatment.</GuideStep>
          <GuideStep title="Set timing">Choose the first due date, weekly, fortnightly, monthly, or quarterly frequency, and between 1 and 60 installments.</GuideStep>
          <GuideStep title="Read the preview">Console splits the total evenly and puts any rounding remainder on the last installment. Compare every due date and amount with the customer agreement before creation.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="create-and-activate" title="Create and activate the plan">
        <p>Create plan first creates the schedule and then activates it so tracking begins immediately. The action requires both permissions. It does not post cash, change the invoice balance, or send an installment receipt by itself. Stop if the preview differs from the agreement.</p>
        <GuideCallout tone="warning" title="Creation is the final action">The walkthrough opens and explains the schedule drawer but never selects a customer, fills a field, or creates and activates the plan.</GuideCallout>
      </GuideSection>

      <GuideSection id="record-an-installment" title="Record an installment">
        <GuideSteps>
          <GuideStep title="Open the active plan">Confirm the plan number, invoice, outstanding total, next unpaid installment, and due date.</GuideStep>
          <GuideStep title="Record the real receipt">Enter the amount, posting date, method, and approved deposit account. This posts a real receipt against the invoice, debiting bank or cash and crediting Accounts Receivable.</GuideStep>
          <GuideStep title="Verify automatic progress">Console refreshes the plan from the invoice settlements. Confirm the installment is Paid or Partial, the outstanding total changed, and the receipt email result is traceable.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="monitor-and-cancel" title="Monitor and cancel">
        <p>On track means the next unpaid installment is not overdue. At risk means its due date has passed. Completed means no installment balance remains. Cancelling stops future schedule tracking but does not reverse receipts already posted to the invoice. Confirm the cancellation authority and replacement collection plan before selecting Cancel plan.</p>
      </GuideSection>

      <GuideSection id="verify-and-recover" title="Verify and recover">
        <p>After creation, reopen the plan and compare its total, dates, frequency, installment amounts, status, and invoice. After a payment, verify the receipt, invoice balance, installment status, and deposit account. If create succeeds but activation fails, do not create a second plan; find the draft, obtain activation permission, and continue from the existing record.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>No invoice appears: verify the customer, entity, posted status, and remaining balance.</li>
          <li>New plan is unavailable: the complete action needs both create and activate permission.</li>
          <li>The last installment differs slightly: Console assigns the rounding remainder to the final installment so the schedule equals the total.</li>
          <li>A plan is At risk: verify the next unpaid due date and contact the customer through the approved collection process.</li>
          <li>Cancellation did not restore money: cancellation stops tracking and never reverses posted receipts.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={[
          "The plan points to the correct customer, entity, and posted invoice",
          "Total, first due date, frequency, count, and preview match the agreement",
          "The plan was created once and activated successfully",
          "Every installment receipt uses verified evidence, date, method, and deposit account",
          "Plan progress and invoice balance agree after each receipt",
          "Cancellation, if used, preserved earlier receipts and has a clear follow-up owner",
        ]} />
      </GuideSection>
    </div>
  );
}
