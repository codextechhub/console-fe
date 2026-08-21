import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ImportExportTroubleshootingArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Do not retry first. Record the batch or run number, file name without sensitive contents, stage, status, row counts, failure code, creator, time, entity, and whether any destination records or file already exist.</p>
      </GuideSection>
      <GuideSection id="classify-the-failure" title="Classify the failure">
        <GuideSteps>
          <GuideStep title="Rejected during validation">No business rows should have been committed. Correct the template, mapping, required fields, values, or scope shown in Issues.</GuideStep>
          <GuideStep title="Partially failed">Some rows may exist. Use Jobs, Row Results, destination records, and Audit to prove the committed subset before recovery.</GuideStep>
          <GuideStep title="Queued or stuck">Check Jobs & Queues and worker health. Queued and Running are not final failures.</GuideStep>
          <GuideStep title="Export failed or expired">Use the run&apos;s recorded cause. Invalid filters or fields need a corrected definition, while expiry needs a fresh authorised run.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="recover-without-duplicates" title="Recover without duplicates">
        <p>Search for another attempt with the same source, dataset, entity, date, and creator. Reconcile succeeded and failed rows with destination records. Retry only if the operation is repeat-safe and Console offers that remedy. Otherwise correct the remaining subset or use an authorised, evidence-backed rollback.</p>
        <GuideCallout tone="warning" title="Rollback changes business records">Confirm the exact job, rows, dependencies, approver, and post-rollback reconciliation before any reversal.</GuideCallout>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Progress looks frozen: confirm queue and worker state before starting another attempt.</li><li>Retry is missing: the cause needs editing, new permission, or a fresh definition.</li><li>Some rows succeeded: never upload the full source again without proving deduplication.</li><li>Download is unavailable: check final state, omissions, expiry, scope, and download permission.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The failed stage and safe cause are known", "Committed records or generated files were proven", "No duplicate attempt is running", "Recovery matches the recorded cause", "Source counts and destination records reconcile", "The safe batch or run reference is ready for support"]} /></GuideSection>
    </div>
  );
}
