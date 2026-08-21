import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function BuildAndRunExportArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the business question, school or entity, date window, approved recipients, required format, and whether personal or financial fields are genuinely needed. Export access is checked when a definition is viewed, when it runs, and again when its file is downloaded.</p>
        <GuideCallout tone="warning" title="An export moves data outside Console">Choose the smallest useful scope and field set. Store and share the finished file only through your organisation&apos;s approved channel.</GuideCallout>
      </GuideSection>
      <GuideSection id="choose-data-and-scope" title="Choose the dataset and scope">
        <p>Open <strong>Exports</strong>, select <strong>New export</strong>, then choose the module and dataset. Only authorised catalogue entries appear. If the dataset requires an entity, choose it explicitly and confirm that Whole organisation is not selected by mistake.</p>
      </GuideSection>
      <GuideSection id="select-fields-and-filters" title="Select fields and filters">
        <GuideSteps>
          <GuideStep title="Keep the identifying field">Every row needs a stable reference so recipients can trace it back to Console.</GuideStep>
          <GuideStep title="Add only necessary columns">Restricted columns require separate permission. Their presence is a warning to tighten handling, not a reason to include them automatically.</GuideStep>
          <GuideStep title="Set bounded filters">Use status, entity, owner, and especially date limits to control size and meaning. Read the preview and estimate again after each material change.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="choose-file-behaviour" title="Choose file behaviour">
        <p>Choose CSV for system exchange, Excel for human review, or another published format only when the recipient supports it. Confirm value mode, delimiter or workbook options, filename pattern, and whether the result is intended for people or another system.</p>
      </GuideSection>
      <GuideSection id="review-save-and-run" title="Review, save, and run">
        <p>At Review, verify name, description, dataset, scope, filters, columns, format, preview, estimated rows, and any withdrawn or omitted field warning. <strong>Save without running</strong> stores the reusable definition. <strong>Save and run</strong> also queues a file, so use it only after the review is complete.</p>
        <GuideCallout title="Editing does not rewrite history">A later definition change affects future files only. Existing files and run records retain the configuration used when they were produced.</GuideCallout>
      </GuideSection>
      <GuideSection id="download-and-handle" title="Download and handle the file">
        <p>Track the run under Files or Queues. Open its detail before downloading if it is partial or contains omissions. Files expire after the stated retention period, while the run history remains. Every download, including a refused attempt, is recorded.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Dataset missing: it may not be published or your role may not permit its module or entity.</li><li>Next is disabled: complete the required dataset, entity, column, filter, or format choice shown on the current step.</li><li>Restricted field missing: request access only when the business purpose requires that data.</li><li>Run is too large: narrow its entity, date, status, or column selection.</li><li>File expired: run the saved definition again and recheck its scope before downloading.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["Dataset and entity answer the intended question", "Filters and dates are bounded", "Only necessary fields are included", "Preview and estimate were reviewed", "The final run has no unexplained omission", "The downloaded file is stored and shared safely"]} /></GuideSection>
    </div>
  );
}
