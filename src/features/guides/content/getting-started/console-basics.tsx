import { Bell, CheckCircle2, CircleAlert, Clock3, Command, Headset, LayoutDashboard, Search, ShieldCheck } from "lucide-react";

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
          <GuideStep title="Start from Home">Use Home to see work that needs attention, quick actions, important signals, and recently opened records. Today&apos;s focus separates work that is yours from conditions to watch. It stays compact until you hover over it or select Maximize, and opens by itself when something is broken.</GuideStep>
          <GuideStep title="Choose an area from the sidebar">The main sidebar groups platform work such as schools, users, workflow, and audit. Expand Support to open Support Centre or How-to Guides. Finance and Procurement open their own focused consoles.</GuideStep>
          <GuideStep title="Use the Administration hub">Settings &gt; Administration links to specialist consoles for people, roles, workflows, security, and communications. It does not grant access to them; each link still follows your permissions.</GuideStep>
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

      <GuideSection id="understand-your-access" title="Understand your access">
        <p>Console combines several pieces of context before it shows work. These terms explain why two signed-in users may see different screens or records.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Entity", body: "The legal or operating organization whose records you are viewing. Finance work is especially sensitive to the selected entity." },
            { title: "Branch", body: "A school location or operating unit. Some records and staff assignments belong to a particular branch." },
            { title: "Role", body: "A named collection of responsibilities assigned to a user, such as administrator, finance officer, or approver." },
            { title: "Permission", body: "A specific allowed action. Menus, search actions, page buttons, and backend requests are all permission-aware." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
        <GuideCallout tone="warning" title="Check context before changing records">Before starting work, especially in Finance or Procurement, confirm that you are viewing the intended entity and branch. A permitted action can still be wrong when performed in the wrong context.</GuideCallout>
      </GuideSection>

      <GuideSection id="todays-focus" title="Today's focus">
        <p>Home opens with <strong>Today&apos;s focus</strong>, the single place Console collects everything that may need attention. It stays compact until you hover over it or select <strong>Maximize</strong>; on a phone, select Maximize. It opens by itself when it holds something broken, such as an open service incident or a background job of yours that failed, so that a red item cannot sit unseen behind a collapsed header. If you close it again, it stays closed for that problem. It is read in two groups, and a quiet area is simply absent rather than shown as a zero.</p>
        <GuideSteps>
          <GuideStep title="Start with Yours to act on">Approvals waiting on your decision, approvals you cover as a delegate, submissions returned to you for changes, tasks due soon or overdue, support tickets assigned to you, and background jobs you started. Nobody else clears these for you.</GuideStep>
          <GuideStep title="Then read Watch">Conditions across the organization, such as unposted journals, deliveries outstanding, invoices past due, vendor bills unpaid, contracts expiring, people holding no role, and open service incidents. You may not personally own them. They are separated so that they never bury the work that is yours.</GuideStep>
          <GuideStep title="Open a row to act on it">Every row opens exactly the records it counted. Selecting &ldquo;Tickets assigned to you&rdquo; opens Support Centre already filtered to <strong>Unresolved</strong> and <strong>Assigned to me</strong>, so the list you land on matches the number you selected.</GuideStep>
        </GuideSteps>
        <GuideChecklist items={[
          "Counts show unfinished work only. Resolving a ticket, or downloading an export, removes it from your count.",
          "Doing the work clears the row. If something remains, the work behind it is still open.",
          "Red means broken now, amber means attention soon, blue is information rather than a problem.",
          "The panel refreshes when you return to the tab and at intervals while you watch it, so work completed elsewhere disappears without reloading the page.",
        ]} />
        <GuideCallout tone="tip" title="You can put information down, but not problems">
          A blue notice, such as finished exports or unread notifications, carries a dismiss control. Dismissing hides that single row for the rest of the day, and it returns as soon as its number changes, so new information is never suppressed. Red and amber rows report something broken or overdue and cannot be dismissed.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="attention-and-notifications" title="Notifications and recent work">
        <GuideChecklist items={[
          "Open the notification bell for recent updates.",
          "Use View Queues for routine background work such as email delivery; the bell is reserved for outcomes that need your attention.",
          "Use Pick up where you left off to return to records you opened in the last few days.",
          "Hover a card there and use its x to remove one you have finished with.",
          "Use the Home metric cards for the totals behind the focus panel, such as unresolved tickets or open tasks.",
        ]} />
        <GuideCallout tone="tip" title="Recent work clears itself">
          A record you opened once leaves Pick up where you left off after a day, and each time you return to it before it goes buys another day, to a maximum of three. So the strip shows the work you are actually in the middle of rather than everything you have ever clicked. It is per browser, not per account: it does not follow you to another device.
        </GuideCallout>
        <GuideCallout tone="warning" title="A notification is not authorization">A message can tell you that work exists, but the destination still enforces its own permission and entity scope.</GuideCallout>
      </GuideSection>

      <GuideSection id="get-help" title="Get help">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Search, title: "How-to Guides", body: "Under Support, search or choose a role or area. Every guide opens at the top, and On This Page moves smoothly to the section you choose." },
            { icon: Headset, title: "Raise a ticket", body: "The headset icon in the header opens a ticket form on any screen. Say what happened, what you expected, and attach screenshots. Guides matched to that page sit one click below the form." },
            { icon: ShieldCheck, title: "Protect sensitive data", body: "Do not include passwords, access tokens, payment credentials, or unnecessary personal data." },
          ].map(({ icon: Icon, title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><Icon className="size-5 text-primary" /><p className="mt-3 text-sm font-semibold text-black-01">{title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
        <p className="flex items-center gap-2 text-xs text-gray-01"><Bell className="size-4" /> Support responses and ticket updates also appear in Console notifications.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "A menu or action is missing", body: "Clear any search filter, then confirm your role and permissions with an administrator. Console hides actions you cannot use." },
            { title: "Search finds no allowed action", body: "Try task language or a shorter phrase. If another user can see the action, compare permissions rather than copying their URL." },
            { title: "A notification opens nowhere", body: "Open Notification Centre and retry. The destination may have moved, been removed, or require access you no longer hold." },
            { title: "The page does not match this guide", body: "Use Report an outdated guide and include the page name and changed label, without copying sensitive record contents." },
          ].map(({ title, body }) => <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="flex items-start gap-2 text-sm font-semibold text-black-01"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" /> {title}</p><p className="mt-2 text-xs leading-5 text-gray-01">{body}</p></div>)}
        </div>
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
