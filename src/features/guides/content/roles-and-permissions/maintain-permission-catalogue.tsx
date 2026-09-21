import { CheckCircle2, CircleAlert } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function MaintainPermissionCatalogueArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>The permission catalogue is defined and changed in backend code. The console gives administrators a readable view of that catalogue for role design, assignments, and personal exceptions.</p>
        <GuideChecklist items={[
          "Use the catalogue to understand available access before creating or changing a custom role.",
          "Check sensitivity and restricted status before requesting a grant.",
          "Use a permission group only when its complete bundle matches the person's job.",
          "Ask the backend team to add or change a permission definition, dependency, default group, or default role.",
        ]} />
      </GuideSection>

      <GuideSection id="understand-the-vocabulary" title="Understand the vocabulary">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["Module", "The broad product area, such as Finance or Procurement."],
            ["Resource", "The protected record or workflow inside a module."],
            ["Action", "The controlled operation, such as view, create, update, approve, or manage."],
            ["Permission", "A readable access choice backed by a stable internal key."],
            ["Dependency", "Another permission that must also be granted when a permission is used."],
            ["Permission group", "A backend-defined bundle that can be attached to a custom role."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="review-catalogue-parts" title="Review catalogue parts">
        <GuideSteps>
          <GuideStep title="Start with modules">Open <strong>Permission Modules</strong> to see the product areas represented in access control.</GuideStep>
          <GuideStep title="Narrow to resources">Open <strong>Permission Resources</strong> and filter by module to see the things protected within that area.</GuideStep>
          <GuideStep title="Review action wording">Open <strong>Permission Actions</strong> to understand the operations used across resources.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="review-permissions" title="Review permissions">
        <GuideSteps>
          <GuideStep title="Use the readable catalogue">Open <strong>Permission Registry</strong>. Each row names the permission, module, and resource in ordinary language.</GuideStep>
          <GuideStep title="Check consequence">Sensitivity shows the likely impact. Restricted permissions require the role-change approval flow and cannot be added as a personal grant.</GuideStep>
          <GuideStep title="Build custom roles from this list">Create and edit custom roles from <strong>Platform Roles</strong>. The permission definition itself remains backend-owned.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="review-dependencies" title="Review dependencies">
        <GuideSteps>
          <GuideStep title="Read the relationship">On <strong>Permission Dependencies</strong>, each row shows the permission and the access it also requires.</GuideStep>
          <GuideStep title="Inspect the full chain">Use <strong>View Chain</strong> before changing a custom role so all required access is included.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="review-permission-groups" title="Review permission groups">
        <GuideSteps>
          <GuideStep title="Find the matching job bundle">Search <strong>Permission Groups</strong> by its readable name and description.</GuideStep>
          <GuideStep title="Use the whole bundle deliberately">A custom role receives every permission in an attached group. Use individual permissions when only part of a bundle fits.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["A permission is missing", "Ask the backend team to confirm that the module seeder registers it and that the registry has been synchronized."],
            ["A permission cannot be granted", "Check whether it is restricted, unavailable to the tenant, inactive, or missing a dependency."],
            ["A label is unclear", "Report the permission and the wording needed. Labels come from the backend catalogue, so every picker receives the same correction."],
            ["Users still lack access", "Confirm their role or personal grant, branch scope, dependencies, and any personal deny."],
          ].map(([title, body]) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">The custom role or personal exception uses the intended readable permissions, includes dependencies, has the right branch scope, and does not bypass restricted-access approval.</GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Permission definitions and default bundles remain unchanged in the console.</p>
      </GuideSection>
    </div>
  );
}
