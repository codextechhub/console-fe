import { CheckCircle2, CircleAlert, KeyRound, Link2, MailCheck, ShieldCheck } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideFigure, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ActivateAndSignInArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Your administrator must create or invite your account first. Console sends a personal activation link to the email address on that account.</p>
        <GuideChecklist items={[
          "Open the invitation from an email account only you control.",
          "Check that the invitation shows your expected name and email address.",
          "Prepare a password with at least 12 characters, uppercase and lowercase letters, a number, and a special character.",
          "Never forward your invitation or share its link with another person.",
        ]} />
        <GuideCallout tone="warning" title="Invitation links are personal">
          The link is the key to activating your account. If it is exposed, expired, or shows the wrong person, stop and ask your administrator for a new invitation.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="activate-your-account" title="Activate your account">
        <GuideSteps>
          <GuideStep title="Open the invitation link">Use the activation link from your Console invitation. Wait while Console verifies it.</GuideStep>
          <GuideStep title="Confirm Name and Email">The activation page shows both fields as read-only. If either is wrong, do not continue.</GuideStep>
          <GuideStep title="Enter Password and Confirm Password">Follow the live password checklist. Both password entries must match before activation becomes available.</GuideStep>
          <GuideStep title="Select Activate Account">Console confirms that the account was activated. Select Continue to Login, or wait for the automatic return to the login page.</GuideStep>
        </GuideSteps>
        <GuideFigure title="A safe activation path" caption="Console verifies the link before it accepts a password. Activation does not grant extra roles or permissions.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Link2, title: "Verify link", body: "Use the personal invitation and confirm its identity." },
              { icon: KeyRound, title: "Set password", body: "Meet every displayed password requirement." },
              { icon: MailCheck, title: "Activation confirmed", body: "Continue to the standard Console login." },
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

      <GuideSection id="sign-in" title="Sign in">
        <GuideSteps>
          <GuideStep title="Enter Email">Use the same email address shown during activation.</GuideStep>
          <GuideStep title="Enter Password">Enter the password you created. Do not paste passwords into support tickets or chat messages.</GuideStep>
          <GuideStep title="Select Login">A successful login opens Home, or returns you to the protected Console page that originally sent you to login.</GuideStep>
        </GuideSteps>
        <GuideCallout title="What you can see after login">
          Your account, roles, permissions, current entity, and branch context determine which areas and actions appear. Signing in confirms identity, but it does not bypass those access rules.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Problem title="The invite says Link Expired" solution="Ask your administrator for a new invitation. An old link cannot be repaired or reused." />
          <Problem title="The name or email is wrong" solution="Stop before activation and ask your administrator to correct the account." />
          <Problem title="Activate Account stays unavailable" solution="Check every password rule and make sure Password and Confirm Password match." />
          <Problem title="Login is rejected" solution="Check the email and password. If you no longer know the password, use Forgot password instead of repeatedly guessing." />
        </div>
        <GuideCallout tone="danger" title="Stop repeated attempts">
          Repeated failed sign-ins may lock an account under your organization&apos;s security settings. Use account recovery or contact your administrator when the credentials are uncertain.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">
          Console accepts your login and opens Home. You can see your account menu and the areas allowed by your assigned access.
        </GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Continue with Get started with Console for a guided tour.</p>
        <p className="flex items-center gap-2 text-xs text-gray-01"><ShieldCheck className="size-4" /> Keep the invitation and password out of screenshots and support tickets.</p>
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
