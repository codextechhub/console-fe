import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ExportAndComplianceArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the evidence question, authorised recipient, school or platform scope, date window, required fields, retention need, secure handling location, and the approval for any compliance-policy change.</p>
        <GuideCallout tone="warning" title="Audit evidence can expose sensitive context">Export the smallest useful set. A compliance rule can change retention, masking, access, or export behaviour across a school or the platform, so review scope and rollback before saving.</GuideCallout>
      </GuideSection>
      <GuideSection id="build-a-bounded-export" title="Build a bounded evidence export">
        <GuideSteps>
          <GuideStep title="Carry forward the investigation scope">Start from filtered audit events when possible. Recheck the date range, tenant, severity, status, module, action, entity, actor, and search values in the export builder.</GuideStep>
          <GuideStep title="Use tenant scope deliberately">Platform staff can select a school tenant or No tenant (platform-level). The same tenant semantics used by the Explorer are applied to the CSV job.</GuideStep>
          <GuideStep title="Generate only after review">The export is created by the server and recorded as a job. Track status, row count, filters, requester, timestamps, and failure details before treating it as evidence.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="download-and-protect" title="Download and protect the evidence">
        <p>Download a completed file from Audit Exports. The file now comes through an authorised download route rather than a URL trusted from the response payload, so permission is checked when the file is requested. Store it in the approved evidence location, restrict sharing, preserve its job reference, and follow the stated retention period.</p>
      </GuideSection>
      <GuideSection id="define-rule-scope" title="Define the compliance rule scope">
        <p>Give the rule an accountable name and description, then choose Global or one school, an optional module, and an optional action. Blank scope fields broaden the rule. Review overlapping rules and existing obligations before activating a new one.</p>
      </GuideSection>
      <GuideSection id="choose-the-rule-type" title="Choose the rule type">
        <ul className="list-disc space-y-2 pl-5"><li><strong>Retention</strong> defines how long matching audit evidence is kept.</li><li><strong>Masking</strong> names sensitive fields, including nested paths, that should not be exposed in matching evidence.</li><li><strong>Access</strong> constrains which roles can view or export matching events. Advanced configuration is maintained server-side.</li><li><strong>Export</strong> constrains jobs such as row caps, allowed formats, or watermarking. Advanced configuration is maintained server-side.</li></ul>
      </GuideSection>
      <GuideSection id="change-rules-safely" title="Change rules safely">
        <p>Keep a rule inactive while its scope and policy are reviewed. For an edit, inspect Preview and history, record the previous value, affected evidence, effective time, owner, approval, and rollback plan. Duplication creates an inactive copy for review. Deactivation and deletion have different governance consequences and must not be used to hide inconvenient evidence.</p>
        <GuideCallout tone="danger" title="Never weaken controls to make an export pass">If access, masking, retention, format, or row limits block the request, correct the business scope or obtain the required approval. Do not loosen a rule merely to produce a file.</GuideCallout>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>The export has no rows: verify the date and tenant scope, especially whether older events sit under No tenant.</li><li>The export failed: open its job record and preserve the error before generating another copy.</li><li>Download is unavailable: the job may still be running or failed, or your current authority may not permit the file.</li><li>A rule appears too broad: set the school, module, or action explicitly and review overlaps before activation.</li><li>A field is still visible: confirm the masking path and which evidence surface enforces that rule.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The export answers one bounded evidence question", "Tenant and date semantics match the investigation", "The server job completed with expected rows and filters", "The file was downloaded and stored through approved controls", "Rule type and scope match the approved policy", "Previous values, history, owner, and rollback are recorded"]} /></GuideSection>
    </div>
  );
}
