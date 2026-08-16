# Finance Console - Build Notes & Handoff

How we build the Finance/Procurement console screens, what's done, and what's next.
Companion to `CLAUDE.md` (ship-check / verify-design) and `PERMISSIONS_AUDIT.md`.

## Design source - `Vision-Finance-Board.html` (repo root, gitignored)
The prototype is a **rendered app**: a raw `grep`/`rg` of the HTML returns **0 hits**
for screen labels. **To study a screen you must render it** - open
`file://…/Vision-Finance-Board.html` in a headless browser (Playwright, system
Chrome), click the nav item, screenshot, and look. Do not conclude "no design
exists" from a text search. Build to the prototype's **structure**, in our **house
theme** (never copy its palette).

## Per-screen workflow
1. **Render** the prototype → screenshot the screen *and* its drawer/modal.
2. **Plan first** - present the design plan/structure and get sign-off before
   building. Flag honest adaptations where our generic model lacks a prototype
   field (e.g. no school-specific "Guardian type" / student sub-name).
3. **Build** to the prototype, house theme.
4. **Verify** with `/verify-design` (drive the running app, read the screenshots -
   build-green ≠ works), then **scrub** the test-login rows.
5. **Commit in batches, directly to `main`** (FE and backend repos separately;
   end commit bodies with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`).

## Conventions
- **Money** = integer **kobo** on the wire; render with `<Money kobo>` / `formatMoney`.
- **Create + detail use right-side drawers** (`DetailDrawer`), not centered modals -
  convert `FormModal`→drawer when the prototype shows a side panel.
- **Type-to-search** via `finance-ui` pickers (`CustomerPicker`, `AccountPicker`,
  `ReceivableAccountPicker` [ASSET + tag CONTROL], `TaxCodePicker`…) over `SearchSelect`.
- Screen pattern: KPI cards · status tabs · avatar table · CSV Export · a primary action.
  Detail drawers use **tabs with icons**.
- Guard every non-paginated list with `toArray()` - an empty list serialises as `{}`.
- Gate controls with `Can`/`P.FIN_*`; seed new keys via
  `python manage.py seed_finance_permissions` and update `PERMISSIONS_AUDIT.md`.
- **Responsive (phone/tablet)**: pages must never overflow horizontally.
  `DashboardLayout` wraps pages in `grid grid-cols-1 min-w-0` (don't remove - it
  stops nowrap tables stretching `<main>`). `DataTable`/`CustomTable` render rows
  as stacked label/value cards below `md` (opt out per table with
  `mobile="scroll"` for dense reports; custom card via `mobileCard`). Toolbars
  `flex-wrap`; tab strips `max-w-full overflow-x-auto`; form grids
  `grid-cols-1 sm:grid-cols-N`; count-KPI strips `grid-cols-2 … lg:grid-cols-4`,
  money-KPI strips stay 1-col on phones; drawers `w-full sm:max-w-[…]`. Verify
  with `.claude/skills/verify-design/_mobile_audit.mjs` (drive.mjs at 390/820px
  + a page-overflow probe): run from the skill dir with `BASE_URL`+`ROUTES`.
  Depth policy: phones are **view + simple actions** - browsing, details,
  approvals and simple forms must be great; complex multi-line editors stay
  desktop-first (usable on phone, not optimized, desktop never degraded).

## Font / theme structure
House theme = `font-mont` + palette gray-01 / black-01 / gray-05 / green-01 /
destructive / pry-01 (blue primary). Consoles render in **Geist**, scoped via the
`.console-geist` class on `ConsoleShell` content, `ConsoleSidebar`, **and** every
portaled overlay (`DetailDrawer` / `FormModal` / `ConfirmActionModal` mount at
`<body>`, so each carries `console-geist` itself).

## Typography - match the AR screens (canonical: `invoices-tab`, `customer-detail-drawer`)
The DataTable + drawer primitives already set the base sizes; cells/fields add
**only modifiers** - never re-declare `font-mont text-sm` on every cell. Copy
these exactly so a new screen reads like AR:
- **Table cells** inherit `font-mont text-sm font-medium text-black-01` from
  `DataTable`. Add `tabular-nums` to *every* numeric / date / code / amount cell
  (so columns align), `font-semibold` for the row's primary id (document no.),
  `text-gray-05` for muted/secondary, `text-gray-01` for names. `<Money>` for
  amounts. Don't set `text-xs` on data cells.
- **Status / type pills** (table + drawer): `rounded px-2 py-0.5 font-mont
  text-[11px] font-medium` + colour. NOT `rounded-full` / `font-semibold`.
- **Detail-drawer field** (the `Field` helper): label `font-mont text-[11px]
  text-gray-05` (**sentence case - no `uppercase`/`tracking`**); value
  `mt-1 font-mont text-sm font-semibold tabular-nums text-black-01`. Long prose
  values (a reason/narration) drop to `font-normal`.
- **Create-form field label** (`FormField`): `font-mont text-xs text-gray-05`.
- **Drawer sub-tables**: `th` = `bg-[#F1F1F1] px-3 py-2 font-mont text-[11px]
  font-semibold text-gray-01`; `td` = `border-t border-gray-03 px-3 py-2 font-mont
  text-xs text-black-01`.
- **Section heading inside a drawer**: `font-mont text-xs font-semibold text-gray-05`.

## Honesty rules
Never fake an action. Posting panels **recap the real journal**. Print =
`window.print()`.

**Email is live (2026-08-16).** The old rule here - "email actions are present
but disabled until an email service exists" - was wrong by then and had been for
a while: the platform notification system sends real email, procurement had been
using it for vendor purchase orders and RFQs, and vs_finance itself was already
emailing customers automatically when an invoice, receipt or credit note posted.
What was actually missing was a *record* of those sends, which is why no re-send,
history or retry could be offered. See "Customer document email" below.

## Customer credit is a liability (2140), AR never negative
Customer credit (overpayments, unapplied credit notes) lives in **2140 Customer
Credit Balances** (a current-liability control), never as a credit balance on AR.
Posting is **split at source**:
- **Receipt**: `Dr Bank · Cr AR (applied) · Cr 2140 (excess)`.
- **Credit note**: `Dr Revenue · Cr AR (applied) · Cr 2140 (unapplied)`.
- **Apply stored credit** to invoices later: `Dr 2140 · Cr AR` (a **real** journal -
  allocation is no longer GL-free; recaps/wording say so).
- **Refund**: `Dr 2140 · Cr Bank`, capped at the customer's available credit
  (`customer_credit_balance` = unapplied receipts + unapplied credit notes − refunds).
Existing negative-AR credit was reclassed once via
`python manage.py backfill_customer_credit --commit` (idempotent, dry-run default).

## Receivables - status
**Done (redesigned to prototype):**
- **AR Invoices** - KPIs, status tabs, summary, customer-name table, rich detail
  drawer (Lines/Payments/GL/Reminders/Activity), New invoice drawer (+ fee-structure
  prefill), Batch generate, Record payment, Send reminder, Write off.
- **Customers / Payers** - KPIs, status tabs, balance + status table, Export,
  New customer drawer, detail drawer (Transactions · **Statement** · Contact). The
  **Statement** is a statement-of-account document (letterhead, From/To, debit/credit
  ledger, opening/closing). Footer actions show only when the customer owes.
- **Receipts & Allocation** - KPIs, status/method filters, table, Export, **Record
  receipt = 2-step drawer** (capture + posting preview → Continue to allocation),
  allocation drawer (auto oldest-first or explicit split + posting recap).
- **Credit / Debit Notes** - no-KPI filter-dropdown list (All notes / All status),
  prototype columns (Note no · Type chip · Date · Customer · Against invoice ·
  Reason · Amount · Issued/Applied), single-panel detail drawer recapping the real
  journal (Print · Apply to balance), and **Issue note = create→post** with a live
  posting preview. Honest adaptations: single-amount form carries an explicit
  Revenue/Income **account picker** (our notes are line-based + need a GL account);
  **debit notes can't be allocated**, so "Apply to balance" shows only for credit
  notes with credit unapplied; post sends `auto_allocate:false` so it lands
  "Issued" and applying is the explicit second step.
- **Refunds & Write-offs** - 3 KPIs (Refundable credit · Written off YTD · Pending),
  a type filter, and a **unified table** of refunds + write-offs. One **New action**
  drawer toggles **Refund to bank** / **Write off to expense**, each with a live
  `PostingRecap`. Honest adaptations: refund recap is **Dr AR · Cr Bank** (we hold
  customer credit as a credit balance on AR, no separate "customer credit" account);
  a write-off is **per-invoice**, so the form picks one of the customer's open
  invoices (amount defaults to/caps at its balance, expense acct defaults to bad
  debt 5300); write-offs **post immediately** (always "Posted") while a refund posts
  on issue unless **Save as draft** is ticked (→ Pending; click the row to post).
  Write-offs have no document model → they're read from the **finance audit log**
  (via the unified `GET /finance/ar-adjustments/`); REF shows the written-off
  invoice number.
- The DR/CR `PostingRecap` card is a shared `finance-ui` primitive (credit notes +
  refunds). New shared picker: `BankAccountPicker`.
- **Payment Plans** - list (search + pagination) with **progress bar · next due ·
  health** (On track / At risk, derived: at risk = an unpaid installment is past
  due), an **Installment-schedule** detail drawer (Paid / Due / Scheduled, deriving
  Due = earliest unpaid) with **Record installment** + **Cancel plan**, and a
  **curated New-plan drawer** (the prototype's create modal doesn't open) with a
  live schedule preview that mirrors the backend's even-split + due-date stepping;
  Create = create + **activate**. Concessions are **not** bundled here (separate
  screen). Honest adaptations: a plan is an overlay on an **invoice** (required) and
  progress is derived from its settlement, so **Record installment** posts a *real*
  receipt against the invoice (`/pay/`) then calls `/refresh/`.
- **Concessions / Waivers** - 3 KPIs (Posted YTD · Draft pending · Active count, from
  `GET /finance/concessions/summary/`), search + type/status filters, a type-chip
  table (Waiver / Discount / Scholarship), a detail drawer recapping the real journal
  (Dr 4910 allowance · Cr AR) with Print + Post (drafts), and a New-concession drawer
  with an **"Enter as" Amount/% toggle** (percent is of the chosen invoice's balance,
  shows `= ₦x of ₦balance`). Honest: a concession reduces a **specific** posted invoice's
  balance (capped), so the invoice is **required**; posting defaults the allowance acct
  to **4910**. Reuses the shared `PostingRecap` + `Segmented`.
- **Dunning / Reminders** - 4 **aging-bucket KPIs** (Due soon 0–7d · Overdue 1–30 ·
  31–60 · 60d+, from `GET /finance/dunning/summary/`), a **Reminder queue** tab
  (notices table + the active policy's cadence column) and a **Policies** tab with a
  **full cadence editor** (create/edit policies + add/edit/remove stages: name · days
  overdue · channel). `Run reminders now` / `Generate notices` raise the notice queue
  (real, **no GL**). Honest: vs_finance only records reminder *intent* (no email/SMS
  service), so the per-notice **Send is deferred** (disabled + tooltip); Cancel is
  real. Channels are **Email / In-app**, and a stage can use **one or both** (stored
  as a CSV like `EMAIL,IN_APP`; editor uses checkboxes; shown as "Email + In-app").
  Overdue days are colour-coded by severity. Status: PENDING→Scheduled · SENT→Sent ·
  RESOLVED→Resolved · CANCELLED.
- **Fee Structures** - search + status (Active/Inactive) list (Code · Name · Term ·
  Lines · Total/term), a detail drawer (line items: Fee item · GL account · Amount ·
  Tax + **Generate invoices**) and a New-structure drawer with a fee-lines editor.
  **Honest adaptation** (the school-specific screen): our generic `FeeStructure` is
  code · name · term · is_active · items(description · GL acct · amount · tax), so the
  prototype's branch / session / class-scope / fee-category / frequency / optional /
  assigned-students / activity are **dropped**; status is Active/Inactive; Import /
  Duplicate / Archive omitted (no backend).
- New journal + New account converted to drawers; sidebar scroll persists.

**Receivables area: COMPLETE** (redesigned to prototype). Payments group COMPLETE.
**Reports & Close:** Trial Balance + **Income Statement** redesigned to the
prototype. The Income Statement (`income-statement-tab.tsx`) is **fiscal-year
scoped** with real **Budget + Variance** and **Prior-year** comparison columns
(backend `reports.income_statement_compare`; toggles disable when there's no
budget / no prior FY). Variance is favourable-signed (revenue actual−budget,
expense budget−actual). **Next:** Balance Sheet, Cash Flow, Changes in Equity
(still the generic `statements.tsx` renderers).

**Operations → Tax Remittance: DONE** (redesigned to prototype). Route
`/finance/budgets/tax`. KPIs (total outstanding / open / filed-awaiting-payment /
paid) + a filings table (Tax=obligation_code · Period label · Authority · Accrued=
gross_liability · Outstanding=balance_due · Due date · Filing ref · Status, mapped
DRAFT→Open/FILED/PAID) with a status filter. Detail drawer: cards + a **filing-
lifecycle stepper** (Accrued ✓ → Filed → Paid) + an **on-remittance `PostingRecap`**
(Dr liability control acct / Cr bank - bank "chosen on payment") + Mark-as-filed / Pay.
File drawer (filed date, reference, optional adjustment+account → `file_filing`); Pay
drawer (bank, date, amount/partials → `pay_filing` Dr liability Cr bank); **New filing**
(obligation + period → `prepare_filing` accrues from the GL control account); **New
obligation** (code/type/name/liability account/authority/frequency/day). **Printable
filing pack** (period summary). Backend: only added `liability_account`(+name) to
`TaxFilingSerializer` - obligations/filings/file/pay/outstanding endpoints already
existed. Honest adaptations: period shown as a derived label; the prototype's no-op
"Generate filing pack" is now a real print.

**Operations → Fixed Assets: DONE** (redesigned to prototype). Route
`/finance/budgets/assets`. Register with KPIs (total cost / accum dep / NBV /
monthly dep), **category + status filters**, table (Tag=document_number · Asset ·
Category · Cost · Accum dep · NBV · Method · Status). Detail drawer: cost/accum/NBV/
in-service cards + a depreciation schedule **rolled up monthly→yearly** (Opening/Dep/
Closing NBV + posted x/n); footer **Acquire** (draft) · **Depreciate-to-date**
(active, per-asset, only when due) · **Dispose** (active/fully-dep). **Add asset**
drawer (proper create → draft; acquire to capitalise). **Run depreciation** drawer =
a period-wide `PostingRecap` preview (one compound journal Dr 5400 / Cr 1900 across
all due assets) with a nothing-due empty state. **Dispose** drawer (date, proceeds,
bank, gain/loss account, live gain/loss). Backend additions: `AssetCategory` +
`FixedAsset.category`; `run_period_depreciation`/`preview_period_depreciation`
(GET/POST `/fixed-assets/run-depreciation/`); `dispose_asset` (POST
`/fixed-assets/<id>/dispose/`, posts Dr accum + Dr bank + Dr loss|Cr gain, Cr cost) +
`disposal_date`/`disposal_journal`; new RBAC key `finance.fixedasset.dispose`
(P.FIN_DISPOSE_FIXED_ASSET=202441). Depreciation methods: **straight-line** and
**declining balance** (double-declining with a switch to straight-line of the
remaining base, landing exactly on salvage) - pick on Add-asset. Honest
adaptations: schedule is monthly (shown yearly); the prototype's empty
"Add asset" button is now a real create drawer. (Acquire/depreciate post real
journals, so verify-design seed assets are left on CODEX rather than scrubbed.)

**Operations → Budgets & Forecasts: DONE** (redesigned to prototype). Route
`/finance/budgets/budgets` (the `:section` page, `BudgetsTab`). List (Name · FY ·
Budgeted · Actual YTD · Consumed bar · Status) from the **enriched list** endpoint;
**variance heatmap** (per-account × 12-month grid for a selected budget, cells
coloured on-track/approaching/over/severe by consumed ratio, YTD at right, legend,
sticky account column) from `GET /budgets/<id>/heatmap/`; **detail drawer** (Budgeted
/ Actual YTD / Variance-remaining / %Consumed cards + account-level variance lines +
inline **Add-line** editor via `POST /budgets/<id>/lines/` + **Approve & lock**);
Backend additions: `budget_monthly_matrix` report + heatmap view; budget list
enriched with budgeted_total/actual_ytd/consumed_pct (one variance compute per
budget). Honest adaptations: variance is **per GL account** (AccountBalance has no
cost-centre split); copy-from-prior / CSV import omitted (CSV is a no-op in the
prototype); no stored FY forecast; no aggregate KPI row (summing per-budget actuals
across budgets sharing a fiscal year would double-count).

**v2 (rebuilt from the backend model, not the prototype's empty header):** budgets
get an **auto code** (`DocType.BUDGET` + `Budget.code`, allocated from the per-entity
document sequence → `CFX-CODEX-BDG-2026-00001`); **create-with-lines** (`create_budget(lines=…)`)
so the **New budget** drawer (wide, `max-w-4xl`) carries a Name + a **fiscal-year
dropdown** (open years from `GET /finance/fiscal-years/`) + an inline **lines editor**
(account × cost centre × period × amount); **drafts are fully editable** - rename
(`PATCH /budgets/<id>/`), wholesale replace (`PUT /budgets/<id>/lines/`), delete one
(`DELETE …/lines/<id>/`), all draft-only (locked on approval); budget lines are
**income/expense GLs only** (services reject balance-sheet accounts; accounts list
accepts a comma `account_type=INCOME,EXPENSE` so the picker narrows). Detail drawer:
DRAFT → editor (Save / Save & approve); APPROVED → read-only variance.

**Operations → Payroll: DONE** (redesigned to prototype, then extended into a
versatile bureau-style module). **Five tabs**: Payroll runs · Employee salaries ·
Salary structures · Payslips · Statutory returns. Runs: KPIs + table + run detail
(Gross/PAYE/Pension/Net/Status cards + payslips table, per-employee figures
FLS-masked, printable payslip) + Post / Pay; New run **generates from the roster**
or manual lines. The accrual-booked, awaiting-payment status reads **"Calculated"**
(not "Posted" - that read as paid); backend `run_status` is still `POSTED`.
- **Salary structures** - reusable pay templates (`SalaryStructure` +
  `SalaryComponent`): earning/deduction components as **% of gross / % of basic /
  fixed** (`rate_bps`, `is_basic`, `statutory_type`). `apply_structure(gross,
  structure)` derives basic/PAYE/pension/net + a per-payslip `components` snapshot;
  `net = gross − PAYE − pension` always, so the journal balances. Deductions must be
  PAYE or pension (NONE rejected) - other deduction types (loans/union) are a noted
  backend expansion. Editor has a live preview on a sample gross.
- **Employee salaries** - gains an optional `structure` FK: with one, PAYE/pension/
  net are **derived** (drawer shows a read-only live breakdown); without one, the
  flat manual fields still work. Roster table shows the structure.
- **Payslips** - every line flattened across runs, searchable; **rows open a drawer**
  with gross/net cards + the earnings/deductions/net breakdown (itemised when a
  structure populated the line) and **Print payslip** (inline Print kept too).
- **Statutory returns** - filing-ready PAYE & pension schedules per posted run;
  **rows open a drawer** with the per-employee schedule, both print buttons, and
  **remittance status** = the real outstanding balance of the run's PAYE/pension
  payable accounts, matched to the **trial balance** by `account_id` (serializer now
  exposes `paye_/pension_payable_account` + ids). Honest: it's the entity-wide account
  balance (remittance isn't tracked per run - never a faked per-run "remitted"), shows
  "-" if the trial balance is forbidden/unloaded, with a Tax Remittance link. Schedule
  actions disabled w/ tooltip without the sensitive grant.
- The salary-structure component editor makes the **% vs ₦** choice explicit (method
  "Fixed ₦ amount", "%" suffix on rate rows). Component value is % **or** amount (no
  hybrid).

Backend: `EmployeeSalary` + `SalaryStructure`/`SalaryComponent` + CRUD (all gated
on payrollrun perms; amounts FLS, structures not), `generate_run_from_roster`
(`POST /payroll-runs/generate/`), `PayrollLine.components` JSON. Migrations 0013
(EmployeeSalary) + 0014 (structures + components). Tests: structure derivation,
NONE-deduction rejected, run copies derived figures + snapshot, can't delete an
assigned structure. Demo: 4 employees + a posted June run on CODEX.

**Operations → Petty Cash: DONE** (redesigned to prototype). Fund-centric float
register: fund selector + KPIs (float ceiling / current / spent-this-week /
to-replenish=shortfall) + tabs **Movement register** (petty-cash GL ledger: date
· desc · category · in · out · running balance) and **Vouchers** (list + post).
Drawers: single-line New voucher (Save draft / Save & post), Establish float,
Replenish, New fund. Backend: PettyCashFundDetail GET adds register +
spent_this_week (Category derived from the journal counter line - "Top-up" for
cash in, expense account name for a spend). Honest: fund selector (we can hold
several), derived Category. Demo: Front-desk float on CODEX (establish + 2
vouchers).

**Operations → Expense Claims: DONE** (redesigned to prototype). KPIs (open /
submitted-this-month / average / awaiting payment) · search+status · avatar
table · Export · ⓘ. Detail drawer: total/subtotal/tax cards + **Approval-workflow
stepper** (Submitted→Approved&accrued[post]→Reimbursed[settle], mapped to our
DRAFT/POSTED/PAID) + lines (cost center + **receipt attachment**) + Approve /
Reject / Pay / Print. Backend: `ExpenseClaimLine.receipt` FileField (core
DatabaseStorage; **added .pdf** to allowed types) + upload/delete endpoint;
**reject** endpoint (cancel DRAFT, gated expenseclaim.post). Fixed FE settle
payload (`pay_date`). Honest: school Branch dropped (cost center kept). Migration
0012. Demo: 3 claims on CODEX (draft w/ receipt, approved, paid).

**Operations → Bank Accounts: DONE** (redesigned to prototype). KPIs + table
(Primary badge, masked A/C, book balance, last reconciled) + tabbed detail
drawer (Transactions w/ running balance · Statement lines · Statements ·
Reconciliations · Settings) with Book/Statement/Unreconciled-diff cards, Import
(paste lines) + Auto-reconcile. New models **BankStatement** (period/opening/
closing, groups imported lines) + **BankReconciliation** (run snapshot:
book/statement/diff/matched/status) + `BankAccount.is_primary`; serializer
book_balance from `AccountBalance`; detail GET embeds metrics/transactions/
statements/reconciliations; PATCH settings (`finance.bankaccount.update`).
Honest drops: petty-cash "Cash books" (own screen), USD/cash-on-hand KPIs (FX).
Migration 0010. Demo: Zenith - Operating on CODEX (statement + recon seeded).

**Operations → Bank Reconciliation: DONE** (standalone screen, prototype). An
account-scoped workbench: account selector, KPIs (statement/book/difference/
match progress), unreconciled banner, two-column matcher (unmatched statement
lines vs unmatched book/GL lines - click one of each → Match; same-amount book
lines highlighted as candidates), in-line **adjusting entry**, matched-lines
table, **Auto-match**, **Complete reconciliation**, printable report. Backend
adds `GET …/book-lines/` (unmatched GL cash lines) + `POST …/reconcile/complete/`
(records a BankReconciliation snapshot). Reuses match/adjust/auto-reconcile.
Honest: click-both-then-Match (no drag-drop), equal-amount candidate highlight
(no AI suggest), account-level (not per statement file). Route F.BANK_RECON.

**Collections → Gateway: DONE** (Vision prototype). Money-in via hosted gateway
checkouts (Paystack/OPay/Fake-for-dev) and their settlement. KPIs (Collected
settled / Pending awaiting / Failed / success rate) computed over the full flat
list (backend returns `list[:200]`, no pagination → `getCollections` is now an
`ApiEnvelope<Collection[]>`); client-side status + provider filters; table with
a provider dot tag, customer (`customer_name`/`payer_name`/code + narration sub),
amount, status pill. Detail drawer: Amount/Provider/Status metric cards, a
**status timeline** (created → link ready → confirmed/failed), and a **settlement
PostingRecap** that mirrors the *real* receipt journal (Dr deposit account or
"Bank / collections" / Cr Accounts receivable) - labelled "Booked automatically
when the provider confirmed payment" once paid, else "Will post on confirmation
… no manual receipt" (honest: cash arrives by webhook/`?verify=1`, never a
manual receipt form). **Re-verify** (non-terminal rows) re-polls the PSP;
**Copy link** copies `checkout_url`; **Export** is a client CSV. **New checkout**
drawer (CustomerPicker, amount, provider, email, narration + the same recap)
POSTs `/payments/collections/` and copies the returned checkout link. Backend:
exposed `customer_name`/`deposit_account_code`/`deposit_account_name` on
`CollectionIntentSerializer`. Route `/finance/collections` (section `gateway`).

**Payments → Payouts: DONE** (Vision prototype). Money-out via the gateway -
single disbursements to recipients. KPIs (Settled 7d / Pending / Failed count /
Payouts count) over the full flat list (`getPayouts` is now `ApiEnvelope<[]>`,
backend returns `list[:200]`); status + provider filters (provider client-side);
table with provider dot, recipient (beneficiary + bank·account sub, **FLS-masked
to ••••** without `payments.payout.view_sensitive`), amount, status (PAID→
"Settled"). Detail drawer: Amount/Provider/Status cards, a **status timeline**
(created → sent to provider → settled/awaiting/failed) and a **settlement
PostingRecap** mirroring the real journal (Dr Accounts payable / Cr source bank),
"Booked when the provider confirmed" once PAID. Settlement is webhook/PSP-driven
- **no fake re-verify** (there's no single-payout verify endpoint). The **Bulk
disbursement** button routes to Batches; **Export** is a client CSV.

**New payout** pays a **vendor**: it settles the vendor's payable on confirmation
(`confirm_payout` → `_book_vendor_payment`, Dr AP / Cr source bank), and the
beneficiary fields auto-fill from the vendor's saved bank details (editable). A
payout must be linked to a vendor - the POST view requires it (a payout with no
payable has nothing to book), and resolves the vendor & accounts by **code or
id** (fixed `_entity_obj` so numeric account *codes* aren't mistaken for pks).
The serializer exposes `source_account_code`/`name` for the recap. Route
`/finance/payments/payouts`.

**Payments → Batches: DONE** (Vision "Bulk Disbursement"). A batch is many
PayoutInstructions submitted in one run. KPIs (Batches / Queued value =
DRAFT+PROCESSING totals / Completed 7d / Drafts) over the batch list; table
(Batch · Run date · Purpose · Items · Total · Provider · Status - real statuses
Draft/Processing/Completed/Partial/Failed). **Build batch** drawer is a
multi-line **vendor** editor - each line picks a vendor (beneficiary auto-fills
from its bank details) + amount + **per-line WHT** (net = amount − WHT); live
summary (Items / Batch total / WHT withheld) and a settlement recap (Dr Accounts
payable gross / Cr bank net / Cr WHT payable); footer **Save draft** or **Submit
batch** (`submit:true` dispatches now). **Detail drawer**: KPIs + an Items &
results table (per-item Amount/WHT/Net + a result pill), footer "N settled · M
failed · K items", **Submit batch** (drafts / any pending) and **Bank file**
(CSV - honest, no proprietary format). **Upload CSV** is deferred
(disabled-with-tooltip) per the build decision. Backend: new
`createPayoutBatch` mutation + `wht_amount` on the instruction serializer; the
batch POST view now resolves each line's vendor by **code or id** and **requires
a vendor per line** (so every line can book). Each line is a vendor disbursement
(the prototype's "employees" are payroll, a separate module). Route
`/finance/payments/batches`.

**Payments → Settlement: DONE** (Vision "Settlement Recon"). A **read-only PSP
lens**: confirmed collections (in) + paid payouts (out) matched against the
entity's imported bank statement lines (by reference, then exact signed amount).
KPIs (Settled matched / Unsettled / Unmatched bank lines / Unexplained bank
total) + three tabs - **Matched** (Date · Type · Provider · Reference · Gross ·
**Fees** · Net settled · Settlement ref · Match basis), **Unsettled** (gateway
records with no bank line - "Awaiting bank"), **Unmatched bank lines** (bank
lines with no gateway record). **Re-run match** refetches (recomputed
server-side; nothing posted); provider filter + per-tab CSV **Export**.
Distinct from **Finance → Bank Reconciliation** (the authoritative book-vs-bank
close, which *writes* adjusting entries + a snapshot) - Settlement is a
gateway-scoped read-only view, and the **Fees** column (gross − net settled) is
shown as an *observation*, the very gap Bank Reconciliation later books. Backend:
`SettlementRow` now carries the matched bank line's `settled_amount` +
`settlement_reference`, and a `fee_amount` (gross − net); the view exposes them.
The endpoint was already there (`payments.report.view`); the FE response is now
fully typed (`SettlementReconciliation`). Route `/finance/payments/settlement`.

**Payments → Transactions Log: DONE** (Vision prototype). A **unified
money-movement feed** - Collections (money **in**) + Payouts (money **out**)
merged into one read-only ledger, **client-side** from the two existing flat
endpoints (no backend change). KPIs (Money in 7d / Money out 7d / Pending /
Failed) + direction / status / provider filters; table (Reference · Date ·
Direction · Party · Provider · Amount · Status) on the shared DataTable; CSV
**Export**. Each row opens a **lightweight drawer** branching by kind - a
collection shows Counterparty (customer, payer email, narration) + Settlement
(confirmed, deposit account, booked receipt #); a payout shows Beneficiary
(FLS-masked name/account, WHT, narration) + Settlement (source account, booked
vendor payment #, failure reason). **Honest adaptation:** the prototype's
"Transactions Log" is a movement ledger, whereas our `/payments/transactions/`
endpoint is the **PaymentEvent action/audit log** (initiated/confirmed/webhook/
rejected) - a *separate* stream left available but not surfaced by this screen.
Route `/finance/payments/transactions`. (The whole Payments group is now rebuilt:
Collections, Virtual Accounts, Payouts, Batches, Settlement, Transactions Log.)

**Reports & Close → Trial Balance: DONE** (Vision prototype). The balanced list of
every account's net position - and the input to the Income Statement & Balance
Sheet. An "always balances" explanation behind an **ⓘ hint** (InfoHint, not an
exposed banner), KPIs (Total debit / Total credit / Status / Accounts), a
**period** filter (fiscal periods via `getPeriods`, grouped sorted), an
**account-type** filter, and an optional **Compare to prior period** toggle that
adds **Prior + Change** columns - fetched as a *second* real TB call for the
immediately-preceding fiscal period and merged by account (no backend change). The
compare control is **only rendered** when a specific period with an earlier
neighbour is selected (hidden on "All periods" / the first period). Prior shows the
prior balance's magnitude (on its own side, aligned with the Debit/Credit columns)
and Change is the signed growth/shrink of that balance.

**Backend TB semantics fix:** `trial_balance(entity, period=)` now returns the
**cumulative balance as of that period** (every movement with
`period__start_date <= period.start_date`), not just that one period's movement - a
trial balance is a point-in-time statement, so "Jun 2026" means the running balance
through June. "All periods" remains the cumulative all-time balance. (Earlier worry
about a double-count was wrong: openings are never rolled forward - each
`AccountBalance` row carries only its period's movement and `opening_*` stays 0 - so
the all-periods sum was already correct; the actual bug was the period filter showing
movement-only.) Multi-period test added; all 184 vs_finance tests pass. Table Code · Account · Type (pill) · Debit · Credit + a totals row with
a Balanced badge. Export is the **real** backend CSV/XLSX/PDF (`downloadReportExport`
→ `?export=`). Money + `is_balanced` come straight from the endpoint. Honest
adaptation: period is a *fiscal period*, not the prototype's free "as of" date.
Lives in `reports/trial-balance-tab.tsx` (replaces the generic stub in
`statements.tsx`); route `/finance/reports/trial-balance`.

**Cost-centre / dimension analytics + AR pagination: DONE** (FE for the backend's
cost-centre/dimension + AR commits). Four pieces:
1. **AR lists paginate.** `getCustomers`/`getPayments` became `PaginatedEnvelope`;
   Customers + Receipts gained pagers, and their KPIs + status/method tab counts now
   come from new `customers/summary/` + `payments/summary/` endpoints (accurate
   entity-wide). **All** filters are server-side - customer status (incl. INACTIVE,
   a derived-status filter added to the list view), receipt status + method, search.
2. **Allocation strategy.** The allocation drawer offers *oldest / largest first*
   (`allocation_strategy` on the receipt/allocate endpoints); the auto-allocate preview
   re-orders to match.
3. **Cost & Dimension Analysis report** (`/finance/reports/analytics`): net posted
   activity per account, grouped by an axis (cost centre or a dimension), with per-bucket
   subtotals, period + account-type filters and the real CSV/XLSX/PDF export. New
   `reports/analytics-slice-tab.tsx`; reuses `finance.report.view`.
4. **Dimensions end-to-end.** A Setup → **Dimensions** tab (manage axes + allowed
   values), per-line dimension value selects on the New-journal-entry drawer (beside the
   cost-centre picker), and a **Dimensions** column on the journal detail. The cost-centre
   picker on direct entries was wired earlier. Note: this required applying the backend's
   migrations 0018 (InvoiceSource.OPENING) + 0019 (Dimension.allowed_values) to the dev DB
   - the dimensions GET 500'd until then. New backend tests for the two summaries + the
   customer status filter.

**Payments pagination: DONE** (no caps; all tables paginate). Removed the `[:200]`
slices on collections, payouts, payout-batches and the PaymentEvent transactions
log - all paginate via XVSPagination (`_paginate`, **page size 25**, `?page_size=`
≤100). Each KPI-bearing list got a summary endpoint (`collections/summary/`,
`payouts/summary/`, `payout-batches/summary/`) over ALL rows, and collections/
payouts gained server-side **status-group + provider** filters. The **Transactions
Log** is rebuilt on a new **movements** union endpoint (`/payments/movements/` +
`/summary/`) - a paginated cross-model feed of collections (in) + payouts (out),
FLS-masking payout beneficiary details, gated `payments.report.view` - replacing
the old client-side merge (which broke once the two lists paginated). FE: the four
gateway tabs are `PaginatedEnvelope` with pagers + summary KPIs; the movements
drawer reads the flattened row. `page_size = 25` is set explicitly in the finance
+ payments `_paginate` helpers.

**Procurement pagination: DONE** (no caps). Dropped the `[:200]`/`[:300]` slices on
every procurement list - vendors, categories, catalog, requisitions, purchase
orders, RFQs, quotations, goods receipts, vendor invoices, vendor payments, stock
items and stock movements - via a `paginate()` helper on `_ProcBase` (page size
25). These are simple tables (no client-side KPIs), so each just got a pager; no
summary endpoints. Pickers (vendor/category/requisition/PO + the shared
customer/vendor pickers) request `page_size=100` so dropdowns aren't truncated to
one page.

**Finance-ops pagination: DONE** (no caps; every ops table paginates). Added a
`paginate()` helper on `_FinanceBase` (page size 25). Paginated: audit log, FX
rates, petty-cash vouchers, bank statement lines, refunds, dunning notices,
expense claims, payroll runs, fixed assets, tax filings, **budgets** (its per-row
budget-vs-actual enrichment now runs over the page, not the whole entity). The
four KPI-bearing screens got `/summary/` endpoints aggregating over ALL rows so
header cards stay accurate under pagination: `expense-claims/summary/`,
`payroll-runs/summary/`, `fixed-assets/summary/`, `tax-filings/summary/` (assets'
straight-line monthly is summed in Python over the bounded active set). Expense
claims gained a server-side `q` search + a `display_status` translator
(Draft/Approved/Paid/Rejected → the underlying status × payment_status filters).
**Reports & Close design: COMPLETE.** All six report screens are rebuilt to the
prototype in dedicated tabs - Trial Balance, Income Statement (P&L, Budget/Prior-
year compare), Balance Sheet (IFRS SOFP sections), Cash Flow (direct method, per-
activity line items), Changes in Equity (component × movement matrix), and Cost &
Dimension Analysis. The generic `statements.tsx` renderer is deleted. Each
statement's ⓘ explainer sits beside the page title (`reports/index.tsx`
`TITLE_HINT`). Fixed a pre-existing contra-account sign bug in `_net_by_account`
(sign by account **type**, not `normal_balance`) so accumulated depreciation nets
against PP&E and the balance sheet balances.

Cross-run roll-ups that must stay whole - payroll Payslips/Statutory and the
petty-cash fund drawer's vouchers - request `page_size=100` rather than a pager.
Left as bounded **detail sub-sections** (not top-level tables, so not paginated):
a bank account's embedded statements/reconciliations (`[:50]`), reconciliation
matching candidates (`[:200]`), and customer-statement invoice/payment lines
(`[:500]`).

**Collections → Virtual Accounts: DONE** (no prototype - built in house theme).
Dedicated NUBANs per customer via the gateway (Paystack/OPay/Fake-for-dev); a
transfer to a customer's number arrives as a Collection that reconciles to AR.
The FE list used to 405 (view was POST-only) - added `GET /payments/virtual-
accounts/` (paginated + KPIs + filters, `payments.virtual_account.view`) and
`GET`/`PATCH /payments/virtual-accounts/<id>/` (status toggle, `…manage`);
`?virtual_account=` filter on the collections list powers the detail drawer's
"funds received" table. Account number/name are FLS-stripped behind
`…view_sensitive` (rendered `••••`). `_entity_obj` now resolves by code or id so
the UI pickers work. Demo: 3 VAs (Fake MFB) + 1 linked collection on CODEX.

## Customer document email (invoice · receipt · statement)

One shared capability in `vs_finance/document_email.py`, modelled on
`vs_procurement/po_email.py`, behind all three send buttons.

- **`FinanceDocumentDelivery`** (migration 0023) records one row per attempt:
  entity, customer, `(document_type, document_id)` (a statement has no document
  row, so it carries `period_start`/`period_end` instead), source
  (AUTOMATIC/MANUAL/RETRY), status (PENDING→SENT/FAILED), recipients, cc, note,
  the generated PDF, the notification ids, and the failure reason.
- **The automatic copy is recorded too.** `notify_invoice_issued` /
  `notify_payment_received` now delegate here, so history starts at the copy sent
  when the document posted rather than at the first manual re-send. Both stay
  best-effort: a mail failure must never roll back a posting (there is a test).
  Credit/debit notes still send directly from `notifications.py` - no attachment,
  no re-send control, so a delivery row would record something nobody can act on.
- **PDFs** live in `vs_finance/pdf.py` and are driven by the *same* context dicts
  the printable HTML documents use, so the attachment cannot drift from the
  screen. Two things worth knowing: the naira sign has **no glyph** in any font
  reportlab can rely on (it renders as a black box), so PDF money reads `NGN`,
  matching the purchase-order PDF; and table money is right-aligned via the
  paragraph style, never a TableStyle ALIGN rule, which cannot reach inside a
  `Paragraph`.
- **Status** is settled from the EMAIL notifications only (`receivers.py` on
  `notification_sent`/`notification_failed`). These events also declare an in-app
  channel, and an in-app row cannot decide whether a document reached a customer.
  Dispatch no longer creates one for an `UnregisteredRecipient` at all (2026-08-16),
  but the guard here stays: it is the channel that matters, not who happens to be
  filtered out upstream.
- **The monitoring copy is BCC, never CC.** These addresses are ours, not the
  customer's - a visible copy exposed internal mailboxes and made reply-all a route
  into one. `FINANCE_CUSTOMER_EMAIL_BCC` (falling back to the old
  `FINANCE_CUSTOMER_EMAIL_CC` environment variable) narrows it away from the
  platform-wide `EMAIL_BCC`.
- **FE**: one `<DocumentEmailAction>` primitive (`finance-ui`) drives all three -
  confirm modal with recipients/CC/subject preview, optional note, delivery
  history and a Retry on failed rows.
- **Dunning Send** was backend-complete all along (`POST
  /dunning-notices/<id>/send/`, `finance.dunning.send`); the FE had wired Cancel
  and left Send disabled behind a tooltip claiming dispatch was not built.

**Deployment**: run `seed_finance_permissions`, `seed_notification_event_types`
and `seed_notification_templates`, and apply `vs_finance` 0023 +
`vs_notifications` 0007. The notifications migration rewrites the invoice and
receipt email copy (school-specific "Dear Parent/Guardian" wording that predates
the console billing any customer, and which never mentioned the attachment) -
**only** for rows still holding the shipped default, comparing dash-insensitively
because seeded rows predate the no-em-dash rule. Hand-edited templates are left
alone.

## Backend endpoint + permission map (added for AR)
| Endpoint | Permission key |
|---|---|
| `POST /finance/invoices/` (create+post) | `finance.invoice.create` |
| `GET /finance/invoices/<id>/` (detail) | `finance.invoice.view` |
| `POST /finance/invoices/<id>/pay/` | `finance.payment.create` |
| `POST /finance/invoices/<id>/remind/` | `finance.dunning.send` |
| `GET /finance/customers/` (+ balance, status) · `GET /finance/customers/<id>/` (statement) | `finance.customer.view` |
| `POST /finance/customers/<id>/receipt/` (`auto_allocate` flag) | `finance.payment.create` |
| `PATCH /finance/customers/<id>/` | `finance.customer.update` |
| `GET /finance/payments/` · `GET /finance/payments/<id>/` | `finance.payment.view` |
| `POST /finance/payments/<id>/allocate/` (explicit or `auto_allocate`) | `finance.payment.allocate` |
| `GET /finance/credit-notes/` (+ `?kind=`, `invoice_number`) · `POST` (create draft, 1 line) | `finance.creditnote.view` / `.create` |
| `POST /finance/credit-notes/<id>/post/` (`auto_allocate:false` → stays Issued) | `finance.creditnote.post` |
| `POST /finance/credit-notes/<id>/allocate/` (`allocations[]` or `auto_allocate`; credit notes only) | `finance.creditnote.allocate` |
| `GET /finance/refunds/` · `POST` (create draft; `bank_account`) · `POST /finance/refunds/<id>/post/` | `finance.refund.view` / `.create` / `.post` |
| `POST /finance/invoices/<id>/write-off/` (`amount?`, `write_off_account?`, `narration`) | `finance.invoice.writeoff` |
| `GET /finance/ar-adjustments/` (unified refunds + write-offs; `?type=&search=&page=`; paginated; write-off rows from the finance audit log; KPI totals in envelope) | `finance.refund.view` |
| `GET /finance/payment-plans/` (`?search=&page=`; paginated) · `POST` (create draft + build schedule) | `finance.paymentplan.view` / `.create` |
| `POST /finance/payment-plans/<id>/activate/` · `…/refresh/` · `…/cancel/` | `finance.paymentplan.activate` / `.cancel` |
| `GET /finance/concessions/` (`?kind=&status=&search=&page=`; paginated) · `POST` · `…/<id>/post/` | `finance.concession.view` / `.create` / `.post` |
| `GET /finance/concessions/summary/` (posted YTD · draft pending · active count) | `finance.concession.view` |
| `GET /finance/dunning/summary/` (4 aging buckets) · `GET/POST /dunning-policies/` · `PATCH /dunning-policies/<id>/` (update + stages) | `finance.dunning.view` / `.manage` |
| `POST /finance/dunning/generate/` (raise notices) · `GET /dunning-notices/` · `…/<id>/cancel/` (send is deferred - no comms service) | `finance.dunning.generate` / `.send` |
| `GET/POST /finance/fee-structures/` (`?search=&is_active=`; items) · `…/<code>/generate/` | `finance.feestructure.view` / `.create` / `.generate` |
| `GET/POST /finance/invoices/<id>/email/` (preview + history / send) | `finance.invoice.email` |
| `GET/POST /finance/payments/<id>/email/` | `finance.payment.email` |
| `GET/POST /finance/customers/<pk>/statement-email/` (`start`/`end` bound the period) | `finance.customer.email_statement` |
| `POST /finance/document-deliveries/<id>/retry/` | any-of the three, then the exact key for that document kind |

**Lists are paginated** (`XVSPagination`, `?page=&page_size=`, max 100) with a
server-side `?search=` - the AR adjustment lists (credit-notes, ar-adjustments) no
longer cap at `[:200]`. Credit-notes also take `?kind=` and a derived `?status=`
(issued/applied/draft, from `allocated_amount` vs `total`). `_FinanceBase` is a
plain `APIView`, so paginate by driving `XVSPagination()` directly in `get()`
(`pagination_class` is only honoured by `GenericAPIView`).

Allocation is **oldest-first** by due date (then invoice date, id); an explicit
split caps each line at the invoice balance and the receipt's remaining cash; any
excess stays as **unallocated customer credit**.

## Running / verifying locally
- Frontend dev server :5173 (`npm run dev`), backend :8000
  (`cd backend/apps && python manage.py runserver --settings=apps.settings.local`).
- Login `admin@codexng.com` / `Admin@123456`; entities **CODEX**, **CREST**.
- Seed AR demo data: `python manage.py seed_finance_ar_demo --all` (chart of
  accounts, **12 open fiscal periods for the year** - without one, posting 409s
  `PERIOD_CLOSED`; demo customers with valid `@example.com` emails; a fee structure).
- Payment gateway: dev has **live Paystack** keys; set
  `PAYMENTS_DEFAULT_PROVIDER=FAKE` in `apps/apps/settings/local.py` to test
  collections offline (runserver auto-reloads).
- Gotchas: revenue accounts are `account_type="INCOME"` (not "REVENUE"); finance
  list endpoints return `{}` (not `[]`) when empty → always `toArray()`.

## Seeding data for checks - and it stays for your use
`/verify-design` drives are **read-only** and `scrub.sh` deletes **only** the
test-login trail (loginsession / authattempt / LOGIN_SUCCESS audit since the
baseline + resets `last_login`). It **never** touches finance business rows - so any
data seeded for a check **remains in the dev DB for you to keep using**.

Two ways data gets seeded:
1. **Master demo data** - `python manage.py seed_finance_ar_demo --all` (idempotent,
   re-runnable): chart of accounts, **12 open fiscal periods** for the current year,
   demo customers `CUST-001…004` (valid `@example.com` emails, wired to AR control
   `1200`) and fee structure `FS-TERM1`.
2. **Ad-hoc records for populated click-through** (e.g. an open invoice to allocate
   against) - created via Django shell using the **real services** so journals +
   balances post correctly (never raw status writes). Amounts are **kobo**
   (₦80,000 = `8000000`):
   ```bash
   cd backend/apps && python manage.py shell -c "
   import datetime
   from vs_finance.models import LedgerEntity, Customer, Account, Invoice, InvoiceLine, Payment
   from vs_finance.receivables import post_invoice, post_payment
   e=LedgerEntity.objects.get(code='CODEX'); c=Customer.objects.get(entity=e, code='CUST-003')
   t=datetime.date.today()
   inv=Invoice.objects.create(entity=e, customer=c, invoice_date=t, due_date=t+datetime.timedelta(days=14), reference='DEMO')
   InvoiceLine.objects.create(invoice=inv, line_no=1, description='Consulting', revenue_account=Account.objects.get(entity=e, code='4100'), quantity=1, unit_price=8000000)
   post_invoice(inv)                                   # ₦80,000 open invoice
   p=Payment.objects.create(entity=e, customer=c, payment_date=t, method='BANK_TRANSFER', amount=5000000, deposit_account=Account.objects.get(entity=e, code='1100'))
   post_payment(p, auto_allocate=False)                # ₦50,000 receipt, left UNallocated
   print(inv.document_number, p.document_number)"
   ```
   Posting needs an **open fiscal period** for the date (seeded above) or it 409s
   `PERIOD_CLOSED`. `auto_allocate=False` leaves the receipt unallocated so the
   allocation drawer has something to demo.
3. **Standing demo data right now (all on `CODEX`):**
   - `CUST-003` (Crystal Foods) has open invoice `INV-2026-00003` (₦80,000) +
     unallocated receipt `RCP-2026-00004` (₦50,000) - for clicking through
     Receipts & Allocation.
   - Four **Credit / Debit Notes**: three Issued (`CRN-2026-00001` ₦150k credit,
     `DRN-2026-00001` ₦25k debit, `CRN-2026-00002` ₦42k credit) + one **Applied**
     credit note `CRN-2026-00003` (₦120k) fully applied to invoice `INV-2026-00004`
     (CUST-004) - covers both types and the Issued/Applied states.
   - **Refunds & Write-offs**: a posted refund `RFD-2026-00001` (CUST-001, ₦50k, to
     bank account "Zenith - Operating" gl `1100`) + a write-off of invoice
     `INV-2026-00005` (CUST-002, ₦60k) → shows in the unified table via the audit log.
   - **Payment Plans**: an active plan `PPL-2026-00001` (CUST-002, invoice
     `INV-2026-00006` ₦90k, 3 monthly installments) with installment #1 recorded →
     progress 1/3, On track.
   - **Concessions**: a Posted `CNC-2026-00001` (Discount, CUST-001, ₦10k) + two Draft
     (`CNC-2026-00002` Scholarship ₦50k, `CNC-2026-00003` Waiver ₦20k) - covers all
     three types + both statuses.
   - **Dunning**: default policy "Standard reminders" (3 stages: +1/+14/+30d, channels
     Email/In-app) + 3 PENDING notices from a generate run over the overdue invoices.
   - **Fee Structures**: `FS-TERM1` + `FS-SSS-T1` (Tuition/Boarding/ICT, ₦1.28M/term).
   - Delete anytime; harmless. (Use **CODEX** for checks, not CREST.)

## Tests
`python manage.py test vs_finance --keepdb` (~154 green). New AR test classes:
`InvoiceCreateEndpointTests`, `InvoicePayRemindEndpointTests`,
`CustomerEndpointTests`, `ReceiptAllocationEndpointTests`.
