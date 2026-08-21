import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function AccountInvitationArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Use only the affected person&apos;s approved work address and current invitation. Never forward an activation or reset link, and never ask support to set or reveal a password.</p>
      </GuideSection>
      <GuideSection id="identify-the-state" title="Identify the account state">
        <GuideSteps>
          <GuideStep title="Unactivated">The person has not completed the one-time activation link. Confirm the invitation was sent to the correct address.</GuideStep>
          <GuideStep title="Inactive">An administrator disabled the account. Activation or password reset does not reactivate it.</GuideStep>
          <GuideStep title="Locked">Repeated failed sign-ins or a security control blocked access. Use the approved unlock process after verifying identity.</GuideStep>
          <GuideStep title="Expired link">Activation and recovery links are time-limited and single-use. Request a fresh link instead of reusing or forwarding one.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="recover-an-invitation" title="Recover a missing or expired invitation">
        <p>Confirm spelling, domain, spam or quarantine, and whether a newer message replaced the old one. An authorised administrator can resend the invitation from the user record. The person should open only the newest link and check that the domain belongs to Console.</p>
      </GuideSection>
      <GuideSection id="recover-sign-in" title="Recover sign-in safely">
        <p>Use Forgot password for an active, activated account. If the account is inactive, locked, has the wrong email, or is outside the expected school, ask the responsible administrator to correct that state first. Do not create a duplicate user to work around access.</p>
        <GuideCallout tone="warning" title="Treat links like passwords">Do not paste activation or reset URLs into tickets, chat, screenshots, or shared documents.</GuideCallout>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>No email arrived: verify the exact recipient and delivery controls before resending repeatedly.</li><li>The link says invalid: use the newest email and request another only if it is also expired or consumed.</li><li>Password reset succeeds but sign-in fails: check inactive or locked state, email spelling, and the current login domain.</li><li>The person appears twice: stop and ask an administrator to reconcile the duplicate identities.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The approved identity and email are confirmed", "The exact account state is known", "Only the newest private link is used", "No duplicate account was created", "The person can sign in to the intended tenant and scope"]} /></GuideSection>
    </div>
  );
}
