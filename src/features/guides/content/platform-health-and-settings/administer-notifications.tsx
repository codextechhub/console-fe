import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function AdministerNotificationsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the event, intended audience, channel, required wording, variables, action link, owner, review approval, and whether the message is transactional. Use delivery references and masked recipient details when investigating.</p>
        <GuideCallout tone="warning" title="Changes affect future delivery">Switching a channel, pausing a template, or saving new wording can change every later message for that event. It does not repair or resend an earlier delivery. Preserve the current template and test the rendered result before publishing.</GuideCallout>
      </GuideSection>
      <GuideSection id="read-delivery-history" title="Read delivery history">
        <p>Filter by recipient email, delivery status, tenant scope, and the bounded date window. Connect the row to its event, channel, creation time, provider evidence, and business action. A Sent state records dispatch, not proof that a person read or acted on the message.</p>
      </GuideSection>
      <GuideSection id="apply-channel-settings" title="Apply channel settings">
        <p>The settings matrix shows event and channel combinations with their inheritance source. Transactional events always dispatch and the in-app feed is always on, so those switches are locked. Change an editable email setting only after confirming the event policy and affected tenants.</p>
      </GuideSection>
      <GuideSection id="choose-an-event-and-channel" title="Choose an event and channel">
        <GuideSteps>
          <GuideStep title="Use the event catalogue">Confirm the event key, description, source module, supported channels, and transactional state. An inactive or unsupported event cannot be fixed by inventing a template.</GuideStep>
          <GuideStep title="Check for an existing template">Search the template directory before creating one. Each event and channel should have one maintained source rather than competing copies.</GuideStep>
          <GuideStep title="Create only the missing channel">The New template screen lists event and channel combinations that are still available. Create and edit is a real write, so stop if the event ownership or wording is not approved.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="edit-and-preview" title="Edit and preview a template">
        <p>Update the subject or headline, message, optional action label and URL, and only the approved variables. The preview is rendered by the backend with sample values and updates from the unsaved draft. Inspect both wording and layout before Save.</p>
        <GuideCallout title="Keep the standard email design when possible">Editing Email HTML turns the template into a hand-maintained design that no longer follows regenerated standard markup. Use custom HTML only when reviewed, accessible, safe for email clients, and owned for future maintenance.</GuideCallout>
      </GuideSection>
      <GuideSection id="activate-and-monitor" title="Activate and monitor safely">
        <p>Active controls whether the channel can fire for the event. Pausing can suppress important communication immediately. After an approved save or state change, trigger only a controlled business test, inspect delivery history, verify variables and links, and confirm no sensitive value appears unexpectedly.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>A delivery is missing: confirm that the source event fired, the channel is supported and enabled, a live template exists, and the bounded history filter includes it.</li><li>A transactional switch is locked: that event bypasses optional settings by policy.</li><li>No event appears on New template: all supported channels may already have templates, or the event is not registered and active.</li><li>The preview has sample values: this is deliberate; verify variable names rather than treating the sample as recipient data.</li><li>The email design stopped following standard changes: restore the standard design if custom HTML is no longer required.</li><li>A past message was wrong: changing the template affects later sends only; investigate the original delivery separately.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The event key, audience, channel, and transactional state are correct", "An existing template was checked before creating another", "Wording, variables, links, and preview were reviewed", "Any custom HTML has an explicit maintenance owner", "Activation or channel changes were approved for their full audience", "A controlled delivery and its history record were verified"]} /></GuideSection>
    </div>
  );
}
