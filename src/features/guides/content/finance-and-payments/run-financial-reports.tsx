import { CheckCircle2 } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function RunFinancialReportsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the active entity, reporting purpose, fiscal period or date range, close status, accounting basis, comparison period, and intended audience. Reports reflect posted data in that scope, so incomplete source work produces incomplete results.</p>
      </GuideSection>

      <GuideSection id="choose-the-report" title="Choose the report">
        <GuideSteps>
          <GuideStep title="Finance Overview">Use the Finance landing dashboard for live entity-level signals such as revenue, collection, aging, cash, payables, approvals, and fiscal runway. Treat each card as a starting point and open its source report or document before deciding.</GuideStep>
          <GuideStep title="Trial Balance">Check debit and credit totals by account and investigate imbalance or unexpected account movements before relying on other statements.</GuideStep>
          <GuideStep title="Income Statement">Review revenue, expenses, and net income over a period. Compare like-for-like periods and confirm unusual movements against source evidence.</GuideStep>
          <GuideStep title="Balance Sheet">Review assets, liabilities, and equity at a point in time. Assets must equal liabilities plus equity.</GuideStep>
          <GuideStep title="Cash Flow">Review posted cash movement by operating, investing, and financing activity. Opening cash plus net movement must equal closing cash.</GuideStep>
          <GuideStep title="Changes in Equity">Explain opening equity, profit, contributions, distributions, and closing equity, then reconcile closing values to the balance sheet.</GuideStep>
          <GuideStep title="Cost and Dimension Analysis">Slice posted account activity by cost centre or an approved dimension such as fund or project. Untagged lines do not appear in a selected axis.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="set-scope-and-comparison" title="Set scope and comparison">
        <GuideChecklist items={[
          "The entity picker shows the intended set of books and base currency.",
          "The selected period or dates match the approved reporting window.",
          "The comparison uses a truly comparable prior period.",
          "Account type, cost centre, and dimension filters do not hide required data.",
          "Late postings, drafts, source exceptions, and close adjustments are understood.",
        ]} />
      </GuideSection>

      <GuideSection id="read-reconciliation-signals" title="Read reconciliation signals">
        <GuideCallout tone="warning" title="A rendered report is not automatically a correct report">
          Check its internal equations, control accounts, source reconciliations, period status, and unusual movements. A balanced trial balance proves debits equal credits, not that every posting used the correct account or period.
        </GuideCallout>
        <GuideChecklist items={[
          "Trial Balance debit equals credit.",
          "AR, AP, bank, payroll, inventory, tax, and other control accounts reconcile to their source records.",
          "Balance Sheet assets equal liabilities plus equity.",
          "Cash Flow opening plus net movement equals closing cash.",
          "Closing equity agrees with the Balance Sheet.",
          "Filtered analytics explain tagged activity and disclose what the filter excludes.",
        ]} />
      </GuideSection>

      <GuideSection id="export-and-share" title="Export and share evidence">
        <p>Use the report's CSV, XLSX, or PDF export after the scope and totals have been checked. Name the file with the entity, report, period, basis, and version date. Share it only through the approved channel and retain the parameters and close status used to produce it.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "The report is empty", body: "Check entity, period, account type, cost centre, dimension, and whether the expected source transactions are posted." },
            { title: "Trial Balance is out of balance", body: "Stop distribution and investigate the underlying journal and system integrity. Do not add a plug entry." },
            { title: "A comparison is unavailable", body: "Select a specific period with an earlier fiscal period available in the entity." },
            { title: "Analytics misses transactions", body: "Only lines tagged to the selected cost centre or dimension appear. Correct source tagging through the approved path when necessary." },
            { title: "The export differs from the screen", body: "Confirm the same entity, period, filters, comparison state, and export time, then report the mismatch with those parameters." },
            { title: "A report changed after close", body: "Check whether the period was reopened or late adjustments were posted, and produce a new controlled version with the change explained." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <p className="flex items-start gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Reporting is complete when the right entity and period were used, reconciliation signals pass or are explained, comparisons are valid, and any shared export preserves the scope and version evidence.</p>
      </GuideSection>
    </div>
  );
}
