# Field Access audit, 13 September to 11 October 2026

## Purpose

This audit checks product work from the previous four weeks against the Field
Access contract. It covers the Console host, the shared `@xvs/finance` screens
and the backend resources those screens call.

Field Access is separate from resource permission. A person may have permission
to open Inter-branch transfers while their role is still prevented from reading
the bank accounts or changing the amount inside one transfer.

## What the system covers today

The enforcement path is sound where a resource is registered:

1. An app registers fields in `field_access.py`.
2. `sync_field_registry` publishes them to the role catalogue.
3. Backend serializers and manual write paths enforce the switches.
4. Login and `/user/auth/me/` send the effective map to the client.
5. The shared frontend hook removes hidden values and strips read-only values
   from writes.

Current registered product areas are:

- platform team and staff profile fields;
- school student, guardian and staff record fields;
- import payload and uploaded-file fields;
- vendor contact, tax, banking, category, payment terms and compliance fields, and the people at a vendor (name, email, phone and routing choices);
- virtual-account and payout banking fields;
- the customer master (`finance.customer`) and the bank account master (`finance.bankaccount`), with the bank documents, branch split, payer links, payer payments and petty cash returns;
- payroll line and salary figures.

## Progress after the audit

- Inter-branch transfers, held receipts, shared-cost recharges and shared-cost
  rules now have end-to-end Field Access in the backend and shared finance
  screens.
- Receivables Deferred Income, Doubtful Debts, Deposits and the Receivables
  policy in Finance settings now have end-to-end Field Access in the backend
  and the shared finance screens. Hidden figures, columns, filters and facts
  leave the screens, read-only values are greyed and left out of submitted
  bodies, and a list filter on a hidden field is neither shown nor sent.
- Procurement vendors (`procurement.vendor`) and the people at a vendor
  (`procurement.vendor_contact`) have end-to-end Field Access in the backend and
  the shared procurement screens. The vendor adds category, payment terms, KYC
  status, risk and hold as open fields beside the sensitive contact, tax and
  banking ones; the single Contact people switch is replaced by a switch for
  each person's name, email and phone and for primary contact, receives
  quotation requests, receives purchase orders and active, and earlier choices
  were carried onto the new switches. The vendor list (columns, On Hold tab, KYC
  filter, summary cards), the vendor drawer and form, an RFQ's invited vendors,
  the order email preview, and the spend, unpaid bills, vendor performance and
  dashboard reports drop what a role may not read, read-only values are greyed
  and left out of submitted bodies, and a contact's email decides whether
  people can be added or removed. Owner decision: the vendor name has no switch.
- Procurement decision receipts (`procurement.approval`) have separate
  read-only switches for document title, decision, approval stage, decision
  time, who the approver acted for and reversal time. A person who moves to
  another branch keeps that narrow receipt without the title, while the amount, requester,
  comment, attachments and full approval trail remain behind current branch
  reach and the source document's Field Access rules. The document reference
  has no switch because it identifies the receipt.
- Bank documents (`finance.banktransaction`, `finance.banktransfer`), the branch
  split of a shared bank account (`finance.bankaccount`), payer links
  (`finance.payer_link`), payer payments (`finance.payer_payment`) and petty cash
  returns (`finance.pettycash_return`) now have end-to-end Field Access in the
  backend and the shared finance screens. Hidden columns, facts, share columns,
  filters and sections leave the screens, read-only inputs are greyed and left
  out of submitted bodies, and a refusal appears beside the control it names.
  The bank account and the other side of an entry are submitted under write
  aliases that follow the names the response carries, and a detail response does
  not list those aliases in `_read_only_fields`, so the screens ask about the
  name the alias follows as well. A new document, a correction, Split by branch,
  Record payer payment and a petty cash return are not offered, or cannot be
  sent, when a field they cannot do without is closed to the reader. The status
  filter of the bank lists, the fund and status filters of returns and the
  payer filter of payer payments are neither shown nor sent when their field is
  hidden. The split form leaves out the shared balance, the
  amount left to place and the branch table when those figures are hidden.
- The finance dashboards, the month and year close, the year archive and the
  closed-figures check (`finance.dashboard`, `finance.period`, `finance.fiscalyear`,
  `finance.seal`) have end-to-end Read switches in the backend and the shared
  finance screens (area 9 of the priority list). Every card of the overview,
  receivables and cash tabs, a month's close state, the checklist progress and each
  close check, a year's close state, archive state and carried-over result, and each
  part of the closed-figures result are server-owned and so Read only. A card a
  switch closes is a missing key, where a card a role's permission keys withhold
  stays `null`: the tabs leave out the card with no shell or placeholder and the
  tiles and cards that remain fill their rows (including the school app's own
  dashboard page), the close strip recounts from the checks it was sent, months and
  years without a state draw no pill, count, progress, readiness card or archive
  action, a checklist drawer offers no close action it cannot judge, and the closed
  figures draw only the parts of each seal that arrive. A role that may not read a
  year's close or archive state no longer sends `?status=` or `?include_archived=`,
  which the server refuses: the new budget's fiscal year picker, the Show archived
  years switch and the closed-figures year picker follow. Messages that would name
  a hidden state are neutral.
- School profile Address and Registration number are implemented in the current
  review wave. Hidden values leave the profile response and form, read-only
  values remain visible but disabled, and only writable values are submitted.
- School name stays public before sign-in and outside tenant Field Access.
  Branch address and email now have school-role Read switches (`school.branches`),
  and are read-only for every school role because only CodeX edits a branch.
  Owner decision: the branch name has no switch, and neither do vendor and
  customer names. Hidden branch values leave the branches list, drawer and
  location line in the school app; no edit control exists for them.
- Customer school terms and the billing contact (`platform.schools`) have
  end-to-end Field Access in the backend and Console: catalogue price per
  student, agreed price, minimum billable students, package plan, subscription
  dates, uplifts, notes and the billing email and phone. Subscription pricing,
  the school record, the edit form and the create wizard follow the switches.
  Console has no screen for the plan page or uplifts yet, so those responses
  have no frontend to change.
- The customer master and the bank account master (areas 11 and 13 of the
  priority list) have end-to-end Field Access in the backend and the shared
  finance screens. A customer's billing email, phone and address, receivable
  account, opening balance, source record and active flag are typed in and have
  Read and Write; its created date, balance, account status, paid to date, open
  bills, pays-for count and the open bill, debit note, transaction and statement
  lists are server-owned and have Read only. A bank account's bank, currency,
  ledger account and the active, main and collection flags have Read and Write
  (the account number is Sensitive); its provider code and subaccount, book and
  statement balances, reconciliation progress and recent activity have Read
  only, and the difference between the books and the statement needs both
  balances. The billing email also travels as the recipient of a customer
  document email, so the panel names the destination in words and the history
  gives a count when it is closed. The customer list (columns, KPI cards, status
  tabs), drawer (stat cards, tabs, statement without a running balance), forms,
  customer pickers, the bank account list, drawer, reconciliation runs and
  workbench, the cash-by-account dashboard card and the primary collection
  account choice in Finance settings follow the switches. The `is_active` and
  `status` list filters of customers are neither shown nor sent when their field
  is hidden. Owner decision: a customer's code and name and a bank account's
  name have no switch.
- Owner decision: branch names and document numbers have no Field Access switch
  anywhere in finance. The inter-branch, deferred income, provision, deposit,
  bank document, branch split, payer payment and petty cash return screens
  always show them, with no neutral wording and no suppressed filter, and the
  backend registrations that carried them are removed. The Field Access guide
  states the decision and no guide describes a branch or number switch.
- Leak-fix pass: the backend now leaves out figures that restate another
  switch (a customer's balance, the age analysis, a bank account's book and
  statement balances, year-close journal lines, the provision bands, the payer
  split default, entitlement dates and the overview signals), and the shared
  screens follow each omission without a placeholder. The ageing strip of
  Dunning shows counts alone when the balance is hidden and no strip when the
  account status is; the refunds figures, the refund and batch pickers and the
  credit transfer form say why no customer credit is listed rather than
  reporting none; the receipt allocation drawer offers automatic allocation
  alone, with no typed split or summary, when the open items or their balances
  are hidden; income given back, the chart of accounts and its group totals
  (a total is dash when a part is hidden), the bank statement columns and the
  statement edit action, entitlement windows and the schedule editor, and the
  overview tiles drop what they cannot show. The customer statement report has
  no screen yet, so only its backend response changed.

The gap is coverage, not the evaluator. An unregistered field remains readable
and writable to anybody who has the resource permission.

## Confirmed gaps in recent finance work

### Priority 0: money and personal data entered by a user

These should be handled first because a role can currently open the resource
and receives every listed value.

| Area | Confirmed unprotected field groups | Backend surface |
| --- | --- | --- |
| Inter-branch transfers | kind, both branches, amount, date, purpose, reference, repayment date, both bank accounts, customer, decline reason, arrival date, moved-document amounts, deferred amount and net owed | `InterBranchTransferSerializer` |
| Held receipts | receiving branch, intended branch, bank account, customer, amount, date, method, reference, narration and forward details | `HeldReceiptSerializer` |
| Shared-cost recharges | paying branch, expense account, amount, date, basis, narration, reference and each branch share | `RechargeSerializer` |
| Shared-cost rules | name, treatment, basis, expense account, active state and branch percentages | `SharedCostRuleSerializer` |
| Bank transactions | bank account, direction, amount, counter-account, date, narration and reference | `BankTransactionSerializer` and `_transaction_fields` |
| Transfers between own accounts | source account, destination account, amount, date, narration and reference | `BankTransferSerializer` and `_transfer_fields` |
| Payer payments | payer, receiving bank account, amount, date, method, reference, narration, customer shares and split choice | hand-built payloads in `views_payers.py` |
| Payer links | payer, customer, active state and source reference | `_link_row` in `views_payers.py` |
| Doubtful-debt provisions | as-at date, narration, totals, policy snapshot, each branch's required/current/movement figures and age bands | `DoubtfulDebtProvisionSerializer` and line serializer |
| Customer deposits | customer, branch, invoice, amount, status, claim date, release note and forfeiture | `CustomerDepositSerializer` |
| Receivables policy | revenue recognition, provision bands, whether deposits offset bills and unclaimed-deposit years | hand-built settings payload and update path |
| Petty-cash returns | fund, bank account, amount, date, reason, reference, over/short handling and approval state | `PettyCashReturnSerializer` and its write view |
| Subscription pricing | price per student, billing contact and the related plan values exposed to platform staff | school package serializers |

### Priority 1: derived figures and operational state

These are server-owned and need Read switches rather than Write switches.

- Deferred-income balances, monthly releases, branch, period, release amount,
  journal, reversal state and the reason an undo is blocked.
- Branch close state, close checks, forced-close facts, archive state and ledger
  seal verification results.
- Finance overview, receivables, collections, cash, spend and compliance cards,
  trends and exception lists.
- Inter-branch journals, transfer stage, approval state and timestamps (document
  numbers and branch names have no switch).
- Shared bank split calculations, branch allocations and differences.

### Priority 2: earlier four-week additions that need a resource-by-resource pass

- Branch-aware budgets and financial statements.
- Branch labels added to invoices, payment plans, customers, accounts and bank
  documents.
- Procurement stock transfers, supplier credit notes, goods returns, shared
  sourcing and vendor-payment withholding-tax details.
- School settings added for academics, calendar, staff, students, guardians,
  display, security and payroll scope.

These areas are confirmed as changed in the audit window. They are not marked
safe merely because this first pass did not enumerate every field.

## Work that was already aligned during the period

- Pay brought forward was added to the existing `finance.salary` switches and
  its aliases, enforcement and deep-payload tests were updated.
- New payroll reads continue to use the existing payroll and salary field
  groups.
- Existing vendor, payout, virtual-account and bank-account sensitive values
  continue to use their registered resources.

## Implementation order

1. Inter-branch transfers, held receipts, recharges and shared-cost rules.
2. Deferred income, doubtful debts, deposits and receivables policy.
3. Bank transactions, transfers between own accounts and shared-bank splits.
4. Payer links and payer payments.
5. Petty-cash returns and subscription pricing or billing contact details.
6. Read-only operational state and dashboards.
7. The remaining finance, procurement and school-setting changes from the
   four-week window.

Each wave must update backend registration and enforcement, shared frontend
rendering and submission, deep-payload and alternate-path tests, the Field
Access guide, and the deployment registry sync. Normal fields should keep their
current open defaults when first registered. Sensitive fields need an explicit
default-reader decision so deployment does not unexpectedly blank a working
screen.

## Permanent build rule

The Console, backend and shared `@xvs/finance` instruction files now require a
Field Access decision for every new or changed business field. The default is
to include it. An agent asks the user only when grouping or exclusion is a real
product decision, and must use a concrete example in the question.
