import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function StalledWorkflowRecordsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>A record that cannot advance is usually waiting for a prerequisite, a valid transition, or an assigned decision. Record its safe reference, current status, entity, workflow instance, expected next status, last successful action, and time.</p>
      </GuideSection>
      <GuideSection id="trace-the-boundary" title="Trace the blocked boundary">
        <GuideSteps>
          <GuideStep title="Confirm the current state">Read the record history and available actions. Do not infer completion from an email or another screen.</GuideStep>
          <GuideStep title="Check prerequisites">Look for missing setup, open period, account mapping, evidence, totals, stock, receipt, match tolerance, budget, or required upstream status.</GuideStep>
          <GuideStep title="Check the workflow instance">Confirm the template version, current step, resolved approver or group, delegation, deadline, and last transition.</GuideStep>
          <GuideStep title="Check actor and scope">The next person may lack permission, be inactive, outside scope, or no longer hold the assigned seat.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="recover-safely" title="Recover safely">
        <p>Correct the earliest failed prerequisite rather than forcing the later status. If there is no approver, repair the approved workflow or assignment and then use the supported recovery action. If the record is already posted, paid, received, or otherwise consequential, reconcile downstream evidence before cancellation, reversal, or resubmission.</p>
        <GuideCallout tone="warning" title="Do not skip states manually">Never edit status data, approve for another person, duplicate the record, or bypass validation to make a queue move.</GuideCallout>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>No approver appears: check template activation, conditions, group membership, delegation, and effective dates.</li><li>A journal or invoice cannot proceed: check entity, period, mapping, balance, source status, and required approval.</li><li>A PO, receipt, invoice, or payment is stuck: trace the expected sequence and three-way match from the earliest source record.</li><li>A report or reconciliation is blocked: confirm the period, source posting, entity, and unresolved exceptions.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The current and expected statuses are recorded", "The earliest failed prerequisite is known", "The workflow step and responsible actor were verified", "No status, approval, or duplicate record bypass was used", "Downstream accounting, stock, and payment effects reconcile after recovery"]} /></GuideSection>
    </div>
  );
}
