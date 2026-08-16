// Track 1 - Identity and Schools.
//
// Everything about who exists on the intranet and who they belong to: getting in,
// the schools and their branches, the people in them, where those people sit on
// the org chart, and the tasks assigned to them.

const K = require("../pack.cjs");
const { t, p, h1, h2, bullets, steps, small, callout, table, spacer, makeRun } = K;

const TRACK_NO = 1;
const TRACK_NAME = "Identity and Schools";
const PREFIX = "QA1";

module.exports = function buildTrack1() {
  const runIds = [];
  const run = makeRun(runIds);
  const body = [];

  body.push(...K.coverAndContents({
    trackNo: TRACK_NO,
    trackName: TRACK_NAME,
    blurb: "One tester. Twenty-two test runs. Everything about who exists on the intranet, which school they belong to, and what they are allowed to be.",
    contents: [
      ["Part 1", "Read this first: the first five minutes, house rules, the list of things that look broken but are not, and how to report a problem", "20 min"],
      ["Part 2", "The short version: one end-to-end run through a school and its first user", "30 min"],
      ["Part 3", "Section A - Your own account (5 runs). Signing in, password reset, profile, sessions, personal security", "45 min"],
      ["Part 4", "Section B - Schools and branches (6 runs). Creating a school end to end, editing it, its branches and its package", "1 hr 30"],
      ["Part 5", "Section C - People (5 runs). Inviting CX and school users, activation, suspending, editing", "1 hr"],
      ["Part 6", "Section D - Organogram and tasks (4 runs). Org units, positions, staff profiles, tasks", "1 hr"],
      ["Part 7", "Section E - Checks to repeat on every screen (2 runs). Phone view, empty states", "30 min"],
      ["Part 8", "Sign-off sheet", "-"],
    ],
  }));

  body.push(...K.partOne({
    trackNo: TRACK_NO,
    prefix: PREFIX,
    whatYouAreTesting: [
      "Your track is everything about identity: who exists on the intranet, which school they belong to, how they get in, and where they sit in the organisation.",
      "Think of it as one story. A school is onboarded, with its branches and its first administrator. People are invited and have to activate before they can do anything. Those people get a place on the org chart and a staff profile. They pick up tasks. Along the way each of them looks after their own account: their password, their sessions, what the system has recorded about them.",
      "It is the foundation the other five tracks stand on. If a school cannot be created or a user cannot be invited, nobody else has anything to test.",
    ],
    notYours: "You are not testing what those people are allowed to do once they are in. Roles, permission keys and the audit trail belong to Track 2. Approvals belong to Track 3, and money belongs to Tracks 4, 5 and 6.",
    firstSteps: [
      "Click School Management in the left sidebar and confirm you can see the list of schools. If you cannot, you are missing a permission and are blocked, so tell Chidera before going further.",
      "Open Users in the sidebar and look at both CX Users and School Users, so you know the difference before you start creating people.",
      'Open Support in the main sidebar and create one throwaway ticket titled "QA1 smoke test, please ignore". This proves your reporting channel works before you need it in anger. If ticket creation itself fails, message Chidera directly.',
    ],
    houseRules: [
      [t("Use a real inbox you control for every email field. ", { bold: true }), t("Activation and password-reset emails are live and they will actually arrive. Gmail's plus-addressing is the easy way to get several: yourname+qa1a@gmail.com and yourname+qa1b@gmail.com both land in your normal inbox.")],
      [t("Never invite a real colleague as test data. ", { bold: true }), t("They will get a genuine activation email asking them to set a password.")],
    ],
    knownIntended: [
      "1.  Activation and password-reset emails are real and will arrive in your inbox. If one does not arrive within a few minutes, check spam before raising anything.",
      "2.  A newly invited user cannot sign in until they activate. That is the point of the invite, not a bug.",
      "3.  A school's slug is generated from its name and is used in the web address. It does not change when you rename the school afterwards.",
      "4.  Pay figures on a staff profile show as dots unless you hold the sensitive-payroll permission. That is field-level security working, not missing data.",
      "5.  Lists show 25 rows at a time with a pager at the bottom. Intended.",
      "6.  Tasks live at /tasks in the address bar. Some of the underlying code still calls them todos, which you may see in an error message. Harmless.",
      "7.  A screen that is missing from the sidebar entirely is a permissions matter, not a bug. Tell Chidera so your account can be granted the key, and note it as blocked.",
    ],
    crossTrack: [
      ["A user you created cannot see a screen you expected", "That is roles and permissions, which is Track 2. Tell that tester which key seems to be missing rather than raising it here."],
      ["Something you do needs approving before it takes effect", "The workflow engine caught it. Note the reference and tell the Track 3 tester."],
      ["An email does not arrive at all", "First check spam, then check whether anyone else's emails are arriving. If nobody's are, it is the mail service and one ticket covers everybody."],
      ["Nothing loads at all and every screen errors", "The intranet is probably down. Say so in the team channel first. One ticket for everyone, not six."],
    ],
  }));

  // ── Part 2: smoke run ────────────────────────────────────────────────────
  body.push(h1("Part 2  ·  The short version, run this first"));
  body.push(p("Before you settle in, walk the spine of your track once, in about half an hour. If something is badly broken we want to know today, not on Thursday."));
  body.push(p("Do not write anything up in detail yet. Note anything that surprises you and which run it belongs to, then look harder later."));
  body.push(...steps([
    'School Management, Create school. Work through the four steps: the school itself, one branch, the first administrator, then the package. Name it "QA1 <your name> School". Use a real inbox for the administrator email.',
    "Save and wait for the success message. Find your school in the list.",
    "Check the inbox you used. An activation email should arrive for the administrator you just created.",
    "Open the activation link and set a password.",
    "Sign out, sign in as that new administrator, and confirm you land somewhere sensible rather than an error.",
    "Sign back in as yourself and open Users, School Users. Your new administrator should be listed under the school you created.",
  ]));
  body.push(callout("If any of those six steps fails outright", [
    "Raise one URGENT ticket immediately with the step number and what happened, then tell Chidera in the team channel. The rest of this pack assumes the spine works.",
  ], "FBEAEA"));
  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section A: your own account ──────────────────────────────────────────
  body.push(h1("Part 3  ·  Section A, your own account"));
  body.push(p("Start here, because everything else needs you to be able to get in and stay in. These screens live under your own name in the top right, and under Me in the address bar."));

  body.push(...run({
    id: "A1",
    title: "Signing in, and being told when you are wrong",
    what: "The sign-in screen, and what it does with a wrong password.",
    why: "It is the first thing every user of the system ever touches, and the place where a careless message tells an attacker whether an email address exists.",
    before: ["Do this in a private browsing window so you do not lose your own session."],
    doThis: [
      "Sign in with your own email and the correct password. Note how long it takes.",
      "Sign out. Sign in again with your correct email and a deliberately wrong password.",
      "Read the error message word for word and write it down.",
      "Now try an email address that certainly does not exist, with any password. Read that message too.",
      "Get the password wrong several times in a row and see whether anything changes.",
      "Sign in correctly again.",
    ],
    passes: [
      "A wrong password is refused with a message that does not say whether the email exists. The two messages in steps 3 and 4 should read the same.",
      "The message appears on the screen, not only in the browser console.",
      "Repeated failures eventually slow you down or lock the attempt. Write down what happens and after how many tries.",
      "A correct sign-in lands you on the home page and the top right shows your own name.",
    ],
    breakIt: [
      "Sign in with the email in a different case, YOURNAME@example.com. It should still work.",
      "Leave the password box empty and submit.",
    ],
    note: "If you do lock yourself out, tell Chidera rather than waiting it out.",
  }));

  body.push(...run({
    id: "A2",
    title: "Resetting a forgotten password",
    what: "The Forgot password link, the email it sends, and the screen that link opens.",
    why: "It is the only way back in for someone locked out, and it is a real email arriving in a real inbox.",
    before: ["Use a private browsing window. Use your own address so the email comes to you."],
    doThis: [
      "From the sign-in screen, click Forgot password. Enter your own email and submit.",
      "Read the message on screen and write it down.",
      "Now do it again with an address that does not exist. Compare the two messages.",
      "Check your inbox. Open the reset email and read it: does it say who it is from and what to do?",
      "Follow the link and set a new password. Try a weak one first, such as password, and read what it tells you.",
      "Set a strong one and sign in with it.",
      "Go back and click the same reset link a second time.",
    ],
    passes: [
      "The on-screen message is the same whether or not the address exists. It must not confirm who has an account.",
      "The email arrives within a few minutes, names the intranet, and its link works.",
      "A weak password is refused with a message saying what is actually required.",
      "The new password signs you in and the old one no longer does.",
      "A reset link cannot be used twice.",
    ],
    breakIt: [
      "Request three resets in a row and check whether the earlier links still work. Only the newest should.",
      "Leave the link an hour and see whether it expires. Note the wording if it does.",
    ],
  }));

  body.push(...run({
    id: "A3",
    title: "Your profile",
    what: "Your own details: name, photo, contact information.",
    why: "Your name and photo appear beside every action you take across the whole intranet, so wrong data here shows up everywhere.",
    before: [],
    doThis: [
      "Open your name in the top right, then Profile.",
      "Read everything shown. Check it matches who you actually are.",
      "Change your first name to something obviously different and save.",
      "Look at the top-right corner and the sidebar. Did the name update without a reload?",
      "Upload a photo. Then look at a screen that lists people, such as Users.",
      "Change your name back.",
    ],
    passes: [
      "Saving works and the new name appears wherever your name is shown, without needing a refresh.",
      "The photo appears beside your name in lists and menus.",
      "Nothing you cannot change is presented as if you could, and anything read-only says why.",
    ],
    breakIt: [
      "Save with the first name empty.",
      "Upload something that is not an image, and something very large.",
      "Put a very long name in and see whether it breaks the header layout.",
    ],
  }));

  body.push(...run({
    id: "A4",
    title: "Your sessions, and signing other devices out",
    what: "The list of devices and browsers currently signed in as you, and the ability to end one.",
    why: "It is the control a person uses when they think somebody else has their account. If it lies, it is worse than not being there.",
    before: ["You will need a second browser, or a private window, signed in as you."],
    doThis: [
      "Sign in as yourself in a second browser or private window.",
      "In your main window open Me, Security, then Active sessions.",
      "Check both sessions are listed. Read what each row says about device, browser and last activity.",
      "End the other session from here.",
      "Go to the other browser and try to use the app: click around, open a screen.",
      "Come back and check the list again.",
    ],
    passes: [
      "Both sessions appear, and you can tell which one you are currently using.",
      "Ending a session actually stops it. The other browser is signed out or refused on its next action, not left working.",
      "The ended session disappears from the list.",
      "Device and browser descriptions roughly match reality.",
    ],
    breakIt: [
      "Try to end your own current session and see what it does.",
      "Leave a session idle for a while and check whether the last-activity time is honest.",
    ],
  }));

  body.push(...run({
    id: "A5",
    title: "Password change, login history and privacy",
    what: "The remaining personal security screens: changing your password while signed in, the record of sign-ins, your activity, and the privacy page.",
    why: "This is what the system has recorded about a person. If it is wrong or missing, nobody can answer 'was that me?'.",
    before: [],
    doThis: [
      "Open Me, Security. Read the overview and note anything it claims about your account.",
      "Go to Password and change it. Try your current password wrong first.",
      "Set a new one, then sign out and back in with it.",
      "Open Login history. Find the sign-ins you made in A1, including the failed ones.",
      "Open Activity and read what it records.",
      "Open Privacy and read every option carefully.",
    ],
    passes: [
      "Changing the password requires the current one and refuses a wrong one.",
      "Login history shows today's sign-ins with times that match what you actually did, and shows the failures as well as the successes.",
      "It records where from: an address or a device, enough to recognise yourself.",
      "The privacy page describes real settings, and anything it offers actually does something.",
      "The security overview does not claim your account is secure while something on the page says otherwise.",
    ],
    breakIt: [
      "Set your new password to the same as the old one.",
      "Change your password and then check whether your other sessions were signed out. Whatever happens, write down which, because both designs are defensible and only one is intended.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section B: schools ───────────────────────────────────────────────────
  body.push(h1("Part 4  ·  Section B, schools and branches"));
  body.push(p("A school is the customer. Everything else in the system hangs off one: its branches are its physical sites, its users belong to it, and its package decides what it may use."));

  body.push(...run({
    id: "B1",
    title: "The school list",
    what: "Every school on the intranet, with search, filters and an export.",
    why: "It is the screen the team lives on, and the first place a wrong figure gets noticed.",
    before: [],
    doThis: [
      "Open School Management. Read the cards at the top and the columns in the table.",
      "Use the status filter for active, then inactive, then pending.",
      "Search for part of a school name, then for something that cannot exist.",
      "Page to the second page and back.",
      "Use Export and open the file that downloads.",
      "Click a row and check where it takes you.",
    ],
    passes: [
      "Counts at the top agree with what you can page through.",
      "Each filter really narrows to that status, and clearing it restores the full list.",
      "Search matches on name and clears cleanly.",
      "The exported file opens, has a header row, and its rows match what was on screen.",
      "Typing in search does not fire a request on every keystroke. If the screen stutters as you type, note it.",
    ],
    breakIt: [
      "Search for something with no results and check for a proper empty message rather than a blank area.",
      "Combine a filter and a search, then clear only one of them.",
    ],
  }));

  body.push(...run({
    id: "B2",
    title: "Creating a school, all four steps",
    what: "The onboarding wizard: the school itself, its first branch, its first administrator, then its package.",
    why: "This is the single most important flow in your track. Everything a customer ever does starts here, and a mistake creates a broken tenant that somebody has to clean up by hand.",
    before: ["Have a real inbox ready for the administrator email. Use plus-addressing so it comes to you."],
    doThis: [
      'Open School Management, Create school. Step one: name it "QA1 <your name> School". Fill in every field: type, address, email, country, state, motto, website, registration id.',
      "Watch the slug field as you type the name. Note what it does.",
      "Continue to the branch step. Add one branch with its own name, type, address and email.",
      "Try adding a second branch, then removing it again.",
      "Continue to the administrator step. Use your real inbox address and a name you will recognise.",
      "Continue to the package step. Read every field: plan, currency, term structure, the counts for students, teachers and admins, the enabled modules and the expiry date.",
      "Submit and wait. Read the success message.",
      "Find your school in the list and open it.",
    ],
    passes: [
      "You can move forward only when the required fields are filled, and going back keeps what you already typed.",
      "The slug is generated from the name and is sensible.",
      "The school is created with the branch, the administrator and the package you chose, all visible on its detail page.",
      "The administrator gets an activation email at the address you gave.",
      "The success message tells you what happened rather than just closing.",
    ],
    breakIt: [
      "Try to continue from step one with the name empty, then with an invalid email.",
      "Use a school name that already exists.",
      "Set the subscription expiry in the past.",
      "Set the number of students to zero, then to a negative number.",
      "Refresh the page halfway through the wizard and see whether you lose everything. Whatever happens, write it down.",
    ],
    note: "This creates a real tenant with a real user. Create one, not five.",
  }));

  body.push(...run({
    id: "B3",
    title: "Reading a school",
    what: "The school detail page: its identity, its branches, its administrators, its package and its status.",
    why: "It is what somebody opens when a customer calls with a problem, so anything missing here becomes a phone call to engineering.",
    before: ["Use the school you created in B2."],
    doThis: [
      "Open your school from the list. Read every section on the page.",
      "Check the branch you created is listed, and open it with View Branch.",
      "Check the administrator you created is shown.",
      "Check the package details match what you chose in step four.",
      "Note the school's status and when it was activated.",
      "Open a school somebody else created and compare.",
    ],
    passes: [
      "Everything you entered in B2 appears here, correctly.",
      "The branch opens and shows its own details.",
      "The package matches, including the module list and the expiry date.",
      "Nothing shows a raw code where a human label belongs.",
    ],
    breakIt: [
      "Change the school id in the address bar to one that does not exist and check you get a clear not-found rather than a crash.",
    ],
  }));

  body.push(...run({
    id: "B4",
    title: "Editing a school",
    what: "Changing a school's details after it exists.",
    why: "Customers rename, move and change contact details constantly, and an edit that silently drops a field is very hard to notice.",
    before: ["Use your own school from B2."],
    doThis: [
      "Open your school and choose Edit School.",
      "Check every field arrives filled in with the current values, not blank.",
      "Change the motto and the website. Save.",
      "Go back to the detail page and confirm both changed.",
      "Edit again and change only one field. Save. Confirm the others are untouched.",
      "Check whether the slug changed when you renamed anything.",
    ],
    passes: [
      "The form opens populated with what is already there.",
      "Saving changes only what you touched and leaves everything else alone.",
      "The detail page reflects the change immediately.",
      "The slug does not change under an existing school, because the web address depends on it.",
    ],
    breakIt: [
      "Clear a required field and save.",
      "Open the same school in two tabs, change different fields in each, and save both. Note which wins.",
    ],
  }));

  body.push(...run({
    id: "B5",
    title: "Branches",
    what: "Creating, viewing and editing the sites a school operates from.",
    why: "Branches scope who sees what elsewhere in the system, so a wrong branch has consequences far from this screen.",
    before: ["Use your own school."],
    doThis: [
      "From your school, add a second branch. Fill in every field.",
      "Open it with View Branch and read what it shows.",
      "Edit it: change the address and the email. Save and confirm.",
      "Go back to the school and check both branches are listed.",
      "Note which branch, if any, is marked as the main one.",
    ],
    passes: [
      "The new branch appears under the school straight away.",
      "Its details are what you entered.",
      "Editing works and shows the change.",
      "A school always has at least one branch. Try removing the last one and see whether it stops you.",
    ],
    breakIt: [
      "Create a branch with the same name as an existing one.",
      "Create one with an invalid email.",
    ],
  }));

  body.push(...run({
    id: "B6",
    title: "The package a school is on",
    what: "The plan, the limits and the modules a school has been given.",
    why: "This decides what the customer can actually use. Wrong limits either block a paying customer or give away what they have not bought.",
    before: ["Use your own school."],
    doThis: [
      "Open your school's package details and write down every value.",
      "Note the enabled modules list.",
      "Note the counts for students, teachers and admins, and the expiry date.",
      "Compare with another school on a different plan, if there is one.",
    ],
    passes: [
      "The values match what was chosen at creation.",
      "The module list is readable rather than a row of codes.",
      "The expiry date is shown in a form a person can read.",
      "Limits are labelled clearly enough that you can tell what each one caps.",
    ],
    breakIt: [
      "If the package can be edited, set a limit below what the school already uses and see what it says.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section C: people ────────────────────────────────────────────────────
  body.push(h1("Part 5  ·  Section C, people"));
  body.push(p("Two kinds of user share these screens. CX users are our own staff. School users belong to a customer. They are listed separately and they are not interchangeable, which is exactly the distinction most likely to break."));

  body.push(...run({
    id: "C1",
    title: "The user lists",
    what: "CX Users and School Users, each with Members, Invites and Drafts tabs.",
    why: "Confusing our staff with a customer's staff is the kind of mistake that shows one tenant another's people.",
    before: [],
    doThis: [
      "Open Users, CX Users. Read the tabs and the columns.",
      "Move through Members, Invites and Drafts. Note what each contains.",
      "Now open School Users and do the same. Note what is different.",
      "Search for a person by name, then by email.",
      "Filter by status if the screen offers it.",
      "Open View Details on somebody and see where it takes you.",
    ],
    passes: [
      "CX Users lists only our own staff, and School Users only customer staff. No overlap.",
      "Each tab really contains what its name says: members are activated, invites are pending.",
      "Search works on both name and email.",
      "View Details opens that person rather than a blank or the wrong one.",
      "School users show which school and branch they belong to.",
    ],
    breakIt: [
      "Search for a school user from the CX list and confirm they do not appear.",
      "Filter to something empty and check the message.",
    ],
  }));

  body.push(...run({
    id: "C2",
    title: "Inviting a user, and activating them",
    what: "Creating a person, the invitation email they get, and the activation that turns them into a real account.",
    why: "This is how every human being gets into the system. A broken invite is a customer who cannot start.",
    before: ["Have a spare inbox address ready, such as yourname+qa1c@gmail.com."],
    doThis: [
      "From CX Users, create a new user. Fill in name, email and whatever else is required.",
      "Save, then find them under the Invites tab.",
      "Check your inbox for the invitation. Read it properly: does it say who invited you, to what, and what to do?",
      "Try signing in as that person before activating. Note what happens.",
      "Follow the activation link and set a password.",
      "Sign in as them.",
      "Go back to the user list as yourself. They should have moved from Invites to Members.",
      "Find the invite again and try Resend on somebody still pending.",
    ],
    passes: [
      "The invitation email arrives, names the intranet, and its link works.",
      "Signing in before activation is refused, with a message that explains rather than just failing.",
      "Activation sets the password and lets them in.",
      "The person moves from Invites to Members without needing anyone to refresh anything by hand.",
      "Resend produces a second working email, and says it did.",
    ],
    breakIt: [
      "Invite the same email address twice.",
      "Use the activation link a second time after it has been used.",
      "Invite an address with a typo in the domain and see whether anything reports the bounce.",
    ],
    note: "Use only inboxes you control. Never invite a colleague as test data.",
  }));

  body.push(...run({
    id: "C3",
    title: "Suspending and reactivating somebody",
    what: "Taking away and restoring a person's access.",
    why: "Suspension is a security control. If a suspended person can still use the system, that is the most serious kind of bug in this pack.",
    before: ["Use the user you created and activated in C2. Sign in as them in a second browser and leave it open."],
    doThis: [
      "As yourself, find that user and choose Suspend. Read the confirmation.",
      "In the other browser, where they are still signed in, click around and try to open a screen.",
      "Try signing in as them from scratch.",
      "Check how they appear in the list now.",
      "Reactivate them.",
      "Sign in as them again.",
    ],
    passes: [
      "A suspended user cannot sign in, and is stopped in an existing session too rather than being left working until they happen to sign out.",
      "The refusal explains that the account is suspended.",
      "The list shows their status clearly.",
      "Reactivating restores access.",
    ],
    breakIt: [
      "Try to suspend yourself.",
      "Suspend somebody twice.",
    ],
    note: "If a suspended user can still act, stop and raise it as URGENT with the exact steps.",
  }));

  body.push(...run({
    id: "C4",
    title: "Editing a user",
    what: "Changing somebody's details after they exist.",
    why: "Names and email addresses change, and an edit to an email is really a change to how somebody signs in.",
    before: ["Use your own test user, never somebody else's."],
    doThis: [
      "Open your test user and choose Edit.",
      "Check every field arrives populated.",
      "Change their last name and save. Confirm it shows in the list.",
      "Try changing their email address. Note carefully what happens: are they told, do they have to confirm, can they still sign in with the old one?",
      "Open their details again and check everything else is unchanged.",
    ],
    passes: [
      "The form opens populated and saves only what you changed.",
      "The list reflects the change without a manual refresh.",
      "If an email change affects sign-in, the screen says so plainly.",
    ],
    breakIt: [
      "Change their email to one that already belongs to somebody else.",
      "Clear a required field and save.",
    ],
  }));

  body.push(...run({
    id: "C5",
    title: "Drafts and invitations that never completed",
    what: "The Drafts tab, and invitations that were never taken up.",
    why: "Half-created people accumulate, and nobody notices until a list is full of them.",
    before: [],
    doThis: [
      "Open CX Users, Drafts. Read what is there and how it got there.",
      "Start creating a user and abandon it halfway. See whether it lands here.",
      "Open the Invites tab and look for old, unaccepted invitations.",
      "Check whether an invite shows when it was sent and by whom.",
      "See what you can do with a stale invite: resend, revoke, delete.",
    ],
    passes: [
      "Drafts and invites are clearly distinguishable from real members.",
      "Each shows enough to decide what to do with it: who, when, invited by whom.",
      "Whatever actions are offered actually work.",
      "An abandoned draft does not count as a member anywhere.",
    ],
    breakIt: [
      "Revoke an invite and then try its activation link.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section D: organogram and tasks ──────────────────────────────────────
  body.push(h1("Part 6  ·  Section D, organogram and tasks"));
  body.push(p("The organogram is the shape of the organisation: units, the positions inside them, and who reports to whom. Other parts of the system use it to work out who approves what, so a wrong chart has effects a long way from this screen."));

  body.push(...run({
    id: "D1",
    title: "Reading the org chart",
    what: "The organisation drawn as a chart, with its units and the people in them.",
    why: "It is the picture everyone trusts. If it does not match reality, decisions get routed to the wrong people.",
    before: [],
    doThis: [
      "Open Organogram, Org Chart. Let it load fully.",
      "Expand and collapse branches of the chart.",
      "Click a node and see what it tells you.",
      "Find a person you know and check their position and who they sit under.",
      "Try the chart at a narrower window width.",
    ],
    passes: [
      "The chart renders without errors and can be navigated.",
      "Each node shows enough to identify it: unit or position name, and the person in it.",
      "Clicking through gets you to the underlying record.",
      "An empty or one-node chart still renders something sensible.",
    ],
    breakIt: [
      "Collapse everything and then expand it all at once.",
    ],
  }));

  body.push(...run({
    id: "D2",
    title: "Org units and positions",
    what: "The Manage screen, where the units and positions that make up the chart are created and edited.",
    why: "This is the structure itself. A deleted unit with people in it, or a position pointing at the wrong parent, breaks the chart and anything reading it.",
    before: ["Create your own unit rather than editing an existing one."],
    doThis: [
      "Open Organogram, Manage. Note the three tabs: Org Units, Positions and Matrix.",
      'On Org Units, create a new one named "QA1 <your name> Unit". Give it a parent.',
      "Check it appears in the chart in D1.",
      "Edit it: change the name and the parent. Confirm the chart follows.",
      'On Positions, create a position inside your unit, named "QA1 <your name> Role".',
      "Edit the position.",
      "Open the Matrix tab and read what it shows.",
      "Delete your position, then your unit.",
    ],
    passes: [
      "Creating a unit or position puts it in the chart without needing a reload.",
      "Changing a parent moves it in the chart rather than duplicating it.",
      "The delete confirms first, and says what will happen.",
      "Deleting is refused, with a reason, if something still depends on it.",
    ],
    breakIt: [
      "Set a unit's parent to itself.",
      "Create two units with the same name under the same parent.",
      "Delete a unit that still has a position or a person in it. It should stop you.",
    ],
  }));

  body.push(...run({
    id: "D3",
    title: "Staff profiles",
    what: "The employment record behind a person: their seat on the chart, their employment details and their pay.",
    why: "It carries the most sensitive data in your track. Pay must be hidden from anyone without the right permission, and hidden means hidden, not greyed out but readable.",
    before: [],
    doThis: [
      "From Users, open View Details on somebody. It should take you to their staff profile.",
      "Read every section. Note which fields are filled and which are empty.",
      "Look specifically at any pay or salary field. Note exactly how it appears to you.",
      'Create a staff profile of your own, for your test user from C2. Name anything you can "QA1".',
      "Fill in the employment details and assign them to your unit and position from D2.",
      "Save, then open it again and check everything stuck.",
      "Edit it and change the position.",
    ],
    passes: [
      "The profile opens for the right person, matching the user you came from.",
      "Pay figures are either shown in full or masked as dots. If they are masked, the screen should not also show the real number anywhere else on the page.",
      "Creating and editing work, and the assignment shows on the org chart.",
      "Required fields are enforced.",
    ],
    breakIt: [
      "Assign somebody to a position that is already filled and see whether it warns you.",
      "Set an employment end date before the start date.",
    ],
    note: "If you can read a pay figure anywhere on a page whose main field is masked, that is a real finding. Raise it as URGENT.",
  }));

  body.push(...run({
    id: "D4",
    title: "Tasks",
    what: "The task list: creating something to be done, assigning it and completing it.",
    why: "It is the simplest flow in your track, which makes it the one most likely to have been left half-finished.",
    before: [],
    doThis: [
      "Open Tasks in the sidebar. Read the views on offer.",
      'Create a task named "QA1 <your name> task" with a due date, assigned to yourself.',
      "Find it in the list. Check the due date and the assignee.",
      "Create a second one assigned to your test user from C2.",
      "Complete the first task. Note what happens to it, and look for an Undo.",
      "Use Undo if it is offered.",
      "Delete the second task.",
      "Switch between the task views and check your tasks appear where they should.",
    ],
    passes: [
      "A task saves with the assignee and due date you gave it.",
      "Completing it moves it out of the open list.",
      "Undo actually restores it.",
      "Deleting confirms first.",
      "The views really differ: one showing everything and one showing only yours should not be identical.",
    ],
    breakIt: [
      "Create a task with no title.",
      "Set a due date in the past.",
      "Complete the same task twice quickly.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section E: cross-cutting ─────────────────────────────────────────────
  body.push(h1("Part 7  ·  Section E, checks to repeat on every screen"));
  body.push(p("Pick any six screens from your track, including at least two lists, one multi-step form and one detail page, and put each through both runs."));

  body.push(...run({
    id: "E1",
    title: "On a phone",
    what: "The same screens at phone width.",
    why: "People switch from desk to phone. Desktop is the design we care most about, but a phone must never be broken, cut off, or scrolling sideways.",
    before: ["Use a real phone if you have one, otherwise make your browser window about 390 pixels wide."],
    doThis: [
      "Open each of your six screens at phone width.",
      "Scroll down the whole page, then try to scroll sideways.",
      "Open the school creation wizard and get through all four steps without turning the phone sideways.",
      "Open a detail page with tabs and move between them.",
      "Open the sidebar, navigate somewhere, and close it.",
      "Repeat at tablet width, about 820 pixels.",
    ],
    passes: [
      "No page scrolls sideways. Ever. If one does, note which screen.",
      "Lists become stacked cards rather than a squashed table, and no column of data is simply gone.",
      "Every button you need can be reached and tapped, including the one that saves.",
      "Nothing overlaps anything else and no text is cut off mid-word.",
      "The org chart is usable at phone width, even if it needs panning.",
    ],
    breakIt: [
      "Use a very long school name and a very long person name and see whether they wrap or push the layout out.",
      "Open a form and rotate the phone.",
    ],
  }));

  body.push(...run({
    id: "E2",
    title: "Empty, loading and error states",
    what: "What each screen shows when there is nothing to show, while it is fetching, and when something goes wrong.",
    why: "Most screens are built and checked with data in them. The empty version is what a brand new customer sees on their first day.",
    before: ["Use filters to produce genuinely empty results rather than deleting anything."],
    doThis: [
      "On each of your six screens, filter to something with no results.",
      "Watch what happens while a screen loads. Note anything that flashes, jumps, or shows zero before showing the real number.",
      "Turn your internet off, reload a screen, and watch. Turn it back on and see whether it recovers by itself.",
      "Open a detail page for something that does not exist by editing the address bar.",
      "Open a brand new school with no users and look at its people list.",
    ],
    passes: [
      "An empty list says so in words, and ideally says what to do about it.",
      "A missing record gives a clear not-found message, not a crash or a blank page.",
      "Losing the connection produces a message that says so, and the screen recovers when it returns.",
      "No screen ever shows a raw technical error, a stack of code, or the word undefined.",
    ],
    breakIt: [
      "Click a save button twice quickly and see whether you get two of whatever you were creating.",
      "Use the browser back button in the middle of the school wizard, then go forward again.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── wrap-up + sign-off ───────────────────────────────────────────────────
  body.push(h1("Part 8  ·  Sign-off"));
  body.push(h2("What to write up at the end"));
  body.push(p("When you have finished, post one short message to the team channel with four things:"));
  body.push(...bullets([
    "How many runs you completed, and which you could not do and why.",
    "The ticket numbers you raised, grouped by priority.",
    "The single worst thing you found.",
    "Anything in this pack that was wrong, unclear, or sent you the wrong way. That feedback shapes the other packs, so it is worth as much as the bugs.",
  ]));
  body.push(spacer());
  body.push(...K.signOff(runIds));

  return { trackNo: TRACK_NO, trackName: TRACK_NAME, body, runCount: runIds.length };
};
