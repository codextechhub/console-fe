import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ManageSchoolsAndBranchesArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>You need school access to browse records. Editing a school, browsing branches, adding a branch, and editing a branch are separate permissions, so the actions on your screen may differ.</p>
        <GuideChecklist items={[
          "Know the school name, status, or location you need.",
          "Confirm the correct school before changing its identity or package details.",
          "Prepare a branch administrator name and valid email before adding a branch.",
          "Use Bulk Upload only when you have the approved import file and permission.",
        ]} />
      </GuideSection>

      <GuideSection id="find-a-school" title="Find a school">
        <GuideSteps>
          <GuideStep title="Choose a status">On <strong>School Onboarding</strong>, select <strong>All Schools</strong>, <strong>Active Schools</strong>, <strong>Pending Schools</strong>, or <strong>Inactive Schools</strong>. The selected card controls the list below it.</GuideStep>
          <GuideStep title="Search the list">Use <strong>Search schools...</strong> for a school name or other supported school text. Results update after a short pause so Console does not send a request for every keystroke.</GuideStep>
          <GuideStep title="Sort or refresh">Use <strong>Sort by Name</strong>, <strong>Status</strong>, or <strong>Date</strong>. Select <strong>Refresh</strong> when you expect a recent change that is not visible yet.</GuideStep>
          <GuideStep title="Open the record">Select the school name, its row, or <strong>View Details</strong>.</GuideStep>
        </GuideSteps>
        <GuideCallout title="Filter and Export are not available yet">The disabled controls do not affect the active status cards, search, and sort options.</GuideCallout>
      </GuideSection>

      <GuideSection id="review-and-edit" title="Review and edit a school">
        <p>The <strong>Overview</strong> tab shows the school identity, package and access, primary administrator, main branch, enabled modules, capacity, and lifecycle. Check the status and school code before treating the record as operational.</p>
        <GuideSteps>
          <GuideStep title="Review the summary">Confirm Branches, Package, Enabled modules, and Activated. A pending activation is not the same as an active school.</GuideStep>
          <GuideStep title="Check administrator status">Under <strong>Primary administrator</strong>, review the email and <strong>Invite status</strong>. A sent invitation still requires the recipient to activate their account.</GuideStep>
          <GuideStep title="Edit when permitted">Select <strong>Edit School</strong>, change only the approved fields, and save. If the button is missing, ask an administrator to check your school-modification permission.</GuideStep>
          <GuideStep title="Correct the sign-in address before go-live"><strong>Sign-in Address</strong> is where the school&apos;s own users sign in, as in bright-star.xvs.codexng.com. It can be corrected while the school is still being set up, and it is fixed for good once the school goes live, because changing it would break every link and sign-in its users already have. Reserved names and addresses already in use are refused.</GuideStep>
          <GuideStep title="Bring back a suspended school">A school that never finished onboarding is suspended automatically after 90 days, and its administrators can no longer sign in. Find it under <strong>Suspended Schools</strong>, open it, and select <strong>Return to Onboarding</strong>. It goes back to Pending with a fresh window to go live. This does not make the school live - that still needs a go-live decision.</GuideStep>
          <GuideStep title="Open the audit trail">Select <strong>Audit Trail</strong> to see every recorded change to this school. The trail follows the school itself, so it survives a change of address.</GuideStep>
        </GuideSteps>
        <GuideCallout title="A school&apos;s name is not editable here">The spreadsheet importer matches a school by name when a row carries no address, so a rename would make the school&apos;s own import file create a second school.</GuideCallout>
      </GuideSection>

      <GuideSection id="decide-go-live" title="Decide a go-live request">
        <p>A school that has finished onboarding asks to be taken live, and the request waits for CodeX to answer. <strong>School Management &gt; Go-Live Requests</strong> is where those requests are.</p>
        <GuideSteps>
          <GuideStep title="Open the queue">The list opens on <strong>Pending</strong>, which is every school waiting on an answer. Change <strong>Status</strong> to see requests already decided, including what was said when one was declined before.</GuideStep>
          <GuideStep title="Read what the school said">Open the row action and choose a decision. Whatever the school wrote with its request is shown in the confirmation, so you are deciding on their words rather than on the date alone.</GuideStep>
          <GuideStep title="Approve, and the school is live">Select <strong>Approve and take live</strong>. Approval and activation are the same step: its administrators can sign in immediately and every module its package allows becomes available. There is no separate activation to remember.</GuideStep>
          <GuideStep title="Or decline, with a reason">Select <strong>Decline with a reason</strong> and say what has to change. The reason is required and is sent to the school. The school keeps everything it has done and can correct that one thing and ask again.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="warning" title="A decision can only be made once">Approve and Decline appear only on a request that is still pending. Once answered, the request is history and the school must submit a new one.</GuideCallout>
      </GuideSection>

      <GuideSection id="manage-branches" title="Manage branches">
        <GuideSteps>
          <GuideStep title="Open Branches">Select the <strong>Branches</strong> tab. Search and sort within the current school&apos;s locations.</GuideStep>
          <GuideStep title="Add a branch">Select <strong>Add Branch</strong>, complete <strong>Branch Information</strong> and <strong>Branch Admin</strong>, decide whether it is the main branch, then select <strong>Create Branch</strong>.</GuideStep>
          <GuideStep title="Inspect a branch">Select its name or <strong>View Details</strong>. Review <strong>Branch overview</strong>, <strong>Branch administrator</strong>, invite status, and <strong>Lifecycle</strong>.</GuideStep>
          <GuideStep title="Edit a branch">Select <strong>Edit Branch</strong> when permitted. Confirm the school and branch code before saving. Branch Type is optional.</GuideStep>
          <GuideStep title="Change a branch&apos;s status">Open the branch and use <strong>Change status</strong> in the <strong>Lifecycle</strong> panel. Only the moves the branch may actually make are offered. <strong>Suspend</strong> and <strong>Deactivate</strong> both stop the branch trading and can be undone with <strong>Return to service</strong>; each needs a reason, which is written into the branch&apos;s history for whoever reads it later. <strong>Close permanently</strong> cannot be undone and asks you to type the branch name first: a closed branch has to be created again as a new branch with a new code.</GuideStep>
          <GuideStep title="Hand the main designation over">On the branch you want to promote, select <strong>Make Main Branch</strong> and confirm. The branch that currently holds the designation becomes an additional branch in the same step. The action appears only on a branch that is in service and is not already the main one.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="warning" title="The main branch cannot be taken out of service">Closing, suspending, or deactivating a school&apos;s main branch is refused. Make another branch the main branch first, then take the former main branch out of service. A school with only one branch cannot take it out of service at all; deactivate the school instead.</GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "The school is not in the list", body: "Clear the search, choose All Schools, refresh, then confirm that your role can browse schools." },
            { title: "Branches is missing", body: "Branch browsing is separately permissioned. The school can be visible while its Branches tab remains hidden." },
            { title: "The page says permission denied", body: "Return to the list and ask an administrator to compare the exact school or branch permission needed for your task." },
            { title: "Details fail to load", body: "Select Try Again. If it continues, contact Support with the route pattern and safe error message, not school personal data." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The school and branch screens show the intended identity, status, main branch, administrators, package access, and lifecycle, and any approved edit remains after Refresh.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Return to School Onboarding and verify the record appears under the correct status.</p>
      </GuideSection>
    </div>
  );
}
