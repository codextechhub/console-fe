import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function MaintainProfileAndPrivacyArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Open the account menu and choose <strong>My Profile</strong>. The self-service profile is an employment record for CX staff, not the sign-in account itself. Use <strong>My Security</strong> for passwords and sessions, and ask an administrator to correct organisation-owned identity or seat details.</p>
        <GuideCallout tone="warning" title="Treat profile details as private">Only collect and save information your organisation is permitted to hold. Keep dates of birth, home addresses, next-of-kin details, and bank information out of screenshots, tasks, and support tickets.</GuideCallout>
      </GuideSection>

      <GuideSection id="read-your-profile" title="Read your profile">
        <p>The read view groups organisation position, employment status, personal details, contact information, next of kin, payroll details, and position history. The organisation chain and assignment history explain where you sit now and how that seat changed over time.</p>
      </GuideSection>

      <GuideSection id="update-permitted-details" title="Update permitted details">
        <GuideSteps>
          <GuideStep title="Choose Edit Profile">Review the current record first, then enter edit mode. Save remains unavailable until a field actually changes.</GuideStep>
          <GuideStep title="Change only approved personal data">Update the personal, contact, next-of-kin, and payroll fields that belong to you. Recheck spelling, dates, phone numbers, bank name, account name, and account number before saving.</GuideStep>
          <GuideStep title="Save once and confirm the read view">Select <strong>Save</strong> once. Wait for the success message and confirm that the read view shows the intended values before trying again.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="understand-profile-boundaries" title="Understand profile boundaries">
        <p>Your work email, employee ID, employment state, organisation seat, line manager, and position history belong to controlled HR and organisation workflows. Correct them through the responsible administrator rather than placing a different value in a personal field. Payroll details are visible to the owner, while access for other staff is separately restricted.</p>
        <GuideCallout title="A missing profile is not an empty account">If My Profile says no staff profile is on record, your sign-in account can still be valid. Ask the CX staff-profile administrator to connect the employment record to the correct user instead of creating a duplicate account.</GuideCallout>
      </GuideSection>

      <GuideSection id="review-privacy-controls" title="Review privacy controls">
        <p>Open <strong>My Security</strong>, then <strong>Data &amp; privacy</strong>, to review the personal activity export option and the categories of information Console records. Retention varies by tenant, record type, legal obligation, and active policy. Use Support or your privacy contact for the rule that applies to a specific record.</p>
      </GuideSection>

      <GuideSection id="request-an-activity-export" title="Request an activity export">
        <p>If your role has audit-export access, <strong>Request activity CSV</strong> creates a CSV of audit events where you are the actor, within the same tenant and masking boundaries used by the Audit console. It is not a ZIP of every profile field. Open Audit Exports to download the created file, follow its expiry notice, store it securely, and delete local copies when no longer required.</p>
        <GuideCallout tone="warning" title="No export access">If the button is unavailable, do not ask another user to export broad tenant data for you. Contact Support or the privacy owner with the purpose and requested scope so the request follows the approved process.</GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>No profile is on record: ask the staff-profile administrator to connect the employment record to your existing account.</li>
          <li>An organisation or employment field is wrong: contact the owning administrator because self-service editing does not replace controlled assignment history.</li>
          <li>Save is disabled: confirm that a permitted field actually changed and that required values remain valid.</li>
          <li>The activity export button is unavailable: your current role does not include audit-export access.</li>
          <li>You need a full personal-data request: contact the privacy owner because the activity CSV covers audit events, not every stored profile field.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={["The profile belongs to the signed-in user", "Personal, contact, next-of-kin, and payroll changes were checked before saving", "Organisation-owned fields were escalated to the responsible administrator", "No duplicate account or staff profile was created", "The applicable retention or access rule was confirmed for sensitive requests", "Any activity CSV was requested with the right permission and stored securely"]} />
      </GuideSection>
    </div>
  );
}
