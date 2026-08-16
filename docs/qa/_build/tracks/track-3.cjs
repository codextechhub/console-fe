// Track 3 - Approvals and Platform Communications.
//
// The machinery that decides whether something is allowed to happen, and
// everything the platform says to people: notifications, tickets, guides,
// settings and the health screens that say whether any of it is working.

const K = require("../pack.cjs");
const { t, p, h1, h2, bullets, steps, small, callout, spacer, makeRun } = K;

const TRACK_NO = 3;
const TRACK_NAME = "Approvals and Platform Communications";
const PREFIX = "QA3";

module.exports = function buildTrack3() {
  const runIds = [];
  const run = makeRun(runIds);
  const body = [];

  body.push(...K.coverAndContents({
    trackNo: TRACK_NO,
    trackName: TRACK_NAME,
    blurb: "One tester. Twenty-four test runs. Who has to say yes before something happens, what the platform tells people, and how you find out when any of it stops working.",
    contents: [
      ["Part 1", "Read this first: the first five minutes, house rules, the list of things that look broken but are not, and how to report a problem", "20 min"],
      ["Part 2", "The short version: send something for approval and take it all the way through", "30 min"],
      ["Part 3", "Section A - The approval inbox (4 runs). Reading a queue, approving, rejecting, returning", "1 hr"],
      ["Part 4", "Section B - Your own submissions (2 runs). Tracking one, withdrawing, resubmitting", "30 min"],
      ["Part 5", "Section C - Cover and load (3 runs). Delegations, every instance, team load", "45 min"],
      ["Part 6", "Section D - Building the machine (4 runs). Approver groups, ladders, previewing approvers, publishing", "1 hr 30"],
      ["Part 7", "Section E - Notifications (3 runs). The inbox, the templates, the delivery history", "1 hr"],
      ["Part 8", "Section F - Support, guides and documents (3 runs)", "45 min"],
      ["Part 9", "Section G - Settings, health and the home page (3 runs)", "45 min"],
      ["Part 10", "Section H - Checks to repeat on every screen (2 runs)", "30 min"],
      ["Part 11", "Sign-off sheet", "-"],
    ],
  }));

  body.push(...K.partOne({
    trackNo: TRACK_NO,
    prefix: PREFIX,
    whatYouAreTesting: [
      "Your track has two halves that belong together: the approvals engine, and everything the platform says to people.",
      "The engine works like this. Somebody submits something consequential - a journal, a purchase order, a permission change. A template decides who has to approve it, in what order. Those approvers might be named by a role, by a group, by a position on the org chart, or by a rule evaluated at the moment of submission. Each stage passes, and when the last one does, the thing actually happens. At any point it can be rejected, returned to the person who asked, or withdrawn by them.",
      "The other half is what the platform says while all that is going on: the notifications it sends, the templates that wording comes from, the record of what was delivered, the support tickets people raise, the guides they read, and the health screens that tell us whether the machine is running at all.",
      "The two meet constantly. An approval that nobody is told about has not really happened.",
    ],
    notYours: "You are not testing the documents themselves. Whether an invoice is correct belongs to Track 4, a purchase order to Track 6, and a permission change to Track 2. You are testing whether the right people were asked, in the right order, and told about it.",
    firstSteps: [
      "Open Workflow in the left sidebar and confirm you can see Approvals, My Submissions, Delegations, Templates and Approver Groups. If any are missing you are blocked, so tell Chidera before going further.",
      "Open Notifications and Support so you know where they are. Then open Health and note whether you can reach it.",
      'Open Support and create one throwaway ticket titled "QA3 smoke test, please ignore". This proves your reporting channel works before you need it in anger. If ticket creation itself fails, message Chidera directly.',
      "You will need somebody to approve things that you submit, and something to submit. Agree with Chidera which other tester will play the approver, and which document type you will use.",
    ],
    houseRules: [
      [t("Never approve or reject somebody else's real submission. ", { bold: true }), t("Work only on documents you or your agreed partner created for this round.")],
      [t("Never edit a workflow template that other tracks depend on. ", { bold: true }), t("Publishing a changed ladder can park every submission the other five testers make. Build your own and name it with your prefix.")],
      [t("Never edit a notification template that is in use. ", { bold: true }), t("The wording goes out to real inboxes. Create your own or copy one first.")],
    ],
    knownIntended: [
      "1.  A submission can park because nobody is eligible to approve it. That is honest behaviour, not a hang: the system is refusing to pretend somebody approved. There is a control to release it, and the screen should offer it.",
      "2.  Editing a notification template changes future sends only. Messages already sent keep the wording they went out with.",
      "3.  Delivery history records what the platform handed to the mail service. Sent means we handed it off successfully, not that a human opened it.",
      "4.  Some how-to guides are drafts and do not appear in search. Finance and procurement guides are not written yet at all, so their screens offer only general ones. Do not raise those as missing.",
      "5.  Documents is restricted to our own staff. A school user cannot see it, by design.",
      "6.  Health screens include synthetic checks the platform runs against itself. A probe you did not trigger is not a mystery.",
      "7.  Lists show 25 rows at a time with a pager at the bottom. Intended.",
      "8.  A screen that is missing from the sidebar entirely is a permissions matter, not a bug. Tell Chidera so your account can be granted the key, and note it as blocked.",
    ],
    crossTrack: [
      ["You need something to submit for approval", "Ask the tester who owns that document type to create one, or create a draft yourself. You are testing the approval, not the document."],
      ["An approval applies but the document does not change", "That is the document's own screen, so hand it to its tester with the instance reference. The engine's job ended when it said yes."],
      ["Nobody is eligible to approve your submission", "That is run D4 and a real finding if the screen does not explain it. Note the template and carry on."],
      ["Nothing loads at all and every screen errors", "The intranet is probably down. Say so in the team channel first. One ticket for everyone, not six."],
    ],
  }));

  // ── Part 2: smoke run ────────────────────────────────────────────────────
  body.push(h1("Part 2  ·  The short version, run this first"));
  body.push(p("Walk one thing all the way through the engine, from submission to done, in about half an hour. You will need your agreed partner available to act as the approver."));
  body.push(...steps([
    "Create or find a draft document of the type you agreed, and submit it for approval.",
    "Read what the screen tells you: who it went to, and what happens next.",
    "Open Workflow, My Submissions, and find it. Note its stage and status.",
    "Ask your partner to open Workflow, Approvals. It should be waiting in their queue.",
    "Watch them open it. Can they see what they are approving without leaving the screen?",
    "Have them approve it. Confirm the submission moves on.",
    "Check your notifications. You should have been told.",
    "Open Workflow, All Instances and find the completed run with its full history.",
  ]));
  body.push(callout("If it never reaches the approver's queue", [
    "Note the template it used and whether the screen said anything when you submitted, then raise it as HIGH and move to Section D, which is about the templates themselves. Do not keep submitting more documents in the hope that one lands.",
  ], "FBEAEA"));
  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section A: the inbox ─────────────────────────────────────────────────
  body.push(h1("Part 3  ·  Section A, the approval inbox"));
  body.push(p("This is where an approver lives. Everything they need to decide should be on the screen in front of them, because an approver who has to go and look something up will eventually stop looking."));

  body.push(...run({
    id: "A1",
    title: "Reading the queue",
    what: "The list of things waiting for you, and what each row tells you before you open it.",
    why: "An approver triages before they decide. A queue that does not show age, amount and who asked cannot be triaged at all.",
    before: ["Have at least two things waiting. Ask your partner to submit a second."],
    doThis: [
      "Open Workflow, Approvals. Read the columns.",
      "Note whether you can tell, without opening anything: what it is, who asked, how long it has waited, and how big it is.",
      "Sort or filter if the screen offers it.",
      "Check the count in the sidebar or the header against the number of rows.",
      "Open one and come back. Note whether your place in the list is kept.",
      "Have your partner submit another while you watch, and see whether it appears without a manual refresh.",
    ],
    passes: [
      "Every row identifies what it is and who asked for it.",
      "Age is shown, and an old item is visibly different from a new one.",
      "The count matches the rows.",
      "Coming back from a decision returns you to the queue, not to the top of the app.",
    ],
    breakIt: [
      "Empty your queue completely and check the empty state says something useful rather than looking broken.",
    ],
  }));

  body.push(...run({
    id: "A2",
    title: "Approving something",
    what: "Opening one item, seeing what you are approving, and saying yes.",
    why: "This is the moment the money moves or the permission changes. Approving without seeing the evidence is the thing this screen exists to prevent.",
    before: ["Something waiting in your queue."],
    doThis: [
      "Open an item from the queue. Read everything on the screen before touching anything.",
      "Note whether you can see the actual document, or only a summary of it.",
      "Look for the stage you are on and how many remain.",
      "Look for who else has already approved and what they said.",
      "Approve it. Read the confirmation before you commit.",
      "Confirm and read what it tells you afterwards.",
      "Go back to the queue and confirm it is gone.",
      "Find the same item in All Instances and check your approval is recorded with your name and the time.",
    ],
    passes: [
      "You can see what you are approving without leaving the screen.",
      "The stage and the remaining stages are clear.",
      "Approving asks you to confirm and says what will happen.",
      "It leaves your queue and advances to the next stage, or completes.",
      "Your decision is recorded against your name.",
    ],
    breakIt: [
      "Approve the same item twice, using the back button to return to it.",
      "Open the same item in two tabs and approve in both.",
      "Approve something you submitted yourself, if it reaches you. Note carefully whether it lets you, because self-approval defeats the control.",
    ],
    note: "If you can approve your own submission, write it up even if the system allows it. That is a policy question worth asking out loud.",
  }));

  body.push(...run({
    id: "A3",
    title: "Rejecting, and returning to the requester",
    what: "The two ways of saying no: rejecting outright, and sending it back for changes.",
    why: "They are different outcomes and are constantly confused. A rejection ends the run. A return puts the ball back in the requester's court with the run still alive.",
    before: ["Two things waiting, so you can do one of each."],
    doThis: [
      "Open one item and reject it. Read the confirmation and note whether it asks for a reason.",
      "Give a reason. Confirm.",
      "Ask your partner what they now see on their side: is the document dead, and were they told why?",
      "Open the second item and return it to the requester instead.",
      "Again, note whether a reason is required and what your partner sees.",
      "Ask your partner to change something and resubmit the returned one.",
      "Check it comes back to you, and whether it starts again from the first stage or resumes where it was.",
    ],
    passes: [
      "Reject and return are visibly different actions with different outcomes.",
      "Both require or at least invite a reason, and that reason reaches the requester.",
      "A rejected item is finished. A returned one can be resubmitted.",
      "The requester is told, in a notification rather than only on a screen they might not visit.",
      "Whatever the resubmission rule is, the screen says which it is doing.",
    ],
    breakIt: [
      "Reject with an empty reason.",
      "Return something that is on the first stage, so there is nowhere further back to go.",
    ],
  }));

  body.push(...run({
    id: "A4",
    title: "What an approver is told",
    what: "The notifications that reach an approver when something needs them, and reach a requester when a decision is made.",
    why: "An approval queue nobody is told about is a queue that fills up. This is the difference between a control and a bottleneck.",
    before: ["Do this alongside A2 and A3 rather than afterwards, so you can watch the notifications arrive."],
    doThis: [
      "Before your partner submits, note the time and open your Notifications inbox.",
      "Have them submit. Watch for a notification and note how long it takes.",
      "Read it: does it say what needs approving, who asked, and does its link take you to the right place?",
      "Approve it, and ask your partner whether they were told.",
      "Repeat for a rejection and check the requester is told, with the reason.",
      "Check whether any of these also arrived by email, and whether that matches what the settings say should happen.",
    ],
    passes: [
      "An approver is told when something lands in their queue.",
      "The requester is told the outcome, including the reason for a no.",
      "Every notification's link goes to the specific item, not a general list.",
      "The wording says what happened without needing the reader to already know the jargon.",
    ],
    breakIt: [
      "Approve something very fast after submission and check the requester does not get the outcome before the request.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section B: submissions ───────────────────────────────────────────────
  body.push(h1("Part 4  ·  Section B, your own submissions"));
  body.push(p("The other side of the same machine: what the person who asked can see and do while they wait."));

  body.push(...run({
    id: "B1",
    title: "Tracking something you submitted",
    what: "My Submissions: where your request is, who has it, and what has happened so far.",
    why: "Without it the requester's only option is to ask somebody. This screen is what stops the approvals engine generating phone calls.",
    before: ["Submit something of your own."],
    doThis: [
      "Open Workflow, My Submissions. Find yours.",
      "Read what the row tells you: stage, status, how long it has been waiting.",
      "Open it. Check you can see who it is currently with.",
      "Check you can see the history: what has already been decided and by whom.",
      "Have your partner approve one stage, then reload and confirm it moved.",
      "Find one that was rejected and check the reason is visible here.",
    ],
    passes: [
      "You can tell at a glance where each submission is and who is holding it up.",
      "The history is complete and in order.",
      "A rejection reason is visible to the person who needs it most.",
      "Nothing shows a raw code where a human label belongs.",
    ],
    breakIt: [
      "Look at a submission that completed a long time ago and check its history survived.",
    ],
  }));

  body.push(...run({
    id: "B2",
    title: "Withdrawing and resubmitting",
    what: "Pulling back something you asked for, and sending it again after a change.",
    why: "People submit by mistake. If they cannot withdraw, somebody else has to reject it, which pollutes the record with a no that was never meant.",
    before: ["Have one of your own submissions in flight."],
    doThis: [
      "Open one of your submissions and withdraw it. Read the confirmation.",
      "Check what your partner now sees in their queue. It should be gone.",
      "Check the document itself: is it back to a state you can edit?",
      "Change something and resubmit.",
      "Confirm it reaches the approver again.",
      "Try to withdraw something that has already been fully approved.",
    ],
    passes: [
      "Withdrawing removes it from every approver's queue, not just from your view.",
      "The document becomes editable again.",
      "Resubmitting starts a fresh run and the approver sees it.",
      "Something already approved cannot be withdrawn, and the refusal explains why.",
    ],
    breakIt: [
      "Withdraw at the exact moment your partner is approving, and see which wins.",
      "Withdraw and then use the back button to try withdrawing again.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section C: cover and load ────────────────────────────────────────────
  body.push(h1("Part 5  ·  Section C, cover and load"));
  body.push(p("What happens when an approver is away, and how anybody sees the whole picture rather than just their own queue."));

  body.push(...run({
    id: "C1",
    title: "Delegating your approvals",
    what: "Handing your approval duty to somebody else for a period, and taking it back.",
    why: "It is what stops everything stopping when one person goes on leave. A delegation that does not end on time is a permission nobody remembers granting.",
    before: ["Agree with your partner that they will be your delegate."],
    doThis: [
      "Open Workflow, Delegations. Read what is already there.",
      "Create one: delegate to your partner, from today, ending in a few days. Note whether you can limit it to certain document types.",
      "Save and check it shows as active.",
      "Have something submitted that would come to you. Check whether it reaches your partner.",
      "Check whether it also still reaches you, or only them. Write down which.",
      "Revoke the delegation and confirm the next one comes back to you.",
      "Create one starting in the future and confirm it shows as scheduled rather than active.",
    ],
    passes: [
      "An active delegation actually moves work, checked by watching a real submission.",
      "The list distinguishes active, scheduled, expired and revoked.",
      "Revoking takes effect immediately.",
      "A delegation limited to certain document types only moves those.",
      "Approvals taken by a delegate record who actually decided, not just whose duty it was.",
    ],
    breakIt: [
      "Delegate to yourself.",
      "Set an end date before the start date.",
      "Create two overlapping delegations and see which applies.",
    ],
  }));

  body.push(...run({
    id: "C2",
    title: "Every instance",
    what: "The full list of workflow runs, finished and in flight, across everybody.",
    why: "It is where somebody looks when a thing did not happen and nobody knows why.",
    before: ["Do this after Sections A and B, so there is history."],
    doThis: [
      "Open Workflow, All Instances. Read the columns and filters.",
      "Find every run you have been part of today.",
      "Filter by status: in flight, approved, rejected, cancelled.",
      "Open one that completed and read its whole history end to end.",
      "Compare that history against what you actually did. Every decision should be there.",
      "Find one that is stuck or parked, if there is one, and see whether the screen explains why.",
    ],
    passes: [
      "Every run you took part in appears, once.",
      "The history names each approver, their decision, their reason and the time.",
      "Filters narrow honestly.",
      "A parked run says what it is waiting for.",
    ],
    breakIt: [
      "Cancel a running instance, if the screen allows it, and check what the requester and approvers see.",
    ],
  }));

  body.push(...run({
    id: "C3",
    title: "Team load",
    what: "How much is waiting on each approver.",
    why: "It is how a bottleneck gets spotted before it becomes a complaint.",
    before: [],
    doThis: [
      "Open Workflow, Team Load. Read what it measures.",
      "Check your own figure against the number of items actually in your queue.",
      "Check your partner's against theirs.",
      "Approve something and see whether the figure moves.",
      "Note whether it counts age as well as volume: five things waiting a month is not the same as five waiting an hour.",
    ],
    passes: [
      "The figures match the real queues. Count them.",
      "Clearing an item reduces the figure.",
      "Somebody with nothing waiting reads as clear rather than missing.",
      "It is obvious what the numbers mean without a legend nobody will read.",
    ],
    breakIt: [
      "Look at an approver who has a delegation active and check whose load the work counts against.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section D: building the machine ──────────────────────────────────────
  body.push(h1("Part 6  ·  Section D, building the machine"));
  body.push(p("Everything so far has been using the engine. This section builds it: who counts as an approver, and in what order."));
  body.push(p("Approvers can be named four ways: by a role, by a named group, by a position on the org chart, or by a rule evaluated when the document is submitted. The last one is the powerful and dangerous one, because the answer depends on the document."));

  body.push(...run({
    id: "D1",
    title: "Approver groups",
    what: "Named sets of people who can approve as a unit.",
    why: "A group is the simplest answer to who approves. If its membership resolves wrongly, every ladder using it sends work to the wrong desks.",
    before: [],
    doThis: [
      "Open Workflow, Approver Groups. Read the existing groups and their members.",
      'Create one named "QA3 <your name> Group" and add yourself and your partner.',
      "Note the ways a member can be added: a named person, a role, a position.",
      "Use whatever control shows who the group currently resolves to, and check it lists the right people.",
      "Remove a member and check the resolved list changes.",
      "Try to deactivate or delete a group and see what happens if a template uses it.",
    ],
    passes: [
      "A group shows both its rules and the actual people those rules currently resolve to.",
      "Adding by role brings in everybody with that role, and the screen shows who that is.",
      "Changing membership changes the resolved list immediately.",
      "A group in use cannot be deleted silently.",
    ],
    breakIt: [
      "Create a group with no members and see whether anything warns you.",
      "Add the same person twice.",
    ],
  }));

  body.push(...run({
    id: "D2",
    title: "Building a ladder",
    what: "A workflow template: the stages a document passes through and who approves each one.",
    why: "This is the rulebook. Everything the engine does comes from here, and a mistake affects every document of that type from then on.",
    before: ["Build your own template. Never edit one another track relies on."],
    doThis: [
      'Open Workflow, Templates and create one named "QA3 <your name> Template".',
      "Add a first stage approved by your own group from D1.",
      "Add a second stage approved a different way: by a role, or by a position on the org chart.",
      "Look for the setting that decides what happens if a stage has nobody to approve it. Read it carefully and note its default.",
      "Look for a threshold or condition that decides whether a stage applies at all.",
      "Save as a draft. Confirm nothing is live yet.",
      "Read the whole template back and check it says what you meant.",
    ],
    passes: [
      "Stages are clearly ordered and can be reordered.",
      "Each stage says plainly who will approve it and how those people are found.",
      "The auto-skip or no-approver setting is visible rather than buried, and its default is stated.",
      "A draft has no effect on live documents.",
    ],
    breakIt: [
      "Create a template with no stages.",
      "Create a stage with no approver source.",
      "Set two stages to the same order number.",
    ],
    note: "Pay attention to the no-approver default. A stage that quietly skips itself when nobody can approve is a control that switches itself off.",
  }));

  body.push(...run({
    id: "D3",
    title: "Previewing who would approve",
    what: "The control that answers, before publishing, exactly which people a ladder would send work to.",
    why: "It is the difference between building a rule and hoping. Without it, the only way to find out who approves is to submit something real.",
    before: ["Your draft template from D2."],
    doThis: [
      "Find the preview or test control on your template.",
      "Run it and read the result: for each stage, which named people would be asked.",
      "Check those names against what you intended.",
      "Change a stage's approver source and preview again. The names should change.",
      "Set up a stage that resolves to nobody, on purpose, and preview it. Note exactly what it says.",
      "Try previewing against different inputs if the screen offers them, such as a larger amount.",
    ],
    passes: [
      "The preview names real people, not just the rule.",
      "It updates when you change the ladder.",
      "A stage resolving to nobody is reported clearly, before publishing rather than after.",
      "The preview matches what actually happens when you publish and submit. Check this in D4.",
    ],
    breakIt: [
      "Preview a template with no stages.",
      "Preview one whose group has no members.",
    ],
  }));

  body.push(...run({
    id: "D4",
    title: "Publishing, and the case where nobody can approve",
    what: "Making a ladder live, submitting against it, and what happens when the ladder asks for an approver who does not exist.",
    why: "The parked case is the honest one and the most important thing in this section. The system refuses to pretend somebody approved, and somebody has to be able to release it deliberately.",
    before: ["Your template from D2 and D3. Agree with Chidera before publishing anything that affects a real document type."],
    doThis: [
      "Publish your template. Read what it says about what it now governs.",
      "Submit a document that should use it.",
      "Confirm it goes to the people the preview named in D3. This is the check that matters.",
      "Now change your group so the second stage resolves to nobody, and publish again.",
      "Submit another document.",
      "Read very carefully what happens: does it park, does it skip the stage, or does it complete?",
      "If it parks, find the control that releases it and read what that control says it will do.",
      "Release it and check the release is recorded against your name.",
    ],
    passes: [
      "A published ladder sends work to exactly the people the preview promised.",
      "A stage with no eligible approver parks the document rather than skipping it silently.",
      "The screen explains that it is parked and why, in words a requester can understand.",
      "Releasing it is a deliberate, recorded act, not a quiet default.",
    ],
    breakIt: [
      "Publish a template while a document is mid-flight against the old version, and see which ladder that document follows. Write down which, because both answers are defensible and only one is intended.",
      "Publish two templates covering the same document type and see which wins.",
    ],
    note: "If a stage silently skips itself when nobody can approve, that is the highest-value finding in this track. Raise it as HIGH with the template name.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section E: notifications ─────────────────────────────────────────────
  body.push(h1("Part 7  ·  Section E, notifications"));
  body.push(p("Everything the platform says to people, the wording it says it in, and the record of whether it arrived."));

  body.push(...run({
    id: "E1",
    title: "Your inbox",
    what: "The notifications you have received, read and unread.",
    why: "It is where every other part of the system reaches a person. If it is noisy or stale, people stop looking at it and the approvals engine stops working.",
    before: ["You should have real notifications from Sections A to D."],
    doThis: [
      "Open Notifications. Read what is there.",
      "Note the unread count and check it against the number of unread rows.",
      "Open one. Confirm the count drops and the row changes.",
      "Use Mark all as read.",
      "Search for one you know exists.",
      "Filter by read state.",
      "Click a notification's link and confirm it lands on the exact thing it refers to.",
      "Have your partner do something that notifies you, and see whether it arrives without a manual refresh.",
    ],
    passes: [
      "The unread count matches reality and drops as you read.",
      "Every notification links to the specific thing, not a general list.",
      "Mark all as read does exactly that and does not come back.",
      "Search and filters work.",
      "The wording of each message says what happened without jargon.",
    ],
    breakIt: [
      "Mark all as read on an empty inbox.",
      "Open a notification whose underlying record has since been deleted.",
    ],
  }));

  body.push(...run({
    id: "E2",
    title: "Event types and templates",
    what: "The administration side: the catalogue of things the platform can tell people about, and the wording it uses.",
    why: "This is the copy that reaches customers. A wrong template sends the wrong words to a real person, and cannot be recalled.",
    before: ["Do not edit a template that is in use. Copy one, or create your own."],
    doThis: [
      "Open Notifications, Administration. Find Event Types and read the catalogue.",
      "Note what each event is for and which channels it supports.",
      "Open Templates and read a few. Note the placeholders in curly braces and what they stand for.",
      "Open one in the editor and read the preview beside it.",
      "Change some wording in a template you are allowed to touch and watch the preview update.",
      "Look for a placeholder you could get wrong, and try a name that does not exist. Note what the preview does.",
      "Save, then trigger that event and read the real message that arrives.",
      "Compare the message received against the preview.",
    ],
    passes: [
      "Every event says plainly when it fires and to whom.",
      "The editor previews the result rather than making you imagine it.",
      "A placeholder that does not exist is reported rather than sent out as literal text.",
      "The message that actually arrives matches the preview.",
      "Editing is prevented, or clearly warned about, on templates in active use.",
    ],
    breakIt: [
      "Remove a required placeholder, such as the recipient's name, and send.",
      "Put unbalanced braces in the body.",
      "Save an empty subject.",
    ],
    note: "Anything you send here reaches a real inbox. Trigger events only against your own test data.",
  }));

  body.push(...run({
    id: "E3",
    title: "Delivery history",
    what: "The record of what the platform tried to send, to whom, and whether it succeeded.",
    why: "It is the only way to answer whether somebody was actually told. Without it, every complaint about a missing email is unanswerable.",
    before: ["Trigger a few notifications first, including at least one email."],
    doThis: [
      "Open Notifications, Administration, Delivery History.",
      "Find the messages generated by your own work in Sections A to D.",
      "Read a row: recipient, channel, event, status, time.",
      "Filter by channel, then by status, then by event type.",
      "Find a failed delivery if one exists, and read its reason.",
      "Deliberately cause a failure: trigger something to an address that cannot receive, and find it here.",
      "Check whether an in-app message and an email for the same event appear as separate rows.",
    ],
    passes: [
      "Every message you triggered appears.",
      "Status is honest: sent means handed to the mail service, and a failure says why.",
      "Filters work and combine.",
      "A failed delivery carries enough detail to act on: which address and what went wrong.",
    ],
    breakIt: [
      "Filter to a date range with nothing in it.",
      "Look for a message sent to a user who was deleted afterwards.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section F: support, guides, documents ────────────────────────────────
  body.push(h1("Part 8  ·  Section F, support, guides and documents"));
  body.push(p("What somebody does when they are stuck, and what they read to avoid getting stuck."));

  body.push(...run({
    id: "F1",
    title: "Raising and working a ticket",
    what: "The support centre: creating a ticket, its life, and its conversation.",
    why: "Every other tester in this round depends on it. If ticketing is broken, six people have nowhere to report anything.",
    before: [],
    doThis: [
      "Open Support. Read the cards at the top and the list beneath.",
      "Create a ticket with a title, description, category and priority. Attach a screenshot.",
      "Find it in the list. Check the attachment opens.",
      "Open it and add a comment.",
      "Change its status, and assign it to somebody if you can.",
      "Check whether the person it was assigned to was notified.",
      "Filter the list by status and by priority.",
      "Resolve it, then reopen it.",
    ],
    passes: [
      "A ticket saves with everything you gave it, including the attachment.",
      "Comments appear in order with author and time.",
      "Status changes stick and are visible in the list.",
      "Assignment notifies the person assigned.",
      "The counts at the top agree with the filtered lists.",
    ],
    breakIt: [
      "Create a ticket with no title.",
      "Attach a very large file, and a file type not on the accepted list.",
      "Resolve a ticket twice.",
    ],
  }));

  body.push(...run({
    id: "F2",
    title: "The help panel and the guides",
    what: "The help button, the guides matched to a page, and the walkthroughs that highlight things on screen.",
    why: "It is the product teaching itself. A guide that describes a screen that has changed is worse than no guide, because it is believed.",
    before: [],
    doThis: [
      "Open the help button from a screen with guides, such as one in Schools or Roles.",
      "Read what it offers for that page.",
      "Open a guide and read it properly against the screen it describes. Check every claim.",
      "Follow any on-this-page navigation inside the article.",
      "Start a walkthrough if one is offered. Step through it to the end.",
      "Watch what it highlights and whether the thing it points at is actually there.",
      "Check the walkthrough never presses a button for you on anything consequential.",
      "Search the guides for something you know exists, and something that does not.",
    ],
    passes: [
      "The guides offered match the page you are on.",
      "Every statement in the article is true of the screen today.",
      "A walkthrough highlights real, present controls and does not get stuck.",
      "It explains consequential actions but never performs them.",
      "Search finds published guides and does not surface drafts.",
    ],
    breakIt: [
      "Start a walkthrough and navigate away halfway through.",
      "Start one on a screen where the thing it wants to highlight is not present, such as an empty list.",
    ],
    note: "Finance and procurement guides are not written yet. Do not report those as missing. Do report a guide that opens and says something untrue.",
  }));

  body.push(...run({
    id: "F3",
    title: "The documents library",
    what: "The requirements documents, searchable and downloadable, restricted to our own staff.",
    why: "It carries internal specifications describing every customer's system. Who cannot see it matters more than who can.",
    before: ["You will need a school user to test the restriction. Ask the Track 1 tester."],
    doThis: [
      "Open Documents. Read the list and the version shown against each.",
      "Search for one and download it. Open the file and confirm it is a real document.",
      "Open the version history for one and download an older version.",
      "Confirm the two files are actually different.",
      "Now sign in as a school user in a second browser and look for Documents in their sidebar.",
      "Copy the Documents address and paste it into their browser directly.",
    ],
    passes: [
      "Documents download and open as real files.",
      "Version history works and older versions differ from current ones.",
      "A school user cannot see Documents in their menu.",
      "A school user pasting the address directly is refused, not merely shown an empty list.",
    ],
    breakIt: [
      "Search for something with no matches.",
      "Download the same document twice quickly.",
    ],
    note: "The direct-address check is the one that matters. A hidden menu item is not a restriction.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section G: settings, health, home ────────────────────────────────────
  body.push(h1("Part 9  ·  Section G, settings, health and the home page"));

  body.push(...run({
    id: "G1",
    title: "Platform settings",
    what: "The configuration values that change how the platform behaves.",
    why: "A setting that displays one value and applies another is the hardest class of bug to find, because everything looks right.",
    before: ["Change one setting at a time and put it back afterwards."],
    doThis: [
      "Open Settings. Read the sections and what each value controls.",
      "Pick one with a visible effect, such as an account lock duration or a contact detail.",
      "Note its current value. Change it and save.",
      "Reload the page and confirm the new value is what is shown.",
      "Now go and observe the behaviour it controls, and check it actually changed.",
      "Put the value back.",
      "Look for anything that says who changed a setting and when.",
    ],
    passes: [
      "Saving persists across a reload.",
      "The setting actually changes the behaviour, not just the display.",
      "Each value explains what it does in words.",
      "Invalid values are refused with a reason.",
      "Changes are recorded somewhere, because a setting nobody can trace is a mystery waiting to happen.",
    ],
    breakIt: [
      "Enter a negative number, a zero, and an absurdly large value.",
      "Clear a required setting entirely.",
    ],
  }));

  body.push(...run({
    id: "G2",
    title: "Platform health",
    what: "Uptime, endpoints, jobs and queues, incidents, tenant health, service levels and provider webhooks.",
    why: "It is what tells us the platform is broken before a customer does. A health screen that is always green is worse than no health screen.",
    before: [],
    doThis: [
      "Open Health. Read the command centre and every figure on it.",
      "Move through each sub-screen: Uptime, API & Endpoints, Jobs & Queues, Incidents & Alerts, Tenant Health, SLOs, Provider Webhooks.",
      "On each, work out what it is measuring and over what period. Note anywhere you cannot tell.",
      "Find a figure you can verify independently, such as a job you triggered, and check it.",
      "Look at Jobs & Queues and find work you caused: an export, an email, a notification.",
      "Check whether any screen claims to be live and is actually stale.",
      "Look for anything red or breached, and follow it through to detail.",
    ],
    passes: [
      "Every figure says what period it covers.",
      "Work you actually caused appears where it should.",
      "Nothing claims to be live while showing figures from an hour ago.",
      "A failure or breach can be clicked through to something actionable.",
      "A healthy system reads as healthy without hiding a problem behind an average.",
    ],
    breakIt: [
      "Cause a failure on purpose, such as an email to an impossible address, and see whether health notices.",
    ],
  }));

  body.push(...run({
    id: "G3",
    title: "The home page",
    what: "The dashboard everybody lands on: what is waiting for them, and what to keep an eye on.",
    why: "It is the first screen of every working day. If it shows work that is already done, people stop trusting it within a week.",
    before: ["Do this after Sections A to D, so you have real items outstanding."],
    doThis: [
      "Open Home. Read every row and card.",
      "Check the things listed as yours really are: an approval waiting on you, a task, a ticket.",
      "Now clear one, by approving it or completing it.",
      "Come back to Home and check the row has gone or the count has dropped.",
      "Follow a deep link from a row and confirm it lands on the filtered screen it promised.",
      "Note the split between what is yours to act on and what you are only watching.",
      "Leave the tab and come back, and see whether it refreshes.",
    ],
    passes: [
      "Doing the work clears the row. This is the single most important thing on this screen.",
      "Nothing is listed as yours that is not actually assigned to you.",
      "Deep links land on the specific filtered view, not a general list.",
      "Counts match the screens behind them.",
      "A quiet day reads as quiet rather than as an error.",
    ],
    breakIt: [
      "Clear everything and see whether the empty state is encouraging or looks broken.",
      "Have your partner assign you something while you watch, and see how long it takes to appear.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section H: cross-cutting ─────────────────────────────────────────────
  body.push(h1("Part 10  ·  Section H, checks to repeat on every screen"));
  body.push(p("Pick any six screens from your track, including the approval inbox, the template builder, the notification editor and one health screen."));

  body.push(...run({
    id: "H1",
    title: "On a phone",
    what: "The same screens at phone width.",
    why: "Approving is exactly the kind of thing people do on a phone between meetings, so this track's phone behaviour matters more than most.",
    before: ["Use a real phone if you have one, otherwise make your browser window about 390 pixels wide."],
    doThis: [
      "Open the approval inbox at phone width and approve something, start to finish.",
      "Read a submission's history on a phone.",
      "Open your notifications and read one.",
      "Open the template builder and see how far you get.",
      "Open a health screen with a wide table.",
      "Scroll every page down, then try to scroll sideways.",
      "Repeat at tablet width, about 820 pixels.",
    ],
    passes: [
      "No page scrolls sideways. Ever.",
      "Approving works completely on a phone, including seeing what you are approving before you decide.",
      "Notifications are readable and their links work.",
      "Health tables scroll inside themselves rather than stretching the page.",
    ],
    breakIt: [
      "Open a submission with a long history and check it does not overflow.",
    ],
    note: "The template builder is a complex editor, so on a phone it only has to be usable, not comfortable. Approving is the opposite: that must be genuinely good.",
  }));

  body.push(...run({
    id: "H2",
    title: "Empty, loading and error states",
    what: "What each screen shows when there is nothing to show, while it is fetching, and when something goes wrong.",
    why: "An empty approval queue is the normal state for most people most of the time, so it had better look deliberate.",
    before: ["Clear your own queue for this run."],
    doThis: [
      "Empty your approval queue and look at the screen.",
      "Look at an empty notification inbox.",
      "Filter each of your six screens to something with no results.",
      "Watch what happens while a screen loads. Note anything that flashes or shows zero first.",
      "Turn your internet off, reload, and watch. Turn it back on and see whether it recovers.",
      "Open an instance detail for an id that does not exist.",
    ],
    passes: [
      "An empty queue reads as done rather than broken, and says so.",
      "A missing record gives a clear not-found message.",
      "Losing the connection produces a message that says so.",
      "No screen ever shows a raw technical error, a stack of code, or the word undefined.",
    ],
    breakIt: [
      "Click Approve twice quickly and check you do not record two decisions.",
      "Use the browser back button after approving and try to approve again.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── wrap-up + sign-off ───────────────────────────────────────────────────
  body.push(h1("Part 11  ·  Sign-off"));
  body.push(h2("What to write up at the end"));
  body.push(p("When you have finished, post one short message to the team channel with four things:"));
  body.push(...bullets([
    "How many runs you completed, and which you could not do and why.",
    "The ticket numbers you raised, grouped by priority.",
    "The single worst thing you found. If a stage skipped itself when nobody could approve it, that is the answer.",
    "Anything in this pack that was wrong, unclear, or sent you the wrong way. That feedback shapes the other packs, so it is worth as much as the bugs.",
  ]));
  body.push(spacer());
  body.push(small("Leave the machine as you found it. Unpublish or delete your template, revoke your delegation, and put back any notification template or setting you changed."));
  body.push(spacer());
  body.push(...K.signOff(runIds));

  return { trackNo: TRACK_NO, trackName: TRACK_NAME, body, runCount: runIds.length };
};
