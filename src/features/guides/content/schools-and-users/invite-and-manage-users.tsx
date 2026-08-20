import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function InviteAndManageUsersArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>The Users menu separates <strong>CX Users</strong> from <strong>School Users</strong>. Viewing accounts, inviting CX users, editing profiles, and changing account status use separate permissions.</p>
        <GuideChecklist items={[
          "Confirm whether the person is a CX user or belongs to a school.",
          "For a new CX user, prepare their identity, role, phone, gender, and approved organogram position.",
          "Check that the email is correct and not already registered.",
          "Do not promise access before the request is approved and the invitation is activated.",
        ]} />
      </GuideSection>

      <GuideSection id="browse-users" title="Browse users">
        <GuideSteps>
          <GuideStep title="Choose the correct list">Open <strong>CX Users</strong> for platform staff or <strong>School Users</strong> for school accounts.</GuideStep>
          <GuideStep title="Choose a lifecycle tab">Use <strong>Members</strong> for current accounts, <strong>Invites</strong> for invitation progress, and <strong>Drafts</strong> for incomplete CX hires.</GuideStep>
          <GuideStep title="Narrow the results">Use Search, <strong>Filters</strong>, and the sort controls. School-user filters can include school; CX filters can include role and account status.</GuideStep>
          <GuideStep title="Refresh after a change">Select <strong>Refresh</strong> when an approval, activation, unlock, or suspension has just completed.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="invite-a-cx-user" title="Invite a CX user">
        <GuideSteps>
          <GuideStep title="Open the form">From CX Users, select <strong>Add New CX User</strong>, then <strong>Create new user</strong>.</GuideStep>
          <GuideStep title="Enter the user group">Complete First Name, Last Name, Email Address, Role Title, Phone Number, and Gender.</GuideStep>
          <GuideStep title="Assign the seat">Choose <strong>Position (seat)</strong>. Console fills Job Title and shows the derived Division, Department, and Team. Add optional HR details if approved.</GuideStep>
          <GuideStep title="Submit or park the record">Select <strong>Submit for Approval</strong> when complete. Use <strong>Save as draft</strong> only when the identity is known but the role, seat, or remaining details still need work.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="warning" title="Submission does not always send an invitation immediately">A CX-staff request can enter the platform-user creation approval workflow. When that happens, the user receives an invitation only after approval. Track the request under <strong>My Submissions</strong>.</GuideCallout>
      </GuideSection>

      <GuideSection id="track-and-manage-access" title="Track and manage access">
        <GuideSteps>
          <GuideStep title="Review invitations">Open the <strong>Invites</strong> tab to understand the current status. Resend only when the address is correct and the earlier invitation should no longer be used.</GuideStep>
          <GuideStep title="Finish a draft">Open <strong>Drafts</strong>, select <strong>Resume</strong>, complete the missing role or position, and submit it for approval.</GuideStep>
          <GuideStep title="Edit a CX user">From Members, choose <strong>Edit</strong> when permitted. Changing a profile does not grant permissions outside the assigned role.</GuideStep>
          <GuideStep title="Resolve status problems">An authorized administrator can <strong>Suspend</strong> an active user, <strong>Reactivate</strong> a suspended user, or <strong>Unlock</strong> a locked user. Never change status before confirming the person and reason.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="open-a-staff-profile" title="Open a staff profile">
        <p>For a CX member, select <strong>View Details</strong> to open the staff profile connected to that user. The profile explains their organogram position and employment context. For a school user, <strong>View Details</strong> opens the school-user detail panel instead.</p>
        <GuideCallout title="An account and a staff profile answer different questions">Use Users for access and invitation state. Use the staff profile for position, reporting structure, and employment details.</GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Add New CX User is missing", body: "Your account may view the team without having invitation permission. Ask an administrator to check Invite Team Member." },
            { title: "Submit for Approval is disabled", body: "Complete the required identity, role, phone, gender, and position fields, and resolve any validation message." },
            { title: "The invitation has not arrived", body: "First check whether the request is still awaiting approval. Then confirm the email and invitation status before resending." },
            { title: "View Details cannot find a profile", body: "The CX user may not yet have a connected staff profile. Check their activation and position, then contact Support with safe identifiers only when needed." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The account appears in the expected Drafts, My Submissions, Invites, or Members state, and its role, position, school relationship, and account status match the approved setup.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> If access still differs, compare the assigned role and permission rather than copying another user&apos;s URL.</p>
      </GuideSection>
    </div>
  );
}
