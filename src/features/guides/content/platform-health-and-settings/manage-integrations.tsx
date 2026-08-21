import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ManageIntegrationsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the affected connection, current delivery behaviour, approved sender identity or retry policy, owner, maintenance window, monitoring plan, and rollback. Never paste credentials, tokens, callback secrets, or full provider payloads into a guide report or support ticket.</p>
        <GuideCallout tone="warning" title="Console does not own every integration value">Sender defaults and retry controls can be saved in Console. Hosts, API keys, callback URLs, payment credentials, and public application URLs remain deployment-owned. A dashboard change cannot repair missing infrastructure secrets.</GuideCallout>
      </GuideSection>
      <GuideSection id="read-effective-settings" title="Read effective settings and sources">
        <p>Check each value and its source badge before changing it. A database value overrides its fallback; Reset removes that override and reveals the deployment or product value. Record the effective before state so a rollback is precise.</p>
      </GuideSection>
      <GuideSection id="configure-email-delivery" title="Configure email delivery">
        <GuideSteps>
          <GuideStep title="Verify sender identity">The default sender name and address apply when a message supplies no sender of its own. Confirm domain policy, public identity, and deliverability ownership.</GuideStep>
          <GuideStep title="Set a bounded retry policy">Retry budget and delay affect queued email attempts after failure. More retries can increase delay, queue pressure, and duplicate-looking provider traffic without fixing a permanent error.</GuideStep>
          <GuideStep title="Save and observe">After approval, save once and monitor a controlled message, queue state, delivery history, and provider response before increasing retries again.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="test-deployment-connections" title="Test deployment-owned connections">
        <p>Connection tests are read-only checks of configured email or payment credentials. They do not send an email, create a charge, transfer money, or create a customer. A failed test needs deployment investigation; a passed test proves credential reachability at that moment, not end-to-end business delivery.</p>
      </GuideSection>
      <GuideSection id="connect-health-and-notifications" title="Connect health and notification evidence">
        <p>For an operational failure, compare connection readiness with Health service signals, Jobs &amp; Queues, provider webhooks, notification delivery history, and the source business record. Keep provider reference, event time, status, and safe error code aligned before deciding whether to retry elsewhere.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Save is unavailable: viewing integrations does not grant the separate manage permission.</li><li>A host or key cannot be edited: it is deployment-owned and must be changed through the approved infrastructure path.</li><li>Test SMTP is disabled: the backend reports that the connection is not configured.</li><li>A test passes but delivery fails: inspect the template, event, queue, recipient, provider response, and delivery history.</li><li>Retries keep failing: treat a stable configuration or provider error as permanent until its cause changes.</li><li>A payment webhook is unmatched: prove the collection or payout result before any authorised replay.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The integration owner and change boundary are clear", "No credential or secret was exposed", "Effective values and their sources were recorded", "Sender and retry changes were approved and bounded", "Connection tests were interpreted as readiness checks only", "Health, queue, delivery, webhook, and business evidence were reconciled"]} /></GuideSection>
    </div>
  );
}
