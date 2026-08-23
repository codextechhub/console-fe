import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function PrepareSupportTicketArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Use troubleshooting guides first when the problem is safe to inspect. Then create one ticket for one issue with enough evidence to reproduce or trace it. Console may attach only a safe guide ID, route pattern, product area, and app version. It never copies page values.</p>
      </GuideSection>
      <GuideSection id="write-the-ticket" title="Write a useful ticket">
        <GuideSteps>
          <GuideStep title="Title">Describe the failed outcome and area, for example, “Approved requisition did not create a PO”.</GuideStep>
          <GuideStep title="Description">Include the task, safe reference, expected result, actual result, exact safe message or error code, time and time zone, frequency, affected users or tenants, and checks already performed.</GuideStep>
          <GuideStep title="Category and priority">Choose the closest category. Base priority on current business impact, scope, workaround, deadline, and security or financial risk.</GuideStep>
          <GuideStep title="Attachments">Use cropped, masked evidence that shows the relevant state. Explain what each file proves.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="protect-sensitive-data" title="Protect sensitive data">
        <GuideCallout tone="warning" title="Do not send secrets or unnecessary records">Exclude passwords, activation and reset links, access tokens, signing secrets, full bank or card details, raw provider payloads, payroll details, source imports, and raw exports. Use an approved secure handoff only when support specifically requests restricted evidence.</GuideCallout>
      </GuideSection>
      <GuideSection id="after-submission" title="After submission">
        <p>Keep the ticket number. Add new evidence to the same ticket instead of opening duplicates. Commenting follows the ticket automatically, so you receive later comments and status updates while you still have access. Use <strong>Stop notifications</strong> on the ticket when you no longer need updates. Commenting again follows it again.</p>
        <p>Only the requester can edit the ticket title, description, category, or priority. If impact changes, the requester should update the ticket with the time and reason. Resolvers can still assign, comment, add internal notes, attach evidence, and move the ticket through its status workflow.</p>
        <p>Do not keep retrying a financial, import, approval, or provider action while support is tracing it unless the documented recovery path says it is safe.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Support cannot reproduce it: add the exact route, safe reference, time zone, steps, and active filters or entity.</li><li>A screenshot is too broad: crop it and mask unrelated names, amounts, addresses, and security data.</li><li>Several failures are bundled together: separate unrelated root causes, but keep repeated evidence for one failure in one ticket.</li><li>The issue is urgent: explain the real current impact and workaround, not only the word urgent.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The title describes one failed outcome", "The safe reference, route, time, expected result, and actual result are included", "Impact and priority are evidence-based", "Screenshots are cropped and masked", "No secret or unnecessary personal data is included", "The ticket is reviewed before Create ticket"]} /></GuideSection>
    </div>
  );
}
