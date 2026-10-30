import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function SecureAccountArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Open your account menu and choose <strong>My Security</strong>. Use only your own direct session when changing a password or deciding which devices to sign out. Never send a password, reset link, session token, or full IP address in a ticket or message.</p>
        <GuideCallout tone="warning" title="Respond quickly to activity you do not recognize">Preserve the time, device, browser, approximate location, and failure message. End the suspicious sessions, change your password from a trusted device, and contact Support with safe evidence.</GuideCallout>
      </GuideSection>

      <GuideSection id="read-your-security-overview" title="Read your security overview">
        <p>The overview summarizes active sessions, the latest sign-in, failed sign-ins from the last seven days, the last password change, and recent account activity. A warning is a prompt to inspect the underlying history. It does not prove that someone accessed the account successfully.</p>
      </GuideSection>

      <GuideSection id="change-your-password" title="Change your password">
        <GuideSteps>
          <GuideStep title="Use a trusted device">Open <strong>Password &amp; sign-in</strong> from a device and network you trust. While you are proxying, the page shows <strong>Exit proxy to change your password</strong> instead of the form, because a change there would be to the proxied person&apos;s password. Exit proxy from the account menu first.</GuideStep>
          <GuideStep title="Enter the current password">Console requires the current password before accepting a replacement. If you cannot supply it, use the password-reset flow instead.</GuideStep>
          <GuideStep title="Create a unique replacement">Follow the live password checklist and strength indicator. Do not reuse a password from email, banking, social media, or another workplace system.</GuideStep>
          <GuideStep title="Save, then sign in again">Select <strong>Update password</strong>. A refusal, such as a wrong current password or a password the policy rejects, appears under the box it is about. Once the change is saved, every device signed in to your account is signed out, this one included, and each asks for the new password within 15 minutes. Select <strong>Sign in again now</strong> so nothing you are doing is cut off, then sign in on the other devices you still use.</GuideStep>
        </GuideSteps>
        <GuideCallout title="Reset history is evidence, not a reset control">The history panel lists reset requests and whether each one is pending, used, or expired. An unexpected pending request should be reported even when your password still works.</GuideCallout>
      </GuideSection>

      <GuideSection id="two-step-sign-in" title="Two-step sign-in">
        <p>Below the password, <strong>Two-step sign-in</strong> says that a code from your authenticator app is asked for after your password, and how many backup codes you have left. Every CodeX account uses it, because the Console reaches every school.</p>
        <GuideSteps>
          <GuideStep title="Make new backup codes">Select <strong>Make new backup codes</strong> and type the code your app shows now. Ten new codes replace every old one; copy them somewhere safe away from this device, then select <strong>I have saved them</strong>.</GuideStep>
          <GuideStep title="A new phone">Ask another administrator to reset your two-step sign-in from Team management. You set up the new phone at your next sign-in. Nobody can reset their own.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="review-and-end-sessions" title="Review and end sessions">
        <p>Open <strong>Active sessions</strong> and compare the browser, operating system, masked IP address, sign-in time, and last-active time. The current device is identified separately. End one unfamiliar session, or use <strong>Sign out of all other sessions</strong> when several devices are uncertain. Both actions require your explicit confirmation.</p>
      </GuideSection>

      <GuideSection id="review-login-history" title="Review login history">
        <p>Filter successful, failed, and blocked attempts by time range. A failed attempt can be a typing mistake; repeated attempts from an unfamiliar device or network need investigation. Selecting <strong>Something look wrong?</strong> ends all sessions and directs you to sign in again and change the password, so use it only when you intend that full response.</p>
      </GuideSection>

      <GuideSection id="review-account-activity" title="Review account activity">
        <p>Use <strong>Account activity</strong> to compare things you did with things done to your account. Search by safe business terms, open an event for its summary and status, and compare the time with your sign-in history. The on-screen CSV download contains only the currently loaded activity rows for the selected tab.</p>
      </GuideSection>

      <GuideSection id="recognize-proxy-mode" title="Recognize proxy mode">
        <p>Authorized support staff can temporarily operate as another user. While proxying, the account menu offers <strong>Exit proxy</strong>. Exit returns to the operator&apos;s direct account and clears the target user&apos;s cached workspace data. Do not treat the target&apos;s profile, sessions, or activity as your own personal account controls.</p>
        <GuideCallout tone="warning" title="Never use proxy access to bypass authorization">Proxy mode preserves the target user&apos;s permission and tenant boundaries. It does not authorize password changes, session termination, or business actions that the support task does not require.</GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>Your current password is rejected: check keyboard layout and password-manager selection, then use the reset flow rather than repeated guesses.</li>
          <li>A device name is unclear: compare browser, operating system, sign-in time, last activity, and masked IP before ending it.</li>
          <li>You see failed attempts but no successful unknown sign-in: change the password if the pattern is suspicious and keep monitoring history.</li>
          <li>Password reset history does not load: refresh once, then contact Support with the time and screen name, never the reset link.</li>
          <li>You are in the wrong account context: choose <strong>Exit proxy</strong> before reviewing or changing personal security.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={["The security overview and latest sign-in were reviewed", "Every active session is recognized or has been ended", "Unexpected login attempts were investigated", "The password is unique and was changed from a trusted direct session when needed", "Unexpected reset requests were recorded without sharing the reset link", "Proxy mode was exited before personal security actions", "Support received only safe evidence when escalation was required"]} />
      </GuideSection>
    </div>
  );
}
