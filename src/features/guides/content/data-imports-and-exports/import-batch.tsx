import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ImportBatchArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>An import can create or change many records at once. Confirm the school, dataset, active template, source owner, expected row count, identifying field, and approval to use the file before uploading it.</p>
        <GuideCallout tone="warning" title="Keep source data private">Do not place student, employee, bank, identity, or contact data in screenshots or support tickets. Use the batch number, safe issue code, row number, and column name when asking for help.</GuideCallout>
      </GuideSection>
      <GuideSection id="prepare-the-file" title="Prepare the file from the active template">
        <GuideSteps>
          <GuideStep title="Download the current template">Use the active template for the intended dataset. An old copy may contain retired headings or miss a new required column.</GuideStep>
          <GuideStep title="Keep the structure stable">Do not rename headings, merge cells, insert title rows, or mix datasets. Keep identifiers such as employee number or account code as text when leading zeroes matter.</GuideStep>
          <GuideStep title="Check the evidence">Remove blank trailing rows, formulas that should be values, duplicate identifiers, and records belonging to another school. Count the expected data rows before upload.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="upload-and-check-scope" title="Upload and check the batch scope">
        <p>Select <strong>New Import</strong>, choose the dataset and template, upload CSV or XLSX, then confirm the sheet name and header row. After upload, read the batch header again: filename, dataset, format, school, template, uploader, row count, and column count must match the intended work.</p>
      </GuideSection>
      <GuideSection id="validate-and-resolve" title="Validate and resolve issues">
        <p>Select <strong>Validate</strong>. Validation checks the file without executing the import. Review Errors, Warnings, and Info separately. Critical errors block execution. Correct source values in the file and upload a new batch when the data is wrong; marking an issue as reviewed does not change the source value.</p>
        <GuideCallout title="Warnings still need a decision">A batch may be technically executable with warnings. Record why each warning is acceptable and confirm it will not overwrite, skip, or misclassify a real record.</GuideCallout>
      </GuideSection>
      <GuideSection id="execute-and-monitor" title="Execute and monitor the import">
        <p>Only select <strong>Start Import</strong> after the batch says it is ready, the row count agrees with the source, and a second person has reviewed high-impact data. Watch the pipeline and Jobs tab until the job reaches a final state. Do not start another copy because a large batch appears slow.</p>
      </GuideSection>
      <GuideSection id="prove-the-result" title="Prove the imported result">
        <GuideChecklist items={["The final status and succeeded, failed, and skipped counts are understood", "A sample of created or updated records matches the source file", "No duplicate batch or duplicate business record was created", "The batch audit and job record identify who performed each stage", "The source file and approval evidence are retained in the approved location"]} />
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Template mismatch: download the current template and move values into its unchanged headings.</li><li>Wrong header row or sheet: correct the batch metadata before validating again.</li><li>Critical issues remain: fix the source file, then use a new batch instead of forcing execution.</li><li>Batch appears stuck: check the Jobs tab and Queues before uploading the file again.</li><li>Partial import: prove which rows committed before deciding whether to correct, retry, or roll back.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["Correct school, dataset, template, sheet, and header were used", "Validation evidence was reviewed before execution", "Final job counts reconcile to the expected source rows", "Imported records were sampled in their destination screen", "No duplicate import was started"]} /></GuideSection>
    </div>
  );
}
