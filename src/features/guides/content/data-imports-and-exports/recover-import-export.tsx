import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function RecoverImportExportArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Do not retry first. Record the batch or run number, final status, safe failure code, stage, row counts, timestamps, and whether any business records or file were produced. A second attempt is safe only after you know what the first attempt changed.</p>
      </GuideSection>
      <GuideSection id="identify-where-it-failed" title="Identify where the work failed">
        <GuideSteps>
          <GuideStep title="Separate validation from execution">Validation errors mean the import has not started changing business records. Import failed or partial means execution began, so use Jobs and Row Results to prove the committed subset.</GuideStep>
          <GuideStep title="Separate queue state from export result">Queued and Running are not failures. Failed carries a coded remedy. Partly complete or omissions means a file may exist but cannot be treated as complete.</GuideStep>
          <GuideStep title="Check for another attempt">Search the same filename, definition, dataset, entity, date, and creator before retrying. Duplicate work may already be running or complete.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="recover-an-import" title="Recover an import without duplicating rows">
        <p>For validation failure, correct the source or batch metadata, then validate a clean batch. For execution failure, inspect Jobs, Row Results, Issues, and Audit. Compare succeeded, failed, and skipped rows with destination records. Retry only when the operation and identifiers make repeated rows safe, otherwise correct the remaining subset or use an authorised rollback.</p>
      </GuideSection>
      <GuideSection id="recover-an-export" title="Recover an export from its recorded cause">
        <p>Open the run detail and follow its offered remedy. A transient worker failure may allow Retry. Invalid filters, withdrawn fields, scope, or permissions require editing or rebuilding instead. An expired file requires a new run. A cancelled run keeps no partial file. Never bypass an omission warning just to obtain a green status.</p>
      </GuideSection>
      <GuideSection id="roll-back-only-with-evidence" title="Roll back only with evidence">
        <GuideCallout tone="warning" title="Rollback is a consequential action">Confirm exactly which job and rows will reverse, what later work depends on them, and who authorised reversal. Give a specific reason. After rollback, reconcile the destination and audit trail before importing again.</GuideCallout>
      </GuideSection>
      <GuideSection id="escalate-safely" title="Escalate safely">
        <p>Send support the safe reference, route, stage, status, failure code, timestamp, expected and actual counts, and the checks already performed. Do not attach the source spreadsheet, generated export, raw payload, access token, or personal values unless an approved secure process specifically requests it.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Progress appears stuck: refresh the detail and check Queues before creating another attempt.</li><li>Retry button is absent: the recorded cause needs editing, permission, or a fresh definition rather than retry.</li><li>Some import rows succeeded: reconcile those destination records before any rollback or reduced-file retry.</li><li>Download is unavailable: the file may be expired, omitted, cancelled, outside your scope, or require download permission.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The failed stage and root cause are known", "The first attempt's committed output was proven", "No duplicate attempt is still running", "Correction, retry, rebuild, or rollback matched the recorded cause", "Final source counts and destination records reconcile", "The audit trail and safe support reference are retained"]} /></GuideSection>
    </div>
  );
}
