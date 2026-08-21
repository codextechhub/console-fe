import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function ImportTemplatesArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>An import template is a data contract, not just a sample spreadsheet. Confirm the supported dataset, backend field vocabulary, required identifiers, accepted formats, validation rules, and an owner who will maintain it.</p>
      </GuideSection>
      <GuideSection id="define-the-contract" title="Define the dataset contract">
        <GuideSteps>
          <GuideStep title="Choose one dataset">A template should create or update one clear kind of record. Do not combine unrelated destinations because they happen to arrive in one workbook.</GuideStep>
          <GuideStep title="Choose a stable code and format">Codes become operational references. Treat a published code and its field meanings as stable.</GuideStep>
          <GuideStep title="State what the import does">Use the description and instructions to explain create versus update behaviour, scope, prerequisites, identifiers, date and money formats, and what will be rejected.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="design-columns" title="Design columns and operator guidance">
        <p>Give each column an exact heading, destination field, type, required state, order, and useful example. Identify the field that distinguishes one record from another. Avoid ambiguous headings such as Name or Value where a precise business term exists.</p>
        <GuideCallout tone="warning" title="Changing meaning is a breaking change">Do not reuse an existing heading for a different meaning. Old operator files would still look valid while sending the wrong data.</GuideCallout>
      </GuideSection>
      <GuideSection id="test-before-publishing" title="Test before publishing">
        <GuideChecklist items={["A minimal valid file passes validation", "Missing required values fail with understandable row and column messages", "Duplicate and unknown identifiers are handled as designed", "Dates, decimals, booleans, codes, and leading zeroes survive a download and upload", "A test import reaches only the intended school and dataset", "The downloaded CSV and XLSX headings match the saved definition"]} />
      </GuideSection>
      <GuideSection id="publish-change-or-retire" title="Publish, change, or retire safely">
        <p>Keep the template in Draft while testing. Make it Active only after its download and validation behaviour are proven. Compatible wording or examples can be updated carefully. For a breaking column change, create a replacement contract and retire the old template after operators have moved. Retirement stops new use but must not rewrite historical batches.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>Save is disabled: make a real change and resolve required field or duplicate-order errors.</li><li>Operators cannot download it: confirm it is Active, download is enabled, and their permissions include the template.</li><li>A column validates incorrectly: compare its type and destination field with the backend dataset contract.</li><li>Old files fail after an edit: restore compatibility or publish a replacement instead of changing the old meaning again.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["The dataset, code, format, and owner are clear", "Every heading has one stable meaning", "Required and identifying fields were tested", "Operator instructions explain scope and recovery", "Lifecycle status and download availability are intentional"]} /></GuideSection>
    </div>
  );
}
