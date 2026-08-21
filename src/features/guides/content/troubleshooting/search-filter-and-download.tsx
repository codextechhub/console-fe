import { GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function SearchFilterDownloadArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>First prove whether the result is missing, outside the current filters, on another page, or unavailable to your role. Record the screen, search words, active filters, page number, entity, date range, and time.</p>
      </GuideSection>
      <GuideSection id="reset-the-view" title="Reset the view without losing the question">
        <GuideSteps>
          <GuideStep title="Clear search and filters">Remove status, owner, entity, school, date, and saved-view filters, then add them back one at a time.</GuideStep>
          <GuideStep title="Return to page one">Changing a filter can leave the old page number beyond the new result set.</GuideStep>
          <GuideStep title="Check scope and spelling">Use a stable name, number, or reference. Confirm the current tenant, school, branch, or ledger entity.</GuideStep>
          <GuideStep title="Refresh once">Allow a normal request to finish. Repeated refreshes can hide a slow response or start duplicate export work.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="check-the-result" title="Check the result and download">
        <p>Compare the visible total, current page, and date range with the expected population. For a download, confirm the job reached a final successful state, the file is not expired, omissions are understood, and your role has download access. Browser download controls can also block or relocate a valid file.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Typing gives no result: try a stable reference and remove punctuation or extra spaces.</li><li>A result appears for a colleague only: compare permission and data scope, not just filters.</li><li>The table is empty after filtering: return to page one and widen one filter at a time.</li><li>The download button is absent: the record state, file expiry, or download permission may not allow it.</li><li>The file downloads but looks incomplete: review applied filters, columns, omissions, row limit, and source totals before using it.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["Search, filters, page, scope, and date range are recorded", "The view was reset and rebuilt one filter at a time", "The expected population was compared with the visible total", "Download state, expiry, omissions, and permission were checked", "Support evidence contains no restricted row values or raw export"]} /></GuideSection>
    </div>
  );
}
