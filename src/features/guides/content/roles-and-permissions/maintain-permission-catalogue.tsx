import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function MaintainPermissionCatalogueArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>The permission catalogue defines the access vocabulary used by roles and assignments. Catalogue changes can affect many users, so confirm the product capability, naming contract, sensitivity, dependencies, and rollout plan first.</p>
        <GuideChecklist items={[
          "Search the registry and catalogue parts to prevent duplicate names or keys.",
          "Confirm the backend authorization check exists before exposing a new permission.",
          "Agree sensitivity and restricted status with the security owner.",
          "Map required dependencies and affected roles before editing or deleting anything.",
        ]} />
      </GuideSection>

      <GuideSection id="understand-the-vocabulary" title="Understand the vocabulary">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Module", "The broad product area at the start of a permission key."],
            ["Resource", "The protected object or workflow inside a module."],
            ["Action", "The controlled operation, such as view, create, update, approve, or manage."],
            ["Permission", "The composed module.resource.action key used by authorization."],
            ["Dependency", "Another permission that must also be granted when a permission is used."],
            ["Permission group", "A reusable bundle attached to roles for consistent access."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="maintain-catalogue-parts" title="Maintain catalogue parts">
        <GuideSteps>
          <GuideStep title="Start with the existing lists">Review <strong>Permission Modules</strong>, <strong>Permission Resources</strong>, and <strong>Permission Actions</strong>. Search and check status before adding a record.</GuideStep>
          <GuideStep title="Create in dependency order">Create the module first, then its resource, then reuse or create the action vocabulary. Keep names stable because they compose permission keys.</GuideStep>
          <GuideStep title="Edit cautiously">Use Edit for approved metadata or status changes. A system or referenced item may have protections that prevent unsafe deletion.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="create-a-permission" title="Create a permission">
        <GuideSteps>
          <GuideStep title="Open Create Permission">From <strong>Permission Registry</strong>, select <strong>Add Permission</strong>.</GuideStep>
          <GuideStep title="Compose the key">Select Module, then a Resource from that module, then Action. Confirm the <strong>Preview key</strong> is the exact approved module.resource.action value.</GuideStep>
          <GuideStep title="Classify it">Write a useful Description, choose Normal, Sensitive, or Critical, decide whether it is Restricted, and choose whether it starts Active.</GuideStep>
          <GuideStep title="Create only after backend enforcement exists">Select <strong>Create Permission</strong> only when the server checks this key. A frontend label alone does not secure an endpoint.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="danger" title="Never create security theatre">A permission that only hides a frontend button is not authorization. The backend must reject unauthorized requests and enforce tenant or entity scope.</GuideCallout>
      </GuideSection>

      <GuideSection id="manage-dependencies" title="Manage dependencies">
        <GuideSteps>
          <GuideStep title="Inspect the graph">On <strong>Permission Dependencies</strong>, search and use <strong>View Chain</strong> before changing a relation.</GuideStep>
          <GuideStep title="Add a requirement">Select <strong>Add Dependency</strong>, choose Permission and <strong>Depends On</strong>, then check the Preview.</GuideStep>
          <GuideStep title="Avoid invalid relations">A permission cannot depend on itself, duplicate an existing relation, or create a circular dependency.</GuideStep>
          <GuideStep title="Remove only with impact review">Removing a dependency changes assignment validation. Confirm affected roles and users before selecting Remove.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="manage-permission-groups" title="Manage permission groups">
        <GuideSteps>
          <GuideStep title="Review existing bundles">Use All Groups, Active, System Groups, Custom Groups, and <strong>Search groups...</strong>.</GuideStep>
          <GuideStep title="Create a clear bundle">Select <strong>Add New Group</strong>, enter Group Name and Description, choose Active status, then select the exact permissions.</GuideStep>
          <GuideStep title="Understand reuse">Any role using the group receives its permission set. Review affected roles before editing a shared group.</GuideStep>
          <GuideStep title="Protect system groups">System groups cannot be deleted through the custom-group path. Do not recreate them as ordinary custom groups.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["A resource list is empty", "Select a module first and confirm that active resources exist for it."],
            ["The key already exists", "Return to Permission Registry and edit the existing record if the requested change is valid."],
            ["A dependency is rejected", "Check for self-reference, duplication, and circular chains, then inspect View Chain."],
            ["Users still lack access", "Confirm the permission is active, included in their role or group, all dependencies are present, and the backend checks the same key."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The composed key, status, sensitivity, restrictions, dependencies, and group memberships match the approved contract, and a permitted and denied backend request both behave correctly.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Review affected roles and assignments after every catalogue or group change.</p>
      </GuideSection>
    </div>
  );
}
