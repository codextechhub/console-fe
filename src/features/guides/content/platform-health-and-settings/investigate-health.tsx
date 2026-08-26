import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function InvestigateHealthArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Record who is affected, the first known time, the exact action or endpoint, the expected result, the observed result, and whether the problem affects one user, one school, one provider, or the platform. Use safe references instead of personal data or credentials.</p>
        <GuideCallout tone="warning" title="Observe before you intervene">A retry, replay, worker restart, provider resend, or configuration change can alter evidence and duplicate work. Preserve the time window, request or job reference, current status, and related incident before any recovery action.</GuideCallout>
      </GuideSection>
      <GuideSection id="read-the-command-center" title="Read the Command Center">
        <p>Start with the platform posture, active incidents, latency, traffic, error rate, saturation, request activity, and service health. A healthy platform signal does not rule out a tenant, user, or provider problem. A warning signal is a prompt to narrow the scope, not proof of the cause.</p>
      </GuideSection>
      <GuideSection id="classify-the-scope" title="Classify the affected scope">
        <GuideSteps>
          <GuideStep title="User">Compare the user, permissions, session, input, and exact action with another authorised user in the same school. Do not borrow credentials or bypass access checks.</GuideStep>
          <GuideStep title="Tenant">Use Tenant Health to compare the affected school with the platform baseline. Check demand, latency, errors, and whether similar schools remain healthy.</GuideStep>
          <GuideStep title="Provider">For email, payment, or webhook symptoms, compare the provider reference, connection readiness, delivery status, and unmatched webhook evidence. Never resend money or messages from a dashboard assumption.</GuideStep>
          <GuideStep title="Platform">Confirm that multiple tenants, services, or endpoints show the same time-aligned degradation and connect them to an active incident.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="trace-services-and-endpoints" title="Trace services, uptime, and endpoints">
        <p>Use service health and Uptime to check availability, response time, recent alerts, and certificate state. Use API &amp; Endpoints to find slow routes, high error rates, throttling, status distribution, and request volume. Compare the same time window across views before drawing a conclusion.</p>
      </GuideSection>
      <GuideSection id="inspect-jobs-and-queues" title="Inspect jobs and queues">
        <p>Find the exact job by safe reference, task type, queue, state, and timestamps. Queued and Running are not final failures. Compare queue depth, oldest age, active workers, failure reason, retries already recorded, and whether the business result committed before requesting another attempt.</p>
        <GuideCallout title="A failed screen does not prove nothing happened">For imports, exports, email, payroll, payments, or other background work, verify the destination and audit evidence before retrying. A timeout can occur after the business change committed.</GuideCallout>
        <p>Open a job to see its recorded failure message. That message is stored redacted: personal data the failure quoted, such as an address a database constraint rejected, is replaced with a placeholder before it is written down. The shape of the failure survives, so the redacted message is usually enough to classify it.</p>
        <GuideCallout title="Revealing the raw text is recorded against the school">The unredacted failure text is kept separately and needs its own permission, held by the Super Admin. Opening it writes an audit entry naming you, the job, and the time, filed against the audit trail of the school whose task failed, where their own administrators can see it. Read the redacted message first and reveal the raw text only when the redacted one cannot answer the question. The raw record is removed once its retention period ends, so an older job may have none.</GuideCallout>
      </GuideSection>
      <GuideSection id="connect-incidents-and-slos" title="Connect incidents, alerts, and SLOs">
        <p>Use Incidents &amp; Alerts to connect triggered signals, severity, owner, affected services, status, and timeline. Use SLOs to understand reliability attainment and remaining error budget. An SLO breach shows sustained reliability impact, while an alert can be brief or local. Escalate using the incident code and evidence already checked.</p>
      </GuideSection>
      <GuideSection id="review-provider-webhooks" title="Review provider webhooks">
        <p>Provider Webhooks contains gateway events that matched no collection and no payout, so they are not assigned to a school. Match provider, event type, safe provider reference, amount, currency, received time, processing result, and reason. Replay remains a separate authorised action after proving the event did not already create or settle the intended record.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Only one user is affected: check access, session, input, and user-specific history before declaring an outage.</li><li>Only one school is affected: compare Tenant Health, school configuration, entitlements, and recent changes.</li><li>A job appears stuck: confirm queue depth, worker activity, job age, and the business destination before retrying.</li><li>An endpoint is slow: compare volume, error rate, throttling, service health, and the same route in another time window.</li><li>A provider event is unmatched: preserve the safe reference and prove whether the business record exists before replay.</li><li>No incident exists: record the evidence and escalate for triage instead of creating a recovery action without ownership.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The affected scope is classified as user, tenant, provider, or platform", "The same time window was compared across relevant health views", "The exact endpoint, job, incident, tenant, or provider reference was identified", "Business completion was checked before any retry or replay", "The incident or escalation contains safe evidence and a clear owner", "No recovery action was taken from an unproven assumption"]} /></GuideSection>
    </div>
  );
}
