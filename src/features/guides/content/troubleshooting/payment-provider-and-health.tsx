import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function PaymentProviderHealthArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>When money or a provider event is involved, do not retry or replay first. Record the safe internal and provider references, amount, currency, entity, time, status, event type, endpoint or job, and whether the bank, provider, Console ledger, or destination record shows success.</p>
      </GuideSection>
      <GuideSection id="classify-the-problem" title="Classify the problem">
        <GuideSteps>
          <GuideStep title="One user or record">Check permissions, scope, validation, status, and record history.</GuideStep>
          <GuideStep title="One tenant or entity">Compare configuration, capability, account mapping, provider identity, and recent tenant changes.</GuideStep>
          <GuideStep title="One provider or endpoint">Compare health, recent errors, latency, webhook delivery, credentials status, and provider evidence.</GuideStep>
          <GuideStep title="Many areas">Check incidents, jobs, queues, dependencies, and deployment changes before altering a business record.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="reconcile-before-recovery" title="Reconcile before recovery">
        <p>Follow the same transaction across the source record, Console transaction or payout, provider event, webhook, receipt or journal, settlement, and bank evidence. Pending is not failed. A failed callback is not proof that money failed. Use a supported retry or replay only after proving the operation will not duplicate money or posting.</p>
        <GuideCallout tone="warning" title="Protect secrets and payment data">Never put access tokens, signing secrets, full bank details, complete card data, or raw provider payloads in a ticket or screenshot.</GuideCallout>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Provider says successful but Console is pending: trace webhook receipt, processing job, business posting, and settlement before replay.</li><li>Console says failed but the bank shows movement: freeze retry and escalate with reconciled references.</li><li>A job is stuck: compare queue age, worker state, retry count, dependency health, and related incident.</li><li>An endpoint is unhealthy: identify tenant impact and degraded capability before changing integration settings.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The failure is classified as user, tenant, provider, or platform", "Provider, Console, ledger, and bank evidence were reconciled", "No duplicate payment, payout, posting, retry, or replay occurred", "Secrets and unnecessary personal data were excluded", "The safe references, time, impact, and checks are ready for support"]} /></GuideSection>
    </div>
  );
}
