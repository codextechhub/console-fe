import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

/**
 * How-to article for creating, updating and reading CX staff profiles.
 *
 * Its "Read a profile as at an earlier date" section follows the As at control
 * on the staff profile page (`organogram/staff/staff-detail.tsx`).
 */
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
        <p>Colleagues may receive a brief work profile containing the person&apos;s seat, department, manager, employment type, and work email. Authorized profile viewers receive the full HR record. Every field on the profile follows Field Access, the name included: a field your role may not read is left out rather than shown blank, and a field it may read but not change is greyed on the form.</p>
        <GuideCallout tone="warning" title="Profile access is layered">Permission to view or edit a staff profile does not grant access to payroll fields. Whether a role reads or changes Bank name, Account name, and Account number is set on the Field Access screen, and a staff member always sees and edits their own.</GuideCallout>
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

      <GuideSection id="read-as-at" title="Read a profile as at an earlier date">
        <p>The <strong>As at</strong> control beside the profile heading shows the profile as it stood at the end of a day you pick, for example what someone&apos;s job title and name were on the day a document was signed.</p>
        <GuideSteps>
          <GuideStep title="Pick the day">Open the <strong>As at</strong> date and choose a day. Days before the profile&apos;s history starts are greyed out, and the note under the control says which day that is.</GuideStep>
          <GuideStep title="Read the past view">A banner confirms the date you are viewing. The profile, its account name, seat, department, line manager, Position history, and the permission and field exceptions all change to that day. Edit, Change email, Add exception, and Lift are not offered, because the past cannot be edited.</GuideStep>
          <GuideStep title="Return to today">Select <strong>Back to today</strong>, or choose today in the control.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="What a past view can show">History is recorded from the day tracking reached the profile, never guessed before it. The line manager is whoever held the manager&apos;s seat that day, and the department and division are the ones the seat sat in that day. On a day before the organisation&apos;s own history starts, those rows are left empty with a note naming the first day they are known, rather than filled in from today. An exception shows without the comparison with the person&apos;s roles, because role switches keep no history. A photograph replaced since is not shown. Field Access applies to the past exactly as it does to today.</GuideCallout>
      </GuideSection>

      <GuideSection id="protect-payroll-details" title="Protect payroll details">
        <p>The Payroll section shows each of Bank name, Account name, and Account number only when your role may read it, and leaves the section out when none is left. A field your role may read but not change is greyed and is never sent when you save. Do not copy bank details into ordinary notes, task descriptions, or support tickets.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["The user is not available", "Confirm the account is an existing CX staff user and does not already have a staff profile."],
            ["The intended seat is missing", "Create or activate the position in Manage Organogram before creating the profile."],
            ["The profile saved but the seat did not", "Use Assignments to set the primary position again. The profile record can succeed before the separate assignment call fails."],
            ["Payroll details are missing or greyed", "Your role does not read or change those fields. Ask a Field Access administrator for a switch or a one-person exception only when the job requires it."],
            ["The As at calendar greys out the day you need", "The profile's history starts later than that day, so there is nothing recorded for it. The note under the control names the first day you can pick."],
            ["An exception panel says its history starts later", "Exceptions keep their own history, which can start after the profile's. Pick the day the panel names, or a later one."],
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
