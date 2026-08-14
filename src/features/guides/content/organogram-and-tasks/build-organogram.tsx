import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function BuildOrganogramArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>This task is for a platform administrator who can manage the organogram. Agree the reporting structure before entering it, because positions, staff seats, task assignment, and manager roll-ups depend on it.</p>
        <GuideChecklist items={[
          "List the approved divisions, departments, and teams with distinct names and codes.",
          "Define every position, its capacity, and its solid-line manager.",
          "Separate true reporting lines from advisory or dotted-line relationships.",
          "Check which existing staff and assignment histories could be affected by a change.",
        ]} />
        <GuideCallout tone="warning" title="Build from the top down">Create org units before positions, then assign staff seats. Deleting or moving a parent can be blocked while children, positions, or assignment history still depend on it.</GuideCallout>
      </GuideSection>

      <GuideSection id="understand-the-structure" title="Understand the structure">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Division", "The top-level org unit. It has no parent."],
            ["Department", "A unit inside a division."],
            ["Team", "A unit inside a department. Positions are attached here."],
            ["Position", "A seat with a title, code, capacity, and optional solid-line manager."],
            ["Solid line", "The main Reports to relationship used by the chart and task hierarchy."],
            ["Matrix line", "A separate dotted relationship that does not replace the solid manager."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="create-org-units" title="Create org units">
        <GuideSteps>
          <GuideStep title="Open Manage Organogram">Go to <strong>Organogram</strong>, select <strong>Manage</strong>, and stay on <strong>Org Units</strong>.</GuideStep>
          <GuideStep title="Create the division">Select <strong>New Org Node</strong>, choose <strong>Division</strong>, and enter the approved Name and Code. A division has no parent.</GuideStep>
          <GuideStep title="Add departments">Create another org node, choose <strong>Department</strong>, then select its Division.</GuideStep>
          <GuideStep title="Add teams">Choose <strong>Team</strong>, then select its Division and Department. The department list follows the selected division.</GuideStep>
          <GuideStep title="Review the hierarchy">Expand the rows and confirm every department and team appears under the intended parent before adding seats.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="create-positions" title="Create positions and reporting lines">
        <GuideSteps>
          <GuideStep title="Open Positions">Select the <strong>Positions</strong> tab, then <strong>New Position</strong>.</GuideStep>
          <GuideStep title="Define the seat">Enter a distinct Title and Code, then choose the Division, Department, and Team in order.</GuideStep>
          <GuideStep title="Set the solid manager">Use <strong>Reports to (solid)</strong> for the position&apos;s primary reporting line. Leave it empty only for a genuine root seat.</GuideStep>
          <GuideStep title="Set capacity and status">Enter Headcount for the number of available holders and confirm whether the position starts Active.</GuideStep>
          <GuideStep title="Review the position tree">Confirm the seat appears beneath the correct solid-line manager and shows the expected filled and total capacity.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="danger" title="Reporting lines control more than the picture">The solid hierarchy bounds team task visibility and who a manager can assign work to. Do not use a convenient reporting line when the approved manager is different.</GuideCallout>
      </GuideSection>

      <GuideSection id="add-matrix-lines" title="Add matrix lines">
        <GuideSteps>
          <GuideStep title="Open Matrix">Select the <strong>Matrix</strong> tab and choose <strong>New Matrix Line</strong>.</GuideStep>
          <GuideStep title="Choose both positions">Select the Position and the position it <strong>Dotted-reports to</strong>. They must be different.</GuideStep>
          <GuideStep title="Explain the relationship">Add a short Relationship label so readers understand why the dotted line exists.</GuideStep>
          <GuideStep title="Check the chart">On <strong>Organisation Chart</strong>, switch to <strong>Positions</strong> and enable <strong>Matrix lines</strong> when you need to inspect dotted relationships.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="review-the-chart" title="Review the chart">
        <p>Use <strong>People</strong> for current holders and <strong>Positions</strong> for seats. Search by name, email, seat, department, or code; filter by org unit; expand or collapse branches; and use the zoom controls without changing the stored structure.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["A department or team has no parent option", "Create the required division first. For a team, the selected division must also contain a department."],
            ["A position cannot be created", "Confirm that a complete Division, Department, and Team chain exists and that Title and Code are present."],
            ["A node or position cannot be deleted", "Remove or re-parent dependent children first. Seats with assignment history are protected from deletion."],
            ["The task hierarchy looks wrong", "Check the position's solid Reports to line. Matrix lines do not determine task assignment bounds."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The Org Units and Positions trees match the approved hierarchy, solid managers are correct, matrix lines are separately labelled, and the Organisation Chart shows the expected seats, holders, and vacancies.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Ask each affected manager to confirm their reporting area before relying on team task roll-ups.</p>
      </GuideSection>
    </div>
  );
}
