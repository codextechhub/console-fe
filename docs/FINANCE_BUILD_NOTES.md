# Finance Console — Build Notes & Handoff

How we build the Finance/Procurement console screens, what's done, and what's next.
Companion to `CLAUDE.md` (ship-check / verify-design) and `PERMISSIONS_AUDIT.md`.

## Design source — `Vision-Finance-Board.html` (repo root, gitignored)
The prototype is a **rendered app**: a raw `grep`/`rg` of the HTML returns **0 hits**
for screen labels. **To study a screen you must render it** — open
`file://…/Vision-Finance-Board.html` in a headless browser (Playwright, system
Chrome), click the nav item, screenshot, and look. Do not conclude "no design
exists" from a text search. Build to the prototype's **structure**, in our **house
theme** (never copy its palette).

## Per-screen workflow
1. **Render** the prototype → screenshot the screen *and* its drawer/modal.
2. **Plan first** — present the design plan/structure and get sign-off before
   building. Flag honest adaptations where our generic model lacks a prototype
   field (e.g. no school-specific "Guardian type" / student sub-name).
3. **Build** to the prototype, house theme.
4. **Verify** with `/verify-design` (drive the running app, read the screenshots —
   build-green ≠ works), then **scrub** the test-login rows.
5. **Commit in batches, directly to `main`** (FE and backend repos separately;
   end commit bodies with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`).

## Conventions
- **Money** = integer **kobo** on the wire; render with `<Money kobo>` / `formatMoney`.
- **Create + detail use right-side drawers** (`DetailDrawer`), not centered modals —
  convert `FormModal`→drawer when the prototype shows a side panel.
- **Type-to-search** via `finance-ui` pickers (`CustomerPicker`, `AccountPicker`,
  `ReceivableAccountPicker` [ASSET + tag CONTROL], `TaxCodePicker`…) over `SearchSelect`.
- Screen pattern: KPI cards · status tabs · avatar table · CSV Export · a primary action.
  Detail drawers use **tabs with icons**.
- Guard every non-paginated list with `toArray()` — an empty list serialises as `{}`.
- Gate controls with `Can`/`P.FIN_*`; seed new keys via
  `python manage.py seed_finance_permissions` and update `PERMISSIONS_AUDIT.md`.

## Font / theme structure
House theme = `font-mont` + palette gray-01 / black-01 / gray-05 / green-01 /
destructive / pry-01 (blue primary). Consoles render in **Geist**, scoped via the
`.console-geist` class on `ConsoleShell` content, `ConsoleSidebar`, **and** every
portaled overlay (`DetailDrawer` / `FormModal` / `ConfirmActionModal` mount at
`<body>`, so each carries `console-geist` itself).

## Typography — match the AR screens (canonical: `invoices-tab`, `customer-detail-drawer`)
The DataTable + drawer primitives already set the base sizes; cells/fields add
**only modifiers** — never re-declare `font-mont text-sm` on every cell. Copy
these exactly so a new screen reads like AR:
- **Table cells** inherit `font-mont text-sm font-medium text-black-01` from
  `DataTable`. Add `tabular-nums` to *every* numeric / date / code / amount cell
  (so columns align), `font-semibold` for the row's primary id (document no.),
  `text-gray-05` for muted/secondary, `text-gray-01` for names. `<Money>` for
  amounts. Don't set `text-xs` on data cells.
- **Status / type pills** (table + drawer): `rounded px-2 py-0.5 font-mont
  text-[11px] font-medium` + colour. NOT `rounded-full` / `font-semibold`.
- **Detail-drawer field** (the `Field` helper): label `font-mont text-[11px]
  text-gray-05` (**sentence case — no `uppercase`/`tracking`**); value
  `mt-1 font-mont text-sm font-semibold tabular-nums text-black-01`. Long prose
  values (a reason/narration) drop to `font-normal`.
- **Create-form field label** (`FormField`): `font-mont text-xs text-gray-05`.
- **Drawer sub-tables**: `th` = `bg-[#F1F1F1] px-3 py-2 font-mont text-[11px]
  font-semibold text-gray-01`; `td` = `border-t border-gray-03 px-3 py-2 font-mont
  text-xs text-black-01`.
- **Section heading inside a drawer**: `font-mont text-xs font-semibold text-gray-05`.

## Honesty rules
Never fake an action. Email-type actions (Email receipt, Send statement) are
present but **disabled with a tooltip** until an email service exists. Posting
panels **recap the real journal**. Print = `window.print()`.

## Customer credit is a liability (2140), AR never negative
Customer credit (overpayments, unapplied credit notes) lives in **2140 Customer
Credit Balances** (a current-liability control), never as a credit balance on AR.
Posting is **split at source**:
- **Receipt**: `Dr Bank · Cr AR (applied) · Cr 2140 (excess)`.
- **Credit note**: `Dr Revenue · Cr AR (applied) · Cr 2140 (unapplied)`.
- **Apply stored credit** to invoices later: `Dr 2140 · Cr AR` (a **real** journal —
  allocation is no longer GL-free; recaps/wording say so).
- **Refund**: `Dr 2140 · Cr Bank`, capped at the customer's available credit
  (`customer_credit_balance` = unapplied receipts + unapplied credit notes − refunds).
Existing negative-AR credit was reclassed once via
`python manage.py backfill_customer_credit --commit` (idempotent, dry-run default).

## Receivables — status
**Done (redesigned to prototype):**
- **AR Invoices** — KPIs, status tabs, summary, customer-name table, rich detail
  drawer (Lines/Payments/GL/Reminders/Activity), New invoice drawer (+ fee-structure
  prefill), Batch generate, Record payment, Send reminder, Write off.
- **Customers / Payers** — KPIs, status tabs, balance + status table, Export,
  New customer drawer, detail drawer (Transactions · **Statement** · Contact). The
  **Statement** is a statement-of-account document (letterhead, From/To, debit/credit
  ledger, opening/closing). Footer actions show only when the customer owes.
- **Receipts & Allocation** — KPIs, status/method filters, table, Export, **Record
  receipt = 2-step drawer** (capture + posting preview → Continue to allocation),
  allocation drawer (auto oldest-first or explicit split + posting recap).
- **Credit / Debit Notes** — no-KPI filter-dropdown list (All notes / All status),
  prototype columns (Note no · Type chip · Date · Customer · Against invoice ·
  Reason · Amount · Issued/Applied), single-panel detail drawer recapping the real
  journal (Print · Apply to balance), and **Issue note = create→post** with a live
  posting preview. Honest adaptations: single-amount form carries an explicit
  Revenue/Income **account picker** (our notes are line-based + need a GL account);
  **debit notes can't be allocated**, so "Apply to balance" shows only for credit
  notes with credit unapplied; post sends `auto_allocate:false` so it lands
  "Issued" and applying is the explicit second step.
- **Refunds & Write-offs** — 3 KPIs (Refundable credit · Written off YTD · Pending),
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
- **Payment Plans** — list (search + pagination) with **progress bar · next due ·
  health** (On track / At risk, derived: at risk = an unpaid installment is past
  due), an **Installment-schedule** detail drawer (Paid / Due / Scheduled, deriving
  Due = earliest unpaid) with **Record installment** + **Cancel plan**, and a
  **curated New-plan drawer** (the prototype's create modal doesn't open) with a
  live schedule preview that mirrors the backend's even-split + due-date stepping;
  Create = create + **activate**. Concessions are **not** bundled here (separate
  screen). Honest adaptations: a plan is an overlay on an **invoice** (required) and
  progress is derived from its settlement, so **Record installment** posts a *real*
  receipt against the invoice (`/pay/`) then calls `/refresh/`.
- **Concessions / Waivers** — 3 KPIs (Posted YTD · Draft pending · Active count, from
  `GET /finance/concessions/summary/`), search + type/status filters, a type-chip
  table (Waiver / Discount / Scholarship), a detail drawer recapping the real journal
  (Dr 4910 allowance · Cr AR) with Print + Post (drafts), and a New-concession drawer
  with an **"Enter as" Amount/% toggle** (percent is of the chosen invoice's balance,
  shows `= ₦x of ₦balance`). Honest: a concession reduces a **specific** posted invoice's
  balance (capped), so the invoice is **required**; posting defaults the allowance acct
  to **4910**. Reuses the shared `PostingRecap` + `Segmented`.
- **Dunning / Reminders** — 4 **aging-bucket KPIs** (Due soon 0–7d · Overdue 1–30 ·
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
- **Fee Structures** — search + status (Active/Inactive) list (Code · Name · Term ·
  Lines · Total/term), a detail drawer (line items: Fee item · GL account · Amount ·
  Tax + **Generate invoices**) and a New-structure drawer with a fee-lines editor.
  **Honest adaptation** (the school-specific screen): our generic `FeeStructure` is
  code · name · term · is_active · items(description · GL acct · amount · tax), so the
  prototype's branch / session / class-scope / fee-category / frequency / optional /
  assigned-students / activity are **dropped**; status is Active/Inactive; Import /
  Duplicate / Archive omitted (no backend).
- New journal + New account converted to drawers; sidebar scroll persists.

**Receivables area: COMPLETE** (redesigned to prototype). **Next:**
Petty Cash, Payroll, Budgets/Assets/Tax, Reports.

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
Migration 0010. Demo: Zenith — Operating on CODEX (statement + recon seeded).

**Operations → Bank Reconciliation: DONE** (standalone screen, prototype). An
account-scoped workbench: account selector, KPIs (statement/book/difference/
match progress), unreconciled banner, two-column matcher (unmatched statement
lines vs unmatched book/GL lines — click one of each → Match; same-amount book
lines highlighted as candidates), in-line **adjusting entry**, matched-lines
table, **Auto-match**, **Complete reconciliation**, printable report. Backend
adds `GET …/book-lines/` (unmatched GL cash lines) + `POST …/reconcile/complete/`
(records a BankReconciliation snapshot). Reuses match/adjust/auto-reconcile.
Honest: click-both-then-Match (no drag-drop), equal-amount candidate highlight
(no AI suggest), account-level (not per statement file). Route F.BANK_RECON.

**Collections → Virtual Accounts: DONE** (no prototype — built in house theme).
Dedicated NUBANs per customer via the gateway (Paystack/OPay/Fake-for-dev); a
transfer to a customer's number arrives as a Collection that reconciles to AR.
The FE list used to 405 (view was POST-only) — added `GET /payments/virtual-
accounts/` (paginated + KPIs + filters, `payments.virtual_account.view`) and
`GET`/`PATCH /payments/virtual-accounts/<id>/` (status toggle, `…manage`);
`?virtual_account=` filter on the collections list powers the detail drawer's
"funds received" table. Account number/name are FLS-stripped behind
`…view_sensitive` (rendered `••••`). `_entity_obj` now resolves by code or id so
the UI pickers work. Demo: 3 VAs (Fake MFB) + 1 linked collection on CODEX.

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
| `POST /finance/dunning/generate/` (raise notices) · `GET /dunning-notices/` · `…/<id>/cancel/` (send is deferred — no comms service) | `finance.dunning.generate` / `.send` |
| `GET/POST /finance/fee-structures/` (`?search=&is_active=`; items) · `…/<code>/generate/` | `finance.feestructure.view` / `.create` / `.generate` |

**Lists are paginated** (`XVSPagination`, `?page=&page_size=`, max 100) with a
server-side `?search=` — the AR adjustment lists (credit-notes, ar-adjustments) no
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
  accounts, **12 open fiscal periods for the year** — without one, posting 409s
  `PERIOD_CLOSED`; demo customers with valid `@example.com` emails; a fee structure).
- Payment gateway: dev has **live Paystack** keys; set
  `PAYMENTS_DEFAULT_PROVIDER=FAKE` in `apps/apps/settings/local.py` to test
  collections offline (runserver auto-reloads).
- Gotchas: revenue accounts are `account_type="INCOME"` (not "REVENUE"); finance
  list endpoints return `{}` (not `[]`) when empty → always `toArray()`.

## Seeding data for checks — and it stays for your use
`/verify-design` drives are **read-only** and `scrub.sh` deletes **only** the
test-login trail (loginsession / authattempt / LOGIN_SUCCESS audit since the
baseline + resets `last_login`). It **never** touches finance business rows — so any
data seeded for a check **remains in the dev DB for you to keep using**.

Two ways data gets seeded:
1. **Master demo data** — `python manage.py seed_finance_ar_demo --all` (idempotent,
   re-runnable): chart of accounts, **12 open fiscal periods** for the current year,
   demo customers `CUST-001…004` (valid `@example.com` emails, wired to AR control
   `1200`) and fee structure `FS-TERM1`.
2. **Ad-hoc records for populated click-through** (e.g. an open invoice to allocate
   against) — created via Django shell using the **real services** so journals +
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
     unallocated receipt `RCP-2026-00004` (₦50,000) — for clicking through
     Receipts & Allocation.
   - Four **Credit / Debit Notes**: three Issued (`CRN-2026-00001` ₦150k credit,
     `DRN-2026-00001` ₦25k debit, `CRN-2026-00002` ₦42k credit) + one **Applied**
     credit note `CRN-2026-00003` (₦120k) fully applied to invoice `INV-2026-00004`
     (CUST-004) — covers both types and the Issued/Applied states.
   - **Refunds & Write-offs**: a posted refund `RFD-2026-00001` (CUST-001, ₦50k, to
     bank account "Zenith — Operating" gl `1100`) + a write-off of invoice
     `INV-2026-00005` (CUST-002, ₦60k) → shows in the unified table via the audit log.
   - **Payment Plans**: an active plan `PPL-2026-00001` (CUST-002, invoice
     `INV-2026-00006` ₦90k, 3 monthly installments) with installment #1 recorded →
     progress 1/3, On track.
   - **Concessions**: a Posted `CNC-2026-00001` (Discount, CUST-001, ₦10k) + two Draft
     (`CNC-2026-00002` Scholarship ₦50k, `CNC-2026-00003` Waiver ₦20k) — covers all
     three types + both statuses.
   - **Dunning**: default policy "Standard reminders" (3 stages: +1/+14/+30d, channels
     Email/In-app) + 3 PENDING notices from a generate run over the overdue invoices.
   - **Fee Structures**: `FS-TERM1` + `FS-SSS-T1` (Tuition/Boarding/ICT, ₦1.28M/term).
   - Delete anytime; harmless. (Use **CODEX** for checks, not CREST.)

## Tests
`python manage.py test vs_finance --keepdb` (~154 green). New AR test classes:
`InvoiceCreateEndpointTests`, `InvoicePayRemindEndpointTests`,
`CustomerEndpointTests`, `ReceiptAllocationEndpointTests`.
