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
- vendor contact, tax and banking fields;
- virtual-account and payout banking fields;
- bank-account number;
- payroll line and salary figures.

## Progress after the audit

- Inter-branch transfers, held receipts, shared-cost recharges and shared-cost
  rules now have end-to-end Field Access in the backend and shared finance
  screens.
- School profile Address and Registration number are implemented in the current
  review wave. Hidden values leave the profile response and form, read-only
  values remain visible but disabled, and only writable values are submitted.
- School name stays public before sign-in and outside tenant Field Access.
  Branch name, address and email are sensitive, CodeX-owned fields. Schools can
  read but not edit them. School-role Read controls for those branch values
  remain to be built across the responses that expose them.

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
- Inter-branch journals, transfer stage, approval state, timestamps and document
  numbers.
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
