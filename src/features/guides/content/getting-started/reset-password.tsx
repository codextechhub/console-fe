import { CheckCircle2, CircleAlert, KeyRound, LogIn, Mail } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideFigure, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ResetPasswordArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>You need access to the email address attached to your Console account. Password reset links are personal and should not be forwarded, copied into a ticket, or shared in chat.</p>
        <GuideChecklist items={[
          "Use Forgot password when you cannot remember the current password.",
          "Use the email address registered on your Console account.",
          "Open only the newest reset email if you requested more than one.",
          "Prepare a new password you have not used before.",
        ]} />
      </GuideSection>

      <GuideSection id="request-a-reset-link" title="Request a reset link">
        <GuideSteps>
          <GuideStep title="Open Forgot password">From Login to your Account, select Forgot password.</GuideStep>
          <GuideStep title="Enter Email">Enter the email address used by your Console account.</GuideStep>
          <GuideStep title="Select Send Reset Link">Console shows Check your Email after accepting the request.</GuideStep>
          <GuideStep title="Open the reset email">Use the newest password reset link. Keep the link private.</GuideStep>
        </GuideSteps>
        <GuideCallout title="Email delivery can take a moment">
          Check spam or junk folders and confirm the email address before selecting Try again. If the account is managed by your organization and mail never arrives, contact your administrator.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="set-a-new-password" title="Set a new password">
        <GuideSteps>
          <GuideStep title="Wait for link verification">Console verifies the reset link before showing the password form.</GuideStep>
          <GuideStep title="Confirm Name and Email">These fields are read-only. Stop if the link identifies the wrong account.</GuideStep>
          <GuideStep title="Enter New Password">Use at least 12 characters with uppercase and lowercase letters, a number, and a special character.</GuideStep>
          <GuideStep title="Enter Confirm Password">Enter the same new password again, then select Reset Password.</GuideStep>
          <GuideStep title="Return to login">After Password Reset appears, select Continue to Login or wait for the automatic return.</GuideStep>
        </GuideSteps>
        <GuideFigure title="Password recovery sequence" caption="The reset link proves access to the registered email. The new password still has to satisfy the shared Console password policy.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Mail, title: "Request", body: "Ask Console to send a private reset link." },
              { icon: KeyRound, title: "Replace", body: "Choose and confirm a valid new password." },
              { icon: LogIn, title: "Sign in", body: "Use the new password on the normal login screen." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-4">
                <Icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-black-01">{title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-01">{body}</p>
              </div>
            ))}
          </div>
        </GuideFigure>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Problem title="No reset email arrives" solution="Check spam, confirm the address, wait briefly, then try again. Ask your administrator to confirm the account email if needed." />
          <Problem title="The page says Link Expired" solution="Return to Forgot password and request a new link. Use the newest email only." />
          <Problem title="Reset Password stays unavailable" solution="Meet every password rule and make sure both password fields match." />
          <Problem title="The reset is rejected" solution="Request a fresh link and try a different password that has not been used before. Contact support if the fresh attempt still fails." />
        </div>
        <GuideCallout tone="warning" title="Do not send secret values to support">
          Support may need the time of the attempt and the exact error message. They do not need your password or the full reset link.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">
          Password Reset appears and you can sign in with the new password. The old password should no longer be used.
        </GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Continue to Login to your Account.</p>
      </GuideSection>
    </div>
  );
}

function Problem({ title, solution }: { title: string; solution: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p>
      <p className="mt-2 text-xs leading-5 text-gray-01">{solution}</p>
    </div>
  );
}
