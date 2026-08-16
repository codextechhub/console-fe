// Track 5 - Finance: Operations, Payments and Reports.
//
// The money-going-out half of finance, the payment gateway either side of it,
// and the statements that have to agree with all of it at the end.

const K = require("../pack.cjs");
const { t, p, h1, h2, bullets, steps, small, callout, table, spacer, makeRun } = K;

const TRACK_NO = 5;
const TRACK_NAME = "Finance Operations, Payments and Reports";
const PREFIX = "QA5";

module.exports = function buildTrack5() {
  const runIds = [];
  const run = makeRun(runIds);
  const body = [];

  body.push(...K.coverAndContents({
    trackNo: TRACK_NO,
    trackName: TRACK_NAME,
    blurb: "One tester. Twenty-four test runs. Money leaving the business, money arriving through the gateway, and the six statements that have to agree with both.",
    coverExtra: [["Ledger entity to use", "CODEX"]],
    contents: [
      ["Part 1", "Read this first: entities, house rules, the list of things that look broken but are not, and how to report a problem", "25 min"],
      ["Part 2", "The short version: one expense claim from raised to reimbursed", "30 min"],
      ["Part 3", "Section A - Operations (10 runs). Banking, reconciliation, expenses, petty cash, payroll, budgets, assets, tax", "3 hrs"],
      ["Part 4", "Section B - Payments (7 runs). Collections, virtual accounts, payouts, batches, settlement, transactions, failures", "2 hrs"],
      ["Part 5", "Section C - Reports and close (5 runs). The six statements, the audit trail, closing a period", "1 hr 30"],
      ["Part 6", "Section D - Checks to repeat on every screen (2 runs)", "30 min"],
      ["Part 7", "Does the accounting hold up. The cross-checks only you will do", "30 min"],
      ["Part 8", "Sign-off sheet", "-"],
    ],
  }));

  body.push(...K.partOne({
    trackNo: TRACK_NO,
    prefix: PREFIX,
    whatYouAreTesting: [
      "Your track is the money-going-out half of finance, plus the gateway that moves money in and out for real, plus the statements that have to agree with everything.",
      "Three groups. Operations is what a finance team does week to week: bank accounts and reconciling them, staff expense claims, the petty cash tin, payroll, budgets, fixed assets and tax filings. Payments is the gateway: money customers send in, money we send out to vendors and staff, and the reconciliation between what the provider says happened and what our books say. Reports is the end of it: six financial statements, plus closing a period so the figures stop moving.",
      "The thread running through all of it is that every one of these actions writes into the same general ledger. An expense claim, a payroll run, a depreciation charge and a bank payout are all, underneath, entries in the same book. Section C is where you find out whether they agree.",
    ],
    notYours: "You are not testing money coming in from customers: invoices, receipts, credit notes, refunds and reminders belong to Track 4. You share the ledger with them, so if a figure looks wrong, check whether it came from their half before raising it.",
    firstSteps: [
      "Click Finance in the left sidebar. It opens with its own sidebar down the left: Dashboard, then Ledger and Setup, Receivables, Operations, Payments, Reports and Close, Administration.",
      "Look at the top of the page for the entity switcher. Choose CODEX. Read the next section before you go any further, because nothing else in this pack works until you have done this.",
      "Open Reports and Close, Trial Balance. Note whether it says the books are balanced, and write the totals down. You will compare against this at the end.",
      'Open Support in the main sidebar and create one throwaway ticket titled "QA5 smoke test, please ignore". This proves your reporting channel works before you need it in anger. If ticket creation itself fails, message Chidera directly.',
    ],
    entityNote: {
      paras: [
        "An entity is a set of books. The business can keep more than one, and every figure in finance belongs to exactly one of them. A payroll run on CODEX does not exist on CREST, and a total on one will never include the other.",
        "So the entity switcher at the top of Finance is not a filter. It decides which company's books you are looking at. If a screen says \"Select an entity\" and shows nothing else, that is expected. Pick one and the screen fills in.",
        "Stay on CODEX for the whole pack unless a run tells you otherwise. If you drift onto another entity halfway through you will lose your own data and report bugs that are not real.",
      ],
      footnote: "The switcher only appears when the tenant has more than one entity. If you cannot see it at all, you may be on a tenant with a single set of books. Ask Chidera to confirm before reporting it.",
    },
    houseRules: [
      [t("Amounts are typed in naira. ", { bold: true }), t("Type 80000 for eighty thousand naira. Do not type kobo and do not type commas. The screen should show it back to you as N80,000.00.")],
      [t("Posting is permanent. ", { bold: true }), t("A posted journal is corrected by reversing it, never by editing it. Post small amounts and expect them to stay in the books.")],
      [t("Never close or lock a fiscal period without asking. ", { bold: true }), t("It stops every other tester posting anything. Section C tells you when to do it and how to put it back.")],
      [t("Treat the gateway with care. ", { bold: true }), t("Collections and payouts can move real money depending on how the environment is configured. Read Section B's warning before you touch it.")],
    ],
    knownIntended: [
      "1.  A payroll run that has been posted but not yet paid reads as Calculated, not Posted. The cost is in the books; the staff have not been paid yet. That distinction is deliberate.",
      "2.  Pay figures and payout beneficiary details show as dots unless you hold the sensitive permission for them. That is field-level security working, not missing data.",
      "3.  The Settlement screen posts nothing. It compares what the provider says against what our books say, and reports the difference. The real book-versus-bank close happens in Bank Reconciliation.",
      "4.  Some reports are scoped to a fiscal period and some to a fiscal year. Read the filter before concluding a figure is wrong.",
      "5.  Nothing can be posted into a closed period. The refusal is the guard working. If the current month is closed, tell Chidera rather than reopening it yourself.",
      "6.  There are no how-to articles for finance screens yet. The help panel offers general intranet guides only. Do not report those as missing.",
      "7.  Lists show 25 rows at a time with a pager at the bottom. Intended.",
      "8.  A screen that is missing from the sidebar entirely is a permissions matter, not a bug. Tell Chidera so your account can be granted the key, and note it as blocked.",
    ],
    crossTrack: [
      ["A figure on a report looks wrong", "It may have come from Track 4's half of the ledger. Check with that tester before raising it, and give them the account and the amount."],
      ["Something you post lands as Pending rather than Posted", "An approval rule caught it. That is the workflow engine and belongs to Track 3. Note the reference, tell that tester, and carry on."],
      ["A screen you need is not in the sidebar", "Permissions. Tell Chidera."],
      ["Nothing loads at all and every screen errors", "The intranet is probably down. Say so in the team channel first. One ticket for everyone, not six."],
    ],
  }));

  // ── Part 2: smoke run ────────────────────────────────────────────────────
  body.push(h1("Part 2  ·  The short version, run this first"));
  body.push(p("One small amount of money, all the way from somebody spending it to the business paying them back. Half an hour, and it touches the ledger three times."));
  body.push(...steps([
    'Operations, Expense Claims. Raise a claim for yourself: one line, 5000 naira, any expense account, description "QA5 <your name> test".',
    "Attach any file as a receipt.",
    "Submit it. Note what the screen says happens next.",
    "Approve it. Read the posting recap before you confirm: it should show which account is charged and which is credited.",
    "Confirm, and note the claim's new state.",
    "Now pay it, choosing a bank account. Read that posting recap too.",
    "Open Reports and Close, Trial Balance, and find the expense account you charged. It should have moved by 5,000.",
    "Open the Finance Audit Trail and find your approval and your payment.",
  ]));
  body.push(callout("If any of those steps fails outright", [
    "Raise one URGENT ticket immediately with the step number and what happened, then tell Chidera in the team channel. The rest of this pack assumes a claim can go from raised to paid.",
  ], "FBEAEA"));
  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section A: operations ────────────────────────────────────────────────
  body.push(h1("Part 3  ·  Section A, operations"));
  body.push(p("The week-to-week work of a finance team. Every run here ends in the general ledger, so the question is never only did the screen work, but also did it write the right thing."));

  body.push(...run({
    id: "A1",
    title: "Bank accounts",
    what: "The accounts the business banks with, and which ledger account each maps to.",
    why: "Every payment in or out names one of these. A bank account pointing at the wrong ledger account puts real money in the wrong place in the books.",
    before: ["You are on CODEX."],
    doThis: [
      "Open Operations, Bank Accounts. Read the list and what each row shows.",
      "Open one and read its detail, including which ledger account it posts to.",
      "Note how the account number is displayed to you. Write down exactly what you see.",
      'Create a new bank account named "QA5 <your name> Bank" with a sensible ledger account.',
      "Find it in the list and open it.",
      "Edit its settings and save.",
    ],
    passes: [
      "Each account shows its bank, its name and its ledger account.",
      "Account numbers are either shown in full or masked. If masked, the real number must not appear anywhere else on the page.",
      "Creating and editing work, and the new account is offered wherever a bank account can be chosen.",
      "The balance shown, if any, agrees with the ledger account it maps to.",
    ],
    breakIt: [
      "Create two accounts with the same number.",
      "Point a bank account at a ledger account that is not an asset and see whether it stops you.",
    ],
  }));

  body.push(...run({
    id: "A2",
    title: "Importing a bank statement",
    what: "Loading the bank's own record of what happened into the system.",
    why: "Everything in reconciliation depends on this file being read correctly. A misread date or a sign flipped on one line quietly corrupts the whole match.",
    before: ["Download the import template from the screen first, if one is offered."],
    doThis: [
      "Open a bank account and find the statement import.",
      "Download the template and look at its columns.",
      "Fill in four or five lines: a couple of money in, a couple out, with dates in the current month and clear descriptions.",
      "Import the file. Read every screen of the wizard before confirming.",
      "Check the preview: are the amounts, dates and directions right before you commit?",
      "Confirm the import and find the lines on the statement.",
      "Import the same file a second time and note what happens.",
    ],
    passes: [
      "The template matches what the importer actually expects.",
      "The preview shows what will be created, and money in and money out are distinguishable.",
      "Dates are read correctly, including any ambiguous day-month ordering.",
      "Amounts are read to the kobo.",
      "Importing the same file twice either warns you or is prevented. Silent duplicates would double the bank balance.",
    ],
    breakIt: [
      "Import a file with a missing column, a bad date, and a text value where an amount belongs.",
      "Import an empty file.",
      "Import a line dated in a closed period.",
    ],
  }));

  body.push(...run({
    id: "A3",
    title: "Reconciling the bank",
    what: "Matching what the bank says happened against what our books say, and explaining the difference.",
    why: "This is the check that catches everything else. It is also the most intricate screen in your track, with matching, splitting, grouping and adjusting entries.",
    before: ["You need imported statement lines from A2 and some posted payments to match them against."],
    doThis: [
      "Open Operations, Bank Reconciliation and start one for your account.",
      "Read the opening position: what the bank says, what the book says, and the difference.",
      "Match one statement line to one book entry. Watch the difference change.",
      "Find a line that needs splitting across two entries and use the split match.",
      "Find several lines that together make one entry and use the group match.",
      "Ignore a line that should not be matched, and note what ignoring means.",
      "Add an adjusting entry for something the bank knows about that the books do not, such as a charge.",
      "Try Auto-reconcile and check what it matched on its own.",
      "Review everything it did before completing.",
      "Complete the reconciliation and read what it says.",
    ],
    passes: [
      "The difference figure changes correctly with every match, and reaches zero only when it genuinely should.",
      "Split and group matches both work and are reversible before completion.",
      "An adjusting entry posts a real journal, and the recap shows which accounts.",
      "Auto-reconcile only matches things a person would agree with, and shows its work rather than just doing it.",
      "Completing is refused, with a reason, while the difference is unexplained.",
      "After completing, the matched lines cannot be quietly unmatched.",
    ],
    breakIt: [
      "Match a line to an entry of a different amount.",
      "Match the same book entry to two statement lines.",
      "Unmatch something after completing the reconciliation.",
    ],
    note: "This is the longest run in the pack. Do it when you are fresh, not at the end of a session.",
  }));

  body.push(...run({
    id: "A4",
    title: "Expense claims",
    what: "Staff spending their own money and being paid back, through an approval and two postings.",
    why: "It is the most common thing a finance team processes, and the amounts are small enough that mistakes go unnoticed for a long time.",
    before: ["Do this after the smoke run, which already raised one."],
    doThis: [
      "Open Operations, Expense Claims. Read the cards and the status filter.",
      "Raise a claim with three lines on different expense accounts, each with a cost centre.",
      "Attach a receipt to one line. Check it opens again afterwards.",
      "Submit it and read the approval stepper: what stage is it at, and what comes next?",
      "Approve it. Read the posting recap carefully before confirming.",
      "Check the trial balance for the accounts you charged.",
      "Pay the claim from a bank account. Read that recap too.",
      "Now raise a second claim and reject it. Note what the claimant sees.",
      "Try to pay a claim that has not been approved.",
    ],
    passes: [
      "The stepper matches reality: submitted, approved and accrued, then reimbursed.",
      "Approving posts the cost to the expense accounts and creates a liability to the claimant.",
      "Paying clears that liability and reduces the bank.",
      "The two postings are separate. Approving must not pay somebody.",
      "A rejected claim posts nothing and tells the claimant why.",
      "An unapproved claim cannot be paid.",
    ],
    breakIt: [
      "Submit a claim with no lines, then with a zero-amount line, then with a negative one.",
      "Approve the same claim twice using the back button.",
      "Attach a file that is not an accepted type.",
    ],
  }));

  body.push(...run({
    id: "A5",
    title: "Petty cash",
    what: "The physical cash float: establishing it, spending from it, and topping it back up.",
    why: "It is the only place in the system that tracks something you can hold. If the register drifts from the tin, nobody can ever close it.",
    before: [],
    doThis: [
      "Open Operations, Petty Cash. Note whether there is a fund already, and the four figures at the top.",
      'Create a fund named "QA5 <your name> Float" and establish it with 50000 naira. Read the posting recap.',
      "Check the figures: the ceiling, the current balance, what has been spent, and what is needed to top it back up.",
      "Raise a voucher for 3000 naira against an expense account. Save it as a draft first.",
      "Post the voucher. Read the recap.",
      "Check the movement register: the establishment and the spend should both be there with a running balance.",
      "Raise and post a second voucher, then replenish the fund.",
      "Check the register and the four figures again.",
      "Void a posted voucher and see what happens to the balance.",
    ],
    passes: [
      "Establishing the float moves money from the bank into the cash account.",
      "The running balance in the register is arithmetically correct at every line.",
      "The amount needed to replenish equals the ceiling minus the current balance.",
      "Replenishing brings the balance back to the ceiling exactly.",
      "Voiding a voucher returns the cash and reverses the journal rather than deleting the record.",
    ],
    breakIt: [
      "Spend more than the float holds.",
      "Establish a float twice on the same fund.",
      "Post a voucher with no expense account.",
    ],
  }));

  body.push(...run({
    id: "A6",
    title: "Running payroll",
    what: "Calculating what staff are owed, posting the cost, and paying them.",
    why: "It is the largest regular payment the business makes and the most sensitive data in the system. Both halves of that matter here.",
    before: ["Check what the roster already contains before adding to it."],
    doThis: [
      "Open Operations, Payroll. Read the tabs and the cards.",
      "Open Employee Salaries and read the roster. Note exactly how each pay figure appears to you.",
      "Create a new payroll run for the current period, generating it from the roster.",
      "Open the run and read every figure: gross, tax, pension, net.",
      "Check the arithmetic on one employee: does net equal gross minus the deductions shown?",
      "Post the run. Read the recap and note the state it lands in.",
      "Check the trial balance for the salary and liability accounts.",
      "Pay the run and check the bank moves.",
      "Print a payslip and read it.",
    ],
    passes: [
      "Generating from the roster brings in the right people with the right figures.",
      "Net equals gross minus deductions, for every employee, every time.",
      "Posting books the cost and the liabilities but does not pay anybody. The state should read Calculated.",
      "Paying clears the liability and reduces the bank.",
      "Pay figures are either fully visible or fully masked, never half.",
      "A payslip is something you could actually give to a person.",
    ],
    breakIt: [
      "Run payroll twice for the same period.",
      "Post a run with no employees in it.",
      "Pay a run that has not been posted.",
    ],
    note: "If a pay figure is masked in one place on a screen and readable in another, that is a real finding. Raise it as URGENT.",
  }));

  body.push(...run({
    id: "A7",
    title: "Salary structures, payslips and statutory returns",
    what: "The reusable templates pay is calculated from, the flattened list of payslips, and the filing schedules for tax and pension.",
    why: "A structure is applied to many people at once, so an error in one is an error in everybody's pay.",
    before: ["Your posted run from A6."],
    doThis: [
      'Open Salary Structures. Create one named "QA5 <your name> Structure" with a basic component and two deductions.',
      "Note whether each component is a percentage or a fixed amount, and read the live preview on a sample salary.",
      "Check the preview arithmetic by hand.",
      "Assign the structure to an employee and check their derived figures change.",
      "Open Payslips and find the ones from your run. Open one and read the breakdown.",
      "Open Statutory Returns and find the schedule for your posted run.",
      "Read the remittance position it reports and check it against the trial balance for the same accounts.",
      "Print both schedules.",
    ],
    passes: [
      "The preview matches hand arithmetic.",
      "A structure applied to an employee changes their figures, and the run picks that up.",
      "Payslips list every line across runs and open into a readable breakdown.",
      "The statutory schedule names each employee and their amounts.",
      "The remittance figure agrees with the trial balance, or says plainly that it could not read it.",
    ],
    breakIt: [
      "Create a structure whose deductions exceed the gross.",
      "Create one with percentages adding to more than one hundred.",
      "Delete a structure that an employee is assigned to.",
    ],
  }));

  body.push(...run({
    id: "A8",
    title: "Budgets",
    what: "What was planned to be spent, against what has been.",
    why: "It is the only forward-looking screen in your track, and its whole value is the comparison being right.",
    before: [],
    doThis: [
      'Open Operations, Budgets. Create one named "QA5 <your name> Budget" for the current fiscal year.',
      "Add lines: pick two expense accounts and give each a monthly amount.",
      "Save as a draft. Confirm you can still edit it.",
      "Open the detail and read the four figures: budgeted, actual so far, variance and how much is consumed.",
      "Check the actual against the trial balance for the same accounts.",
      "Open the heatmap and read it. Work out what a red cell means.",
      "Approve and lock the budget. Try to edit it afterwards.",
      "Post an expense to one of those accounts and check the budget's actual moves.",
    ],
    passes: [
      "A draft is fully editable and an approved one is not.",
      "The actual figure agrees with the ledger for the same accounts and period.",
      "Variance is arithmetically right and its sign is the right way round: overspending should look bad.",
      "The heatmap's colours are explained somewhere.",
      "Posting an expense moves the budget's actual.",
    ],
    breakIt: [
      "Add a budget line for a balance-sheet account rather than an expense.",
      "Add two lines for the same account and period.",
      "Approve a budget with no lines.",
    ],
  }));

  body.push(...run({
    id: "A9",
    title: "Fixed assets",
    what: "Things the business owns and writes down over time: acquiring, depreciating and disposing.",
    why: "Depreciation posts automatically on a schedule. A wrong method or life quietly misstates the accounts every month until somebody checks.",
    before: [],
    doThis: [
      'Open Operations, Fixed Assets. Add an asset named "QA5 <your name> Asset" costing 1200000 naira over a 5 year life, straight line.',
      "It should be a draft. Acquire it and read the recap.",
      "Open it and read the depreciation schedule. Check the yearly figures by hand: cost divided by life.",
      "Note its cost, accumulated depreciation and net book value.",
      "Use Depreciate to date on it, if it is due, and read the recap.",
      "Check the trial balance for the depreciation and accumulated depreciation accounts.",
      "Add a second asset on declining balance and compare its schedule to the first.",
      "Run the period-wide depreciation and read the preview before confirming.",
      "Dispose of your first asset with some proceeds, and read the gain or loss it calculates.",
    ],
    passes: [
      "The schedule is arithmetically right for the method chosen, and the two methods genuinely differ.",
      "Net book value equals cost minus accumulated depreciation, always.",
      "Depreciation never takes an asset below its salvage value.",
      "The period-wide run previews what it will post before posting it.",
      "Disposal calculates gain or loss correctly from proceeds against net book value.",
    ],
    breakIt: [
      "Set a life of zero, then a cost of zero.",
      "Depreciate the same asset twice in one period.",
      "Dispose of an asset that has already been disposed of.",
    ],
  }));

  body.push(...run({
    id: "A10",
    title: "Tax remittance",
    what: "What the business owes the tax authority, filing it, and paying it.",
    why: "Getting this wrong has consequences outside the system. The figure accrued must come from the ledger, not from somebody typing it.",
    before: [],
    doThis: [
      "Open Operations, Tax Remittance. Read the cards and the filings list.",
      "Create a new obligation: a code, a type, a name, a liability account, an authority and a frequency.",
      "Create a filing against it for a period. Note where the accrued figure comes from.",
      "Check that figure against the trial balance for the liability account.",
      "Open the filing and read the lifecycle stepper.",
      "Mark it as filed, giving a reference. Read what changes.",
      "Pay it, choosing a bank account. Read the recap: it should reduce the liability and the bank.",
      "Print the filing pack.",
      "Try to unfile something that has been paid.",
    ],
    passes: [
      "The accrued amount is read from the ledger, not typed by hand.",
      "The stepper matches the real state at each point.",
      "Filing records the reference and the date.",
      "Paying reduces both the liability and the bank by the same amount.",
      "A paid filing cannot be unfiled, and the refusal says why.",
    ],
    breakIt: [
      "Pay more than the outstanding amount.",
      "File the same period twice on the same obligation.",
      "Create an obligation pointing at an account that is not a liability.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section B: payments ──────────────────────────────────────────────────
  body.push(h1("Part 4  ·  Section B, payments"));
  body.push(callout("Read this before touching anything in this section", [
    "These screens talk to a real payment provider. Depending on how this environment is configured, a collection or a payout may move actual money.",
    "Before you start, ask Chidera whether the gateway is pointed at a test provider or a live one. If nobody is certain, do the read-only runs (B5, B6) and stop.",
    "Never retry a failed webhook until you have read B7. That action can book money into the ledger.",
  ], "FBEAEA"));
  body.push(spacer());

  body.push(...run({
    id: "B1",
    title: "Collections",
    what: "Money customers send in through the gateway, and the checkout links that ask for it.",
    why: "It is the front door for customer money. A checkout that produces the wrong amount takes the wrong amount.",
    before: ["Confirm the gateway is in test mode before creating anything."],
    doThis: [
      "Open Payments, Collections. Read the cards, the filters and the columns.",
      "Filter by status group and by provider.",
      "Open a collection and read its detail: amount, customer, provider reference, status.",
      "Create a new checkout for a small amount against a test customer.",
      "Copy the link and open it. Do not complete a real payment unless the gateway is confirmed as test.",
      "Use Re-verify on a collection and note what it does.",
      "Export the list and check the file against the screen.",
    ],
    passes: [
      "Each collection shows amount, who it is from, its provider reference and its state.",
      "Filters narrow honestly and combine.",
      "A new checkout carries the amount you entered, to the kobo.",
      "Re-verify asks the provider again rather than just reloading our own record.",
      "The export matches the filtered list.",
    ],
    breakIt: [
      "Create a checkout for zero, then for a negative amount.",
      "Re-verify a collection that already succeeded.",
    ],
  }));

  body.push(...run({
    id: "B2",
    title: "Virtual accounts",
    what: "Dedicated account numbers issued to customers, so a transfer arrives already identified.",
    why: "The account number is the sensitive part, and it is also the thing a customer will type wrong if it is displayed badly.",
    before: [],
    doThis: [
      "Open Collections, Virtual Accounts. Read the list.",
      "Note exactly how account numbers and names appear to you. Write it down.",
      "Open one and check whether the funds received against it are listed.",
      "Create a virtual account for a test customer.",
      "Deactivate one, then reactivate it, and note what changes.",
      "Check whether a deactivated account still shows its history.",
    ],
    passes: [
      "Account numbers are either shown in full or masked, and masked means masked everywhere on the page.",
      "Each virtual account names the customer it belongs to.",
      "Funds received against an account are listed against it.",
      "Deactivating stops it being offered without erasing its history.",
    ],
    breakIt: [
      "Create two virtual accounts for the same customer.",
      "Deactivate one that has money against it.",
    ],
  }));

  body.push(...run({
    id: "B3",
    title: "Payouts",
    what: "Money we send out through the gateway, to vendors or staff.",
    why: "It is the screen that moves money away from us. Beneficiary details are sensitive and the amounts are real.",
    before: ["Confirm the gateway is in test mode."],
    doThis: [
      "Open Payments, Payouts. Read the cards and the filters.",
      "Note exactly how beneficiary names and account numbers appear to you.",
      "Open a payout and read its full detail.",
      "Create a small payout to a test beneficiary. Read every confirmation before committing.",
      "Watch its status change and note how long it takes.",
      "Find the ledger entry it produced.",
      "Export the list.",
    ],
    passes: [
      "Beneficiary details are masked unless you hold the sensitive permission, and masked consistently.",
      "Creating a payout confirms the amount and the beneficiary before sending.",
      "The status reflects what the provider actually says, not just what we asked for.",
      "The ledger entry matches the payout to the kobo.",
    ],
    breakIt: [
      "Create a payout larger than the bank account holds.",
      "Create one for zero.",
      "Submit the same payout twice quickly.",
    ],
  }));

  body.push(...run({
    id: "B4",
    title: "Payout batches, and who has to approve them",
    what: "Building many payouts into one batch and sending it, possibly through an approval first.",
    why: "A batch is many payments at once, which is exactly when a second pair of eyes matters most.",
    before: ["Confirm the gateway is in test mode."],
    doThis: [
      "Open Payments, Batches. Read what a batch shows before you open it.",
      "Build a batch with two or three small payouts. Check the total.",
      "Look for whether it can be submitted directly, or must go for approval.",
      "If approval applies, submit it and check it reaches an approver. Tell the Track 3 tester the reference.",
      "Watch what the batch does while it waits. It must not pay anybody yet.",
      "Once approved, check it sends.",
      "Open a batch and confirm the individual payouts inside it are all accounted for.",
      "Download the bank file, if the screen offers one, and open it.",
    ],
    passes: [
      "The batch total equals the sum of its payouts, exactly.",
      "A batch awaiting approval pays nobody.",
      "Approval releases it and the payouts go.",
      "Every payout in the batch ends in a definite state, none left ambiguous.",
      "The bank file, if offered, contains every payout with the right amounts.",
    ],
    breakIt: [
      "Build an empty batch.",
      "Submit the same batch twice.",
      "Remove a payout from a batch after submitting it.",
    ],
  }));

  body.push(...run({
    id: "B5",
    title: "Settlement",
    what: "The comparison between what the provider says it settled and what our books say we received.",
    why: "It is where a missing payment is noticed. It posts nothing, so its only job is to be right.",
    before: ["This run is read-only. Safe to do whatever the gateway is pointed at."],
    doThis: [
      "Open Payments, Settlement. Read the three groups: matched, unsettled and unmatched.",
      "Work out what each group means before reading any numbers.",
      "Open a matched item and check the two sides genuinely correspond.",
      "Look at anything unmatched and see whether the screen says why.",
      "Note where provider fees appear, if anywhere.",
      "Export each view and check the file against the screen.",
      "Use the re-run control and confirm it only recalculates rather than posting anything.",
    ],
    passes: [
      "The three groups are defined on the screen, not left to be guessed.",
      "Matched pairs really match, in amount and reference.",
      "Nothing on this screen creates a journal. Check the audit trail afterwards to be sure.",
      "The exports match the views.",
    ],
    breakIt: [
      "Re-run the match twice and confirm nothing changes in the ledger.",
    ],
  }));

  body.push(...run({
    id: "B6",
    title: "The transactions log",
    what: "One combined feed of money in and money out through the gateway.",
    why: "It is the screen somebody opens to answer what happened on a given day, so it has to be complete.",
    before: ["Read-only."],
    doThis: [
      "Open Payments, Transactions Log. Read the columns.",
      "Check that both directions appear, and that you can tell them apart.",
      "Find the collection from B1 and the payout from B3 in the same list.",
      "Filter by direction, by date, and by status.",
      "Open a row and read its detail.",
      "Export and compare the file with the screen.",
      "Page through and check the ordering is consistent.",
    ],
    passes: [
      "Both directions are present and distinguishable at a glance.",
      "Everything you did in B1 and B3 appears.",
      "Beneficiary details stay masked here too, if they are masked elsewhere.",
      "The export matches the filtered view, not just the loaded page.",
    ],
    breakIt: [
      "Filter to a date range with nothing in it.",
      "Sort by amount and check the ordering handles both directions sensibly.",
    ],
  }));

  body.push(...run({
    id: "B7",
    title: "Payments that did not make it into the books",
    what: "The Needs Attention screen: provider events that failed to book, or that matched nothing on our side.",
    why: "A customer's payment can arrive at the bank and fail to reach the books. This screen is the only place that is visible, and its retry can book real money.",
    before: ["Read the whole run before pressing anything. Ask Chidera before retrying."],
    doThis: [
      "Open Payments, Needs Attention. Read what is listed and why each item is there.",
      "Work out the difference between a failed event and an ignored one.",
      "Open one and read everything it tells you: what arrived, when, and why it did not book.",
      "Note whether the screen shows the provider's raw message, and whether it should.",
      "If there is a failed event that is safe to retry, and Chidera agrees, retry it.",
      "Watch what happens: does it book, and does the ledger move?",
      "Find the resulting entry in the audit trail and check who it names.",
      "Retry the same event again and see whether it books twice.",
    ],
    passes: [
      "Each item says clearly why it did not book, in words rather than a provider error code alone.",
      "Failed and ignored are visibly different and mean different things.",
      "A retry that succeeds books exactly once and creates a real ledger entry.",
      "Retrying an already-booked event does not book it twice.",
      "The retry is recorded against the person who did it.",
    ],
    breakIt: [
      "Retry an event that has already been retried successfully.",
      "Retry one whose customer or invoice no longer exists.",
    ],
    note: "This is the most dangerous button in your track. A retry replays a real payment into the books. Treat a double-booking as URGENT.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section C: reports and close ─────────────────────────────────────────
  body.push(h1("Part 5  ·  Section C, reports and close"));
  body.push(p("Everything you have done in Sections A and B has written into the ledger. This is where you find out whether it agrees."));

  body.push(...run({
    id: "C1",
    title: "The trial balance",
    what: "Every account with its debit and credit total, and whether the two sides agree.",
    why: "If the trial balance does not balance, nothing else in this section means anything.",
    before: ["Do this after Section A."],
    doThis: [
      "Open Reports and Close, Trial Balance. Read the totals and the balanced indicator.",
      "Compare against the figures you wrote down in the first five minutes.",
      "Find the accounts you touched in Section A: the expense account from A4, the cash account from A5, the salary accounts from A6.",
      "Check each has moved by the amount you posted.",
      "Change the period filter and watch the figures change.",
      "Compare to the prior period if the screen offers it.",
      "Export as csv, then xlsx, then pdf. Open all three.",
    ],
    passes: [
      "Debits equal credits, and the screen says so.",
      "Every account you posted to has moved by exactly what you posted.",
      "The period filter changes the figures in a way that makes sense.",
      "All three export formats download, open and agree with the screen.",
    ],
    breakIt: [
      "Select a period with no activity.",
      "Select a period that has been closed.",
    ],
    note: "If it does not balance, stop everything else and raise it as URGENT with the period and the totals.",
  }));

  body.push(...run({
    id: "C2",
    title: "The income statement and the balance sheet",
    what: "What the business earned and spent over a period, and what it owns and owes at a point in time.",
    why: "These are the statements somebody outside the business would read. They must agree with the trial balance and with each other.",
    before: ["The trial balance from C1 balanced."],
    doThis: [
      "Open the Income Statement. Read the whole thing and note the period it covers.",
      "Find an expense you posted in Section A and confirm it appears.",
      "Turn on the budget comparison and the prior-year comparison, if offered. Note what happens when there is no budget.",
      "Check the variance signs: overspending should read as unfavourable.",
      "Open the Balance Sheet. Check that assets equal liabilities plus equity.",
      "Find the bank account from A1 and the fixed asset from A9.",
      "Check accumulated depreciation reduces the asset rather than adding to it.",
      "Export both and open the files.",
    ],
    passes: [
      "Both statements agree with the trial balance for the same period.",
      "The balance sheet balances.",
      "Accumulated depreciation is shown as reducing the asset.",
      "Comparison columns disable themselves cleanly when there is nothing to compare against.",
      "Variance is favourable-signed so that good and bad read the right way round.",
    ],
    breakIt: [
      "Run both for a period before the business had any activity.",
      "Run the income statement for a single day.",
    ],
  }));

  body.push(...run({
    id: "C3",
    title: "Cash flow, changes in equity, and analysis",
    what: "The remaining statements, plus the report that slices activity by cost centre or dimension.",
    why: "These are the least-used statements, which is exactly why they are least likely to have been checked.",
    before: [],
    doThis: [
      "Open Cash Flow. Read the three activity groups and check the closing figure against the bank accounts in the balance sheet.",
      "Open Changes in Equity and read the matrix.",
      "Open Cost and Dimension Analysis. Group by cost centre, then by a dimension.",
      "Find the expense claim lines from A4, which had cost centres on them.",
      "Check the subtotals add to the whole.",
      "Change the account-type filter and the period.",
      "Export each report.",
    ],
    passes: [
      "Cash flow's closing balance equals the cash on the balance sheet.",
      "Changes in equity reconciles opening to closing.",
      "The analysis subtotals add to the total, with anything unassigned shown rather than dropped.",
      "Every report exports in all three formats.",
    ],
    breakIt: [
      "Group by a dimension nothing uses.",
      "Run the analysis for an account type with no activity.",
    ],
  }));

  body.push(...run({
    id: "C4",
    title: "The finance audit trail",
    what: "The record of every finance action: who posted, who reversed, who was refused.",
    why: "It is the finance module's own log, and it records rejected attempts as well as successful ones.",
    before: ["Do this last, so there is a full day of your own activity in it."],
    doThis: [
      "Open Reports and Close, Audit Trail. Filter to today and to yourself.",
      "Find every posting you made in Sections A and B.",
      "Find at least one refused attempt from a Try to break it step.",
      "Open one entry and read what it records: the action, the document, the amounts, the before and after.",
      "Filter by action type and by status.",
      "Check whether a reversal is linked to what it reversed.",
    ],
    passes: [
      "Everything you posted appears, once each.",
      "Refused attempts are recorded too. A finance log that only shows successes cannot show an attempt to do something wrong.",
      "Each entry names the actor, the document and the amount.",
      "Filters work and combine.",
    ],
    breakIt: [
      "Look for an edit or delete control on an audit entry. There should not be one.",
    ],
  }));

  body.push(...run({
    id: "C5",
    title: "Closing a period",
    what: "Stopping the figures moving: soft close, close, lock, reopen, and closing the year.",
    why: "It is the control that makes a reported figure final. Once a period is locked, the numbers in it are the numbers for ever.",
    before: ["Agree with Chidera before closing anything. Closing the current month stops every other tester posting."],
    doThis: [
      "Open the fiscal periods screen and read the state of each period.",
      "Pick an old period nobody is using. Run the close checklist against it and read every item.",
      "Note which items block the close and which are only warnings. They should look different.",
      "Soft close it. Try to post something into it.",
      "Close it fully. Try again.",
      "Reopen it and confirm posting works again.",
      "Close it once more and then lock it. Try to reopen a locked period.",
      "If a fiscal year can be closed and there is a safe one, read what closing it says it will do. Do not do it without agreement.",
    ],
    passes: [
      "The checklist distinguishes blockers from warnings, and says so.",
      "A closed period refuses postings with a clear message.",
      "Reopening works and is recorded.",
      "A locked period cannot be reopened, and the refusal says so plainly.",
      "Closing the year explains that it zeroes the income and expense accounts and moves the result to retained earnings, before you commit.",
    ],
    breakIt: [
      "Close a period that has unposted drafts in it.",
      "Close a period out of order, leaving an earlier one open.",
    ],
    note: "Put every period back the way you found it before you finish for the day.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section D: cross-cutting ─────────────────────────────────────────────
  body.push(h1("Part 6  ·  Section D, checks to repeat on every screen"));
  body.push(p("Pick any six screens from your track, including the reconciliation workbench, one report, one payments list and one posting form."));

  body.push(...run({
    id: "D1",
    title: "On a phone",
    what: "The same screens at phone width.",
    why: "Approving an expense claim from a phone is entirely normal. Reconciling a bank statement from one is not, and the pack expects different things of each.",
    before: ["Use a real phone if you have one, otherwise make your browser window about 390 pixels wide."],
    doThis: [
      "Open each of your six screens at phone width.",
      "Approve an expense claim end to end on a phone.",
      "Open a report with many columns and see what it does.",
      "Open the reconciliation workbench and note whether it is usable at all.",
      "Scroll every page down, then try to scroll sideways.",
      "Repeat at tablet width, about 820 pixels.",
    ],
    passes: [
      "No page scrolls sideways. Ever.",
      "Approving a claim works completely, including seeing the amount and the account before deciding.",
      "Wide report tables scroll inside themselves rather than stretching the page.",
      "Money is never truncated. A figure cut in half is worse than a figure hidden.",
    ],
    breakIt: [
      "Open a report with a long account name and check it wraps.",
    ],
    note: "Reconciliation and payroll are complex editors, so on a phone they only have to be usable, not comfortable. Approving and reading a report must be genuinely good.",
  }));

  body.push(...run({
    id: "D2",
    title: "Empty states, exports and errors",
    what: "What each screen shows with no data, what the export buttons produce, and what happens when something fails.",
    why: "An export that quietly produces the wrong file is worse than one that fails loudly, because somebody sends it onward.",
    before: [],
    doThis: [
      "Filter each of your six screens to something empty and read what they say.",
      "On every screen with an export, download the file and open it.",
      "Check the amounts in each file: they must be readable money, not raw kobo integers.",
      "Apply a filter, export again, and check the file respects it.",
      "Turn your internet off, reload a screen, and watch. Turn it back on.",
      "Open a detail page for an id that does not exist.",
    ],
    passes: [
      "Every export opens without a damaged-file warning.",
      "N80,000 does not come out as 8000000.",
      "The file matches the filter that was on screen.",
      "An empty list says so in words.",
      "No screen ever shows a raw technical error or the word undefined.",
    ],
    breakIt: [
      "Export an empty filtered list.",
      "Export a report for a very wide date range.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Part 7: does the accounting hold up ──────────────────────────────────
  body.push(h1("Part 7  ·  Does the accounting hold up"));
  body.push(p("These are the checks nobody else on the team is placed to do. Each screen might work perfectly on its own while the numbers underneath disagree. Give this half an hour at the end."));
  body.push(table(
    [
      ["Check", "How to do it", "What proves it"],
      ["The books balance",
        "Trial Balance, current period, at the start of your session and again at the end.",
        "Debits equal credits and the balanced badge shows. If it balanced before your testing and not after, something you did broke it, and knowing which run is enormously valuable."],
      ["The statements agree",
        "Compare the income statement and balance sheet totals against the trial balance for the same period.",
        "The same accounts add to the same figures on all three. A statement that disagrees with the trial balance is reading the ledger differently from the ledger."],
      ["Cash is cash",
        "Compare the cash flow closing balance, the bank accounts on the balance sheet, and the bank account balances on the Bank Accounts screen.",
        "All three agree. If the operational screen and the statement disagree about how much money we have, one of them is not reading the ledger."],
      ["Nothing posted itself",
        "Finance Audit Trail for today, filtered to your own actions.",
        "Every posting traces back to something you deliberately did. If there are entries you cannot account for, list them in a ticket with their references."],
      ["Masking is complete",
        "On payroll and payouts, read every part of the page including exports and printed output.",
        "A figure masked on screen is masked everywhere. A number hidden in one place and printed in another is not hidden."],
    ],
    [1900, 3400, 4060]
  ));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── wrap-up + sign-off ───────────────────────────────────────────────────
  body.push(h1("Part 8  ·  Sign-off"));
  body.push(h2("What to write up at the end"));
  body.push(p("When you have finished, post one short message to the team channel with four things:"));
  body.push(...bullets([
    "How many runs you completed, and which you could not do and why.",
    "The ticket numbers you raised, grouped by priority.",
    "The single worst thing you found. If the trial balance stopped balancing, that is the answer.",
    "Anything in this pack that was wrong, unclear, or sent you the wrong way. That feedback shapes the other packs, so it is worth as much as the bugs.",
  ]));
  body.push(spacer());
  body.push(small("Put every fiscal period back the way you found it, and tell Chidera if you left anything closed or locked."));
  body.push(spacer());
  body.push(...K.signOff(runIds));

  return { trackNo: TRACK_NO, trackName: TRACK_NAME, body, runCount: runIds.length };
};
