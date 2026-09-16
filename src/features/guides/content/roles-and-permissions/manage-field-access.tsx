import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

/**
 * How-to article for the Field Access screen and one-person field exceptions.
 *
 * It describes switches as stored settings. Console screens do not read the
 * switches, so the article never says a saved switch hides or greys a field;
 * it must change in the same release that makes screens obey them.
 */
export default function ManageFieldAccessArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>This task is for a platform administrator who can view roles and holds a Field Access permission. Viewing switches needs the Field Access view permission; changing them needs the Field Access manage permission.</p>
        <GuideChecklist items={[
          "Agree which role needs a different field setting and the job reason for it.",
          "Check whether the field is marked Sensitive before opening it for a role.",
          "For a one-person exception, confirm the person, the field, the reason, and when it should end.",
        ]} />
        <GuideCallout tone="warning" title="What saving does today">Saving stores the switch and records it in the audit trail. Console screens do not read these switches, so a saved change does not hide or grey a field on any screen.</GuideCallout>
      </GuideSection>

      <GuideSection id="understand-switches" title="Understand Read, Write, and defaults">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Read", "Whether the role may read the field."],
            ["Write", "Whether the role may change the field. Write always includes Read, so turning Write on turns Read on, and turning Read off turns Write off."],
            ["Default", "No setting is saved for this role. Normal fields default to Read and Write on. Fields marked Sensitive default to both off."],
            ["Set for role", "The role has its own saved setting, which replaces the default until you reset it."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
        <p className="mt-3">Some fields cannot be changed by anyone, such as values issued by a provider. They show a Read switch and no Write switch. A person with several roles receives the most generous setting any of those roles gives.</p>
      </GuideSection>

      <GuideSection id="change-a-role" title="Change a role's switches">
        <GuideSteps>
          <GuideStep title="Open Field Access">In the sidebar, open <strong>Roles</strong> and select <strong>Field Access</strong>, or search for <strong>View field access</strong>.</GuideStep>
          <GuideStep title="Choose the role">Select the <strong>Role</strong>. Choosing another role discards switches you have not saved.</GuideStep>
          <GuideStep title="Narrow to the fields">Type or pick a module in the <strong>Module</strong> box. The <strong>Resource</strong> box opens once a module is chosen; pick a resource there and its fields appear. Only modules and resources that carry fields are offered, and choosing another module clears the resource. Use <strong>Search field labels</strong> to find a field inside that resource. Fields are grouped under headings such as Banking or Contact.</GuideStep>
          <GuideStep title="Set Read and Write">Turn the <strong>Read</strong> and <strong>Write</strong> switches for each field. A changed field shows <strong>Unsaved</strong> until you save, and returning it to its saved value clears that badge.</GuideStep>
          <GuideStep title="Save the changes">Select <strong>Save changes</strong>. Only the fields you changed are sent, and the list is reloaded from the saved result. You see <strong>Field access saved.</strong> when it succeeds.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="A switch change needs no approval">Saving stores the change with no request to review. You may change a role you hold yourself, and a field you cannot read yourself. Every change is audited.</GuideCallout>
      </GuideSection>

      <GuideSection id="reset-to-default" title="Reset a field to its default">
        <p>Select <strong>Reset to default</strong> on a field marked <strong>Set for role</strong>, then <strong>Save changes</strong>. The role&apos;s own setting is removed and the field returns to its default: open for a normal field, closed for a Sensitive one. The reset is audited like any other change. On a field already at its default, the control is disabled.</p>
      </GuideSection>

      <GuideSection id="who-can-change" title="Who can change switches">
        <p>Anyone with the Field Access view permission sees the switches greyed and cannot change them. The Field Access manage permission unlocks the switches, Reset to default, and Save.</p>
        <GuideCallout tone="danger" title="The manage permission is restricted">Adding Field Access manage to a role you hold goes through a role change request, because otherwise someone who can edit roles could give themselves the power to open sensitive fields with nobody approving. It cannot be added through a permission group, and a role carrying it can only be assigned by someone who holds it.</GuideCallout>
      </GuideSection>

      <GuideSection id="field-exceptions" title="Add or lift a field exception">
        <p>A field exception changes one field for one person, on top of their roles. It appears as <strong>Field exceptions</strong> beside permission exceptions on a school user&apos;s details and on a staff profile, for anyone who can view roles and view user exceptions. For a school user, the field list is that school&apos;s own.</p>
        <GuideSteps>
          <GuideStep title="Open Add exception">In <strong>Field exceptions</strong>, select <strong>Add exception</strong>. The control is never offered on your own profile.</GuideStep>
          <GuideStep title="Choose the field">Pick a module in the <strong>Module</strong> box, then a resource in the <strong>Resource</strong> box. The <strong>Field</strong> box appears once both are chosen; search it for the field.</GuideStep>
          <GuideStep title="Choose access and mode">Choose <strong>Read</strong> or <strong>Write</strong>, then <strong>Allow</strong> or <strong>Deny</strong>. Write is unavailable for a field nobody can change.</GuideStep>
          <GuideStep title="Give a reason and an optional expiry">Enter the required <strong>Reason</strong>. Set <strong>Expires on</strong> when the need has an end date, or leave it empty.</GuideStep>
          <GuideStep title="Apply">Select <strong>Apply exception</strong>. If the person already has an exception for the same field and access, the button reads <strong>Replace exception</strong> and the new one replaces the old.</GuideStep>
        </GuideSteps>
        <p className="mt-3">Each exception explains how it compares with the person&apos;s roles, for example that the role does not allow Read and Read is allowed for this person until a date. To remove one, select <strong>Lift</strong> and confirm <strong>Lift exception</strong>.</p>
        <GuideCallout tone="warning" title="A denial wins">A Deny exception beats every role and any Allow exception. Allow Write also allows Read, and Deny Read also denies Write. Creating, replacing, and lifting exceptions are all audited, and an expired exception simply stops counting.</GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["The switches are greyed", "Your roles give Field Access view but not manage. Ask for manage through a role change request."],
            ["No fields match this selection", "Clear Search field labels. Only fields developers have registered appear, so a field that is not listed cannot be restricted yet."],
            ["Write has no switch", "The field is not changeable by anyone, so only Read can be set."],
            ["Add exception is missing", "You are on your own profile, or your roles let you view user exceptions but not manage them."],
            ["A saved change shows nothing different on screen", "Expected. Console screens do not read these switches, so no field is hidden or greyed by saving one."],
            ["Save failed", "Nothing was stored. Read the error, keep your unsaved switches, and try again."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">Each field you changed shows the intended Read and Write state with no Unsaved badge, a reset field shows Default, and any field exception lists the right field, access, mode, reason, and expiry.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Check the audit trail when you need proof of who changed a switch and when.</p>
      </GuideSection>
    </div>
  );
}
