import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ReviewGuideCoverageArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>You need platform health access. The dashboard reads the guide registry, route catalogue, action palette, walkthrough verification records, and privacy-safe reader signals. It does not read customer records or change a guide from the browser.</p>
        <GuideCallout title="Fix the source, not the number">Each total is calculated from a versioned source contract. Update the affected route, action, guide, relation, review date, or walkthrough verification record in the same product change. There is no manual override on the dashboard.</GuideCallout>
      </GuideSection>

      <GuideSection id="read-reader-signals" title="Read reader signals">
        <p>Use the 30-day counts to compare guide views, reader-marked completions, helpful votes, outdated-report handoffs, no-result searches, and walkthrough exits. These are prioritisation signals, not proof that a task succeeded or failed.</p>
        <GuideCallout title="Search text is reduced before storage">Console waits for a settled no-result search, sends only its normalized route and zero result count, and the backend keeps approved task words while replacing every other word with [redacted]. Events contain no actor, record id, form value, amount, or free-text report and are deleted after 180 days.</GuideCallout>
      </GuideSection>

      <GuideSection id="read-the-summary" title="Read the coverage summary">
        <GuideSteps>
          <GuideStep title="Active guides">Published and draft guides count as active. Retired guides cannot cover a current workflow.</GuideStep>
          <GuideStep title="Routes covered">This compares shipped product route patterns with the routes mapped by active guides. Guide article and compatibility-alias routes are delivery infrastructure and do not inflate the denominator.</GuideStep>
          <GuideStep title="Actions covered">This checks registered task actions marked as Do. Read-only navigation actions remain searchable but are not treated as high-value workflow coverage.</GuideStep>
          <GuideStep title="Reviews current">Risk controls the review interval: high every 90 days, medium every 180 days, and low every 365 days.</GuideStep>
          <GuideStep title="Integrity gaps">This combines invalid guide registry links with walkthrough target verification failures.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="close-route-and-action-gaps" title="Close route and action gaps">
        <p>Start with the workflow owner and confirm that the route or action is still shipped. If it is, map it to the task-sized guide that genuinely explains its prerequisites, steps, result, and recovery. If no suitable guide exists, publish a discoverable guide as part of the product change. Do not add an unrelated mapping just to make the count green.</p>
        <GuideCallout tone="warning" title="Coverage is not permission">A mapping makes guidance discoverable only when the reader also passes the guide access rule. It never grants access to the product screen and cannot replace backend authorization.</GuideCallout>
      </GuideSection>

      <GuideSection id="work-the-review-queue" title="Work the review queue">
        <p>The editorial queue combines the recurring risk deadline with outdated reports, not-helpful votes, low completion after enough views, and walkthrough exits. Work the highest score first, confirm the signal against the current product, and then fix the source guide, search metadata, or walkthrough. Move the review date only after the current guidance has been checked.</p>
      </GuideSection>

      <GuideSection id="repair-integrity-and-targets" title="Repair integrity and target checks">
        <p>Registry issues name the guide and the invalid route, action, relation, section, article, or walkthrough reference. Walkthrough issues mean the current walkthrough has no verification record, its version changed after the last drive, or the last drive could not find a target. Fix the stable target or walkthrough definition, drive the changed version on desktop, phone, and tablet, then record that exact version and any remaining missing targets.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>A route appears uncovered even though an article mentions it: add the exact route pattern to the guide record.</li>
          <li>An action appears uncovered: reference the registered action id, not its visible label.</li>
          <li>A current-looking guide is stale: the interval is based on its risk, not one shared annual date.</li>
          <li>Every target appears missing after a small walkthrough edit: changing the walkthrough version intentionally invalidates the older verification record.</li>
          <li>A dashboard total looks wrong: inspect the source registry and exclusion contract before adding an exception.</li>
          <li>A search phrase contains [redacted]: this is the privacy boundary working. Use the remaining task words and route pattern to investigate without trying to recover a person or record value.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={[
          "Every reported route and action gap was confirmed as real or removed from the shipped source",
          "New mappings point to guidance that actually explains the workflow",
          "Stale articles were checked against the current screen before their review date changed",
          "Broken relations and registry references were repaired at their source",
          "Changed walkthrough versions were driven again on desktop, phone, and tablet",
          "Reader signals were treated as prompts for review, not proof of task success",
          "No product permission, validation, confirmation, or tenant boundary was bypassed",
        ]} />
      </GuideSection>
    </div>
  );
}
