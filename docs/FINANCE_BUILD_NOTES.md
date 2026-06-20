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

## Honesty rules
Never fake an action. Email-type actions (Email receipt, Send statement) are
present but **disabled with a tooltip** until an email service exists. "Allocation
posting" / "Posting on receipt" panels **recap the real journal** (Dr bank · Cr AR)
and label the bank line "already debited on the receipt" — allocation is a
sub-ledger act with **no new GL posting**. Print = `window.print()`.

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
- New journal + New account converted to drawers; sidebar scroll persists.

**Next (still basic, redesign to prototype):** Refunds & Write-offs ·
Concessions/Waivers · Dunning/Reminders · Payment Plans · Fee Structures. Then:
Bank Accounts/Reconciliation, Expense Claims, Petty Cash, Payroll,
Budgets/Assets/Tax, Reports, Collections gateway.

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
3. **Standing demo data right now:**
   - **CODEX** — `CUST-003` (Crystal Foods) has open invoice `INV-2026-00003`
     (₦80,000) + unallocated receipt `RCP-2026-00004` (₦50,000) — for clicking
     through Receipts & Allocation.
   - **CREST** — four **Credit / Debit Notes**: three Issued
     (`CRN-2026-00003` ₦150k credit, `DRN-2026-00002` ₦25k debit, `CRN-2026-00004`
     ₦42k credit) + one **Applied** credit note `CRN-2026-00005` (₦120k) fully
     applied to invoice `INV-2026-00002` (CUST-004) — covers both types and the
     Issued/Applied states.
   - Delete anytime; harmless.

## Tests
`python manage.py test vs_finance --keepdb` (~154 green). New AR test classes:
`InvoiceCreateEndpointTests`, `InvoicePayRemindEndpointTests`,
`CustomerEndpointTests`, `ReceiptAllocationEndpointTests`.
