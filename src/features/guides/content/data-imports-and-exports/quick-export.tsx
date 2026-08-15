import { CheckCircle2, CircleAlert, Filter, ListFilter } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideFigure, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function QuickExportArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>
          Most list screens in Console carry an <strong>Export</strong> button. It takes the
          filters already applied to that table and produces a file of everything those
          filters match, not just the rows on the page you are looking at. The file is
          built in the background and waits for you under Export, so you can keep working
          while it runs.
        </p>
        <GuideChecklist items={[
          "Filter the table on screen first. The export copies what you have set, so a filtered table means a smaller, more useful file.",
          "You need permission to view the export catalogue and to run exports. Without both, the Export button does not appear.",
          "Files stay available for 30 days, then they are removed. Download anything you need to keep.",
          "Only you can see and download a file you started this way. It is not shared with your team.",
        ]} />
      </GuideSection>

      <GuideSection id="export-a-table" title="Export what a table is showing">
        <GuideSteps>
          <GuideStep title="Set your filters">
            Narrow the table using its own search, status tabs and dropdowns until it shows
            what you want. The export reads these, so this step decides what ends up in the file.
          </GuideStep>
          <GuideStep title="Select Export">
            A panel opens on the right showing what the file would contain before anything runs.
          </GuideStep>
          <GuideStep title="Check the estimate">
            Matching rows, the number of columns and an estimated file size. Above about
            100,000 rows the count becomes an approximate range rather than an exact figure.
          </GuideStep>
          <GuideStep title="Read the Filters section">
            Green chips are the filters that were carried across from the screen. Any note
            below them explains a filter the export had to add or could not use.
          </GuideStep>
          <GuideStep title="Check Preview">
            The first few rows exactly as they will appear in the file. If these look wrong,
            the filters are wrong.
          </GuideStep>
          <GuideStep title="Choose your columns">
            A sensible set is ticked for you. Add or remove any you like - the estimate
            updates as you go. One column is always included and cannot be unticked: it
            is what identifies each row. Columns marked <strong>restricted</strong> hold
            personal or financial detail and only appear if you are permitted to export them.
          </GuideStep>
          <GuideStep title="Name the file and pick a format">
            The name is filled in for you and can be changed. Choose Excel or CSV.
          </GuideStep>
          <GuideStep title="Select Download export, or Run export">
            Small files are produced there and then, and the button says
            <strong> Download export</strong> - the file saves as soon as it is ready.
            Larger ones say <strong>Run export</strong> and are queued instead; use View on
            the confirmation, or go to Export to collect them.
          </GuideStep>
        </GuideSteps>
        <GuideCallout tone="tip" title="Nothing is saved as a reusable export">
          This is a one-off file, and your column choice is not remembered. If you will want
          the same extract again next month, use <strong>Build a saved export instead</strong>
          at the bottom of the panel. That route also lets you set the sort order and a schedule.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="when-the-file-is-wider" title="When the file holds more than the table">
        <p>
          Some filters on a screen have no equivalent in an export. When that happens
          Console does not quietly drop them. A yellow panel appears at the top of the drawer
          saying <strong>This file will contain more than the table shows</strong>, it names
          each filter that could not be carried, and the button changes to <strong>Run
          anyway</strong>.
        </p>
        <p>
          Take this seriously. It means the file will contain rows the table in front of you
          is hiding. Two common cases:
        </p>
        <GuideChecklist items={[
          "Customers filtered to Overdue or In credit. Both are worked out from each customer's live balance rather than stored on the customer, so the export cannot filter on them. Export Invoices instead if you need the overdue set.",
          "Sign-in sessions filtered by school, or to sessions that ended today. Neither is part of the sessions export.",
        ]} />
        <GuideCallout tone="warning" title="Check the file before you send it on">
          If you run anyway, open the file and confirm its contents before sharing it or
          using it in a report. The extra rows are real records, not blanks.
        </GuideCallout>
        <GuideFigure
          title="What the drawer is telling you"
          caption="The three states you will see. Only the first means the file matches the table exactly."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Filter, title: "Carried", body: "Green chips. These filters crossed into the export, so the file matches the table." },
              { icon: ListFilter, title: "Added", body: "A note under the chips. The export needed a date window the screen did not have, so the file is narrower." },
              { icon: CircleAlert, title: "Not carried", body: "The yellow panel. A screen filter could not be expressed, so the file is wider." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-4">
                <Icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-black-01">{title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-01">{body}</p>
              </div>
            ))}
          </div>
        </GuideFigure>
      </GuideSection>

      <GuideSection id="dates-and-row-counts" title="Date windows and row counts">
        <p>
          Some exports refuse to mean &quot;everything ever recorded&quot;. When a screen has
          no date filter of its own, the export adds one and says how far back it goes,
          usually the last 365 days. Ledger postings default to a much tighter window
          because that table is the largest in the platform. You can widen either in the
          builder.
        </p>
        <GuideCallout title="The General Ledger export counts differently on purpose">
          The Journal Entries screen lists one row per <strong>entry</strong>. The export
          produces one row per <strong>line</strong>, because a trial balance or an
          auditor&apos;s sample needs the individual debits and credits. A file with more
          rows than the screen is correct here, not a fault.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="find-your-file" title="Find and download your file">
        <GuideSteps>
          <GuideStep title="Open Export">Go to Export in the main navigation.</GuideStep>
          <GuideStep title="Check Files">
            Your run appears here. While it is working it shows its progress and, if it is
            waiting, its place in the queue.
          </GuideStep>
          <GuideStep title="Download it">
            Select Download on the row. Each download is recorded, including attempts that
            are refused.
          </GuideStep>
          <GuideStep title="Read the result if it is marked with omissions">
            The run detail explains what was left out and why, for example a column you are
            not permitted to export or a row limit that was reached.
          </GuideStep>
        </GuideSteps>
        <GuideCallout tone="warning" title="Exports can carry personal data">
          Contact details, bank details and similar columns are restricted and are left out
          unless you hold the additional permission for them. Treat any file you do download
          as confidential, and use your organisation&apos;s approved channel to share it.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Problem
            title="There is no Export button on this screen"
            solution="Not every table can be exported yet, and the button is hidden if you lack the export permissions. Reports with their own CSV, XLSX and PDF buttons use those instead."
          />
          <Problem
            title="The Transactions Log button is greyed out"
            solution="Choose In or Out first. Money in and money out are different records with different columns, so they export as separate files."
          />
          <Problem
            title="Run export is unavailable"
            solution="The estimate has exceeded the maximum row count. Narrow the filters on the screen, most usefully the date range, and open the panel again."
          />
          <Problem
            title="It says an export is already running"
            solution="You asked for the identical file moments ago. Console shows you that run rather than building a duplicate. Open Export to watch it."
          />
          <Problem
            title="The row count does not match the screen"
            solution="Check the Filters section for a filter that could not be carried. On the General Ledger this is expected, because the export lists journal lines rather than entries."
          />
          <Problem
            title="The file is gone"
            solution="Files are removed 30 days after they are produced. Run the export again to get a fresh copy."
          />
          <Problem
            title="It said Download export but nothing downloaded"
            solution="The file turned out larger than the estimate suggested, so it was queued instead. The message tells you which happened - collect it under Export."
          />
          <Problem
            title="A column I need is not in the list"
            solution="Columns marked restricted need an extra permission to export. If one is missing entirely, that dataset does not publish it - ask an administrator."
          />
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">
          The file appears under Export with the row count you expected, you have downloaded
          it, and any &quot;more than the table shows&quot; warning you accepted has been
          checked against the file itself.
        </GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4" /> Your export is ready to use.
        </p>
      </GuideSection>
    </div>
  );
}

function Problem({ title, solution }: { title: string; solution: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="flex items-start gap-2 text-sm font-semibold text-black-01">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}
      </p>
      <p className="mt-2 text-xs leading-5 text-gray-01">{solution}</p>
    </div>
  );
}
