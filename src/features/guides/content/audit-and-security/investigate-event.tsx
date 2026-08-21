import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function InvestigateEventArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Record the question you are answering, the expected school or platform scope, the safest date window, and any known user, entity, action, IP address, or reference. Investigate from recorded evidence before contacting the actor or changing an account.</p>
        <GuideCallout tone="warning" title="Treat the trail as evidence">Do not edit source records, end sessions, unlock accounts, or repeat the suspected action just to test a theory. Preserve the event reference, time, status, actor, effective user, tenant, entity, and request context first.</GuideCallout>
      </GuideSection>
      <GuideSection id="read-the-security-dashboard" title="Read the security dashboard">
        <p>Use the dashboard to find unusual volume, critical events, failed or denied actions, locked accounts, active sessions, and active proxy use. The cards and charts are signals, not conclusions. Compare a spike with the normal business schedule, maintenance work, imports, and known support activity.</p>
      </GuideSection>
      <GuideSection id="narrow-the-event-set" title="Narrow the event set">
        <GuideSteps>
          <GuideStep title="Start with time and tenant">Use the smallest useful date range. Platform staff can choose a school tenant. A selected tenant narrows both the Explorer and a later CSV export to events stamped for that school.</GuideStep>
          <GuideStep title="Understand No tenant">No tenant (platform-level) contains platform operations, sweeps, management commands, and older events recorded before tenant stamping existed. A specific tenant filter cannot recover those older unscoped events.</GuideStep>
          <GuideStep title="Add one reliable dimension at a time">Narrow by severity, status, module, action, actor, entity type, entity ID, or search text. Keep the filter URL with the investigation so another authorised reviewer can reproduce the same set.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="inspect-one-event" title="Inspect one event in context">
        <p>Open the event and compare its recorded time, result, severity, actor, effective user, proxy marker, school, entity, summary, request reference, source address, and before or after evidence. A denied event proves an attempt, not a completed change. A successful event proves the recorded action, but its business correctness still needs source evidence.</p>
        <GuideCallout title="Actor and effective user can differ">During proxy use, the staff actor and the target account are both material. Keep the proxy-session justification and access trail with any change event produced inside that session.</GuideCallout>
      </GuideSection>
      <GuideSection id="follow-the-entity-trail" title="Follow the entity trail">
        <p>Open Entity Trails or filter the Explorer by the exact entity type and ID. Read the lifecycle in time order and identify the last known-good state, the first unexpected event, related attempts, and any corrective event. Similar labels are not enough: confirm the stable entity reference.</p>
      </GuideSection>
      <GuideSection id="preserve-and-escalate" title="Preserve and escalate evidence">
        <p>Record safe event and request references, exact filters, timestamps with timezone, expected and observed outcomes, and the evidence already checked. Export only the bounded event set when a file is required. Do not paste tokens, passwords, full personal data, or raw metadata into a ticket.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>An expected old event is missing under a school: remove the tenant filter and check No tenant because older records may not carry tenant scope.</li><li>The result set is too large: reduce the date range, then add module, action, status, actor, or entity filters.</li><li>An entity trail appears incomplete: confirm the entity type and stable ID, then search related events that may use another entity reference.</li><li>A read is absent from the main event trail: review the relevant access trail or proxy-session evidence where read activity is recorded.</li><li>The event says denied: preserve it as an attempted action and check nearby successful events before deciding that no change occurred.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The investigation question and time window are explicit", "Tenant or platform scope is understood", "The actor, effective user, action, status, and entity were checked", "The entity lifecycle explains the before and after state", "Evidence was preserved before any security action", "Escalation contains safe references rather than sensitive payloads"]} /></GuideSection>
    </div>
  );
}
