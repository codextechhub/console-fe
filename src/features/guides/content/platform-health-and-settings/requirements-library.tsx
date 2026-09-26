import { CheckCircle2, CircleAlert, Download, Eye, Search } from "lucide-react";

import { GuideCallout, GuideChecklist, GuideFigure, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function RequirementsLibraryArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Documents holds the platform's product requirements so you can read them without cloning the backend repository. There are two kinds: the Module Requirements Document, which tracks every module at once, and a Functional Requirements Document for each individual module.</p>
        <GuideChecklist items={[
          "You need the requirements library permission, which is granted to CX platform staff.",
          "You can read any document inside Console with View. You only need Word if you download the file.",
          "View shows the content faithfully, but page breaks, headers and footers can differ from Word.",
          "The library is read-only. New documents are published by the engineering team.",
        ]} />
      </GuideSection>

      <GuideSection id="find-a-document" title="Find a document">
        <GuideSteps>
          <GuideStep title="Open Documents">Select Documents in the left navigation.</GuideStep>
          <GuideStep title="Read the list">The Module Requirements Document appears first because it covers every module. The module documents follow, ordered by module number.</GuideStep>
          <GuideStep title="Search if you know the subject">Use Search by name or module. You can type a subject such as procurement, or a module number such as M23.</GuideStep>
          <GuideStep title="Check the Current column">This is the newest version of that document. It is the one to read unless you have a reason to look further back.</GuideStep>
        </GuideSteps>
        <GuideCallout title="One row is one document, not one file">
          A document is revised over time, so the list shows the current version of each and keeps the earlier ones out of your way. The subtitle under each name tells you how many versions exist.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="view-a-document" title="View a document">
        <GuideSteps>
          <GuideStep title="Select View">Use the View action on the document's row. A reader opens over the page and shows the document once it has loaded.</GuideStep>
          <GuideStep title="Read and scroll">Scroll inside the reader. On a phone it fills the screen and the text reflows to fit, so you do not need to scroll sideways.</GuideStep>
          <GuideStep title="Download from the reader if you need the file">The Download button at the top of the reader saves the same version you are looking at.</GuideStep>
          <GuideStep title="Close the reader">Select the close button or press Escape to return to the list.</GuideStep>
        </GuideSteps>
        <GuideCallout title="When to download instead">
          View is right for reading and checking what a requirement says. If you need the exact page layout, for example to check what a printed page looks like or to quote a page number, download the file and open it in Word.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="download-a-document" title="Download a document">
        <GuideSteps>
          <GuideStep title="Select Download">Use the Download action on the document's row, or the Download button inside the reader. Console fetches the file and your browser saves it.</GuideStep>
          <GuideStep title="Open it beside Console">Open the saved file in Word. You can keep it open next to Console while you work.</GuideStep>
        </GuideSteps>
        <GuideFigure title="How a document reaches you" caption="Console fetches every document using your signed-in session, which is why View and Download are buttons and not ordinary links. The file is displayed inside Console itself and is never sent to an outside viewer.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Search, title: "Find", body: "Search or scan the list for the module you need." },
              { icon: Eye, title: "View", body: "Read it in Console without leaving the page." },
              { icon: Download, title: "Download", body: "Save the Word file when you need the exact layout." },
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

      <GuideSection id="read-an-earlier-version" title="Read an earlier version">
        <p>Every revision is kept, so you can go back to what a document said at the time a decision was made.</p>
        <GuideSteps>
          <GuideStep title="Select the row">Select anywhere on the document's row to open its details.</GuideStep>
          <GuideStep title="Review Version history">Versions are listed newest first, and the newest carries a Current label.</GuideStep>
          <GuideStep title="View or download the version you need">Each version has its own View and Download actions.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="tip" title="Quote the version you read">
          When you refer to a requirement in a ticket or a review, name the version alongside it. Requirements change between revisions, so a quotation without a version can be read against the wrong document later.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Problem title="Documents is not in the navigation" solution="The library is limited to CX platform staff and needs its own permission. Ask a platform administrator to grant requirements library access." />
          <Problem title="A module you expect is missing" solution="Only modules with a published functional requirements document appear. A module with no document yet is covered by the Module Requirements Document instead." />
          <Problem title="The preview could not be shown" solution="Select Try again. If it still fails, use Download instead and open the file in Word. The file itself is unaffected when a preview fails." />
          <Problem title="The downloaded file will not open" solution="These are Word documents. Confirm the download finished, then open it in Word or a compatible reader rather than a browser tab." />
          <Problem title="A document looks out of date" solution="Check the Current column against the version you have. If the newest version is still wrong, raise it with the engineering team - documents are published from the backend repository, not edited in Console." />
        </div>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are done when">
          You have read the document you need in the reader, or downloaded it and opened it in Word, and you know which version number you are reading.
        </GuideCallout>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Continue to Documents.</p>
      </GuideSection>
    </div>
  );
}

function Problem({ title, solution }: { title: string; solution: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p>
      <p className="mt-2 text-xs leading-5 text-gray-01">{solution}</p>
    </div>
  );
}
