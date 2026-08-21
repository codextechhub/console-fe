import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ConfigurePlatformArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the approved business reason, affected services and schools, current effective value, proposed value, owner, effective time, validation plan, and rollback plan. Viewing and saving use separate permissions.</p>
        <GuideCallout tone="danger" title="Platform settings have a wide blast radius">A platform default can affect every new school or a live authentication, entitlement, document, or integration path. Change the smallest scope supported, preserve the previous value, and verify the runtime consumer after saving.</GuideCallout>
      </GuideSection>
      <GuideSection id="understand-sources-and-scope" title="Understand sources and scope">
        <p>Read the source badge before editing. Product default, deployment environment, platform database, school, and branch values form an inheritance chain. A saved value can override a fallback; resetting an override reveals its parent value. Do not copy a displayed effective value into every child scope.</p>
      </GuideSection>
      <GuideSection id="maintain-platform-profile" title="Maintain the platform profile">
        <p>The platform profile is the issuer identity used when CodeX itself produces Finance documents. Verify name, address, public contact details, website, tagline, and logo URL against the approved legal or operating identity. Clearing an optional saved field returns it to its deployment fallback.</p>
      </GuideSection>
      <GuideSection id="set-onboarding-defaults" title="Set school-onboarding defaults">
        <GuideSteps>
          <GuideStep title="Confirm when the default applies">Onboarding defaults fill values only when a new school or branch omits them. They do not silently rewrite existing tenants.</GuideStep>
          <GuideStep title="Review every dependent area">Check timezone, locale, currency, academic structure, and any other displayed defaults against onboarding policy and downstream Finance or reporting expectations.</GuideStep>
          <GuideStep title="Test with an approved scenario">After saving, use a controlled onboarding case to prove the default appears only where the school did not provide its own value.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="govern-security-baselines" title="Govern security baselines">
        <p>Runtime security settings control live authentication, invitation, recovery, lockout, and proxy-session behaviour. School and branch overrides may tighten the parent baseline but cannot weaken it. Validate every numeric boundary and expect an immediate support and access impact after save or reset.</p>
      </GuideSection>
      <GuideSection id="control-features-and-entitlements" title="Control features and entitlements">
        <p>Capabilities describe product features, dependencies, and availability. Entitlements grant them to a scope and time period; overrides change effective behaviour for a narrower scope. Confirm dependencies, package ownership, start and end dates, affected users, and the effective result before scheduling, resetting, or archiving anything.</p>
      </GuideSection>
      <GuideSection id="use-audit-and-advanced-settings" title="Use audit and advanced settings">
        <p>Audit and compliance is the immutable source for who changed a value, why, when, and what moved before and after. Advanced catalogue entries are typed contracts used by verified runtime consumers. Create or archive a definition only when its key, type, default, validation, scope, consumer, migration, and rollback are understood.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>A section is missing: the reader lacks its view permission; do not infer that the setting does not exist.</li><li>Save is unavailable: the page can be read without the matching update or manage permission.</li><li>A value looks unchanged: check the source badge and effective value because a parent or environment fallback may still win.</li><li>An existing school did not change: onboarding defaults are for omitted values on new records, not a bulk migration.</li><li>A security override is rejected: the proposed child value may weaken the enforced parent boundary.</li><li>A feature remains unavailable: check capability dependencies, entitlement dates, scope, override precedence, and the user's own permission.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The current effective value and its source were recorded", "The smallest correct scope was selected", "The proposal has an owner, reason, validation, and rollback plan", "Onboarding impact on new versus existing schools is understood", "Security, capability, and entitlement dependencies were checked", "The saved result and immutable audit record were verified"]} /></GuideSection>
    </div>
  );
}
