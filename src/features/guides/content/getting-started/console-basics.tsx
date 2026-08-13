import { Bell, CheckCircle2, Clock3, Command, Headset, LayoutDashboard, Search, ShieldCheck } from "lucide-react";

import {
  GuideCallout,
  GuideChecklist,
  GuideFigure,
  GuideSection,
  GuideStep,
  GuideSteps,
} from "../../article-components";

export default function ConsoleBasicsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>You need an active Console account and a current sign-in. The areas you see depend on your assigned roles and permissions, so your navigation may contain fewer items than the examples in this guide.</p>
        <GuideCallout title="Your access is deliberate">
          A missing menu item does not always mean something is broken. Console removes areas your account cannot use. If a task should be part of your job, follow the permission troubleshooting guide or contact your administrator.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="find-your-way-around" title="Find your way around">
        <GuideSteps>
          <GuideStep title="Start from Home">Use Home to see work that needs attention, quick actions, important signals, and recently opened records. Today&apos;s focus stays compact until you hover over it or select Maximize.</GuideStep>
          <GuideStep title="Choose an area from the sidebar">The main sidebar groups platform work such as schools, users, workflow, audit, and support. Finance and Procurement open their own focused consoles.</GuideStep>
          <GuideStep title="Use the page header">The header shows the current page, back navigation when available, workspace search, notifications, support, and your account menu.</GuideStep>
        </GuideSteps>
        <GuideFigure title="Console workspace map" caption="The exact areas depend on your permissions. The structure remains the same on every protected screen.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.8fr_1.4fr]">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><LayoutDashboard className="size-4 text-primary" /> Navigation</div>
              <div className="mt-3 space-y-2 text-xs text-gray-01"><p>Home and platform areas</p><p>Finance and Procurement consoles</p><p>Settings and Support</p></div>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><Command className="size-4 text-primary" /> Current workspace</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span className="rounded-lg bg-white p-3">Page actions</span><span className="rounded-lg bg-white p-3">Lists and details</span><span className="rounded-lg bg-white p-3">Status and signals</span><span className="rounded-lg bg-white p-3">Forms and drawers</span></div>
            </div>
          </div>
        </GuideFigure>
      </GuideSection>

      <GuideSection id="search-and-quick-actions" title="Search and quick actions">
        <p>Workspace search is the fastest way to open an area, begin an allowed action, or find a person. Select the search box in the header or press <strong>Command E</strong> on macOS and <strong>Control E</strong> on Windows.</p>
        <GuideSteps>
          <GuideStep title="Describe the task">Type natural phrases such as “create school,” “view invoices,” or “change password.” Common aliases and shortened phrases also work.</GuideStep>
          <GuideStep title="Check the result area">Results identify whether an action belongs to Main, Finance, or Procurement. Only actions permitted for your account appear.</GuideStep>
          <GuideStep title="Open the result">Use the mouse or arrow keys, then press Enter. Creation actions open their relevant form or drawer when that screen supports direct launch.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="tip" title="Search learns locally">Frequently used actions can move higher for your browser. This preference stays on your device and does not change anyone else’s results.</GuideCallout>
      </GuideSection>

      <GuideSection id="attention-and-notifications" title="Attention and notifications">
        <GuideChecklist items={[
          "Hover over Today's focus for a quick look, or select Maximize to keep your assigned tasks and approvals open.",
          "Use Action needed signals for operational or financial issues.",
          "Open the notification bell for recent updates.",
          "Use Pick up where you left off to return to recent records.",
        ]} />
        <GuideCallout tone="warning" title="A notification is not authorization">A message can tell you that work exists, but the destination still enforces its own permission and entity scope.</GuideCallout>
      </GuideSection>

      <GuideSection id="get-help" title="Get help">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Search, title: "Search guides", body: "Find instructions using the words you would normally use for the task." },
            { icon: Headset, title: "Create a ticket", body: "Explain what happened, what you expected, and attach useful screenshots." },
            { icon: ShieldCheck, title: "Protect sensitive data", body: "Do not include passwords, access tokens, payment credentials, or unnecessary personal data." },
          ].map(({ icon: Icon, title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><Icon className="size-5 text-primary" /><p className="mt-3 text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
        <p className="flex items-center gap-2 text-xs text-gray-01"><Bell className="size-4" /> Support responses and ticket updates also appear in Console notifications.</p>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideCallout tone="tip" title="You are ready when">
          You can return Home, open an allowed area, find an action using workspace search, review notifications, and reach either this guide centre or the support-ticket form.
        </GuideCallout>
        <p className="flex items-center gap-2 text-xs text-gray-01"><Clock3 className="size-4" /> Most people complete this orientation in about six minutes.</p>
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Continue with the guide that matches your role or current task.</p>
      </GuideSection>
    </div>
  );
}
