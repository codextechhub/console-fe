// Track 6 - Procurement and Data Movement.
//
// Buying things: from somebody asking for it, through the vendor, the delivery
// and the bill, to paying for it. Plus the two doors data comes through and
// leaves by - imports and exports.

const K = require("../pack.cjs");
const { t, p, h1, h2, bullets, steps, small, callout, table, spacer, makeRun } = K;

const TRACK_NO = 6;
const TRACK_NAME = "Procurement and Data Movement";
const PREFIX = "QA6";

module.exports = function buildTrack6() {
  const runIds = [];
  const run = makeRun(runIds);
  const body = [];

  body.push(...K.coverAndContents({
    trackNo: TRACK_NO,
    trackName: TRACK_NAME,
    blurb: "One tester. Twenty-four test runs. Everything from somebody asking to buy something to the vendor being paid, plus the data coming in and going out.",
    coverExtra: [["Ledger entity to use", "CODEX"]],
    contents: [
      ["Part 1", "Read this first: entities, house rules, the list of things that look broken but are not, and how to report a problem", "25 min"],
      ["Part 2", "The short version: one purchase from request to payment", "45 min"],
      ["Part 3", "Section A - Procure to pay (6 runs). Requisition, order, delivery, bill, three-way match, payment", "2 hrs 30"],
      ["Part 4", "Section B - Vendors and sourcing (5 runs). Vendors, catalogue, RFQs, the vendor's own screen, contracts", "2 hrs"],
      ["Part 5", "Section C - Inventory (3 runs). Stock, movements, locations", "1 hr"],
      ["Part 6", "Section D - Analytics and settings (2 runs)", "45 min"],
      ["Part 7", "Section E - Data movement (6 runs). Import templates and batches, exports, files and queues", "2 hrs"],
      ["Part 8", "Section F - Checks to repeat on every screen (2 runs)", "30 min"],
      ["Part 9", "Does it add up. The cross-checks only you will do", "30 min"],
      ["Part 10", "Sign-off sheet", "-"],
    ],
  }));

  body.push(...K.partOne({
    trackNo: TRACK_NO,
    prefix: PREFIX,
    whatYouAreTesting: [
      "Your track is buying things, and the two doors data comes through.",
      "The buying half is one long chain and it is the whole point of the track. Somebody asks for something (a requisition). It is approved and becomes an order to a vendor (a purchase order). The vendor sends the goods (a goods receipt). The vendor sends a bill (a vendor invoice). The system checks all three against each other before anybody pays. Then we pay.",
      "That check is called a three-way match, and it is the control that stops the business paying for things it never ordered or never received. Most of Section A exists to test it from both sides: that a good chain passes, and that a broken one is refused.",
      "Around that sit the vendors themselves, the sourcing that picks them, and the stock that arrives. Then the data doors: imports bringing records in from spreadsheets, and exports taking them out.",
    ],
    notYours: "You are not testing the money-in half of finance, nor the ledger's own screens. If a purchase posts a journal you disagree with, hand the journal to the Track 5 tester rather than raising it here.",
    firstSteps: [
      "Click Procurement in the left sidebar. It opens with its own sidebar: Dashboard, Procure to Pay, Vendors and Catalog, Sourcing, Inventory, Analytics, Administration.",
      "Look at the top of the page for the entity switcher. Choose CODEX. Read the next section before you go any further.",
      "Open Administration, Settings and read every option. Two matter for this pack: whether invoices without a purchase order are allowed, and any approval thresholds. Write down what they are set to now.",
      'Open Support in the main sidebar and create one throwaway ticket titled "QA6 smoke test, please ignore". This proves your reporting channel works before you need it in anger. If ticket creation itself fails, message Chidera directly.',
    ],
    entityNote: {
      paras: [
        "An entity is a set of books. The business can keep more than one, and every purchase order, receipt and bill belongs to exactly one of them. Stock at one entity does not exist at another.",
        "So the entity switcher at the top of Procurement is not a filter. It decides which company you are buying for. If a screen says \"Select an entity\" and shows nothing else, that is expected. Pick one and the screen fills in.",
        "Stay on CODEX for the whole pack unless a run tells you otherwise.",
      ],
      footnote: "The switcher only appears when the tenant has more than one entity. If you cannot see it at all, ask Chidera to confirm before reporting it.",
    },
    houseRules: [
      [t("Use your own vendor. ", { bold: true }), t('Create "QA6 <your name> Supplies" with an email address you control, and buy everything from them. Never send a real purchase order to a real vendor.')],
      [t("Vendor emails are real. ", { bold: true }), t("Purchase orders and RFQ invitations genuinely send, with a PDF attached. The address on your test vendor is where they will go.")],
      [t("Amounts are typed in naira. ", { bold: true }), t("Type 80000 for eighty thousand naira. No kobo, no commas.")],
      [t("Do not change the procurement settings without saying so. ", { bold: true }), t("The non-PO invoice switch changes what every other tester's bills do. Section D tells you when to touch it and to put it back.")],
    ],
    knownIntended: [
      "1.  A vendor invoice with no purchase order behind it may be refused outright. That depends on a setting, and the refusal is the setting working. Check Settings before reporting it.",
      "2.  A price difference between the order and the bill does not block posting. An under-delivery or an over-billing does. Those are deliberately different, because a small price variance is normal and lands in a variance account.",
      "3.  Purchase orders can only be emailed once fully approved. Before that the button is unavailable rather than broken.",
      "4.  If a school has only one stock location, the location picker and column are hidden everywhere. That is intended, not missing.",
      "5.  Approvals for procurement documents appear in the Procurement Approvals queue, which is eligibility-based rather than permission-based. Somebody can be asked to approve without holding the matching key.",
      "6.  There are no how-to articles for procurement screens yet. The help panel offers general intranet guides only. Do not report those as missing.",
      "7.  Lists show 25 rows at a time with a pager at the bottom. Intended.",
      "8.  A screen that is missing from the sidebar entirely is a permissions matter, not a bug. Tell Chidera so your account can be granted the key, and note it as blocked.",
    ],
    crossTrack: [
      ["A document lands as Pending rather than moving on", "An approval rule caught it. That is the workflow engine and belongs to Track 3. Note the reference and tell that tester."],
      ["A purchase posts a journal that looks wrong", "The ledger is Track 5's. Give them the document number, the accounts and the amounts."],
      ["An export you queue never finishes", "Check View Queues first. If the job failed, that detail is what the ticket needs."],
      ["Nothing loads at all and every screen errors", "The intranet is probably down. Say so in the team channel first. One ticket for everyone, not six."],
    ],
  }));

  // ── Part 2: smoke run ────────────────────────────────────────────────────
  body.push(h1("Part 2  ·  The short version, run this first"));
  body.push(p("The whole chain once, end to end, with one cheap item. Three quarters of an hour. You may need the Track 3 tester to approve something on the way."));
  body.push(...steps([
    'Vendors and Catalog, Vendors. Create "QA6 <your name> Supplies" with an email address you control.',
    "Procure to Pay, Requisitions. Raise one for 2 units of anything at 10000 naira each. Submit it for approval.",
    "Get it approved. If it goes to somebody else's queue, ask the Track 3 tester.",
    "Turn the approved requisition into a purchase order for your vendor. Submit that for approval too.",
    "Once approved, use Email Vendor. Check your inbox: the order should arrive with a PDF attached.",
    "Goods Receipts. Receive both units against the order.",
    "Vendor Invoices. Enter the vendor's bill for the full amount, against the same order. Read what the match panel says.",
    "Post the invoice, then pay it.",
  ]));
  body.push(callout("If the chain breaks anywhere", [
    "Note which step, raise it as HIGH, and skip to Section B. Do not raise five more requisitions hoping one gets through. The individual runs in Section A will tell you exactly where it broke.",
  ], "FBEAEA"));
  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section A: procure to pay ────────────────────────────────────────────
  body.push(h1("Part 3  ·  Section A, procure to pay"));
  body.push(p("The chain, one link at a time. Each document should carry forward what the last one said, and the match at the end is what makes the whole thing worth having."));

  body.push(...run({
    id: "A1",
    title: "Raising a requisition",
    what: "Somebody asking for something to be bought.",
    why: "It is where a purchase starts, usually written by somebody who is not in finance. If it is hard to fill in, people go round it and buy things without one.",
    before: ["Your vendor from the smoke run exists."],
    doThis: [
      "Open Procure to Pay, Requisitions. Read the list and the statuses.",
      "Create one with two lines: different items, different quantities and prices. Add a delivery date and a reason.",
      "Note whether you can pick items from a catalogue or must type them.",
      "Check the total as you type. Save as a draft.",
      "Reopen the draft and edit a line. Confirm the total follows.",
      "Submit it for approval. Read what the screen says happens next.",
      "Try to edit it after submitting.",
      "Find it in the Procurement Approvals queue, either yours or your partner's.",
    ],
    passes: [
      "The total equals the lines, always.",
      "A draft is editable and a submitted one is not.",
      "Submitting says where it went and who has it.",
      "It appears in an approval queue rather than vanishing.",
    ],
    breakIt: [
      "Submit with no lines, then with a zero quantity, then with a negative price.",
      "Set a delivery date in the past.",
      "Submit the same requisition twice quickly.",
    ],
  }));

  body.push(...run({
    id: "A2",
    title: "Turning it into a purchase order",
    what: "Converting an approved requisition into an order placed with a vendor.",
    why: "This is the document that commits the business to spending money. What it says is what the vendor will hold us to.",
    before: ["An approved requisition from A1."],
    doThis: [
      "From the approved requisition, create a purchase order. Note whether the lines carry across automatically.",
      "Check every line against the requisition: item, quantity, price.",
      "Choose your vendor. Add a delivery address and payment terms.",
      "Save as a draft and read it back.",
      "Submit for approval. Look for the option to email the vendor automatically once approved, and read what it says.",
      "Get it approved.",
      "Once approved, try to edit it.",
      "Use Email Vendor. Read the preview: who it goes to, what the subject is, and whether a copy goes anywhere else.",
      "Send it, then check your inbox for the PDF.",
      "Open the email tab on the order and read the delivery record.",
    ],
    passes: [
      "Lines carry across from the requisition without retyping.",
      "An approved order cannot be edited.",
      "Email Vendor is unavailable until the order is fully approved, and says why.",
      "The preview names the recipient before sending.",
      "The email arrives with a PDF that matches the order.",
      "The delivery record shows what was sent, to whom and whether it succeeded.",
    ],
    breakIt: [
      "Create an order for more than the requisition asked for.",
      "Email a vendor with no email address on their record.",
      "Send the same order twice and check the history shows both.",
    ],
  }));

  body.push(...run({
    id: "A3",
    title: "Receiving the goods",
    what: "Recording what actually turned up.",
    why: "The receipt is the evidence that we got what we are about to pay for. Receiving more than was ordered, or receiving twice, is how a business pays for phantom deliveries.",
    before: ["An approved purchase order from A2."],
    doThis: [
      "Open Procure to Pay, Goods Receipts. Create one against your order.",
      "Note whether the ordered quantities are pre-filled and what is outstanding.",
      "Receive part of the order only: one of the two units.",
      "Post the receipt. Read the posting recap.",
      "Go back to the purchase order and check what it now says is outstanding.",
      "Create a second receipt for the remaining unit and post it.",
      "Check the order now shows as fully received.",
      "Try to receive more against the same order.",
    ],
    passes: [
      "Outstanding quantities are calculated correctly after each partial receipt.",
      "Posting a receipt creates a journal, and the recap shows which accounts.",
      "The purchase order's received percentage matches what you actually received.",
      "Over-receiving is refused or clearly warned about.",
    ],
    breakIt: [
      "Receive a quantity of zero.",
      "Receive against a cancelled or draft order.",
      "Post the same receipt twice using the back button.",
    ],
  }));

  body.push(...run({
    id: "A4",
    title: "The vendor's bill, and the three-way match",
    what: "Entering what the vendor charged, and the check that compares it against the order and the delivery.",
    why: "This is the control the whole section exists for. It is the only thing standing between the business and paying for goods it did not order or receive.",
    before: ["Your order from A2, fully received in A3."],
    doThis: [
      "Open Vendor Invoices. Create one against your purchase order for exactly the ordered amount.",
      "Read the match panel carefully. It should compare order, receipt and bill.",
      "Post it. Read the recap.",
      "Now create a second scenario. Raise a new small order, approve it, and receive only half.",
      "Bill for the full amount against that half-received order.",
      "Read what the match panel says now, and write down the exact wording.",
      "Try to post it. Note whether you are stopped, warned, or offered an override.",
      "If an override exists, read what it says before using it. Note who is allowed to use it.",
      "Now try a third case: bill for a higher price than the order, with the goods fully received.",
      "Compare how that is treated against the under-delivery case.",
    ],
    passes: [
      "The match panel shows all three quantities and amounts side by side.",
      "Billing for more than was received is blocked, not merely coloured red.",
      "A price difference behaves differently from a quantity shortfall, and the screen explains which is which.",
      "Any override is deliberate, explained, permission-gated, and recorded against the person who used it.",
      "A posted invoice creates a journal that matches the bill.",
    ],
    breakIt: [
      "Bill against an order with no receipt at all.",
      "Bill twice against the same order and receipt.",
      "Enter a bill with no purchase order, and see whether the setting you noted at the start is what decides.",
    ],
    note: "If you can post a bill for goods that were never received, without an override and without a warning, raise it as URGENT.",
  }));

  body.push(...run({
    id: "A5",
    title: "Paying the vendor",
    what: "Settling the bill, and what that does to the ledger.",
    why: "It is the end of the chain and the point where money leaves. It must pay what is owed, and only once.",
    before: ["A posted vendor invoice from A4."],
    doThis: [
      "Open Vendor Payments. Create one against your posted invoice.",
      "Check the amount offered: it should be what is outstanding, not the original total if anything was already paid.",
      "Choose a bank account and read the posting recap.",
      "Submit for approval if required, then post.",
      "Go back to the invoice and check it reads as paid.",
      "Try to pay it again.",
      "Make a part payment against a second invoice and check the outstanding figure afterwards.",
    ],
    passes: [
      "The payment offers the outstanding amount, not a stale total.",
      "Posting reduces the payable and the bank by the same figure.",
      "A fully paid invoice cannot be paid again.",
      "A part payment leaves the correct balance outstanding.",
    ],
    breakIt: [
      "Pay more than is outstanding.",
      "Pay an invoice that has not been posted.",
      "Pay zero.",
    ],
  }));

  body.push(...run({
    id: "A6",
    title: "The procurement approvals queue",
    what: "The queue where procurement documents wait for a decision.",
    why: "It is eligibility-based rather than permission-based, which means somebody can be asked to approve something they do not otherwise have the key for. That is deliberate and worth checking works.",
    before: ["Documents in flight from A1 to A5."],
    doThis: [
      "Open Procure to Pay, Approvals. Read what is waiting.",
      "Check each row identifies the document, who raised it and how much it is for.",
      "Open one and confirm you can see the document itself before deciding.",
      "Approve one and confirm the document moves on.",
      "Reject another and check what the requester sees.",
      "Compare this queue against the general Workflow Approvals queue: are the same items in both?",
      "Ask somebody without procurement permissions whether they can see anything here.",
    ],
    passes: [
      "The queue shows the amount, which is what an approver decides on.",
      "You can see the document without leaving the screen.",
      "Decisions move the document and are recorded.",
      "Somebody who is genuinely not an eligible approver sees nothing here.",
    ],
    breakIt: [
      "Approve your own requisition and note whether it lets you.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section B: vendors and sourcing ──────────────────────────────────────
  body.push(h1("Part 4  ·  Section B, vendors and sourcing"));
  body.push(p("Who we buy from, what we buy, and how we decide. This section includes the only screen in the whole product that people outside the business use, so it gets extra attention."));

  body.push(...run({
    id: "B1",
    title: "Vendors and their contacts",
    what: "The suppliers, their details and the people at them who receive our documents.",
    why: "The contact list decides where a purchase order actually goes. A wrong address sends a commercial document to a stranger.",
    before: [],
    doThis: [
      "Open Vendors and Catalog, Vendors. Read the list and filters.",
      "Open your own vendor and read everything on the record.",
      "Add two contacts: one marked to receive purchase orders, one not.",
      "Go and email a purchase order to this vendor, then check which contacts it went to.",
      "Remove the receiving flag from the first contact and email another order.",
      "Check where it went this time.",
      "Deactivate a contact and confirm they stop receiving.",
    ],
    passes: [
      "Only contacts marked to receive purchase orders get them.",
      "Changing the flag changes where the next document goes.",
      "The email preview names exactly those addresses before sending.",
      "A vendor with no eligible contact falls back sensibly, or refuses and says so.",
    ],
    breakIt: [
      "Remove every contact and try to email an order.",
      "Add a contact with an invalid email.",
      "Deactivate a vendor with open orders.",
    ],
  }));

  body.push(...run({
    id: "B2",
    title: "Categories and the catalogue",
    what: "How purchasable things are organised and priced.",
    why: "The catalogue is what stops every requisition being free text. If it is unusable, people type instead and the spend analysis becomes meaningless.",
    before: [],
    doThis: [
      "Open Categories. Read the list and create one of your own.",
      "Open Catalog and create an item in your category with a price and a unit.",
      "Go and raise a requisition, and check your item can be picked from the catalogue.",
      "Check the price and unit carry across.",
      "Edit the catalogue price and raise another requisition. Note whether the new price is used.",
      "Check what happened to the requisition raised at the old price. It should not have changed.",
      "Deactivate your item and confirm it stops being offered.",
    ],
    passes: [
      "A catalogue item can be found and picked when raising a requisition.",
      "Price and unit carry across.",
      "Changing a price affects new documents only. An existing requisition must keep the price it was raised at.",
      "Deactivating removes it from new documents without disturbing old ones.",
    ],
    breakIt: [
      "Create an item with a negative price.",
      "Delete a category that has items in it.",
    ],
  }));

  body.push(...run({
    id: "B3",
    title: "Running an RFQ",
    what: "Asking several vendors to quote for the same thing.",
    why: "It is how the business proves it got a fair price, and it sends real email to real suppliers.",
    before: ["At least two vendors, both with addresses you control."],
    doThis: [
      "Open Sourcing, RFQs. Create one with a couple of lines and a response deadline.",
      "Invite both of your vendors.",
      "Issue it. Check your inboxes: each vendor should get an invitation.",
      "Read one invitation properly. Does it say who it is from, what is wanted and by when?",
      "Amend the RFQ, changing a quantity, and re-issue.",
      "Check whether the vendors are told it changed.",
      "Extend the deadline for one vendor only, if the screen offers it, and check only they are told.",
      "Send a reminder and confirm it arrives.",
    ],
    passes: [
      "Every invited vendor gets an invitation with a working link.",
      "The invitation states the deadline.",
      "An amendment tells the vendors rather than silently changing what they are quoting on.",
      "A per-vendor deadline extension only reaches that vendor.",
      "Reminders arrive and say what is outstanding.",
    ],
    breakIt: [
      "Issue an RFQ with no lines, then with no vendors.",
      "Set a deadline in the past.",
      "Invite the same vendor twice.",
    ],
    note: "Only invite vendors whose email addresses you control.",
  }));

  body.push(...run({
    id: "B4",
    title: "The vendor's own screen",
    what: "The public page a vendor opens from their invitation, verifies themselves on, and submits a quotation through.",
    why: "It is the only part of the product used by somebody outside the business, with no account and no training. Everything about it has to work first time.",
    before: ["An issued RFQ from B3, with an invitation in an inbox you control."],
    doThis: [
      "Open the invitation link in a private browsing window, so you are not signed in as yourself.",
      "Read the page as though you were the vendor. Is it obvious what is wanted and what to do?",
      "Go through the email verification: request the code and enter it.",
      "Enter a quotation: prices for each line, and try the option to say you cannot supply one of them.",
      "Submit it. Read the confirmation.",
      "Check your inbox for a receipt confirming the submission.",
      "Try to open the link again after submitting.",
      "Now try the link in a different browser without verifying, and see what you can reach.",
      "Try an obviously wrong verification code several times.",
    ],
    passes: [
      "The page is understandable without training and without an account.",
      "Verification is required before a quotation can be entered.",
      "A wrong code is refused, and repeated attempts are slowed or stopped.",
      "Submitting produces a confirmation on screen and by email.",
      "The link cannot be used to see anything belonging to another vendor or another RFQ.",
    ],
    breakIt: [
      "Change the token in the address slightly and see what happens.",
      "Submit a quotation with no prices.",
      "Submit twice.",
    ],
    note: "This is the highest-exposure screen in the product. Anything that leaks another vendor's quotation or another RFQ is URGENT.",
  }));

  body.push(...run({
    id: "B5",
    title: "Quotations and contracts",
    what: "Comparing what came back, awarding it, and the longer-term agreements that follow.",
    why: "The award is the decision the RFQ existed to produce, and it has to turn into a real order.",
    before: ["A submitted quotation from B4."],
    doThis: [
      "Open Sourcing, Quotations. Find the one your vendor submitted.",
      "Read it: does it show what they quoted against what was asked?",
      "Compare two quotations side by side if the screen allows it.",
      "Award one. Read what it says will happen.",
      "Check whether a purchase order was created, and whether it matches the awarded prices.",
      "Reject the other quotation and check the vendor is told.",
      "Open Contracts and create one against your vendor with a start and end date and a value.",
      "Add a milestone if the screen offers it, and complete it.",
      "Check what happens as a contract approaches its end date.",
    ],
    passes: [
      "A quotation is shown against what was asked, line by line.",
      "Awarding produces an order carrying the quoted prices, not the original estimates.",
      "The unsuccessful vendor is told.",
      "A contract records its dates and value, and its state is visible.",
    ],
    breakIt: [
      "Award two quotations for the same RFQ.",
      "Award a quotation that was never submitted.",
      "Create a contract ending before it starts.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section C: inventory ─────────────────────────────────────────────────
  body.push(h1("Part 5  ·  Section C, inventory"));
  body.push(p("What arrived, where it is, and what happened to it. Stock is the one thing in this track you could walk up to and count, which makes disagreement between the screen and the shelf the whole risk."));

  body.push(...run({
    id: "C1",
    title: "Stock items and balances",
    what: "The things held in stock, how many there are and what they are worth.",
    why: "The quantity and the value have to agree with each other and with the ledger. A valuation that drifts is a misstated balance sheet.",
    before: ["Your goods receipts from A3 should have put stock in."],
    doThis: [
      "Open Inventory, Stock Items. Find what your receipts brought in.",
      "Read the quantity, the unit cost and the total value for one item.",
      "Check the arithmetic: quantity times unit cost should equal the value.",
      "Receive more of the same item at a different price, then look again.",
      "Work out how the unit cost was recalculated and whether it is reasonable.",
      "Open the item and read its full detail, including any per-location breakdown.",
      "Compare the total stock value against the stock account in the trial balance.",
    ],
    passes: [
      "Quantity times unit cost equals value, on every row.",
      "Receiving at a new price recalculates the unit cost in a way the screen explains.",
      "The total agrees with the ledger's stock account.",
      "An item with no stock reads as zero rather than blank.",
    ],
    breakIt: [
      "Look at an item that has been fully issued and check it reads zero, not negative.",
    ],
  }));

  body.push(...run({
    id: "C2",
    title: "Movements: issuing and adjusting",
    what: "Stock leaving, and corrections when the count is wrong.",
    why: "Every movement changes both the quantity and the ledger. An adjustment is somebody saying the system is wrong, which must always be recorded.",
    before: ["Stock on hand from C1."],
    doThis: [
      "Open Inventory, Movements. Read the ledger of what has come and gone.",
      "Issue some stock. Read the posting recap before confirming.",
      "Check the item's balance afterwards.",
      "Try to issue more than is on hand.",
      "Make an adjustment: reduce the count as though something was damaged. Give a reason.",
      "Check the recap and the ledger effect.",
      "Read the movement list again and confirm every change you made is there in order with a running balance.",
    ],
    passes: [
      "Issuing reduces the quantity and posts a cost to the ledger.",
      "Issuing more than is on hand is refused, and the message says how much there actually is.",
      "An adjustment requires a reason and records who made it.",
      "The running balance in the movement list is correct at every line.",
    ],
    breakIt: [
      "Issue a negative quantity.",
      "Adjust to a negative balance.",
      "Issue stock dated before it was received.",
    ],
  }));

  body.push(...run({
    id: "C3",
    title: "Stock locations",
    what: "Which store holds what, when a business has more than one.",
    why: "The whole feature hides itself when there is only one location, so both states have to be checked: that it appears when needed and stays out of the way when not.",
    before: ["Check first how many active locations this entity has."],
    doThis: [
      "Open Inventory, Locations. Count the active ones.",
      "If there is only one, confirm no location picker or column appears anywhere in inventory.",
      "Create a second location.",
      "Now go back through Stock Items and Movements. The picker and column should have appeared.",
      "Receive stock into the new location and issue from it.",
      "Check a stock item's per-location breakdown adds up to its total.",
      "Try to deactivate a location that still holds stock.",
      "Deactivate the empty one and confirm the pickers disappear again.",
    ],
    passes: [
      "With one location, nothing about locations is shown anywhere.",
      "With two, the picker and column appear consistently across every inventory screen.",
      "Per-location quantities add up to the item total.",
      "A location holding stock cannot be deactivated, and the refusal says how much is there.",
    ],
    breakIt: [
      "Issue from a location that has none of that item.",
      "Create two locations with the same name.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section D: analytics and settings ────────────────────────────────────
  body.push(h1("Part 6  ·  Section D, analytics and settings"));

  body.push(...run({
    id: "D1",
    title: "The four analytics reports",
    what: "AP aging, GR/IR control, spend and vendor performance.",
    why: "These are the numbers somebody quotes in a meeting. They must agree with the documents underneath them.",
    before: ["Do this after Section A, so there is activity to report on."],
    doThis: [
      "Open Analytics, AP Aging. Find your vendor and check what it says is owed.",
      "Compare against the vendor invoices you posted and paid in A4 and A5.",
      "Open GR/IR and Control. Work out what it is telling you: goods received but not yet billed, and the reverse.",
      "Check that against your own partial receipt and bill from A4.",
      "Open Spend. Group it different ways and check the totals against the orders you raised.",
      "Open Vendor Performance and read what it measures.",
      "Export each report and check the file matches the screen.",
    ],
    passes: [
      "AP aging agrees with the outstanding invoices, and its buckets add to the total.",
      "GR/IR shows the gap your half-received order created, and it clears when you complete the chain.",
      "Spend totals agree with the orders behind them.",
      "Every report exports and the file matches the filtered screen.",
    ],
    breakIt: [
      "Run each report for a period with no activity.",
      "Filter to a vendor with nothing against them.",
    ],
  }));

  body.push(...run({
    id: "D2",
    title: "Procurement settings",
    what: "The switches that change what the whole module allows, especially invoices without an order.",
    why: "One of these settings decides whether the three-way match can be bypassed entirely. Testing it is testing the control itself.",
    before: ["Tell the other testers before changing anything here, and put it back afterwards."],
    doThis: [
      "Open Administration, Settings. Read every option and write down its current value.",
      "Find the setting for invoices without a purchase order. Note its state.",
      "With it off, try to raise a vendor invoice with no order. Read the refusal.",
      "Turn it on. Try again and confirm it is now allowed.",
      "Check what account such an invoice posts to.",
      "Turn the setting back off, and confirm the refusal returns.",
      "Check whether the change was recorded anywhere.",
      "Look at any approval thresholds and check what happens either side of one.",
    ],
    passes: [
      "The setting genuinely changes the behaviour, not just the screen.",
      "The refusal explains that a purchase order is required, rather than failing obscurely.",
      "Turning it back off restores the previous behaviour immediately.",
      "The change is recorded with who made it.",
      "A threshold behaves correctly at, just under and just over its value.",
    ],
    breakIt: [
      "Set a threshold to zero, then to a negative number.",
    ],
    note: "Put every setting back exactly as you found it, and say in the team channel when you have.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section E: data movement ─────────────────────────────────────────────
  body.push(h1("Part 7  ·  Section E, data movement"));
  body.push(p("The two doors. Imports bring records in from a spreadsheet somebody prepared; exports take them back out. Both are places where a quiet mistake becomes hundreds of wrong rows."));

  body.push(...run({
    id: "E1",
    title: "Import templates",
    what: "The definitions that say what a spreadsheet must contain to be imported.",
    why: "A template is the contract between a spreadsheet and the system. If it does not match what the importer expects, every file built from it fails.",
    before: [],
    doThis: [
      "Open Data Imports, Import Templates. Read the list.",
      "Open one and read its columns: names, whether each is required, and what type it expects.",
      'Create a template of your own named "QA6 <your name> Template" with a few columns, some required.',
      "Save it and reopen it to confirm it stuck.",
      "Edit it: add a column, mark one required, remove one.",
      "Download the sample file if one is offered and check it matches the columns.",
    ],
    passes: [
      "Each column says its name, its type and whether it is required.",
      "Creating and editing work and persist.",
      "Any downloadable sample matches the template exactly.",
      "A template in use cannot be silently broken by an edit, or the screen warns you.",
    ],
    breakIt: [
      "Create a template with no columns.",
      "Create two columns with the same name.",
    ],
  }));

  body.push(...run({
    id: "E2",
    title: "Importing a batch",
    what: "Uploading a file, seeing what will happen, and committing it.",
    why: "An import writes many records at once. The preview is the only chance anybody has to notice it is wrong.",
    before: ["A template from E1, and a small file that matches it."],
    doThis: [
      "Open Data Imports, Import Batches and start a new one.",
      "Choose your template and upload a file with five good rows.",
      "Read the preview: does it show what will be created, and how many?",
      "Check the file size and row count shown against the real file.",
      "Commit the import. Watch what happens while it runs.",
      "Open the batch and read the result: how many succeeded, how many failed.",
      "Now import a second file where two rows are deliberately wrong: a missing required value and a bad number.",
      "Read how the failures are reported. Can you tell which row and why?",
      "Check whether the good rows were imported or whether the whole file was rejected. Write down which.",
    ],
    passes: [
      "The preview shows what will happen before it happens.",
      "Row counts and file sizes match the real file.",
      "Failures name the row and the reason, specifically enough to fix the spreadsheet.",
      "Whatever the partial-failure rule is, the screen states it rather than leaving you to guess.",
      "The batch keeps a record you can come back to.",
    ],
    breakIt: [
      "Upload a file with the wrong columns entirely.",
      "Upload an empty file, and one that is very large.",
      "Upload the same file twice and check whether you get duplicates.",
    ],
  }));

  body.push(...run({
    id: "E3",
    title: "Building an export",
    what: "Choosing a dataset, its columns and its filters, and running it.",
    why: "An export leaves the building. What it contains is what somebody outside will see.",
    before: [],
    doThis: [
      "Open Data Exports and start a new one. Read the datasets on offer.",
      "Pick one from your own track, such as purchase orders.",
      "Choose columns. Note whether any are marked sensitive and what that means.",
      "Add a filter and read how the screen describes what you will get, in words.",
      "Check the estimated row count and size.",
      "Run it. Watch its progress.",
      "Download the file and open it. Check the rows and columns against what you asked for.",
      "Check the amounts are readable money rather than raw kobo.",
      "Save the export configuration and run it again from the saved list.",
    ],
    passes: [
      "The screen describes in plain words what the file will contain.",
      "The estimate is roughly right.",
      "The file contains exactly the columns and rows you asked for.",
      "Money is formatted, not raw integers.",
      "A saved export can be re-run and produces the same shape.",
    ],
    breakIt: [
      "Export with no columns selected.",
      "Filter to something with no rows and see what file you get.",
      "Request a very large export and see whether it warns you.",
    ],
  }));

  body.push(...run({
    id: "E4",
    title: "The quick export on a list screen",
    what: "The Export button that appears on ordinary list screens.",
    why: "It is the export most people will actually use, and its promise is that it matches what is on screen.",
    before: [],
    doThis: [
      "Go to a procurement list, such as Purchase Orders. Apply a filter and a search.",
      "Use Export. Read whatever the screen says about what the file will contain.",
      "Note especially whether it warns you that the file will be wider or larger than the screen.",
      "Run it and open the file.",
      "Compare: does it contain every row matching your filter, or only the page you were looking at?",
      "Repeat on two other list screens in your track.",
    ],
    passes: [
      "The file covers every row matching the filter, not just the loaded page.",
      "The filter you had on screen is reflected in the file.",
      "If the file will contain more than the screen shows, the screen says so before running.",
      "Column headings are readable labels, not field names.",
    ],
    breakIt: [
      "Export from a screen with an empty filter result.",
      "Change the filter and export again immediately, and check you get the new one.",
    ],
  }));

  body.push(...run({
    id: "E5",
    title: "Files and queues",
    what: "Where finished exports go, and the queue showing work in progress.",
    why: "An export that never finishes, or a file nobody can find, is the same as no export at all.",
    before: ["Several exports run in E3 and E4."],
    doThis: [
      "Open Data Exports, Files. Find everything you have produced today.",
      "Read what each file shows: size, when it was made, when it expires, whether it has been downloaded.",
      "Download one and check the downloaded count changes.",
      "Open View Queues and find the jobs behind your exports.",
      "Read a job's detail: what it was, who asked, how long it took, whether it succeeded.",
      "Cancel a running export if you can catch one.",
      "Find a failed job, or cause one, and read what it says went wrong.",
      "Check whether you were notified when an export finished.",
    ],
    passes: [
      "Every export you ran has a file, and every file opens.",
      "The queue shows real progress rather than jumping from nothing to done.",
      "A failure explains itself well enough to act on.",
      "Cancelling actually stops the job.",
      "Finishing produces a notification, and downloading the file clears it from anything counting uncollected exports.",
    ],
    breakIt: [
      "Download a file twice.",
      "Try to download an expired file.",
      "Cancel a job that has already finished.",
    ],
  }));

  body.push(...run({
    id: "E6",
    title: "Who can export what",
    what: "Whether an export can produce data its requester is not allowed to see on screen.",
    why: "An export is a read. If it ignores the rules the screens apply, it is a way around every permission in the product.",
    before: ["You will need a second account with narrower access. Ask the Track 2 tester."],
    doThis: [
      "As yourself, note a dataset containing something sensitive, such as vendor bank details or pay figures.",
      "Export it and look at what the file contains.",
      "Now sign in as the narrower account in a second browser.",
      "Try to reach Data Exports at all.",
      "If they can, try to export the same dataset.",
      "If they produce a file, open it and compare against yours column by column.",
      "Try to download a file that you created, using their account, by pasting its address.",
    ],
    passes: [
      "A narrower account cannot export a dataset it cannot see on screen.",
      "If it can export a dataset, sensitive columns are absent or masked exactly as on screen.",
      "It cannot download somebody else's file by address.",
      "The refusal is a refusal, not an empty file.",
    ],
    breakIt: [
      "Guess a file address by changing an id.",
    ],
    note: "An export that contains a column its requester cannot see on screen is URGENT. Keep the file as evidence.",
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Section F: cross-cutting ─────────────────────────────────────────────
  body.push(h1("Part 8  ·  Section F, checks to repeat on every screen"));
  body.push(p("Pick any six screens from your track, including one document form, the match panel, one analytics report and the vendor's public page."));

  body.push(...run({
    id: "F1",
    title: "On a phone",
    what: "The same screens at phone width, including the one a vendor will use.",
    why: "A vendor answering an RFQ on their phone is entirely likely, and unlike our own staff they cannot be told to go and find a laptop.",
    before: ["Use a real phone if you have one, otherwise make your browser window about 390 pixels wide."],
    doThis: [
      "Open the vendor's RFQ page at phone width and complete a quotation on it, start to finish.",
      "Approve a requisition on a phone.",
      "Open the three-way match panel and see whether it is readable.",
      "Open an analytics report with a wide table.",
      "Scroll every page down, then try to scroll sideways.",
      "Repeat at tablet width, about 820 pixels.",
    ],
    passes: [
      "No page scrolls sideways. Ever.",
      "The vendor page works completely on a phone. That one is not optional.",
      "Approving works, including seeing the amount before deciding.",
      "Wide tables scroll inside themselves rather than stretching the page.",
    ],
    breakIt: [
      "Open a purchase order with ten lines and check the totals stay visible.",
    ],
    note: "Multi-line document editors only have to be usable on a phone, not comfortable. The vendor page and approving are the opposite: those must be genuinely good.",
  }));

  body.push(...run({
    id: "F2",
    title: "Empty, loading and error states",
    what: "What each screen shows with nothing in it, while loading, and when something fails.",
    why: "A brand new customer has no vendors, no orders and no stock. That is what they see on day one.",
    before: [],
    doThis: [
      "Filter each of your six screens to something empty.",
      "Look at inventory for an item with no stock, and at analytics with no activity.",
      "Watch what happens while a screen loads.",
      "Turn your internet off, reload, and watch. Turn it back on.",
      "Open a document detail for an id that does not exist.",
      "Open the vendor page with a token that is not valid.",
    ],
    passes: [
      "An empty list says so in words.",
      "A missing document gives a clear not-found message.",
      "An invalid vendor token is refused politely, without revealing whether that RFQ exists.",
      "No screen ever shows a raw technical error, a stack of code, or the word undefined.",
    ],
    breakIt: [
      "Click Post twice quickly on an invoice and check you do not post two.",
      "Use the browser back button after posting and try again.",
    ],
  }));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── Part 9: does it add up ───────────────────────────────────────────────
  body.push(h1("Part 9  ·  Does it add up"));
  body.push(p("The cross-checks that no single screen can answer. Half an hour at the end."));
  body.push(table(
    [
      ["Check", "How to do it", "What proves it"],
      ["The chain agrees with itself",
        "For your completed purchase, put the requisition, order, receipt, bill and payment side by side.",
        "The same quantities and amounts appear at every step, or the difference is explained by something you deliberately did."],
      ["Received but not billed",
        "Compare the GR/IR report against your half-received order from A4.",
        "The gap shown equals what you received and have not yet been billed for. Complete the chain and the gap should close."],
      ["Stock agrees with the ledger",
        "Total stock value on the Stock Items screen against the stock account on the trial balance.",
        "The two agree. If a shelf and a ledger disagree, one of them is not being updated by a movement."],
      ["Owed agrees with the documents",
        "AP aging total against the sum of your unpaid vendor invoices.",
        "The same figure. A report that disagrees with the documents behind it is reading them differently."],
      ["Exports respect permissions",
        "The narrow account's export file from E6 against your own.",
        "The narrower file is missing exactly the columns that account cannot see on screen. Nothing extra leaked."],
    ],
    [1900, 3400, 4060]
  ));

  body.push(new K.Paragraph({ children: [new K.PageBreak()] }));

  // ── wrap-up + sign-off ───────────────────────────────────────────────────
  body.push(h1("Part 10  ·  Sign-off"));
  body.push(h2("What to write up at the end"));
  body.push(p("When you have finished, post one short message to the team channel with four things:"));
  body.push(...bullets([
    "How many runs you completed, and which you could not do and why.",
    "The ticket numbers you raised, grouped by priority.",
    "The single worst thing you found. If a bill for goods nobody received could be posted, that is the answer.",
    "Anything in this pack that was wrong, unclear, or sent you the wrong way. That feedback shapes the other packs, so it is worth as much as the bugs.",
  ]));
  body.push(spacer());
  body.push(small("Put the procurement settings back exactly as you found them, and say in the team channel when you have."));
  body.push(spacer());
  body.push(...K.signOff(runIds));

  return { trackNo: TRACK_NO, trackName: TRACK_NAME, body, runCount: runIds.length };
};
