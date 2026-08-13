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
        </GuideSteps>
      </GuideSection>

      <GuideSection id="manage-branches" title="Manage branches">
        <GuideSteps>
          <GuideStep title="Open Branches">Select the <strong>Branches</strong> tab. Search and sort within the current school&apos;s locations.</GuideStep>
          <GuideStep title="Add a branch">Select <strong>Add Branch</strong>, complete <strong>Branch Information</strong> and <strong>Branch Admin</strong>, decide whether it is the main branch, then select <strong>Create Branch</strong>.</GuideStep>
          <GuideStep title="Inspect a branch">Select its name or <strong>View Details</strong>. Review <strong>Branch overview</strong>, <strong>Branch administrator</strong>, invite status, and <strong>Lifecycle</strong>.</GuideStep>
          <GuideStep title="Edit a branch">Select <strong>Edit Branch</strong> when permitted. Confirm the school and branch code before saving.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="warning" title="Main branch changes affect how the school is represented">A school should have one intended main location. Confirm the designation before creating or editing a branch.</GuideCallout>
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
