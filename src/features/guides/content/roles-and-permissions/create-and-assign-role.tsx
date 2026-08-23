import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function CreateAndAssignRoleArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>This task is for a platform administrator who can view and define roles and assign them to CX staff. Agree the job responsibility and minimum access before opening the form.</p>
        <GuideChecklist items={[
          "Confirm the role name, purpose, owner, and whether it should be active.",
          "List the exact tasks the role must perform and exclude unrelated access.",
          "Review existing roles and permission groups before creating another one.",
          "Confirm the intended CX user before assigning or changing a role.",
        ]} />
        <GuideCallout tone="warning" title="A role can grant broad platform access">Use the least access needed for the job. Creating a role and assigning it are separate consequential actions, and this guide&apos;s walkthrough never performs either action for you.</GuideCallout>
      </GuideSection>

      <GuideSection id="understand-role-access" title="Understand role access">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Role", "A named set of platform responsibilities assigned to a CX user."],
            ["Permission", "One allowed action, written as a module.resource.action key."],
            ["Permission group", "A reusable bundle of related permissions that can be attached to roles."],
            ["Assignment", "The link that gives one user a role. Other active role assignments can remain in place."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="create-the-role" title="Create or edit the role">
        <GuideSteps>
          <GuideStep title="Review existing roles">On <strong>Roles Management</strong>, use All Roles, Active Roles, System Roles, Locked Roles, and <strong>Search roles...</strong>. Do not duplicate an existing role.</GuideStep>
          <GuideStep title="Open Create New Role">Select <strong>Add New Role</strong>. Enter <strong>Role Name</strong>, an explanatory Description, and the intended Status.</GuideStep>
          <GuideStep title="Choose permission groups">Search <strong>Permission Groups</strong> and select only groups whose complete contents match the job.</GuideStep>
          <GuideStep title="Add individual permissions">Use <strong>Individual Permissions</strong> only for required access not already represented by the selected groups.</GuideStep>
          <GuideStep title="Edit from the current access set">When editing an existing role, record its current groups, direct permissions, status, affected users, and whether it is protected. Compare every addition and removal with the approved change before saving.</GuideStep>
          <GuideStep title="Review and save">Check the selected counts and permission keys. Select <strong>Create Role</strong> or <strong>Save changes</strong> only after the full access set is approved.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="danger" title="Editing changes every active assignment">A saved permission or group change affects every user who holds the role. Confirm the complete resulting access set and the rollback path, not only the boxes that changed.</GuideCallout>
      </GuideSection>

      <GuideSection id="assign-or-change-a-role" title="Assign or change a role">
        <GuideSteps>
          <GuideStep title="Open assignments">Go to <strong>Platform User Role Assignments</strong> and select <strong>Assign Role</strong>.</GuideStep>
          <GuideStep title="Select the user and role">Choose the CX staff member, then an active role. The Super Admin role cannot be assigned here.</GuideStep>
          <GuideStep title="Handle an existing role deliberately">If the user has active roles, leave them unchanged to add another role, or select <strong>Revoke former role</strong> to replace one. The former role is revoked only after the new assignment succeeds.</GuideStep>
          <GuideStep title="Confirm the result">Select <strong>Assign Role</strong> or <strong>Change Role</strong>, then search for the user and review <strong>Assignment Details</strong>.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="revoke-an-assignment" title="Revoke an assignment">
        <p>From an active non-super-admin assignment, choose <strong>Revoke</strong>. Enter the required written justification and confirm only after checking the user, role, and effect on their work.</p>
        <GuideCallout tone="danger" title="Revocation can stop current work">Before revoking, confirm whether the user has another active role that preserves the access they still need. Super Admin ownership uses the separate protected transfer flow.</GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["A permission is not available", "Confirm it is active and that your search matches its full key or description."],
            ["The user already has the role", "Duplicate active assignments are blocked. Review their existing assignments instead."],
            ["Existing roles could not be checked", "Refresh and retry. Assignment remains disabled because adding access without seeing current roles is unsafe."],
            ["Super Admin cannot be changed", "Use Transfer Super Admin. It has a separate ownership and confirmation boundary."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The role appears with the intended status and permission count, and the user&apos;s active assignment shows the correct role, assigner, and time.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Ask the user to sign in again when needed and confirm only the expected actions are visible.</p>
      </GuideSection>
    </div>
  );
}
