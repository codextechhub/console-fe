import { CheckCircle2, Landmark, ListTree, Settings2, Tags } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function ConfigureFinanceFoundationsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Finance configuration controls what can be posted and how it is reported. Prepare the approved legal entity, reporting currency, fiscal calendar, chart structure, tax rules, analysis codes, and posting-account mappings before changing anything.</p>
        <GuideCallout tone="warning" title="Always confirm the active entity">
          The entity picker in the header is the scope for accounts, periods, tax codes, cost centres, dimensions, settings, journals, and reports. A valid change in the wrong entity is still the wrong change.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="choose-the-scope" title="Choose the entity and setup order">
        <GuideSteps>
          <GuideStep title="Create or select the set of books">A ledger entity owns its own base currency, chart of accounts, fiscal calendar, documents, and reporting. Creating one provisions a starter chart and its first monthly or quarterly calendar.</GuideStep>
          <GuideStep title="Switch to that entity">Use the Finance header picker before opening Chart of Accounts, Fiscal Periods, Tax Codes, Cost Centres, Dimensions, or Finance Settings.</GuideStep>
          <GuideStep title="Build dependencies before transactions">Finish the chart, reference data, and posting mappings before invoices, receipts, payroll, procurement, or manual journals begin using them.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="create-the-entity" title="Create the ledger entity and calendar">
        <GuideChecklist items={[
          "Use the approved stable entity code and legal or reporting name.",
          "Confirm the reporting code and base currency before creation.",
          "Choose the fiscal-year label, starting month and day, and monthly or quarterly frequency.",
          "After creation, verify the starter chart and every expected posting period.",
        ]} />
        <GuideCallout tone="danger" title="Do not create a second entity to correct a small mistake">
          An entity becomes the owner of financial records. If setup is wrong after posting has begun, stop and use the approved correction path rather than splitting one set of books across duplicate entities.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="build-the-chart" title="Build and check the chart of accounts">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: ListTree, title: "Use the code line", body: "Account codes have four digits. 1 is Assets, 2 Liabilities, 3 Equity, 4 Income, and 5 Expenses. The first digit fixes the account type." },
            { icon: Landmark, title: "Separate groups from posting accounts", body: "A postable account accepts journal lines. A non-postable account groups child accounts and reports their rolled balance." },
            { icon: Tags, title: "Keep parents in the same type", body: "Console only offers parent accounts in the same code line. Use subtypes to describe the account without changing its accounting class." },
            { icon: Settings2, title: "Protect control accounts", body: "Accounts used by AR, AP, cash, inventory, tax, payroll, and other services must stay aligned with Finance Settings." },
          ].map(({ icon: Icon, title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><Icon className="size-5 text-primary" /><p className="mt-3 text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="add-reference-data" title="Add currencies, tax, cost centres, and dimensions">
        <GuideSteps>
          <GuideStep title="Record FX rates by pair and date">One unit of the base currency equals the saved number of quote-currency units. Verify both currencies, the effective date, rate source, and direction.</GuideStep>
          <GuideStep title="Map tax codes to accounts">Set the percentage, output or collected account, input or paid account, recoverable rule, and active state. A tax label without the correct accounts creates the wrong posting.</GuideStep>
          <GuideStep title="Create cost centres for ownership">Use a consistent code structure and optional parent so spending can be reported by branch, department, or other responsible unit.</GuideStep>
          <GuideStep title="Create dimensions for extra analysis">Define a stable code such as FUND or PROJECT and constrain allowed values when free text would make reporting inconsistent.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="map-posting-defaults" title="Map posting defaults and policies">
        <p>Open Finance Settings for the active entity. Accounting defaults map stable posting roles to active, postable accounts of the expected type. Document and banking policies control defaults used by invoices, collections, reconciliation, receipt allocation, and cash alerts.</p>
        <GuideCallout tone="warning" title="A saved mapping takes effect immediately">
          Review the named consumer beside every setting. Changing a control-account mapping can affect the next document posted by Finance or Procurement, so record the approval and verify the resulting journal in a safe environment first.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="verify-the-foundation" title="Verify the foundation before live work">
        <GuideChecklist items={[
          "The entity picker shows the intended code, name, and base currency.",
          "The fiscal calendar covers every required posting date.",
          "All posting accounts are active and have the intended normal balance.",
          "Tax, cost-centre, and dimension values match the approved reference list.",
          "Finance Settings resolves every required posting role to the intended account.",
          "A trial balance and controlled test posting behave as expected before go-live.",
        ]} />
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "The setup screen is empty", body: "Select an entity in the Finance header and confirm the matching view permission." },
            { title: "An account code is refused", body: "Use exactly four digits beginning with 1 to 5, make it unique, and choose a parent in the same account type." },
            { title: "A mapping cannot select an account", body: "The account must belong to the active entity, match the required account type, be active, and be postable." },
            { title: "A date cannot be used", body: "Create the missing fiscal year or reopen the approved period. Do not change the document date simply to bypass period control." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Finance foundations are ready when the entity, calendar, chart, reference data, and posting mappings have been independently checked and a controlled test produces the expected balanced result.</p>
      </GuideSection>
    </div>
  );
}
