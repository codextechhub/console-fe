import { CheckCircle2, CircleAlert, PackageCheck, School, ShieldCheck, UsersRound } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideFigure, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function CreateAndConfigureSchoolArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>This task is for a platform administrator who can onboard schools. Prepare the school&apos;s legal and contact details, the first branch and its administrator, the primary school administrator, and the approved package limits.</p>
        <GuideChecklist items={[
          "Confirm the school name, ownership type, address, term structure, and currency.",
          "Confirm which branch is the main branch and use working administrator email addresses.",
          "Agree the package plan, enabled modules, capacity limits, and subscription expiry date.",
          "Check that administrator emails do not already belong to another account.",
        ]} />
        <GuideCallout tone="warning" title="One submission creates several records">The final Submit action creates the school, its branches and administrator records, package access, and invitations. Review every step before submitting. The walkthrough opens each wizard view so its guidance matches the visible section and preserves what you have entered, but it never reads, fills, validates, or submits a field.</GuideCallout>
      </GuideSection>

      <GuideSection id="add-school-details" title="Add school details">
        <GuideSteps>
          <GuideStep title="Open School Management">Select <strong>Add New School</strong>, then <strong>Add Manual</strong>. The form opens at <strong>Add a New School</strong>.</GuideStep>
          <GuideStep title="Enter the identity">Complete <strong>School Name</strong>, <strong>School Slug</strong>, <strong>School Address</strong>, and <strong>Ownership Type</strong>. The slug becomes a stable part of the school&apos;s Console address, so use the agreed value.</GuideStep>
          <GuideStep title="Set the academic defaults">Complete <strong>Term Structure</strong> and <strong>Currency</strong>. Add the website, motto, and registration ID when available, then select <strong>Continue</strong>.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="add-branches" title="Add branches">
        <p>At least one branch is required and exactly one branch must be marked as the main branch.</p>
        <GuideSteps>
          <GuideStep title="Describe the location">Enter <strong>Branch Name</strong>, <strong>Branch Type</strong>, country, and the available address, email, and state information.</GuideStep>
          <GuideStep title="Add the branch administrator">Enter the branch administrator&apos;s first name, last name, and email. Their phone number is optional.</GuideStep>
          <GuideStep title="Check the main branch">Keep <strong>Main Branch</strong> on for the primary location. If you select <strong>Add Another Branch</strong>, verify that only the intended location remains the main branch, then select <strong>Continue</strong>.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="add-school-admin" title="Add the school administrator">
        <p>Under <strong>Create School Admin</strong>, enter the primary administrator&apos;s first name, last name, email address, and optional phone number. This person manages the school as a whole, while branch administrators are tied to their locations.</p>
        <GuideCallout title="Use the right person and email">The primary administrator will receive an invitation after the school is created. Confirm the address with the school before you continue.</GuideCallout>
      </GuideSection>

      <GuideSection id="configure-package" title="Configure the package">
        <GuideSteps>
          <GuideStep title="Select the package plan">Choose the approved <strong>Package Plan</strong>. Do not guess a commercial entitlement.</GuideStep>
          <GuideStep title="Choose enabled modules">Select the approved <strong>Enabled Modules</strong>. Console adds required dependencies and tells you which modules were included.</GuideStep>
          <GuideStep title="Set limits and expiry">Enter the student, teacher, and administrator capacities and choose <strong>Subscription Expires</strong>.</GuideStep>
          <GuideStep title="Review, then submit">Use <strong>Back</strong> to correct earlier details. Select <strong>Submit</strong> only when the complete setup is approved.</GuideStep>
        </GuideSteps>
        <GuideFigure title="What the final setup controls" caption="The package choices determine which capabilities and capacity the school receives.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: School, title: "School and branches", body: "Identity, location, academic defaults, and main-branch designation." },
              { icon: UsersRound, title: "Administrators", body: "Primary and branch administrator records and invitations." },
              { icon: PackageCheck, title: "Package access", body: "Plan, modules, and any module dependencies." },
              { icon: ShieldCheck, title: "Capacity and expiry", body: "Student, teacher, administrator limits, and subscription date." },
            ].map(({ icon: Icon, title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><Icon className="size-5 text-primary" /><p className="mt-3 text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
          </div>
        </GuideFigure>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Continue does not move forward", body: "Check the required fields on the current step. Email addresses must be valid, and one branch must be marked as main." },
            { title: "A module was added automatically", body: "The selected module depends on another capability. Console adds that dependency so the school is not created with unusable access." },
            { title: "A package option is missing", body: "Stop and confirm the approved package catalogue. Do not substitute a different plan just to finish onboarding." },
            { title: "Submission fails", body: "Keep the form open, note the safe error message, and check for a duplicate slug or administrator email before contacting Support." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">Console shows <strong>School created successfully</strong>, sends the administrator invitations, and returns you to School Onboarding with the pending-school filter selected.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Open the school record and verify its main branch, package, enabled modules, capacities, and invitation status.</p>
      </GuideSection>
    </div>
  );
}
