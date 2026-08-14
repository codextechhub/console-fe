import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function BuildWorkflowTemplateArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>A workflow template becomes the approval path for a document type and code. Design and test the path before publishing because new requests take a snapshot of its stages and approvers.</p>
        <GuideChecklist items={[
          "Write the required stages, decision owners, conditions, rejection result, and notification events.",
          "Create required roles, approver groups, dynamic rules, or organogram positions first.",
          "Choose representative requesters and documents for safe validation.",
          "Confirm whether you are changing the shared Codex version or one school's version.",
        ]} />
        <GuideCallout tone="danger" title="Do not publish an unresolvable path">A stage with no eligible approvers can stall live work. Enable auto-skip only when business policy explicitly allows that stage to disappear.</GuideCallout>
      </GuideSection>

      <GuideSection id="prepare-approver-sources" title="Prepare approver groups and dynamic rules">
        <p>In <strong>Approver Groups</strong>, a named pool can include people, roles, and positions. Role and position members resolve to effective active users when a request starts. Keep the effective count above zero for every live group.</p>
        <p><strong>Dynamic Role</strong> uses ordered conditions to choose a role from document data. Put specific conditions before the fallback and validate each referenced field and role. Deactivate a group instead of deleting it when a template still uses it; Console blocks deletion of in-use groups.</p>
      </GuideSection>

      <GuideSection id="define-template-details" title="Define template details">
        <GuideSteps>
          <GuideStep title="Open Workflow Templates">Review an existing path with the same document type and code before choosing <strong>New Template</strong>.</GuideStep>
          <GuideStep title="Enter the identity">Give the template a clear Name, exact Document type, stable Code, and useful Description.</GuideStep>
          <GuideStep title="Understand version scope">On the Codex tenant, a new shared template is available to schools. Adjusting a Codex version from a school creates that school's own version. Shared updates do not overwrite school-owned versions.</GuideStep>
          <GuideStep title="Choose notifications">Enable only the required stage activated, returned, rejected, and final approved events.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="build-stages" title="Build stages and approvers">
        <GuideSteps>
          <GuideStep title="Add the stage identity">Each stage needs a distinct Code, Label, and Kind. <strong>Approval</strong> waits for votes; <strong>Branch</strong> routes without collecting votes.</GuideStep>
          <GuideStep title="Choose an approver source">Use Role holders, Approver group, Role chosen by document, or Organogram relative to requester.</GuideStep>
          <GuideStep title="Set scope">For role, group, and dynamic-role sources, choose School, Branch, or Platform. Organogram resolution follows the requester instead.</GuideStep>
          <GuideStep title="Configure organogram resolution">Choose Direct manager, N levels up, Department head, or Specific position. The requester needs a valid active seat and reporting chain.</GuideStep>
          <GuideStep title="Set the advance rule">ANY needs one approval, QUORUM needs the stated number, and UNANIMOUS needs every eligible approver.</GuideStep>
          <GuideStep title="Set rejection and empty resolution">Choose Ends workflow or Returns to requester. New stages currently start with <strong>Auto-skip if nobody can approve</strong> on; switch it off unless skipping is an approved outcome.</GuideStep>
          <GuideStep title="Add an inclusion condition">Optional JSON decides whether this stage applies. A false condition skips the stage.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="validate-routing" title="Validate routing and resolution">
        <p>Leave <strong>Routing (advanced)</strong> blank for stages to run in order. Advanced routing requires a valid JSON array with source, destination, order, and condition. Use ENTRY or EXIT only as described in the editor.</p>
        <p>Choose a <strong>Sample requester</strong> to preview relative approvers. If directory access is unavailable, preview uses you. Test each important branch, fallback, scope, group, and organogram path with representative data.</p>
      </GuideSection>

      <GuideSection id="publish-and-revise" title="Publish and revise the template">
        <GuideSteps>
          <GuideStep title="Review every stage">Confirm ordering, approver summary, scope, advance rule, rejection result, empty-approver policy, conditions, and notifications.</GuideStep>
          <GuideStep title="Publish deliberately">Select <strong>Publish template</strong>, <strong>Update template</strong>, or <strong>Save for this school</strong> only after validation passes.</GuideStep>
          <GuideStep title="Inspect the published detail">Read the rendered Stages, Routing, Notification events, and version banner. Confirm school adoption when changing a shared path.</GuideStep>
          <GuideStep title="Revise without assuming live work changed">Existing workflow instances keep the path and approver snapshot they started with. Validate whether a new request uses the intended version.</GuideStep>
          <GuideStep title="Request retirement safely">Console does not currently expose a self-service retire control. Use the approved support path to stop new use, then monitor existing instances to completion. Do not delete supporting groups or roles while live work depends on them.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["A stage resolves to nobody", "Check active users, role assignments, group effective members, scope, delegation, organogram seats, and dynamic-rule fallback. Do not switch on auto-skip merely to clear validation."],
            ["A request skips the wrong stage", "Review the stage inclusion condition and advanced route order against the actual document fields."],
            ["A school did not receive an update", "It may run its own version. Shared changes affect only schools still using the Codex version."],
            ["Publishing creates another template", "Changing the document type or code changes the template identity. Reopen the intended template when revising in place."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The published detail shows the intended version, every route resolves, representative requests reach the correct active approvers, rejection behaves as designed, and no valid branch can stall unexpectedly.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Record the approved template version and test evidence before directing teams to use it.</p>
      </GuideSection>
    </div>
  );
}
