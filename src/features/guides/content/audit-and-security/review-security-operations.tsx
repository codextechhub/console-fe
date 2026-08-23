import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ReviewSecurityOperationsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the user, school, reported time, expected device or location, and the authority for any response. Record current session, attempt, lockout, password, and proxy evidence before ending access or unlocking an account.</p>
        <GuideCallout tone="danger" title="Security actions change access immediately">Force logout, unlock, password reset, email change, and ending a proxy session are separate consequential actions. Use the least disruptive action supported by the evidence and record a specific reason.</GuideCallout>
      </GuideSection>
      <GuideSection id="review-live-sessions" title="Review live sessions">
        <p>Search by user, IP address, device, school, status, or end reason. Compare creation time, last seen time, session age, client, location evidence, and whether the session is already ended. A familiar device name alone does not prove the user owns the session.</p>
      </GuideSection>
      <GuideSection id="investigate-sign-in-attempts" title="Investigate sign-in attempts">
        <GuideSteps>
          <GuideStep title="Read the outcome and failure code">Separate SUCCESS, FAIL, and BLOCKED. Use the recorded failure code to distinguish bad credentials, disabled access, rate limiting, lockout, or another authentication control.</GuideStep>
          <GuideStep title="Look for a pattern">Compare email, school, source address, device details, date range, and repeated timing. One failed attempt is different from a distributed pattern or a success immediately after many failures.</GuideStep>
          <GuideStep title="Connect the successful session">When a suspicious attempt succeeded, locate the resulting live or ended session and nearby password activity before responding.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="review-lockouts-and-passwords" title="Review lockouts and password activity">
        <p>For a lockout, confirm its reason, failure count, last failure address, expiry, and whether the same pattern continues. Review password changes, resets, email changes, successes, failures, actor, target user, and school. Unlocking with a reset is not proof that the original activity was safe.</p>
      </GuideSection>
      <GuideSection id="review-proxy-sessions" title="Start and review proxy sessions">
        <GuideSteps>
          <GuideStep title="Confirm the support authority">Use proxy only for a specific approved support task. Record the target user, tenant, reason, expected checks, and work that must remain off limits.</GuideStep>
          <GuideStep title="Open Proxy a user">Use workspace search or the approved account control to open <strong>Proxy a user</strong>. Enter at least two characters of the verified name or email.</GuideStep>
          <GuideStep title="Verify the exact target">Compare the full name, email, tenant or school, and displayed role. Select the person only when all identifiers match the support case.</GuideStep>
          <GuideStep title="Start deliberately">Select <strong>Proxy</strong>. Console switches to the target&apos;s effective identity and permissions; it does not grant the operator additional access.</GuideStep>
          <GuideStep title="Exit as soon as the check ends">Use <strong>Exit proxy</strong> before returning to unrelated work. Confirm your own identity and tenant are restored.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="danger" title="Proxy is not permission escalation">Never use proxy access to approve, pay, post, change permissions, reset credentials, or perform another business action merely because the target can. The support authority must cover the exact action.</GuideCallout>
        <p>Afterward, compare the staff proxier, target user, organisation, justification, start and end time, status, data accessed, and actions attempted or completed. Open-ended proxy sessions expire under the configured idle safeguard. An active unexpected session may need to be ended, but preserve its evidence first.</p>
        <GuideCallout title="Proxy evidence has two layers">Changes and failed actions appear in the audit event trail with actor and effective-user context. Reads are recorded in the proxy session&apos;s access trail.</GuideCallout>
      </GuideSection>
      <GuideSection id="respond-without-losing-evidence" title="Respond without losing evidence">
        <p>Choose the smallest response that contains the risk: contact the verified user, end one session, end the user&apos;s sessions, end a proxy session, unlock with reset, or follow the approved incident path. Never ask the user for their password or copy reset links, tokens, or sensitive event payloads into support notes.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>A session looks active after logout: refresh and compare last seen and end reason before acting again.</li><li>No attempt appears: widen the date range carefully and confirm the email or school used at sign-in.</li><li>An account relocks after unlock: investigate the repeating source and failure code instead of repeatedly unlocking it.</li><li>Password activity has no expected user action: preserve the actor, target, school, status, and related sessions, then escalate.</li><li>A proxy session shows no change events: inspect its access trail because read activity is recorded there.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["User and school identity were confirmed", "Attempts, sessions, lockout, password, and proxy evidence were correlated", "Successful and denied actions were not confused", "Evidence was recorded before access changed", "The least disruptive authorised response was chosen", "The audit trail and follow-up owner are clear"]} /></GuideSection>
    </div>
  );
}
