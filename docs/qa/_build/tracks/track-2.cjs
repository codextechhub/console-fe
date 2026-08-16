// Track 2 - Access Control and Audit.
//
// Who is allowed to do what, and the record of what they did. The two halves
// belong together: a permission system nobody can audit is a permission system
// nobody can trust, and an audit trail with holes in it is worse than none.

const K = require("../pack.cjs");
const { t, p, h1, h2, bullets, steps, small, callout, spacer, makeRun } = K;

const TRACK_NO = 2;
const TRACK_NAME = "Access Control and Audit";
const PREFIX = "QA2";

module.exports = function buildTrack2() {
  const runIds = [];
  const run = makeRun(runIds);
  const body = [];

  body.push(...K.coverAndContents({
    trackNo: TRACK_NO,
    trackName: TRACK_NAME,
    blurb: "One tester. Twenty-three test runs. Who is allowed to do what, whether the system actually enforces it, and whether the record of what happened can be trusted.",
    contents: [
      ["Part 1", "Read this first: the first five minutes, house rules, the list of things that look broken but are not, and how to report a problem", "20 min"],
      ["Part 2", "The short version: grant a permission, watch a screen appear, take it away again", "30 min"],
      ["Part 3", "Section A - Roles (5 runs). Creating them, editing them, permission groups, deleting them", "1 hr"],
      ["Part 4", "Section B - Who holds what (3 runs). Assigning, change requests, transferring Super Admin", "1 hr"],
      ["Part 5", "Section C - The permission catalogue (4 runs). Permissions, modules, resources, actions, dependencies", "1 hr"],
      ["Part 6", "Section D - Does the gate actually hold (3 runs). The most important section in this pack", "1 hr"],
      ["Part 7", "Section E - The audit trail (6 runs). Events, trails, sessions, lockouts, proxy sessions, exports, compliance rules", "1 hr 30"],
      ["Part 8", "Section F - Checks to repeat on every screen (2 runs)", "30 min"],
      ["Part 9", "Sign-off sheet", "-"],
    ],
  }));

  body.push(...K.partOne({
    trackNo: TRACK_NO,
    prefix: PREFIX,
    whatYouAreTesting: [
      "Your track is the lock on every door in the building, and the logbook of who went through which one.",
      "Permissions work in layers. A permission key is the smallest unit, something like the right to post a journal. Keys are collected into roles. Roles are assigned to people. Groups bundle keys that always travel together. Somewhere above all of it sits a Super Admin who can hand that position to somebody else.",
      "Then the audit half: every consequential action leaves a record. Who did it, to what, when, from where, and whether it succeeded. Sessions, failed sign-ins, locked accounts and proxy sessions all land in the same place, because when something goes wrong those are the questions asked.",
      "Section D is the heart of it and the reason this track exists. Hiding a button is not security. The only thing that counts is whether the server refuses.",
    ],
    notYours: "You are not testing what the individual screens do once somebody is allowed in. Schools and users belong to Track 1, approvals to Track 3, and money to Tracks 4, 5 and 6.",
    firstSteps: [
      "Open Roles in the left sidebar and confirm you can see the role list. Then open Permissions and Audit & Security. If any of the three is missing you are blocked, so tell Chidera before going further.",
      "You will need a second account to experiment on. Ask the Track 1 tester for the test user they created, or create one yourself, and get its sign-in details. Never experiment on a real colleague's account.",
      'Open Support in the main sidebar and create one throwaway ticket titled "QA2 smoke test, please ignore". This proves your reporting channel works before you need it in anger. If ticket creation itself fails, message Chidera directly.',
    ],
    houseRules: [
      [t("Never edit a role somebody else is using. ", { bold: true }), t("Create your own, named with your prefix, and experiment on that. Changing a live role can lock a colleague out of their own track mid-test.")],
      [t("Never revoke your own access. ", { bold: true }), t("It is easy to do here and there may be nobody able to give it back to you quickly.")],
      [t("Keep a second browser signed in as your test user throughout. ", { bold: true }), t("Most of this track is about what somebody else can and cannot see, and you need to watch it happen.")],
    ],
    knownIntended: [
      "1.  Audit events cannot be edited or deleted. The log is append-only by design, so the absence of an edit button is the feature.",
      "2.  Some permissions are marked CRITICAL or restricted. Those are meant to be harder to grant and may route through an approval rather than applying immediately.",
      "3.  The security dashboard refreshes about once a minute. A figure that lags slightly behind an action you just took is not necessarily wrong. Wait and look again before raising it.",
      "4.  A role that people currently hold may refuse to be deleted. That is a guard, not a bug. The message should say so.",
      "5.  Transferring Super Admin needs an eligible CX staff member to transfer to. If the list is empty the screen says so.",
      "6.  Lists show 25 rows at a time with a pager at the bottom. Intended.",
      "7.  A screen that is missing from the sidebar entirely is a permissions matter, not a bug. Tell Chidera so your account can be granted the key, and note it as blocked.",
    ],
    crossTrack: [
      ["A permission change needs approving before it applies", "The workflow engine caught it. Note the reference and tell the Track 3 tester, then carry on."],
      ["You need a user to experiment on", "Track 1 creates users. Ask that tester rather than inventing more real accounts."],
      ["A finance or procurement screen refuses somebody who should have access", "Note the exact permission key from the error and hand it to the tester who owns that screen. The key is the useful part, not the screen."],
      ["Nothing loads at all and every screen errors", "The intranet is probably down. Say so in the team channel first. One ticket for everyone, not six."],
    ],
  }));

  // ── Part 2: smoke run ────────────────────────────────────────────────────
  body.push(h1("Part 2  ·  The short version, run this first"));
  body.push(p("This is the whole track in miniature: a permission is granted, a door opens, the permission is taken away, the door closes. Half an hour."));
  body.push(p("Do not write anything up in detail yet. Note anything that surprises you and which run it belongs to."));
  body.push(...steps([
    'Roles, Create Role. Name it "QA2 <your name> Role". Give it exactly one permission: something harmless and easy to see, such as viewing schools.',
    "Roles, Platform User Assignments. Assign your new role to your test user.",
    "In the second browser, signed in as that test user, reload. The screen that permission unlocks should now be reachable.",
    "Copy the web address of that screen.",
    "Back as yourself, revoke the assignment.",
    "In the other browser, reload and try that screen again. It should be gone from the sidebar.",
    "Now paste the address straight into the bar and press enter. This is the important step: the screen must still refuse, not merely be hidden from the menu.",
    "Open Audit & Security, Events Explorer, and find the grant and the revoke you just did.",
  ]));
  body.push(callout("If step 7 lets you in", [
    "Stop and raise it as URGENT immediately, with the exact address and the permission you revoked. A screen that is only hidden rather than refused is the most serious class of bug in this pack, and everything else in your track is less important than it.",
  ], "FBEAEA"));
  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section A: roles ─────────────────────────────────────────────────────
  body.push(h1("Part 3  ·  Section A, roles"));
  body.push(p("A role is a named bundle of permissions. Almost nobody is given permissions directly; they are given a role, and the role carries the keys. Which means a careless edit to one role changes what a lot of people can do at once."));

  body.push(...run({
    id: "A1",
    title: "The role list",
    what: "Every role on the platform, what each one carries, and how many people hold it.",
    why: "It is the map of who can do what. If it does not show how many people a role affects, somebody will edit one thinking it is unused.",
    before: [],
    doThis: [
      "Open Roles. Read the columns and any counts shown.",
      "Note whether you can tell, from the list alone, how many permissions a role carries and how many people hold it.",
      "Search for a role by name.",
      "Filter by status if the screen offers it.",
      "Open a role and read everything on its page.",
      "Page to the second page and back.",
    ],
    passes: [
      "Every role shows enough to identify it without opening it.",
      "You can tell which roles are in use and which are not.",
      "Search and filters narrow correctly and clear cleanly.",
      "Opening a role shows the permissions it actually carries, in a form you can read rather than a list of codes.",
    ],
    breakIt: [
      "Search for something that cannot exist and check for a proper empty message.",
    ],
  }));

  body.push(...run({
    id: "A2",
    title: "Creating a role",
    what: "Making a new role and choosing the permissions it carries.",
    why: "This is where access is defined. A permission picker that is hard to read is how somebody grants far more than they meant to.",
    before: ["Name it with your prefix so nobody mistakes it for a real role."],
    doThis: [
      'Roles, Create Role. Name it "QA2 <your name> Role" and describe it.',
      "Work through the permission picker. Note how the keys are grouped and whether you can search them.",
      "Pick two or three harmless view permissions. Note whether anything is marked critical or restricted, and what happens when you try to select one.",
      "Save. Find it in the list.",
      "Open it and confirm it carries exactly what you selected, no more.",
      "Count the permissions on screen against what you chose.",
    ],
    passes: [
      "The picker lets you find a permission without scrolling through hundreds, by search or by grouping.",
      "Each permission is readable: it says what it allows, not just its key.",
      "The role saves with exactly the permissions you chose.",
      "Critical or restricted permissions are visibly different from ordinary ones.",
    ],
    breakIt: [
      "Save with no name, then with no permissions at all.",
      "Create a second role with the same name.",
      "Select every permission in one group at once, if the screen offers that, and check the count is right.",
    ],
  }));

  body.push(...run({
    id: "A3",
    title: "Editing a role, and who it affects",
    what: "Changing the permissions on a role that people already hold.",
    why: "An edit here reaches everybody holding the role, immediately. The screen must say how many people that is before you save, not after.",
    before: ["Use your own role from A2, assigned to your test user from the smoke run."],
    doThis: [
      "Open your role and edit it. Add one more permission.",
      "Before saving, look for anything telling you how many people this affects.",
      "Save. In the other browser, reload as your test user and check the new permission took effect.",
      "Note whether they had to sign out and back in, or whether it applied immediately. Write down which.",
      "Now remove a permission from the role and check the same way.",
      "Open the role again and confirm the list is what you left it as.",
    ],
    passes: [
      "The change reaches everybody holding the role.",
      "The screen tells you how many people you are about to affect, before you commit.",
      "Removing a permission removes the access, and does not need a manual cache clear.",
      "Whatever the propagation rule is, it is consistent: adding and removing behave the same way.",
    ],
    breakIt: [
      "Remove every permission from the role and save.",
      "Open the same role in two tabs, change different permissions in each, save both, and note which wins.",
    ],
    note: "If a removed permission still works after a reload and a re-login, that is URGENT.",
  }));

  body.push(...run({
    id: "A4",
    title: "Permission groups",
    what: "Named bundles of permission keys that travel together, used when building roles.",
    why: "Groups are a shortcut, and shortcuts are where too much access gets handed out by accident.",
    before: [],
    doThis: [
      "Open Roles, Permission Groups. Read the list and what each group contains.",
      'Create a group named "QA2 <your name> Group" with a few related permissions.',
      "Open it again and confirm the members.",
      "Edit it: add one, remove one.",
      "Now go and build a role using your group, and check what the role ends up carrying.",
      "Delete your group and see what happens to the role that used it.",
    ],
    passes: [
      "A group shows its members clearly, and how many there are.",
      "Using a group in a role grants exactly the group's keys.",
      "Editing a group is reflected wherever it is used, or the screen says plainly that it is not.",
      "Deleting a group in use either refuses with a reason or explains what will happen to the roles using it.",
    ],
    breakIt: [
      "Create a group with no members.",
      "Put the same permission in twice.",
    ],
  }));

  body.push(...run({
    id: "A5",
    title: "Deleting a role",
    what: "Removing a role, and what stops you when people hold it.",
    why: "Deleting a role somebody holds is a silent way to take away access from several people at once.",
    before: ["Your role from A2 should still be assigned to your test user."],
    doThis: [
      "Try to delete your role while your test user still holds it. Read what happens.",
      "If it refuses, note the exact wording.",
      "Revoke the assignment, then try again.",
      "Confirm the role is gone from the list.",
      "In the other browser, check what your test user can now see.",
      "Look in the audit trail for the deletion.",
    ],
    passes: [
      "Deleting a role in use is either refused with a clear reason, or warns you exactly how many people lose access.",
      "The delete asks you to confirm.",
      "Once deleted, the role is gone from the list and from anyone who held it.",
      "The deletion appears in the audit trail with your name on it.",
    ],
    breakIt: [
      "Delete a role and then look for it by its old address.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section B: assignments ───────────────────────────────────────────────
  body.push(h1("Part 4  ·  Section B, who holds what"));
  body.push(p("Roles are one half. This is the other: putting them on people, taking them off again, and the two special cases where the system deliberately makes it harder."));

  body.push(...run({
    id: "B1",
    title: "Assigning and revoking a role",
    what: "Giving somebody a role, and taking it away.",
    why: "This is the everyday act of granting access. It happens often, usually in a hurry, and it must leave a trail.",
    before: ["Use your test user."],
    doThis: [
      "Open Roles, Platform User Assignments. Read the columns: who, which role, assigned by whom and when.",
      "Assign a role to your test user. Note whether you can pick the person by typing rather than scrolling.",
      "Find the new assignment in the list. Check it records who assigned it and when.",
      "Revoke it. Read the confirmation.",
      "Check the list again: is the revoked assignment gone, or shown as revoked with who revoked it and when?",
      "Assign the same role again and confirm it works a second time.",
    ],
    passes: [
      "Assigning takes effect for that person, and the list shows it immediately.",
      "The record includes who did it and when, on both the assignment and the revocation.",
      "Revoking actually removes the access, checked in the other browser.",
      "A revoked assignment is not silently deleted from history. Somebody should be able to see it happened.",
    ],
    breakIt: [
      "Assign the same role to the same person twice.",
      "Revoke an assignment twice.",
      "Try to assign a role to a suspended user.",
    ],
  }));

  body.push(...run({
    id: "B2",
    title: "Change requests",
    what: "Permission changes that need somebody else to approve them before they take effect.",
    why: "It is the control that stops one person quietly granting themselves more access. If a request applies before approval, the control is decorative.",
    before: [],
    doThis: [
      "Open Roles, Change Requests. Read what is waiting and what each row tells you.",
      "Find or create a change that requires a request. Note what triggers one rather than applying directly.",
      "Read a pending request in full: what would change, who asked, when.",
      "Before approving, check whether the change has already taken effect. It must not have.",
      "Approve and apply one. Confirm the change is now real.",
      "Find another and reject it. Confirm nothing changed.",
      "Check both the approval and the rejection appear in the audit trail.",
    ],
    passes: [
      "A pending request has no effect until it is approved. Verified by checking the actual access, not just the screen.",
      "Approving applies the change and says so.",
      "Rejecting leaves everything as it was.",
      "Both outcomes are recorded with who decided and when.",
      "You can see what a request would do before deciding, in plain words rather than raw keys.",
    ],
    breakIt: [
      "Approve the same request twice.",
      "Try to approve your own request. Note whether it lets you, because self-approval defeats the point.",
    ],
    note: "If you can approve a request you raised yourself, write it up even if the system allows it. That is a policy question worth asking out loud.",
  }));

  body.push(...run({
    id: "B3",
    title: "Transferring Super Admin",
    what: "Handing the highest position on the platform to somebody else.",
    why: "It is the single most consequential action in the entire product. Done wrong, either nobody has full control or the wrong person does.",
    before: ["Read the whole run before touching anything. Do not transfer without agreeing it with Chidera first."],
    doThis: [
      "Open Roles, Transfer Super Admin. Read every word on the screen before doing anything.",
      "Look at who is currently Super Admin and who is eligible to receive it.",
      "Note what the screen tells you will happen to the current holder afterwards.",
      "Note what confirmation it demands: a typed name, a password, a checkbox, nothing at all.",
      "Do not complete the transfer unless Chidera has agreed. If agreed, complete it and then transfer it back.",
      "Whether or not you transferred, check the audit trail for this screen being opened.",
    ],
    passes: [
      "The screen states plainly who holds it now, who would hold it after, and what the current holder keeps or loses.",
      "It cannot be done by a single unconfirmed click.",
      "Only eligible people are offered, and the screen says so when nobody is.",
      "If a transfer happens, it is recorded in the audit trail with both names.",
    ],
    breakIt: [
      "Try to transfer it to yourself.",
      "Open the screen as a user who is not the Super Admin and confirm it refuses.",
    ],
    note: "This run is mostly reading. An unclear screen here is a finding worth raising even if every button works.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section C: the catalogue ─────────────────────────────────────────────
  body.push(h1("Part 5  ·  Section C, the permission catalogue"));
  body.push(p("Underneath the roles is the catalogue of keys themselves, organised as module, resource and action. Finance, invoice, create. This is configuration rather than day-to-day work, but a wrong entry here breaks a screen somewhere far away."));

  body.push(...run({
    id: "C1",
    title: "The permission list",
    what: "Every permission key on the platform, with its module, resource, action and sensitivity.",
    why: "It is the dictionary the whole system is written in. If a key is inactive or mislabelled, a screen somewhere fails for a reason nobody can find.",
    before: [],
    doThis: [
      "Open Permissions, All Permissions. Note roughly how many there are.",
      "Read the columns: key, module, resource, action, sensitivity, status.",
      "Filter by module. Then by action type. Then by whether it is critical.",
      "Search for a key you recognise from another track, such as one for invoices.",
      "Open one and read its detail.",
      "Find an inactive permission, if there is one, and note what inactive means here.",
    ],
    passes: [
      "Every key follows the module.resource.action shape consistently.",
      "Filters combine rather than replacing each other.",
      "Sensitivity is visible: you can tell a critical key from an ordinary one at a glance.",
      "A key's description says what it allows in words, not just by restating the key.",
    ],
    breakIt: [
      "Filter to a combination with no results.",
      "Search with an underscore and with a dot, and see whether both find what you expect.",
    ],
  }));

  body.push(...run({
    id: "C2",
    title: "Modules, resources and actions",
    what: "The three lists the permission keys are built from.",
    why: "These are the vocabulary. Adding a resource with a typo creates keys nobody can ever match.",
    before: [],
    doThis: [
      "Open Permissions, Modules. Read the list.",
      "Open Resources and note which module each belongs to.",
      "Open Actions and read them: view, create, update, delete, and the more specific ones.",
      'Create a resource of your own named "qa2test" under a sensible module.',
      "Create an action if the screen allows it.",
      "Go back to All Permissions and see whether your new resource can now be used to build a key.",
      "Delete what you created.",
    ],
    passes: [
      "Each list is readable and says which module a resource belongs to.",
      "Creating a resource or action makes it available where keys are built.",
      "Names are validated: no spaces or capitals sneaking into something that becomes part of a key.",
      "Deleting something still in use is refused with a reason.",
    ],
    breakIt: [
      "Create a resource with a space in the name, then with capitals.",
      "Create two with the same name in the same module.",
    ],
  }));

  body.push(...run({
    id: "C3",
    title: "Creating and editing a permission",
    what: "Adding a new key to the catalogue and changing an existing one.",
    why: "A key created here must match exactly what the server expects, or the screen it is meant to unlock stays shut for everybody.",
    before: ["Create your own. Do not edit a key another track depends on."],
    doThis: [
      "Permissions, Create. Build a key from a module, your test resource and an action.",
      "Set its sensitivity and description. Save.",
      "Find it in the list and confirm the key string reads as you expected.",
      "Edit it: change the description and the sensitivity. Save and confirm.",
      "Try adding it to your role from A2.",
      "Delete it.",
    ],
    passes: [
      "The key is assembled from the three parts and shown to you before you save.",
      "It cannot duplicate an existing key.",
      "Editing changes what you changed and nothing else.",
      "A newly created key is immediately usable when building a role.",
    ],
    breakIt: [
      "Create a key that already exists.",
      "Save with no description.",
      "Delete a key that a role currently carries and see whether it stops you.",
    ],
  }));

  body.push(...run({
    id: "C4",
    title: "Dependencies between permissions",
    what: "Rules saying that one permission requires another.",
    why: "Being allowed to edit something without being allowed to see it is a nonsense state, and dependencies are what prevent it.",
    before: [],
    doThis: [
      "Open Permissions, Dependencies. Read the existing rules and what each one means.",
      "Create a dependency: pick a permission that should require another.",
      "Now build a role that includes the dependent key but not the one it requires. Note what happens.",
      "Save the role and check what it ends up carrying.",
      "Assign it and check in the other browser what your test user can actually do.",
      "Delete your dependency.",
    ],
    passes: [
      "The screen explains a dependency in words: this requires that.",
      "Building a role that breaks a dependency is either prevented, or the missing key is added for you and the screen says it did.",
      "Whatever it does, it is not silent.",
    ],
    breakIt: [
      "Make a permission depend on itself.",
      "Make two permissions depend on each other and see whether anything catches the loop.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section D: enforcement ───────────────────────────────────────────────
  body.push(h1("Part 6  ·  Section D, does the gate actually hold"));
  body.push(p("This is the most important section in the pack, and the one worth doing slowly."));
  body.push(p("Hiding a menu item is not security. A determined person, or a careless one with an old bookmark, goes straight to the address. What matters is whether the server refuses. Every run here is the same shape: take the access away, then try to get in anyway."));
  body.push(callout("How to try an address directly", [
    "Before you revoke anything, open the screen while you still have access and copy the full web address from the bar.",
    "After revoking, paste it back in and press enter. Do not navigate there through the menu, because the menu is exactly the thing that is allowed to hide it.",
    "A pass looks like a clear refusal: a message saying you do not have permission. A fail looks like the screen loading, or loading empty as though there were simply no data.",
  ]));
  body.push(spacer());

  body.push(...run({
    id: "D1",
    title: "A permission opens a door",
    what: "Granting one key and watching exactly one thing become reachable.",
    why: "Before testing that access is refused, you have to know the grant works at all, and that it grants only what it says.",
    before: ["Your test user, signed in in a second browser."],
    doThis: [
      "Pick a single view permission for a screen your test user cannot currently reach.",
      "Note everything they can see in the sidebar right now. Write the list down.",
      "Grant just that one key, through your own role.",
      "In the other browser, reload and compare the sidebar to your list.",
      "Open the screen that key unlocks and confirm it works.",
      "Check nothing else appeared that you did not grant.",
    ],
    passes: [
      "Exactly one thing changed. One key should not quietly bring three screens with it.",
      "The unlocked screen actually loads and shows data, rather than appearing in the menu and then failing.",
      "Nothing else in the sidebar changed.",
    ],
    breakIt: [
      "Grant a key for a screen whose data belongs to a different school and check what they can see.",
    ],
  }));

  body.push(...run({
    id: "D2",
    title: "Taking it away, and trying anyway",
    what: "Revoking the key and then attempting the screen by its address, not its menu item.",
    why: "This is the run the whole track exists for. If the server does not refuse, every permission on the platform is advisory.",
    before: ["You have the screen's full address copied from D1."],
    doThis: [
      "As your test user, with access still granted, copy the exact address of the unlocked screen.",
      "As yourself, revoke the key.",
      "In the other browser, reload. Confirm the menu item has gone.",
      "Now paste the address into the bar and press enter.",
      "Read carefully what happens. Note whether you get a refusal, an empty screen, or the real thing.",
      "If the screen has a detail page, try one of those addresses too.",
      "Try the browser back button to a page you were on before the revoke.",
    ],
    passes: [
      "The address is refused with a message saying you do not have permission.",
      "It is a refusal, not an empty version of the screen. An empty screen means the request was allowed and simply returned nothing, which is a different and worse thing.",
      "Going back in history does not restore access to live data.",
      "The refusal is understandable rather than a bare code.",
    ],
    breakIt: [
      "Try a detail address with a record id belonging to another school.",
      "Leave the page open from before the revoke and click something on it. It should fail at that point.",
    ],
    note: "Any success at reaching data after a revoke is URGENT. Include the exact address and the key you revoked.",
  }));

  body.push(...run({
    id: "D3",
    title: "Seeing somebody else's data",
    what: "Whether a user of one school can reach another school's records by changing an id.",
    why: "Permissions answer what you may do. This answers whose data you may do it to, and it is the failure that would matter most to a customer.",
    before: ["You need two schools. Track 1 will have created one; use any other that exists."],
    doThis: [
      "Sign in as a user belonging to one school in the second browser.",
      "Note a record id from that school: a user, a branch, anything with an id in the address.",
      "As yourself, find the equivalent id belonging to a different school.",
      "In the other browser, edit the address to that other school's id and press enter.",
      "Try the same with a list screen, adding a filter or parameter for the other school if the address allows it.",
      "Write down exactly what you tried and what came back.",
    ],
    passes: [
      "Every attempt is refused or returns nothing at all.",
      "The refusal does not confirm that the other record exists. Not-found and not-allowed should look the same to an outsider.",
      "No screen shows a mixture of two schools' data.",
    ],
    breakIt: [
      "Try an id that does not exist anywhere and compare the message to the one for a real id you are not allowed to see. They should be indistinguishable.",
    ],
    note: "This is the highest-value run in the pack. Take your time, and write down every address you tried even when nothing happened.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section E: audit ─────────────────────────────────────────────────────
  body.push(h1("Part 7  ·  Section E, the audit trail"));
  body.push(p("Everything you did in sections A to D should be visible here. That is the test: not whether the audit screens render, but whether they contain what actually happened."));

  body.push(...run({
    id: "E1",
    title: "The security dashboard",
    what: "The overview: critical events, active sessions, locked accounts, active proxy sessions.",
    why: "It is the first screen somebody opens when they think something is wrong, so a wrong figure here sends them the wrong way.",
    before: ["Do this after sections A to D, so there is real activity to see."],
    doThis: [
      "Open Audit & Security. Read every figure on the page.",
      "Check the active sessions count against what you know: you, your test user, anyone else testing.",
      "Check locked accounts against anything you locked in A1 of Track 1, if that tester locked one.",
      "Use any critical-only filter and see what it shows.",
      "Note when the page says it last updated, and watch whether it refreshes on its own.",
      "Click through from a figure to its detail, where offered.",
    ],
    passes: [
      "Figures are plausible and match what you can verify by counting elsewhere.",
      "The page says how fresh it is rather than implying it is live.",
      "Clicking a figure takes you to the rows behind it.",
      "A quiet system reads as quiet, not as broken.",
    ],
    breakIt: [
      "Do something auditable in the other browser and see how long the dashboard takes to reflect it.",
    ],
  }));

  body.push(...run({
    id: "E2",
    title: "The events explorer",
    what: "Every recorded action, with filters for actor, module, action, entity and status.",
    why: "This is the record. If it is incomplete or its filters lie, no investigation that uses it can be trusted.",
    before: ["You should be able to find your own work from sections A to D in here."],
    doThis: [
      "Open Events Explorer. Filter to yourself as the actor and today.",
      "Find the role you created in A2, the assignment in B1, and the revoke in D2.",
      "Check each row: does it name the actor, the action, the thing acted on, and the time?",
      "Filter by module, then by action, then by status. Combine two.",
      "Look for a failed action: something you tried that was refused. It should be recorded too.",
      "Page through and check the order is consistent.",
    ],
    passes: [
      "Everything consequential you did appears, once each.",
      "Refused attempts are recorded, not just successful ones. An audit log that only records successes cannot show an attack.",
      "Filters narrow honestly and combine.",
      "Times are readable and in a consistent zone.",
      "System actions are distinguishable from things a person did.",
    ],
    breakIt: [
      "Filter to a time range in the future.",
      "Filter to an actor who has done nothing.",
      "Look for an edit or delete control on an event. There should not be one.",
    ],
  }));

  body.push(...run({
    id: "E3",
    title: "One event, and the trail of one record",
    what: "The detail behind a single event, and the entity trail that gathers every event about one record.",
    why: "The list answers what happened. These answer what happened to this thing, which is the question actually asked in an investigation.",
    before: [],
    doThis: [
      "From the events list, open one of your own events in detail.",
      "Read everything: actor, target, before and after values, where it came from.",
      "Note whether it shows what changed rather than only that something changed.",
      "Open Entity Trails and find the role you created in A2.",
      "Read its full history: created, edited, assigned, deleted.",
      "Compare that trail against what you actually did, step by step.",
    ],
    passes: [
      "The detail shows the change itself, not merely the fact of one.",
      "The entity trail is complete and in order.",
      "Nothing in the trail is missing that you know you did.",
      "Sensitive values are handled sensibly: a password change should be recorded without recording the password.",
    ],
    breakIt: [
      "Open an entity trail for something that was deleted. The history should survive the record.",
    ],
  }));

  body.push(...run({
    id: "E4",
    title: "Sessions, sign-ins and lockouts",
    what: "Live sessions, login attempts, locked accounts and password activity.",
    why: "These four answer who is in the building right now and who has been trying the door.",
    before: ["Track 1's tester may have locked an account. If not, deliberately fail a few sign-ins with your test user."],
    doThis: [
      "Open Live Sessions. Find your own session and your test user's.",
      "End your test user's session from here, and confirm in the other browser that it stopped.",
      "Open Login Attempts. Find today's failures and successes.",
      "Fail a sign-in three or four times as your test user, then reload this screen.",
      "Open Account Lockouts and see whether that user appears.",
      "If they are locked, unlock them and check they can sign in again.",
      "Open Password Activity and find the password change from Track 1, or make one.",
    ],
    passes: [
      "Live sessions match reality, and ending one genuinely ends it.",
      "Failed attempts are recorded with enough detail to recognise a pattern: when, from where, which account.",
      "A locked account appears on the lockouts screen while it is locked.",
      "Unlocking works and is itself recorded.",
      "Password activity records that a password changed without recording what it changed to.",
    ],
    breakIt: [
      "End your own session from Live Sessions and see what happens to you.",
      "Fail sign-ins for an account that does not exist and check whether those are recorded too.",
    ],
  }));

  body.push(...run({
    id: "E5",
    title: "Proxy sessions",
    what: "The record of CX staff acting as another user, and the ability to end one.",
    why: "A proxy session is one person using the system as somebody else. Everything done during one must be attributable to the real person, and anybody watching must be able to stop it.",
    before: ["Ask Chidera before starting a proxy session, and only ever proxy into your own test user."],
    doThis: [
      "Open Audit & Security, Proxy Sessions. Read what is listed and what each row tells you.",
      "If a proxy session can be started, start one into your own test user only.",
      "While proxying, do something small and harmless that leaves a record.",
      "Check whether the interface makes it obvious you are acting as somebody else.",
      "Come back to Proxy Sessions and end the session from here.",
      "Confirm the proxy actually stopped.",
      "Now find the action you took while proxying, in the events explorer. Check whose name is on it.",
      "Leave a proxy session idle and note whether it expires on its own.",
    ],
    passes: [
      "The list shows who proxied into whom, when it started and when it ended.",
      "While proxying, the screen makes it unmistakable. Nobody should be able to forget they are somebody else.",
      "Ending a session from this screen genuinely ends it.",
      "Actions taken while proxying name the real person, not only the account being used.",
      "A session that is left alone eventually expires rather than lasting for ever.",
    ],
    breakIt: [
      "Try to proxy into somebody more privileged than you.",
      "Try to proxy while already proxying.",
    ],
    note: "If an action taken during a proxy session is attributed only to the account being used, with no trace of who was really driving, that is URGENT.",
  }));

  body.push(...run({
    id: "E6",
    title: "Audit exports and compliance rules",
    what: "Getting evidence out of the system, and the rules that flag activity for review.",
    why: "An audit trail nobody can extract is not evidence, and a compliance rule that never fires is a false sense of safety.",
    before: [],
    doThis: [
      "Open Audit Exports and read what has been exported before.",
      "Create a new export: choose a date range and whatever scope it offers. Run it.",
      "Wait for it, download the file and open it. Check the rows match what the events screen shows for the same range.",
      "Open Compliance Rules. Read the existing rules and what each one watches for.",
      'Create a rule of your own, named "QA2 <your name> rule", watching something you can trigger.',
      "Trigger it. Check whether anything is flagged, and where that shows up.",
      "Deactivate your rule, trigger it again, and confirm nothing is flagged.",
      "Delete your rule.",
    ],
    passes: [
      "An export completes and its file opens, with a header row and readable dates.",
      "The exported rows match the same filter on screen. Spot-check the count.",
      "A rule can be created, and it says in words what it watches.",
      "A rule that fires produces something visible somewhere. If it fires silently it is not a control.",
      "Deactivating a rule stops it firing.",
    ],
    breakIt: [
      "Export a range with no events in it.",
      "Export a very wide range and see whether it copes or times out.",
      "Create a rule that matches everything and check it does not flood the system.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section F: cross-cutting ─────────────────────────────────────────────
  body.push(h1("Part 8  ·  Section F, checks to repeat on every screen"));
  body.push(p("Pick any six screens from your track, including at least two lists, one permission picker and one detail page, and put each through both runs."));

  body.push(...run({
    id: "F1",
    title: "On a phone",
    what: "The same screens at phone width.",
    why: "People switch from desk to phone. Desktop is the design we care most about, but a phone must never be broken, cut off, or scrolling sideways.",
    before: ["Use a real phone if you have one, otherwise make your browser window about 390 pixels wide."],
    doThis: [
      "Open each of your six screens at phone width.",
      "Scroll down the whole page, then try to scroll sideways.",
      "Open the role permission picker and try to select several permissions.",
      "Open an audit event detail and read it.",
      "Open the sidebar, navigate somewhere, and close it.",
      "Repeat at tablet width, about 820 pixels.",
    ],
    passes: [
      "No page scrolls sideways. Ever. If one does, note which screen.",
      "Lists become stacked cards rather than a squashed table, and no column of data is simply gone.",
      "The permission picker is usable: you can find and select a key without giving up.",
      "Long permission keys wrap rather than pushing the layout out.",
    ],
    breakIt: [
      "Open a filtered events list with several filters applied and see whether the filter row wraps.",
    ],
    note: "The permission picker is a complex editor, so on a phone it only has to be usable, not comfortable. Report broken, not cramped.",
  }));

  body.push(...run({
    id: "F2",
    title: "Empty, loading and error states",
    what: "What each screen shows when there is nothing to show, while it is fetching, and when something goes wrong.",
    why: "An audit screen with nothing in it looks exactly like an audit screen that failed to load, unless somebody designed the difference.",
    before: ["Use filters to produce genuinely empty results rather than deleting anything."],
    doThis: [
      "On each of your six screens, filter to something with no results.",
      "Check carefully that an empty result says so, rather than looking like a loading state that never finished.",
      "Watch what happens while a screen loads. Note anything that flashes or shows zero before showing the real number.",
      "Turn your internet off, reload a screen, and watch. Turn it back on and see whether it recovers by itself.",
      "Open an event detail for an id that does not exist.",
    ],
    passes: [
      "An empty list says so in words, and an empty audit result is clearly different from a failed one.",
      "A missing record gives a clear not-found message, not a crash or a blank page.",
      "Losing the connection produces a message that says so.",
      "No screen ever shows a raw technical error, a stack of code, or the word undefined.",
    ],
    breakIt: [
      "Click a save button twice quickly when creating a role and see whether you get two.",
      "Use the browser back button in the middle of the role creation flow.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── wrap-up + sign-off ───────────────────────────────────────────────────
  body.push(h1("Part 9  ·  Sign-off"));
  body.push(h2("What to write up at the end"));
  body.push(p("When you have finished, post one short message to the team channel with four things:"));
  body.push(...bullets([
    "How many runs you completed, and which you could not do and why.",
    "The ticket numbers you raised, grouped by priority.",
    "The single worst thing you found. If anything in Section D let you through, that is the answer.",
    "Anything in this pack that was wrong, unclear, or sent you the wrong way. That feedback shapes the other packs, so it is worth as much as the bugs.",
  ]));
  body.push(spacer());
  body.push(small("Leave nothing granted at the end. Revoke your test role, delete what you created, and make sure your test user is back where it started."));
  body.push(spacer());
  body.push(...K.signOff(runIds));

  return { trackNo: TRACK_NO, trackName: TRACK_NAME, body, runCount: runIds.length };
};
