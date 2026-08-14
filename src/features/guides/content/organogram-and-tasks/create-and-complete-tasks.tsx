import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function CreateAndCompleteTasksArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Tasks are available to active CX staff. You can add your own KPI commitment. Managers can also assign tasks to people below them in the current organogram.</p>
        <GuideChecklist items={[
          "Write a clear outcome, measurable target, realistic deadline, and priority.",
          "For assigned work, confirm the correct person sits inside your reporting area.",
          "Do not put sensitive personal, payroll, security, or customer data in a task.",
        ]} />
      </GuideSection>

      <GuideSection id="understand-task-views" title="Understand task views">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["My Tasks", "Your own commitments, statuses, deadlines, and filters."],
            ["My Team", "A manager's reporting-area totals, direct reports, and drill-down path."],
            ["In progress", "An unfinished task whose deadline has not passed."],
            ["Overdue", "An unfinished task whose deadline has passed."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
        <p>Non-managers see only <strong>My Tasks</strong>. Managers can switch to <strong>My Team</strong>, open a report, and use the breadcrumb or Back action to move through their permitted reporting area.</p>
      </GuideSection>

      <GuideSection id="add-your-own-task" title="Add your own task">
        <GuideSteps>
          <GuideStep title="Open My Tasks">Go to <strong>Tasks</strong> and select <strong>My Tasks</strong>.</GuideStep>
          <GuideStep title="Open Add Task">Select <strong>Add Task</strong>. This records a personal KPI commitment and does not show an assignee picker.</GuideStep>
          <GuideStep title="Describe the commitment">Enter Title and Target. Add a helpful Description and Metric when they make success clearer.</GuideStep>
          <GuideStep title="Set time and urgency">Choose a Deadline and High, Medium, or Low Priority.</GuideStep>
          <GuideStep title="Save">Select <strong>Add Task</strong> and confirm it appears in your list with the intended deadline and status.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="assign-a-task" title="Assign a task">
        <GuideSteps>
          <GuideStep title="Open My Team">Managers select <strong>My Team</strong>. Choose <strong>Assign Task</strong> at the current reporting level, or open a report before assigning.</GuideStep>
          <GuideStep title="Choose an allowed assignee">Under <strong>Assign to</strong>, select a person from your reporting area. Console does not accept someone outside that backend-derived list.</GuideStep>
          <GuideStep title="Complete the task definition">Enter the outcome, target, deadline, and priority, then select <strong>Assign Task</strong>.</GuideStep>
          <GuideStep title="Confirm the roll-up">Check the report&apos;s own tasks and the team totals. Assigned tasks show who assigned them.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="track-and-complete" title="Track and complete work">
        <p>Use the All, In Progress, Completed, and Overdue filters to focus the list. Select a task&apos;s completion control to mark it done. Completing your own task schedules a reviewer notification after five seconds; use <strong>Undo</strong> during that window to restore the task and cancel the review request.</p>
        <GuideCallout tone="warning" title="Completion is visible accountability">Mark a task done only when the stated target is met. Managers see completion rolled up through the solid organogram hierarchy.</GuideCallout>
      </GuideSection>

      <GuideSection id="edit-or-delete" title="Edit or delete a task">
        <p>The assignee or assigner can edit a task&apos;s descriptive fields. Assignment ownership is fixed at creation. Deleting permanently removes the task and requires confirmation, so use it only for a task that should not remain in the accountability record.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["My Team is not available", "You have no current reports in the organogram, so Console keeps you on My Tasks."],
            ["A person is missing from Assign to", "They are not below you in the current solid reporting hierarchy. Ask an organogram administrator to verify the seat structure."],
            ["The task will not save", "Title, Target, and Deadline are required. An assigned task also requires an allowed assignee."],
            ["The task list will not load", "Use Retry. If it continues, report the Tasks route and error without copying task contents into the ticket."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The task appears for the correct owner with the intended target, deadline, priority, and status, and any manager view rolls it into the correct reporting area.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> When work is complete, confirm the task moves to Completed and the overdue count no longer includes it.</p>
      </GuideSection>
    </div>
  );
}
