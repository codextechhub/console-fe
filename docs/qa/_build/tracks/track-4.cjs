// Track 4 - Finance: Ledger and Receivables.
//
// Ported onto the shared chrome in pack.cjs without touching a word of its
// content. This pack had already been through four rounds of correction when the
// other five were written, so its runs are the reference the others copy - but
// while it lived in its own script it was the one pack a future format change
// would silently miss.
//
// Parts 2 to 7 below are the approved text, unchanged.

const K = require("../pack.cjs");
const { t, p, h1, h2, h3, bullets, steps, small, label, spacer, fill, table, callout, makeRun } = K;
const { Paragraph, PageBreak } = K;

const TRACK_NO = 4;
const TRACK_NAME = "Finance: Ledger and Receivables";

module.exports = function buildTrack4() {
  const runIds = [];
  const run = makeRun(runIds);
  const body = [];

  body.push(...K.coverAndContents({
    trackNo: TRACK_NO,
    trackName: TRACK_NAME,
    blurb: "One tester. Twenty-six test runs. Everything from the chart of accounts to the money a customer owes us and how it gets collected.",
    coverExtra: [["Ledger entity to use", "CODEX"]],
    contents: [
      ["Part 1", "Read this first: your setup, the house rules, the list of things that look broken but are not, and how to report a problem", "20 min"],
      ["Part 2", "The short version: one end-to-end money story to run before anything else", "30 min"],
      ["Part 3", "Section A - Foundations (7 runs). The setup screens everything else stands on", "1 hr"],
      ["Part 4", "Section B - General Ledger (4 runs). Journals, posting, reversal", "45 min"],
      ["Part 5", "Section C - Receivables (12 runs). Customers, invoices, receipts, credit notes, refunds, plans, concessions, reminders, fee structures", "3 hrs"],
      ["Part 6", "Section D - Checks to repeat on every screen (3 runs). Phone view, empty states, exports", "45 min"],
      ["Part 7", "Does the accounting hold up. The cross-checks only you will do", "30 min"],
      ["Part 8", "Sign-off sheet", "-"],
    ],
  }));

  body.push(...K.partOne({
    trackNo: TRACK_NO,
    prefix: "QA4",
    whatYouAreTesting: [
      "Your track is the money-coming-in half of Finance on the intranet, plus the foundations underneath it.",
      "Think of it as one story. We set up the books (what accounts exist, which months are open, what a tax code is). We record a customer. We bill that customer. The customer pays, in full or in part or too much. Sometimes we give money back, or write it off, or agree to instalments, or grant a discount, or chase them for payment. Every one of those actions is supposed to leave a correct trail in the general ledger.",
      "Your job is to walk that story like a real finance officer would, and to notice the moment anything is wrong, confusing, or dishonest about what it claims to have done.",
    ],
    notYours: "You are not testing: payroll, expense claims, bank reconciliation, payouts, or the six financial reports. Those belong to Track 5. You are also not testing approvals or notifications. Those belong to Track 3. Where your work touches theirs, this pack tells you what to do.",
    firstSteps: [
      "Click Finance in the left sidebar. It opens with its own sidebar down the left: Dashboard, then Ledger and Setup, Receivables, Operations, Payments, Reports and Close, Administration.",
      [t("Look at the top of the page for the "), t("entity switcher", { bold: true }), t(". Choose "), t("CODEX", { bold: true }), t(". Read the next section before you go any further, because nothing else in this pack works until you have done this.")],
      "Open Support in the main sidebar and create one throwaway ticket titled \"QA4 smoke test, please ignore\". This proves your reporting channel works before you need it in anger. If ticket creation itself fails, message Chidera directly.",
    ],
    entityNote: {
      paras: [
        "An entity is a set of books. The business can keep more than one, and every figure in finance belongs to exactly one of them. An invoice raised on CODEX does not exist on CREST, and a total on one will never include the other.",
        "So the entity switcher at the top of Finance is not a filter. It decides which company's books you are looking at. If a screen says \"Select an entity\" and shows nothing else, that is expected. Pick one and the screen fills in.",
        "Stay on CODEX for the whole pack unless a run tells you otherwise. If you drift onto another entity halfway through you will lose your own data and report bugs that are not real.",
      ],
      footnote: "The switcher only appears when the tenant has more than one entity. If you cannot see it at all, you may be on a tenant with a single set of books. Ask Chidera to confirm before reporting it.",
    },
    // Track 4's own wording, unchanged from the approved document.
    houseRuleText: {
      naming: 'A customer called "QA4 Ada Test Ltd", a reference of "QA4-ADA". Then you can always find your own rows and nobody else has to guess whose they are.',
      neverTouch: "Never cancel, void, delete or write off a record you did not create. ",
      reference: "Write down the document number of everything you create ",
      referenceTail: "(they look like INV-2026-00012, RCP-2026-00007, CRN-2026-00003). Every ticket you raise should carry one. It is the fastest way for a developer to find the exact row you were looking at.",
      laptop: "Section D asks you to repeat a few things on a phone.",
    },
    houseRules: [
      [t("Amounts are typed in naira. ", { bold: true }), t("Type 80000 for eighty thousand naira. Do not type kobo and do not type commas. The screen should show it back to you as N80,000.00.")],
    ],
    ticketTitleExample: "C4 - allocation drawer leaves the receipt showing the full amount as unallocated",
    priorityRows: [
      ["Priority", "Use it when", "Example"],
      ["URGENT", "Money is wrong, data is lost, or you can see something you should not be able to see. Also: the screen is unusable and there is no way round it.", "A receipt of N50,000 reduces the invoice by N500,000."],
      ["HIGH", "A main action fails or produces the wrong result. There may be a workaround but it hurts.", "Posting a journal returns an error and no journal is created."],
      ["MEDIUM", "Something is wrong but the work still gets done. Wrong labels, a filter that ignores you, broken layout on a phone.", "The status filter shows drafts when you asked for posted."],
      ["LOW", "Cosmetic. Spacing, wording, an icon that does not fit.", "A column header is in the wrong case."],
    ],
    whatIDidHint: "Step by step, from a screen I can name. Include the entity (CODEX) and the document number.",
    workedExample: [
      ["Title", "C6 - credit note posts but the customer's balance does not move"],
      ["Category / priority", "BUG / HIGH"],
      ["What I did", "CODEX. Receivables, Credit and Debit Notes, Issue note. Customer QA4 Ada Test Ltd, type Credit, amount 20000, against invoice INV-2026-00021, account 4100. Confirmed the posting preview and saved. Note created as CRN-2026-00009 with status Issued. Opened it and clicked Apply to balance."],
      ["What I expected", "The invoice balance to drop by N20,000 and the note to move to Applied."],
      ["What actually happened", "The drawer closed with a success toast, the note still reads Issued, and the invoice balance is unchanged at N65,000."],
      ["Where", "/finance/receivables/credit-notes, around 11:20 on 18 August."],
      ["How often", "Twice, on two different notes."],
    ],
    helpNote: "Finance screens have none written yet, so expect general intranet guides only.",
    knownIntended: [
      "1.  Email now works, and it reaches real addresses. \"Email invoice\" on an invoice, \"Email receipt\" on a receipt, \"Send to customer\" on a statement and \"Send\" on a reminder notice all send a genuine email with a PDF attached. Each one asks you to confirm and shows you the exact address first. Read that address before you confirm, and only send to a customer you created yourself.",
      "2.  There are no how-to articles for finance screens yet. The help panel will offer general intranet guides, not finance ones. Finance guides are planned and not written. Do not report them missing. Do report a guide that opens and says something untrue.",
      "3.  \"Print\" opens your browser's print dialogue. That is the intended behaviour everywhere in finance, including statements and payslip-style documents.",
      "4.  Lists show 25 rows at a time with a pager at the bottom. Intended.",
      "5.  Debit notes cannot be applied to a customer's balance, so the \"Apply to balance\" action is hidden for them. Only credit notes can be applied. Intended.",
      "6.  Write-offs always appear as Posted. They post the moment you confirm and have no draft state. Refunds are different: they post on issue unless you tick \"Save as draft\", which leaves them Pending.",
      "7.  A screen that is missing from the sidebar entirely is a permissions matter, not a bug. Tell Chidera so your account can be granted the key, and note it as blocked.",
    ],
    crossTrack: [
      ["A journal you post lands as Pending rather than Posted", "An approval rule caught it. That is the workflow engine and belongs to Track 3. Write down the journal number, tell that tester, and carry on. Do not raise it as a finance bug."],
      ["You want to check a figure on the Trial Balance", "You are allowed to open it for a cross-check. Track 5 owns testing the report itself. If the report looks wrong, hand them the numbers rather than raising it yourself."],
      ["A screen you need is not in the sidebar", "Permissions. Tell Chidera."],
      ["Nothing loads at all and every screen errors", "The intranet is probably down. Say so in the team channel first. One ticket for everyone, not six."],
    ],
  }));

  // =========== PART 2: the short version ===========
  body.push(h1("Part 2  ·  The short version, run this first"));
  body.push(p("Before you settle in, walk the whole money story once, end to end, in about half an hour. If something is badly broken we want to know today, not on Thursday."));
  body.push(p("Do not write anything up in detail yet. Just note anything that surprises you, and mark the runs it belongs to so you look harder later."));
  body.push(...steps([
    "Receivables, Customers, New customer. Create \"QA4 <your name> Ltd\" with an email and a phone number. Save.",
    "Receivables, AR Invoices, New invoice. Pick your customer. One line, quantity 1, unit price 100000. Save. Note the invoice number.",
    "Open the invoice. Look at the GL tab. It should show a debit to the receivables account and a credit to an income account, and the two sides should be equal.",
    "Receivables, Receipts and Allocation, Record receipt. Same customer, 40000, any method, any bank account. Continue to allocation, allocate it against your invoice, confirm.",
    "Go back to the invoice. It should now be part paid with N60,000 outstanding.",
    "Receivables, Customers, open your customer, Statement tab. Your invoice and your receipt should both appear and the closing balance should read N60,000.",
  ]));
  body.push(
    callout("If any of those six steps fails outright", [
      "Raise one URGENT ticket immediately with the step number and what happened, then tell Chidera in the team channel. The rest of this pack assumes the spine works.",
    ], "FBEAEA")
  );

  body.push(new Paragraph({ children: [new PageBreak()] }));

  // =========== PART 3: Section A ===========
  body.push(h1("Part 3  ·  Section A, foundations"));
  body.push(p("These seven screens are the settings the whole ledger stands on. They are dull and they are load-bearing. If a fiscal period is not open, nothing anywhere else in finance can be posted, and the error you get when you try is one of the most important messages in the system."));
  body.push(small("All of these live under Finance, Ledger and Setup in the Finance sidebar."));

  body.push(...run({
    id: "A1",
    title: "Entities, and what switching one does",
    what: "The list of separate sets of books, and the switcher that decides which one you are working in.",
    why: "Every figure you will look at for the rest of the day is scoped to the entity you picked. If switching leaks data between them, that is the single most serious class of bug in this pack.",
    before: ["You are signed in and Finance is open."],
    doThis: [
      "Open Ledger and Setup, then Entities. Read the list.",
      "Note the code and name of each entity you can see.",
      "Switch the entity switcher at the top to a different entity, if there is more than one.",
      "Go to Receivables, AR Invoices, and note the invoice numbers and totals you can see.",
      "Switch back to CODEX and look at the same screen again.",
      "Reload the page in your browser without touching the switcher.",
    ],
    passes: [
      "The invoice list changes completely when you switch, and nothing from one entity appears while the other is selected.",
      "The totals in the cards at the top change to match the list underneath them.",
      "After a reload, you are still on the entity you last chose. It does not silently reset.",
      "No screen shows a mix of both, even for a moment while loading.",
    ],
    breakIt: [
      "Open an invoice from CODEX so its address is in the bar, then switch entity while the drawer is open. Nothing should show you another entity's document.",
      "Copy the web address of a CODEX invoice list, switch to the other entity, then paste the address back in. You should not be looking at CODEX data while the switcher says otherwise.",
    ],
    note: "If a total in a card ever disagrees with the rows in the table below it, note the exact numbers. That mismatch is worth a ticket on its own.",
  }));

  body.push(...run({
    id: "A2",
    title: "Chart of accounts",
    what: "The list of every account the ledger can post to: bank accounts, receivables, income, expenses and so on. Each has a code, a name and a type.",
    why: "Every other run in this pack posts to one of these. If an account is the wrong type, reports later add it to the wrong side and the mistake is very hard to spot.",
    before: ["You are on CODEX."],
    doThis: [
      "Open Chart of Accounts. Look at how it groups the accounts.",
      "Find these by code and check the type reads sensibly: 1100 (a bank account), 1200 (receivables), 2140 (customer credit balances), 4100 (an income account), 5300 (bad debt).",
      "Use the search box. Type part of a name, then part of a code.",
      "Open one account and read its detail. Move between whatever tabs it offers.",
      "Create a new account with New account. Give it a code that nobody else will use, such as 4199, name it \"QA4 <your name> test income\", and pick income as the type.",
      "Find it again with search.",
    ],
    passes: [
      "Codes and names line up with what you would expect, and income accounts are not sitting under assets.",
      "Search narrows the list and clearing it brings everything back.",
      "Your new account saves, appears in the list, and can be found by search.",
      "Amounts, where shown, are formatted as naira with two decimal places.",
    ],
    breakIt: [
      "Try to create a second account with the same code as an existing one. It should refuse with a message that names the problem, not a raw error.",
      "Try to save with the code or name left empty.",
      "Put a very long name in, around 200 characters, and see whether the table copes or stretches off the screen.",
    ],
  }));

  body.push(...run({
    id: "A3",
    title: "Fiscal periods, and the error when one is closed",
    what: "The calendar the books run on. Each month is a period, and a period is either open (things can be posted into it) or closed.",
    why: "This is the single most important guard in finance. A closed month must not accept new postings, and the refusal must be understandable rather than a technical error code.",
    before: ["You are on CODEX. Do not close a period that other people are testing in. If in doubt, ask in the channel first."],
    doThis: [
      "Open Fiscal Periods. Note which periods exist and which are open.",
      "Confirm the current month is open. If it is not, stop, tell Chidera, and mark this run blocked. Nothing else in this pack will post.",
      "Find a period well in the past that nobody is using, or create one, and close it.",
      "Now go to the General Ledger and start a new journal dated inside that closed period. Try to post it.",
      "Read the error carefully and write down its exact wording.",
      "Reopen the period you closed, if reopening is offered, and confirm the journal can then be posted.",
    ],
    passes: [
      "Posting into a closed period is refused. Nothing is created, and the list does not gain a half-made row.",
      "The message says, in ordinary words, that the period is closed. A tester who does not know accounting should be able to work out what to do next.",
      "The message appears on screen. It is not only in the browser console and not a bare code.",
      "Reopening restores normal behaviour.",
    ],
    breakIt: [
      "Try dating a journal into a period that does not exist at all, such as three years from now.",
      "Try dating an invoice into the closed period, not just a journal. The refusal should be the same.",
    ],
    note: "Write down the exact error wording in your ticket if it is unclear. Rewording it is a cheap fix that saves every future user an hour.",
  }));

  body.push(...run({
    id: "A4",
    title: "Currencies and exchange rates",
    what: "The currencies the books can hold and the rates between them.",
    why: "Wrong rates quietly distort every figure that touches a foreign currency.",
    before: [],
    doThis: [
      "Open Currencies and FX. Check which currency is set as the base.",
      "Read the rate list. Note the date each rate applies from.",
      "Add a rate for a currency, dated today. Use a value that is easy to recognise, such as 1000.",
      "Reload and confirm it is still there.",
      "Sort or filter the list if it lets you.",
    ],
    passes: [
      "The base currency is clearly marked and is naira unless Chidera says otherwise.",
      "Your new rate saves with the date you gave it and appears in the list.",
      "Rates show enough decimal places to be useful and do not get rounded to a whole number.",
    ],
    breakIt: [
      "Try a rate of zero, and a negative rate.",
      "Try two rates for the same currency on the same day. Whatever the system decides, it should be deliberate and explained, not a silent overwrite.",
    ],
  }));

  body.push(...run({
    id: "A5",
    title: "Tax codes",
    what: "The named tax rates that get attached to invoice lines, such as VAT at 7.5 percent.",
    why: "A tax code with the wrong rate produces invoices that are wrong by exactly that much, on every line, forever.",
    before: [],
    doThis: [
      "Open Tax Codes and read the list. Note each code, its rate and the account it posts to.",
      "Create one: \"QA4VAT\", 7.5 percent, pointed at a sensible liability account.",
      "Go to Receivables, AR Invoices, New invoice, and check your new code appears in the tax selection on a line.",
      "Come back and edit the rate to 10 percent. Save.",
      "Check the invoice screen shows the new rate.",
    ],
    passes: [
      "Your code appears wherever tax can be chosen, without needing a full page reload.",
      "The rate you typed is the rate shown, with no rounding surprises. 7.5 stays 7.5.",
      "Editing takes effect on new documents.",
    ],
    breakIt: [
      "Try a rate above 100, and a negative rate.",
      "Try to save a code with no rate at all.",
    ],
    note: "Do not change a tax code somebody else created. Rates feed live documents.",
  }));

  body.push(...run({
    id: "A6",
    title: "Cost centres",
    what: "Labels that say which part of the business a cost or income belongs to, for example a branch or a department.",
    why: "They are how management reporting slices the numbers later.",
    before: [],
    doThis: [
      "Open Cost Centres and read the list.",
      "Create one called \"QA4 <your name>\".",
      "Open the General Ledger, start a new journal, and check your cost centre can be chosen on a posting line.",
      "Deactivate or archive one you created, if the screen offers it, and check it stops being offered on new documents.",
    ],
    passes: [
      "The new cost centre appears in the picker on journal lines.",
      "The picker lets you type to search rather than forcing you to scroll a long list.",
      "Deactivating removes it from new documents without disturbing older ones that already used it.",
    ],
    breakIt: ["Try to create two with the same code."],
  }));

  body.push(...run({
    id: "A7",
    title: "Dimensions",
    what: "Extra labels beyond cost centres. You define an axis, for example \"Programme\", and the values it is allowed to take.",
    why: "They drive the cost and dimension analysis report, and a dimension with no allowed values is a trap for whoever tries to use it.",
    before: [],
    doThis: [
      "Open Dimensions. Read the axes that already exist and the values under each.",
      "Create an axis called \"QA4 Axis\" with two or three allowed values.",
      "Open the General Ledger, start a new journal, and check your axis appears beside the cost centre picker on each posting line, with only the values you defined.",
      "Post a small balanced journal that uses one of your values.",
      "Open the journal you just posted and look for a dimensions column or field on its lines.",
    ],
    passes: [
      "Only the values you defined are offered. You cannot type a free value that was never allowed.",
      "The value you chose is visible again when you reopen the journal. It is stored, not just displayed while typing.",
      "The screen loads without error. If this screen fails to load at all, say so clearly, because it has broken that way before.",
    ],
    breakIt: [
      "Create an axis with no values at all and see what the journal line offers you.",
      "Add a value with a comma in it and check nothing splits it in two.",
    ],
  }));

  body.push(new Paragraph({ children: [new PageBreak()] }));

  // =========== PART 4: Section B ===========
  body.push(h1("Part 4  ·  Section B, the general ledger"));
  body.push(p("The general ledger is the actual book of record. Everything else in finance is a friendly way of writing into it. A journal has lines, each line is either a debit or a credit, and the two sides must add up to the same number or it cannot be posted."));

  body.push(...run({
    id: "B1",
    title: "Reading the journal list",
    what: "The list of every posting in the books, with tabs across the top for the states a journal can be in: drafts, pending, approved, posted, reversed and cancelled.",
    why: "This is where a finance officer goes to find out what happened. Filters that lie make that impossible.",
    before: ["You are on CODEX."],
    doThis: [
      "Open Ledger and Setup, General Ledger.",
      "Click each status tab in turn. Note the count on each tab and whether the rows match the tab you picked.",
      "Use the source filter. Then set the period filter to this month, last month, year to date, and finally a custom range.",
      "Combine a status tab with a source filter and a period.",
      "Page to the second page of results and back.",
      "Search for a journal by its reference.",
    ],
    passes: [
      "Every row under a tab really is in that state. A posted journal never appears under drafts.",
      "The count on a tab agrees with the number of rows you can page through under it.",
      "Filters combine rather than cancelling each other out.",
      "Changing a filter takes you back to page one instead of leaving you on a page that no longer exists.",
      "A custom date range excludes things outside it at both ends. Check the first and last day are included.",
    ],
    breakIt: [
      "Set a custom range that ends before it starts.",
      "Filter to something with no results and check you get a proper empty message rather than a blank screen or a spinner that never stops.",
    ],
  }));

  body.push(...run({
    id: "B2",
    title: "Posting a journal by hand",
    what: "The New journal drawer, where you write debit and credit lines yourself. Every other screen in finance eventually produces one of these.",
    why: "If the balance check is weak here, wrong books can be created directly.",
    before: ["The current month must be open, from run A3."],
    doThis: [
      "In the General Ledger, click New journal.",
      "Set the date to today. Reference \"QA4-<your name>\". Narration \"QA4 balanced test\".",
      "Add a debit line: pick an expense account, amount 5000.",
      "Add a credit line: pick a bank account, amount 5000.",
      "Attach a cost centre and a dimension value to one of the lines.",
      "Watch whatever running total or balance indicator the drawer shows as you type.",
      "Post it. Note the journal number.",
      "Find it in the list under Posted and open it.",
    ],
    passes: [
      "The drawer tells you clearly whether the entry balances, and it updates as you type rather than only when you submit.",
      "The journal posts, gets a number, and appears under Posted.",
      "When you reopen it, the lines, the cost centre and the dimension value are all exactly what you entered.",
      "The date, period and narration are what you typed.",
    ],
    breakIt: [
      "Make the two sides unequal, 5000 against 4000, and try to post. It must refuse and say why.",
      "Try to post with a single line only.",
      "Try to post with an amount of zero on a line.",
      "Put a negative amount on a line.",
      "Delete lines until only one is left and see whether the remove button stops you.",
      "Enter 5000.555 and see how it rounds. Whatever it does, it should not silently lose money.",
    ],
    note: "If your journal lands under Pending instead of Posted, an approval rule is in play. Note the number and tell the Track 3 tester. It is not a finance bug.",
  }));

  body.push(...run({
    id: "B3",
    title: "Reading a journal and reversing it",
    what: "The detail view of a single posting, and the reverse action that undoes it by writing an equal and opposite entry.",
    why: "Reversal is how mistakes get corrected in a real ledger. Books are never edited in place, so the reversal must be a new visible entry, not a quiet deletion.",
    before: ["Use the journal you posted in B2."],
    doThis: [
      "Open your posted journal. Read every field and tab.",
      "Reverse it. Read whatever confirmation you are given before you agree.",
      "Find the reversal in the list. Open it.",
      "Go back to the original and look at its status.",
    ],
    passes: [
      "A new journal is created with the debits and credits the other way round, for the same amounts.",
      "The original is still visible and is marked as reversed. It has not vanished.",
      "The two are linked, so from one you can tell the other exists.",
      "You are asked to confirm before it happens.",
    ],
    breakIt: [
      "Try to reverse the same journal twice.",
      "Try to reverse the reversal.",
    ],
  }));

  body.push(...run({
    id: "B4",
    title: "Journals that came from somewhere else",
    what: "Most journals are not typed by hand. They are created by an invoice, a receipt, a credit note. The source column says which.",
    why: "A finance officer needs to trace any number back to the thing that caused it.",
    before: ["Do this after you have run C2 and C4, so there are invoice and receipt journals to look at."],
    doThis: [
      "In the General Ledger, filter by source to find journals raised by invoices, then by receipts.",
      "Open one raised by an invoice and read its lines.",
      "Check whether the journal points back at the invoice that caused it, by number or by a link.",
      "Do the same for a receipt.",
    ],
    passes: [
      "You can tell from the journal alone which document produced it.",
      "The source label is accurate. A receipt journal is not labelled as manual.",
      "The lines match what the invoice screen told you it would post.",
    ],
    breakIt: ["Try to edit or delete a journal that came from an invoice. It should not be editable by hand."],
  }));

  body.push(new Paragraph({ children: [new PageBreak()] }));

  // =========== PART 5: Section C ===========
  body.push(h1("Part 5  ·  Section C, receivables"));
  body.push(p("This is the heart of your track and the biggest part of the pack. Work through it in order, because each run uses what the one before it created."));
  body.push(
    callout("One accounting rule to keep in your head", [
      "When a customer pays more than they owe, or gets a credit note for more than an invoice, the extra is money we are holding on their behalf. It is a liability, and it goes to account 2140, customer credit balances.",
      "It must never show up as a negative amount owed on the receivables account. So if you ever see a customer's balance go below zero, or receivables going negative anywhere, that is a serious finding. Raise it as URGENT and say exactly which steps produced it.",
    ], "EAF2EA")
  );
  body.push(spacer());

  body.push(...run({
    id: "C1",
    title: "Creating and reading a customer",
    what: "The people and organisations who owe us money. The screen shows how much each owes and whether they are in good standing.",
    why: "Everything downstream hangs off a customer record, including which receivables account their debt sits in.",
    before: ["You are on CODEX."],
    doThis: [
      "Open Receivables, Customers. Read the cards at the top and the status tabs.",
      "Click New customer. Name \"QA4 <your name> Ltd\". Fill in a billing email and phone. Add an address.",
      "Leave the receivable account at its default and note what that default is.",
      "Save, then find your customer in the list.",
      "Create a second customer, this time with an opening balance of 25000 dated today. Note what happens.",
      "Open your first customer and look at each tab: transactions, statement, contact.",
      "Edit the contact details and save.",
    ],
    passes: [
      "Both customers save and appear in the list with a balance of the right amount. The first shows nothing owed, the second shows N25,000.",
      "The opening balance produced a real posting. Check the general ledger for it.",
      "The statement tab reads like a document you could send: who it is from, who it is to, the running ledger, an opening and a closing figure.",
      "Editing contact details sticks after a reload.",
      "The cards at the top of the list agree with the rows underneath, including after you change the status tab.",
    ],
    breakIt: [
      "Save with an email that is not an email, such as \"abc\".",
      "Save with the name empty.",
      "Create a customer with the same name as one that exists. Whatever the rule is, it should be stated rather than silently allowed and then confusing later.",
      "Give an opening balance but no date.",
    ],
    note: "\"Send to customer\" on the Statement tab now sends a real email with the statement attached as a PDF. Use it only on a customer you created.",
  }));

  body.push(...run({
    id: "C2",
    title: "Raising an invoice",
    what: "Billing a customer. You pick the customer, the dates, and one or more lines of what they are being charged for.",
    why: "This is the moment a debt comes into existence, and the moment the ledger first learns about it.",
    before: ["Your customer from C1 exists. The current month is open."],
    doThis: [
      "Open Receivables, AR Invoices. Read the four cards at the top and the status tabs.",
      "Click New invoice. Type the first few letters of your customer's name into the customer box and pick from the suggestions.",
      "Set the invoice date to today and the due date to two weeks out.",
      "Add a line: description \"QA4 tuition\", quantity 1, unit price 100000. Pick an income account.",
      "Add a second line with quantity 3 and unit price 5000. Leave tax off this invoice, so the arithmetic in the runs that follow stays simple.",
      "Check the running total at the bottom of the drawer. It should read N115,000 exactly.",
      "Save. Note the invoice number. This is the invoice runs C4 and C5 will use, so keep the number to hand.",
      "Open the invoice and go through all five tabs: lines, payments, GL, reminders, activity.",
      "Now raise a second, separate invoice for the same customer: one line, quantity 1, unit price 10000, this time with the tax code you made in A5 attached. Check the tax is added on top and the total reads N10,750 at 7.5 percent.",
    ],
    passes: [
      "The customer search finds people as you type and does not make you scroll a full list.",
      "The first invoice totals N115,000 exactly, with no rounding drift.",
      "On the taxed invoice, the tax equals the rate you set applied to the line total, and it is shown as a separate figure rather than buried in the line.",
      "The invoice saves and immediately appears in the list as outstanding, not as a draft.",
      "The GL tab shows a debit to receivables and credits to the income accounts you picked, and both sides are equal.",
      "The payments tab is empty and says so in words.",
      "Open Email invoice. The panel names the customer's billing address, a CC address and the subject line, and lists an \"Automatic on posting\" entry marked Sent - the copy the system emailed when you saved the invoice. Cancel out without sending.",
      "The customer's balance on the Customers screen has gone up by the invoice total.",
    ],
    breakIt: [
      "Save with no customer chosen.",
      "Save with no lines.",
      "Set the due date before the invoice date.",
      "Enter a quantity of zero, then a negative unit price.",
      "Add ten lines and check the drawer still scrolls properly and the total is right.",
      "Date the invoice into the closed period from A3 and confirm the same clear refusal.",
    ],
  }));

  body.push(...run({
    id: "C3",
    title: "Fee structures and generating invoices in bulk",
    what: "A fee structure is a reusable list of charges, for example a term's tuition, boarding and ICT. From it you can raise many invoices at once.",
    why: "In a school this is how most invoices are actually created. One wrong line here becomes hundreds of wrong invoices.",
    before: ["Your customer from C1 exists."],
    doThis: [
      "Open Receivables, Fee Structures. Read the list and note the code, name, term, number of lines and total for each.",
      "Open one and read its lines: the fee item, the account, the amount and any tax.",
      "Create a new structure with New structure. Code \"QA4FS\", give it a term, and add two or three fee lines with different amounts.",
      "Check the total per term shown in the list equals your lines added up.",
      "Open a structure and use Generate invoices. Read carefully what it says it is about to do before confirming.",
      "Go to AR Invoices and find what was generated.",
      "Now go back to New invoice and use \"Start from a fee structure\" to prefill a single invoice from your structure.",
    ],
    passes: [
      "The total shown for a structure equals the sum of its lines, every time.",
      "Generating tells you how many invoices it will raise and for whom, before it does it.",
      "The generated invoices carry the right lines, amounts and accounts.",
      "Prefilling a single invoice fills in the lines but still lets you change them before saving.",
      "The active and inactive filter works.",
    ],
    breakIt: [
      "Create a structure with no lines and try to generate from it.",
      "Generate twice from the same structure and see whether you get duplicate invoices with no warning. If you do, that is worth reporting even if it is technically allowed.",
    ],
    note: "This one can create a lot of rows on a shared database. Keep your structure small, two or three lines, and use your own customer.",
  }));

  body.push(...run({
    id: "C4",
    title: "Recording a receipt and allocating it",
    what: "Money arriving. The drawer has two steps: first you capture what came in and see a preview of the posting, then you say which invoices it pays off.",
    why: "This is the most-used screen in the whole track, and allocation is where the arithmetic is easiest to get wrong.",
    before: ["Your invoice from C2 exists and is outstanding."],
    doThis: [
      "Open Receivables, Receipts and Allocation. Read the cards and the status and method filters.",
      "Click Record receipt. Choose your customer, today's date, method bank transfer, amount 40000, and a bank account. Reference \"QA4-<your name>\".",
      "Read the posting preview on the second step of the drawer. Write down what it says it will debit and credit.",
      "Continue to allocation. Choose the automatic option and check which invoice it picks.",
      "Confirm and note the receipt number.",
      "Open your invoice again and look at the payments tab and the outstanding figure.",
      "Now record a second receipt for the same customer of 30000, but this time on the allocation step split it explicitly across invoices instead of letting it choose.",
      "Try the ordering choice on the allocation drawer: oldest first, then largest first. Watch the preview change before you confirm.",
    ],
    passes: [
      "The posting preview reads as a debit to the bank account and a credit to receivables, for the amount you entered.",
      "Automatic allocation picks the oldest unpaid invoice by due date, not a random one.",
      "After allocating N40,000 to a N115,000 invoice, the invoice shows N75,000 outstanding and the payments tab lists the receipt.",
      "Changing the ordering choice visibly changes the preview before you commit.",
      "An explicit split never lets you allocate more to an invoice than that invoice actually owes, and never more than the money you received.",
      "The customer's balance drops by exactly what you allocated.",
    ],
    breakIt: [
      "Try to record a receipt of zero, then of a negative amount.",
      "In an explicit split, try to allocate more than the receipt is worth. It should stop you and say so.",
      "Record a receipt and close the drawer at the allocation step without allocating. The receipt should still exist, showing as unallocated, and you should be able to come back to it later.",
      "Allocate the same receipt twice.",
      "Date the receipt earlier than the invoice it pays. Note what happens. There are deliberate rules about dates in this system, so an error here may well be correct. Write down the wording either way.",
    ],
  }));

  body.push(...run({
    id: "C5",
    title: "Overpayment, and where the extra money goes",
    what: "What happens when a customer pays more than they owe.",
    why: "This is the rule from the box at the start of this section. The extra becomes money we hold for them, in account 2140, and never a negative debt.",
    before: ["Start this run with a fresh invoice of its own, so the arithmetic is unambiguous no matter what state your earlier invoices are in."],
    doThis: [
      "Raise a new invoice for your customer: one line, quantity 1, unit price 50000, no tax. Note the number.",
      "Record a receipt for that customer of 70000.",
      "Read the posting preview before confirming. Write down every line it says it will post.",
      "On the allocation step, allocate explicitly to that new invoice only, N50,000 of it, and confirm.",
      "Open the invoice. Check it is fully paid.",
      "Open the customer and look at both the balance and anything shown as credit held for them.",
      "Go to the general ledger and find the journal this receipt created. Read its lines.",
    ],
    passes: [
      "The invoice is settled in full and shows nothing outstanding.",
      "The customer's balance never goes below zero. If other invoices are still open it reflects those, but the N20,000 left over is not netted off as a negative debt.",
      "The journal shows three lines: the bank debited for the full N70,000, receivables credited for the N50,000 that was actually owed, and account 2140 credited with the N20,000 left over.",
      "The extra is visible somewhere as credit held for that customer, so a finance officer can see it exists.",
    ],
    breakIt: [
      "Raise a new invoice for that customer afterwards and see whether the credit you are holding can be applied to it.",
      "Look at the customer statement and check the credit is shown honestly rather than as a negative debt.",
    ],
    note: "If the balance goes negative at any point in this run, stop and raise an URGENT ticket with the numbers.",
  }));

  body.push(...run({
    id: "C6",
    title: "Credit and debit notes",
    what: "A credit note reduces what a customer owes, for example after an overcharge. A debit note increases it. Issuing one creates the note, and applying it is a separate deliberate step.",
    why: "These change the amount owed without money moving, so the ledger entries need to be exactly right.",
    before: ["Your customer has at least one outstanding invoice."],
    doThis: [
      "Open Receivables, Credit and Debit Notes. Read the columns and use both dropdown filters, by type and by status.",
      "Click Issue note. Choose credit, your customer, amount 20000, and pick the invoice to raise it against. Choose an income account. Give a reason.",
      "Read the posting preview. Write down what it will debit and credit.",
      "Save. Note the note number and its status, which should be Issued.",
      "Open the note and use Apply to balance. Confirm.",
      "Check the invoice balance and the customer balance.",
      "Now issue a debit note for 5000 against the same customer and look at what actions the detail drawer offers.",
    ],
    passes: [
      "A credit note posts as a debit to the income account and a credit to receivables, for the amount applied.",
      "It arrives as Issued and only becomes Applied after you deliberately apply it. It does not apply itself.",
      "Applying it reduces the invoice balance and the customer balance by exactly the amount.",
      "A debit note offers no apply action at all. That is intended, see section 1.5.",
      "Both filters work, and the type chip in the table matches what you created.",
    ],
    breakIt: [
      "Issue a credit note for more than the invoice is worth. If it is allowed, check the leftover goes to customer credit and not to a negative balance.",
      "Apply the same credit note twice.",
      "Save with no reason and with no account chosen.",
    ],
  }));

  body.push(...run({
    id: "C7",
    title: "Refunds and write-offs",
    what: "Two ways money leaves the receivables story. A refund sends credit we are holding back to the customer's bank. A write-off accepts that an invoice will never be paid and books it as a cost.",
    why: "Both reduce what the business is owed, so both are exactly the sort of thing that must be controlled, traceable and correctly capped.",
    before: ["From C5 your customer has credit we are holding. You also need one outstanding invoice, so raise a small one if you have none left."],
    doThis: [
      "Open Receivables, Refunds and Write-offs. Read the three cards and the type filter, then note that both kinds of record share one table.",
      "Click New action and switch it to Refund to bank. Choose your customer, an amount smaller than the credit being held, and a bank account.",
      "Read the posting preview and write it down. Save without ticking the draft option.",
      "Find the refund in the table and check its status.",
      "Do it again, this time ticking Save as draft. Check it lands as Pending, then open the row and post it.",
      "Now switch New action to Write off to expense. Pick one of your customer's open invoices. Watch what the amount field defaults to.",
      "Note which expense account it defaults to. Add a reason and confirm.",
      "Check the invoice and the customer balance afterwards.",
    ],
    passes: [
      "A refund posts as a debit to customer credit, account 2140, and a credit to the bank.",
      "You cannot refund more than the credit actually held for that customer. Try it and check you are stopped.",
      "A refund saved as draft reads Pending and only posts when you say so. One not saved as draft posts straight away.",
      "A write-off defaults to the chosen invoice's outstanding balance and will not go above it.",
      "The write-off books to bad debt, account 5300, unless you change it, and reduces the invoice to nothing owed.",
      "Both kinds appear in the same table, clearly labelled, and the write-off row names the invoice it wrote off.",
    ],
    breakIt: [
      "Refund a customer who has no credit at all.",
      "Write off an invoice that is already fully paid.",
      "Write off with the reason left empty. It is required, so it should say so.",
      "Write off part of an invoice, then try to write off the same invoice again for the full amount.",
    ],
  }));

  body.push(...run({
    id: "C8",
    title: "Payment plans",
    what: "An agreement to settle one invoice in instalments. The plan shows progress, what is due next, and whether it is on track.",
    why: "The progress and health readings are derived, not stored, so they are the sort of thing that drifts out of line with reality without anyone noticing.",
    before: ["Raise a fresh invoice for your customer of 90000 so you have something clean to put on a plan."],
    doThis: [
      "Open Receivables, Payment Plans. Read the columns, particularly the progress bar, the next due date and the health reading.",
      "Click New plan. Choose your invoice, three monthly instalments, starting next month.",
      "Read the schedule preview before saving. Check the amounts add up to the invoice total and the dates step forward a month at a time.",
      "Save. Note the plan number and check it becomes active straight away.",
      "Open the plan and read the instalment schedule. Note which instalment is marked as due.",
      "Use Record instalment on the first one.",
      "Check the progress bar, the invoice balance and the customer balance.",
      "Go to Receipts and Allocation and check a real receipt was created by that instalment.",
      "Cancel the plan and see what happens to the instalments and to the invoice.",
    ],
    passes: [
      "The instalments add up to exactly the invoice total, with no rounding gap on the last one.",
      "Recording an instalment creates a genuine receipt against the invoice, not just a tick on the plan.",
      "The invoice balance falls by the instalment amount.",
      "Progress reads one of three after the first payment.",
      "The health reading says at risk only when an unpaid instalment is genuinely past its due date. Check one of the older plans in the list against its dates.",
      "Cancelling asks you to confirm and does not silently unwind the payments already made.",
    ],
    breakIt: [
      "Try to create a plan with no invoice chosen.",
      "Try one instalment, then try twenty.",
      "Try an amount larger than the invoice.",
      "Record the same instalment twice.",
    ],
  }));

  body.push(...run({
    id: "C9",
    title: "Concessions, waivers, discounts and scholarships",
    what: "A deliberate reduction of what a specific invoice asks for. Three types, all doing the same thing to the books.",
    why: "This is money given away on purpose, so it has its own account and it must be capped at what the invoice actually owes.",
    before: ["Your customer has an invoice with a known outstanding balance. Write the balance down."],
    doThis: [
      "Open Receivables, Concessions. Read the three cards and both filters. Note the type chips in the table.",
      "Click New concession. Choose the discount type, your customer, and the invoice. Use the amount option and enter 10000. Give a reason.",
      "Read the posting preview and write it down. Save it as a draft if the option exists.",
      "Find it in the list, open it, and post it.",
      "Check the invoice balance afterwards.",
      "Create a second one, and this time use the percentage option. Enter 10 percent and read the line that tells you what that comes to against the invoice balance.",
      "Post it and check the arithmetic against what that line predicted.",
    ],
    passes: [
      "The posting is a debit to the allowance account, 4910, and a credit to receivables.",
      "The percentage option tells you the naira figure before you commit, and the posted amount matches it exactly.",
      "A draft does nothing to the invoice until it is posted.",
      "Posting reduces the invoice balance by exactly the concession.",
      "All three types appear correctly chipped in the table and the type filter works.",
      "The cards at the top move when you post one.",
    ],
    breakIt: [
      "Enter a concession larger than the invoice balance. It should be capped or refused, and either way it should tell you.",
      "Enter 150 percent.",
      "Post the same draft twice.",
      "Save with no invoice chosen. The invoice is required.",
    ],
  }));

  body.push(...run({
    id: "C10",
    title: "Dunning, the reminder machine",
    what: "Chasing late payers. A policy sets the cadence, for example a reminder one day overdue, another at fourteen, another at thirty. Running it raises notices into a queue.",
    why: "This is the only part of receivables that touches customers directly, and it is also the part where a mistake means we harass someone who has already paid.",
    before: ["You need at least one overdue invoice. Raise one dated in the past with a due date that has passed, if the closed period from A3 does not get in the way."],
    doThis: [
      "Open Receivables, Dunning. Read the four ageing cards: due soon, one to thirty days over, thirty-one to sixty, and over sixty.",
      "Check the reminder queue tab. Read the columns, including the cadence column that shows the active policy.",
      "Move to the policies tab. Open the existing policy and read its stages: name, days overdue, channel.",
      "Create your own policy \"QA4 policy\" with two stages, one at three days and one at ten. Set one to email and one to both email and in-app.",
      "Edit a stage, then remove it, then add it back.",
      "Go back to the queue and use Run reminders now, or Generate notices.",
      "Look at the notices that appear and the invoices they point at.",
      "Cancel one notice.",
    ],
    passes: [
      "The four ageing cards add up sensibly and an invoice appears in exactly one bucket, matching how late it actually is.",
      "The stage editor saves what you typed, including a stage with both channels ticked, and it survives a reload.",
      "Generating raises notices only for invoices that are genuinely overdue, and never for one that is paid.",
      "Cancelling a notice works and the status changes.",
      "Notice statuses read in plain words: scheduled, sent, resolved, cancelled.",
    ],
    breakIt: [
      "Set a stage to a negative number of days.",
      "Create two stages at the same number of days.",
      "Run the reminder generation twice in a row and see whether you get duplicate notices for the same invoice.",
      "Pay an invoice in full, then run generation again and check no notice is raised for it.",
    ],
    note: "Send on an individual notice is real: it emails the customer and marks the notice sent, and it cannot be recalled. Confirm the customer is one of yours before sending.",
  }));

  body.push(...run({
    id: "C11",
    title: "The customer statement",
    what: "The document you would actually send to a customer: who it is from and to, every debit and credit in date order, an opening balance and a closing one.",
    why: "It is the summary of everything you have done in this section. If it does not agree with the individual screens, one of them is lying.",
    before: ["Do this run last, after C1 to C10, so your customer has a full history."],
    doThis: [
      "Open Receivables, Customers, find your customer and open the statement tab.",
      "Read every line. Tick off each one against what you did: the invoices you raised, the receipts, the credit note, the concession, the write-off, the instalments.",
      "Check the opening and closing balances.",
      "Add up the debits and credits yourself and confirm the closing figure.",
      "Compare the closing figure with the balance shown for that customer in the list.",
      "Use Print and look at what comes out.",
    ],
    passes: [
      "Every action you took appears exactly once. Nothing is missing and nothing is doubled.",
      "The lines are in date order and each says what it was.",
      "The closing balance equals the opening balance plus debits minus credits.",
      "It matches the balance on the Customers list.",
      "The printed version is readable, keeps the letterhead and the totals, and does not cut off at the edge.",
      "Footer actions offering to chase payment only appear when the customer actually owes something.",
    ],
    breakIt: [
      "Open the statement for a brand new customer with no history at all and check you get a sensible empty document rather than an error.",
    ],
  }));

  body.push(...run({
    id: "C12",
    title: "The invoice list itself",
    what: "Going back to the AR invoice list now that it has real data in it, and testing it as a list: cards, tabs, filters, search, paging and export.",
    why: "This is the screen the finance team will live on. It has to be fast and it has to be honest.",
    before: ["Everything from C2 to C10 has been done."],
    doThis: [
      "Open AR Invoices. Read the four cards: total invoiced, total collected, collection rate, overdue balance.",
      "Work out the collection rate yourself from the first two cards and check it agrees.",
      "Click each status tab and check the rows really are in that state.",
      "Search by invoice number, then by part of a customer name.",
      "Page forward and back.",
      "Use Export and open the file that downloads.",
      "Open an invoice you part paid and check the payments tab lists every receipt against it.",
    ],
    passes: [
      "The cards agree with the data. Collected plus outstanding makes sense against invoiced.",
      "Overdue counts only invoices whose due date has actually passed and which are not settled.",
      "Search returns matches for both a number and a name, and clearing it restores the list.",
      "The exported file opens, has a header row, and the rows and amounts match what is on screen.",
      "Typing in the search box does not fire a request on every keystroke. If the screen flickers or stutters as you type, note it.",
    ],
    breakIt: [
      "Search for something that cannot exist, such as ZZZZZ, and check for a proper empty message.",
      "Search, then switch tabs, and see whether your search is still applied and whether the count still agrees.",
    ],
  }));

  body.push(new Paragraph({ children: [new PageBreak()] }));

  // =========== PART 6: Section D ===========
  body.push(h1("Part 6  ·  Section D, checks to repeat on every screen"));
  body.push(p("These three runs are not about one feature. Pick any six screens from your track, including at least two lists, one drawer with a form in it, and one detail view, and put each of them through all three."));

  body.push(...run({
    id: "D1",
    title: "On a phone",
    what: "The same screens at phone width.",
    why: "People switch from desk to phone. Desktop is the design we care most about, but a phone must never be broken, cut off, or scrolling sideways.",
    before: ["Use a real phone if you have one on the same network, otherwise make your browser window about 390 pixels wide."],
    doThis: [
      "Open each of your six screens at phone width.",
      "Scroll down the whole page, then try to scroll sideways.",
      "Open a drawer, such as New invoice, and fill the whole form in without turning the phone sideways.",
      "Open a detail view with tabs and move between the tabs.",
      "Open the sidebar, navigate somewhere, and close it.",
      "Repeat at tablet width, about 820 pixels.",
    ],
    passes: [
      "No page scrolls sideways. Ever. If one does, that is a bug on its own, so note which screen.",
      "Lists become stacked cards rather than a squashed table, and no column of data is simply gone.",
      "Every button you need can be reached and tapped, including the one that saves the form.",
      "Nothing overlaps anything else and no text is cut off mid-word.",
      "Money still reads as full amounts, not truncated.",
    ],
    breakIt: [
      "Fill in a long customer name and a long narration and see whether they wrap or push the layout out.",
      "Open a drawer and rotate the phone.",
    ],
    note: "Complex multi-line editors, such as a journal with six lines, only have to be usable on a phone, not comfortable. Report broken, not cramped.",
  }));

  body.push(...run({
    id: "D2",
    title: "Empty, loading and error states",
    what: "What each screen shows when there is nothing to show, while it is fetching, and when something goes wrong.",
    why: "Most screens are built and checked with data in them. The empty version is what a brand new school actually sees on their first day.",
    before: ["Use filters to produce genuinely empty results rather than deleting anything."],
    doThis: [
      "On each of your six screens, filter to something with no results.",
      "Watch what happens while a screen is loading. Note anything that flashes, jumps, or shows zero before showing the real number.",
      "Turn your internet off, reload a screen, and watch what it does. Turn it back on and see whether it recovers by itself or needs a reload.",
      "Open a detail view for something that does not exist by editing the address bar, for example changing an invoice id to 999999.",
    ],
    passes: [
      "An empty list says so in words, and ideally says what to do about it. It is not a blank white area or an endless spinner.",
      "Cards on an empty screen show zero rather than a dash where a number should be, or a dash consistently. Either is fine as long as it is the same everywhere.",
      "A missing record gives a clear not-found message, not a crash or a blank page.",
      "Losing the connection produces a message that says the connection failed, and the screen recovers when it comes back.",
      "No screen ever shows a raw technical error, a stack of code, or the word undefined.",
    ],
    breakIt: [
      "Click a save button twice quickly and see whether you get two of whatever you were creating.",
      "Use the browser back button in the middle of a flow, then go forward again.",
    ],
  }));

  body.push(...run({
    id: "D3",
    title: "Exports and printing",
    what: "The download buttons on lists, and Print on documents.",
    why: "An export that quietly produces the wrong file is worse than one that fails loudly, because somebody sends it to a customer.",
    before: [],
    doThis: [
      "On each list that offers Export, download the file.",
      "Open each file. Check the columns, the row count against what was on screen, and the amounts.",
      "Apply a filter, export again, and check the file respects the filter.",
      "On any document that offers Print, use it and look at the preview.",
    ],
    passes: [
      "Every export downloads something that opens without a warning about a damaged file.",
      "Amounts in the file are readable numbers, not raw kobo integers. N80,000 should not come out as 8000000.",
      "The file matches the filter that was on screen when you asked for it.",
      "Print keeps the layout, the totals and the headings, and does not spill off the page.",
    ],
    breakIt: [
      "Export an empty filtered list and see whether you get an empty file with headers, or an error, or nothing at all. Any of these might be intended, so just report what you see.",
    ],
  }));

  body.push(new Paragraph({ children: [new PageBreak()] }));

  // =========== PART 7 ===========
  body.push(h1("Part 7  ·  Does the accounting hold up"));
  body.push(p("These are the checks nobody else on the team is placed to do. Each screen might work perfectly on its own while the numbers underneath disagree with each other. Give this half an hour at the end."));

  body.push(h2("The four cross-checks"));
  body.push(
    table(
      [
        ["Check", "How to do it", "What proves it"],
        ["The books balance",
          "Open Finance, Reports and Close, Trial Balance. Set the period to the current month.",
          "Total debits equal total credits, and the balanced badge is showing. Do this once at the start of your session and again at the very end. If it balanced before your testing and not after, something you did broke it, and knowing which run it was is enormously valuable."],
        ["Receivables agrees with the customers",
          "Note the balance on the receivables control account, 1200, on the trial balance. Then add up the balances of every customer on the Customers list.",
          "The two figures are the same. If they are not, one of the runs above wrote to the ledger without updating the customer, or the other way round."],
        ["Customer credit is a liability",
          "After run C5, look at account 2140 on the trial balance.",
          "It holds the overpayment you created, as a credit. No customer anywhere shows a negative amount owed."],
        ["Nothing posted itself",
          "Go through the general ledger for today, filtered to journals raised by your own work.",
          "Every journal traces back to a document you deliberately created. If there are postings you cannot account for, list them in a ticket with their numbers."],
      ],
      [1900, 3400, 4060]
    )
  );

  body.push(h2("What to write up at the end"));
  body.push(p("When you have finished, post one short message to the team channel with four things:"));
  body.push(...bullets([
    "How many runs you completed, and which you could not do and why.",
    "The ticket numbers you raised, grouped by priority.",
    "The single worst thing you found.",
    "Anything in this pack that was wrong, unclear, or sent you the wrong way. That feedback shapes the other five packs, so it is worth as much as the bugs.",
  ]));

  body.push(new Paragraph({ children: [new PageBreak()] }));

  // =========== PART 8: sign-off ===========

  body.push(h1("Part 8  ·  Sign-off sheet"));
  body.push(p("Fill this in as you go. Bring it to the wrap-up."));
  body.push(...K.signOff(runIds).slice(2));

  return { trackNo: TRACK_NO, trackName: TRACK_NAME, body, runCount: runIds.length };
};
