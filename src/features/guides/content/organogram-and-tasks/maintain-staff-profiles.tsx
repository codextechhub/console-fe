import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function MaintainStaffProfilesArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>This task is for an authorized HR or platform administrator. The CX staff user must already exist, and the intended position should already be present in the organogram.</p>
        <GuideChecklist items={[
          "Confirm the exact CX staff account and approved employee ID.",
          "Confirm the primary position, employment type, status, and start date.",
          "Collect only profile details your organization is permitted to keep.",
          "Handle payroll bank details only when your role explicitly requires them.",
        ]} />
      </GuideSection>

      <GuideSection id="understand-profile-access" title="Understand profile access">
        <p>Colleagues may receive a brief work profile containing the person&apos;s seat, department, manager, employment type, and work email. Authorized profile viewers receive the full HR record. Payroll bank fields are withheld unless the caller has the separate payroll-view permission.</p>
        <GuideCallout tone="warning" title="Profile access is layered">Permission to view or edit a staff profile does not automatically grant access to payroll fields. Console and the backend enforce that sensitive boundary separately.</GuideCallout>
      </GuideSection>

      <GuideSection id="create-a-profile" title="Create a staff profile">
        <GuideSteps>
          <GuideStep title="Open New Staff Profile">From an eligible CX user without a profile, select <strong>Create staff profile</strong>, or open the staff-profile creation screen directly.</GuideStep>
          <GuideStep title="Choose the identity and seat">Under <strong>Seat &amp; identity</strong>, select the Staff member and Primary position, then enter the Employee ID and Job title.</GuideStep>
          <GuideStep title="Add approved personal and contact details">Complete only the authorized fields under Personal, Contact, and Next of kin.</GuideStep>
          <GuideStep title="Set employment details">Choose Employment type and Employment status, then enter Date joined and Date exited when applicable.</GuideStep>
          <GuideStep title="Save and check the seat">Create the profile. Console creates the HR record first and then writes the primary seat through assignment history.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="update-a-profile" title="Update a profile and seat">
        <GuideSteps>
          <GuideStep title="Open the full profile">Find the person from the Organisation Chart or Team Management and select <strong>Edit</strong> when your access allows it.</GuideStep>
          <GuideStep title="Change profile details">Update the approved fields. A pasted edit URL cannot turn a colleague&apos;s brief projection into an editable HR record.</GuideStep>
          <GuideStep title="Change the primary position carefully">Selecting a different Primary position creates effective-dated assignment history: the old primary assignment closes and the new one opens.</GuideStep>
          <GuideStep title="Review Position history">After saving, confirm the current seat and earlier assignments appear correctly, including PRIMARY or ACTING labels where applicable.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="danger" title="A seat change affects reporting and tasks">Moving someone to another position can change their manager, visible team area, and who can assign tasks to them. Confirm the effective structure after saving.</GuideCallout>
      </GuideSection>

      <GuideSection id="protect-payroll-details" title="Protect payroll details">
        <p>The Payroll section shows Bank name, Account name, and Account number only to an authorized viewer. Editing those values requires the separate payroll-manage permission. Do not copy bank details into ordinary notes, task descriptions, or support tickets.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["The user is not available", "Confirm the account is an existing CX staff user and does not already have a staff profile."],
            ["The intended seat is missing", "Create or activate the position in Manage Organogram before creating the profile."],
            ["The profile saved but the seat did not", "Use Assignments to set the primary position again. The profile record can succeed before the separate assignment call fails."],
            ["Payroll details are restricted", "Ask for the specific payroll-view or payroll-manage access only when the job requires it."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The staff profile shows the correct person, employee ID, employment state, primary seat, manager, and position history, while payroll fields remain visible only to authorized roles.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Reopen the Organisation Chart and confirm the person appears in the expected reporting branch.</p>
      </GuideSection>
    </div>
  );
}
