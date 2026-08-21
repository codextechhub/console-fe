import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function PermissionDeniedArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>A missing menu item and a Permission denied message usually mean Console is protecting a route or action. Do not borrow another account or ask for broad access. Record the page, action, time, and safe error code first.</p>
      </GuideSection>
      <GuideSection id="confirm-your-context" title="Confirm your account context">
        <GuideSteps>
          <GuideStep title="Check the signed-in identity">Confirm your name and account, especially after proxy work or switching devices.</GuideStep>
          <GuideStep title="Check the school or entity">A valid permission can still be limited to a school, branch, ledger entity, or assigned record.</GuideStep>
          <GuideStep title="Open the intended route again">Use Console navigation or workspace search. An old bookmark may point to a route that changed or a record outside your scope.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="separate-menu-and-action-access" title="Separate menu access from action access">
        <p>Seeing a page does not grant every button on it. A role may allow viewing but not creating, approving, exporting, paying, or changing configuration. Likewise, a hidden menu can be correct even when a colleague can see it because their responsibilities differ.</p>
        <GuideCallout tone="warning" title="Frontend visibility is not authorization">Never treat a visible button or copied URL as proof of permission. Console and the backend both enforce access.</GuideCallout>
      </GuideSection>
      <GuideSection id="request-the-smallest-change" title="Request the smallest access change">
        <p>Ask a role administrator to compare the task with your approved job responsibility, current role assignment, permission dependencies, school or entity scope, and any expiry. Give the exact action you need, not the name of a powerful colleague whose access should be copied.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Access worked earlier: check role expiry, account status, scope changes, proxy mode, and recent approved role changes.</li><li>The menu is visible but the action fails: the write permission or record scope may be missing.</li><li>The role was just changed: sign out and back in only after the administrator confirms the assignment is active.</li><li>Only one record fails: compare its tenant, school, entity, owner, and workflow assignment with a record you can open.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The correct identity and context are confirmed", "The exact route, action, and safe error code are recorded", "The required responsibility and scope are understood", "No shared account or permission bypass was used", "Any access request asks only for the minimum needed permission"]} /></GuideSection>
    </div>
  );
}
