# Procurement Console — Build Notes & Handoff

How we rebuild the Procurement console screens to their design pack, what's done,
and what's next. Sibling to `docs/FINANCE_BUILD_NOTES.md` — the **conventions,
theme, typography and honesty rules there apply here unchanged**; this file only
records what is *procurement-specific* plus the screen roadmap.

Companion to `CLAUDE.md` (ship-check / verify-design) and `PERMISSIONS_AUDIT.md`.

## Design source — `Procurement_Console.html` (repo root, gitignored)
The prototype is a **rendered app**: a raw `grep`/`rg` of the HTML returns **0
hits** for screen labels. **To study a screen you must render it** — open
`file://…/Procurement_Console.html` in a headless browser (Playwright / system
Chrome; the `verify-design` skill's Playwright works), click the nav item,
screenshot, and look. Do not conclude "no design exists" from a text search.
Build to the prototype's **structure**, in our **house theme** (never its palette).

Render recipe (SPA — `networkidle` fires before it mounts):
`page.goto(file, { waitUntil: "load" }); await page.waitForTimeout(4000);`

## Per-screen workflow (identical to finance)
1. **Render** the prototype → screenshot the screen *and* every state: list +
   filters/tabs/KPIs/empty state, the detail drawer + each tab, every create/edit
   drawer/modal, row/footer actions, and any multi-step flow.
2. **Plan first** — present the structure and get sign-off. Flag honest
   adaptations where our generic model lacks a prototype field.
3. **Build** to the prototype, house theme, reusing the finance-ui primitives.
4. **Verify** with `/verify-design` (drive the running app with real data, read
   the screenshots — build-green ≠ works), then **scrub** the test-login rows.
5. **Commit in batches, directly to `main`** (FE + backend separately; end commit
   bodies with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`).

## What already exists (scaffolding — do NOT rebuild)
- **Nav + shell**: `procurement-nav.ts` already groups the sidebar exactly like
  the prototype (Dashboard · Procure to Pay · Vendors & Catalog · Sourcing ·
  Inventory · Analytics), and `procurement-shell.tsx` wraps pages in the shared
  `ConsoleShell` (house theme, `.console-geist`, global entity picker). The IA is
  correct; the rebuild is **per-screen content**, not layout.
- **Backend**: `vs_procurement` is **fully built** — every prototype screen has
  endpoints (see the map below). This effort is a **FE redesign**, not a backend
  build. The one likely exception is the Dashboard aggregate (see roadmap).
- The current procurement pages are **pre-prototype**; rebuild each in place.

## Conventions (reuse the finance-ui kit)
- **Same table everywhere**: `DataTable` (`@/components/finance-ui`) — column-
  driven over the shared shadcn `Table`, server pagination, the four explicit
  states (loading / empty / error / forbidden), row-click → drawer. Same header
  (`bg-[#F1F1F1]`), same cell typography as the finance AR screens.
- **Search dropdown for long lists**: `SearchSelect` (`@/components/custom/
  search-select`) for vendor / category / catalog-item / account pickers and any
  filter whose option list is long. For filters, lead the option list with an
  explicit "All …" item (value `""`) so the default renders as a dark value, not
  a faint placeholder. Small fixed-option filters (status, a 2–4 item enum) may
  stay simple styled `<select>`s.
- **Create + detail use right-side drawers** (`DetailDrawer`), not centered
  modals. Detail drawers use **tabs with icons** for rich records.
- **Money** = integer **kobo** on the wire; render with `<Money kobo>` /
  `formatMoney`.
- Guard every list with `toArray()` — an empty list serialises as `{}`.
- Gate controls with `Can` / `P.PROC_*`; register any new key and update
  `PERMISSIONS_AUDIT.md`.
- **Typography / theme**: follow `FINANCE_BUILD_NOTES.md` §Typography and §Font
  exactly (cells add only modifiers + `tabular-nums`; pills `rounded px-2 py-0.5
  text-[11px] font-medium`; drawer field label `text-[11px] text-gray-05`
  sentence-case; drawer sub-table `th`/`td` as specified). Consoles render in
  Geist via `.console-geist`.
- **Responsive (phone/tablet)**: pages must never overflow horizontally.
  `DashboardLayout` wraps pages in `grid grid-cols-1 min-w-0` (don't remove — it
  stops nowrap tables stretching `<main>`). `DataTable` renders rows as stacked
  label/value cards below `md` (opt out per table with `mobile="scroll"` for
  dense reports; custom card via `mobileCard`). Toolbars `flex-wrap`; tab strips
  `max-w-full overflow-x-auto`; form grids `grid-cols-1 sm:grid-cols-N`;
  count-KPI strips `grid-cols-2 … lg:grid-cols-4`, money-KPI strips stay 1-col
  on phones; drawers `w-full sm:max-w-[…]`. Verify with
  `.claude/skills/verify-design/_mobile_audit.mjs` (drive.mjs at 390/820px + a
  page-overflow probe): run from the skill dir with `BASE_URL`+`ROUTES`.
  Depth policy: phones are **view + simple actions** — browsing, details,
  approvals and simple forms must be great; complex multi-line editors stay
  desktop-first (usable on phone, not optimized, desktop never degraded).

## Drawer styles (reuse the finance-ui primitives — do not hand-roll)
Everything opens in a **right-side drawer**, never a centered modal (unless the
prototype explicitly shows one). All portal to `<body>` and carry `.console-geist`
themselves. Full typography rules: `FINANCE_BUILD_NOTES.md` §Typography.

**Detail drawer — `DetailDrawer` (`@/components/finance-ui`)**
- Props: `open`, `onOpenChange`, `title`, `description?`, `children`, `footer?`,
  `widthClass` (default `sm:max-w-xl`; use `sm:max-w-3xl` for wide records like the
  3-way match or a Dr/Cr posting recap).
- Header (component-set): title `font-mont text-base font-semibold text-black-01`
  + description `text-xs text-gray-05`. Body scrolls; `footer` is a right-aligned
  actions row.
- Rich records → **tabs with icons** (e.g. Lines · Match · GL · Activity).
- **Field row** (the `Stat`/`Field` helper): label `font-mont text-[11px]
  text-gray-05` (sentence case — no uppercase/tracking); value `mt-1 font-mont
  text-sm font-semibold tabular-nums text-black-01`; long prose → `font-normal`.
- **Sub-table** inside a drawer: `th = bg-[#F1F1F1] px-3 py-2 font-mont text-[11px]
  font-semibold text-gray-01`; `td = border-t border-gray-03 px-3 py-2 font-mont
  text-xs text-black-01`.
- **GL / posting recap**: `PostingRecap` + `RecapRow` (Dr/Cr grouped card,
  "Debits = Credits" badge). Recaps the **real** journal only.
- Footer actions: Post / Submit / Match etc.; Print = `window.print()`;
  email/comms = **disabled-with-tooltip**.

**Form (create/edit) drawer — `FormDrawer` (`@/components/finance-ui`)**
- Built on `DetailDrawer`; owns the Cancel/Submit footer. Props: `open`,
  `onOpenChange`, `title`, `description?`, `onSubmit`, `submitText`, `loading`,
  `canSubmit` (gates the submit button), `widthClass` (default `sm:max-w-lg`).
- Wrap each field in **`FormField`** (`label`, `required`) — label renders
  `font-mont text-xs text-gray-05`.
- Inputs: **pickers over `SearchSelect`** for references (`VendorPicker`,
  `AccountPicker`, `CategoryPicker`/catalog, `BankAccountPicker`…); **`MoneyInput`**
  for kobo money; **`Segmented`** for enum toggles (options are **tuples not
  objects** — see [[finance_ui_gotchas]]); **`LineEditor`** (+ `emptyLine`,
  `toApiLines`, `DocLine`) for document line grids.
- Gate `canSubmit` on validity (and dirty, for edit). Keep input heights even with
  the `h-9` / `[&_input]:h-9` pattern. `FormField` has **no** `hint` prop.
- A create drawer that will **post** shows a **live `PostingRecap` preview** of the
  journal that will be written (mirrors the real posting — no second journal).
- `FormModal` is the centered-dialog sibling; use it only where the prototype
  shows a centered modal.

## Honesty rules
Never fake an action. **Email/comms** actions (email a PO to a vendor, send an
RFQ) are present but **disabled-with-tooltip** until a service exists. **Posting**
panels recap the **real** journal, never imply a second one. Print = `window.print()`.

## Procurement domain model (so recaps are honest)
Procure-to-Pay spine and its GL:
- **Requisition** (internal request) → **RFQ** (invite quotes) → **Quotation**
  (vendor bids; award → PO) → **Purchase Order** (commitment) → **Goods Receipt**
  (GRN) → **Vendor Invoice** (3-way matched to PO + GRN) → **Vendor Payment**.
- **GL**: GRN posts `Dr Inventory/Expense · Cr GR/IR clearing`; vendor invoice
  posts `Dr GR/IR · Cr Accounts Payable`; payment posts `Dr AP · Cr Bank`.
  **GR/IR** (goods-received / invoice-received) is the clearing account the
  GR/IR & Control screen reconciles — a real balance, recap it truthfully.
- **Approvals** ride the shared **vs_workflow** engine (same queue the other
  consoles use); the prototype's "Approvals" nav item points at the workflow
  queue filtered to procurement, not a bespoke procurement table.
- Entity-scoped exactly like finance: every call carries `?entity=<code>` and the
  backend enforces entitlement via `resolve_entity` (unknown/forbidden → 404).

## Backend endpoint + permission map (`vs_procurement`, all entity-scoped)
Reports are gated on `procurement.report.view`; lists on `*.view`; actions on the
specific verb key.

| Area | Endpoints | Permission |
|---|---|---|
| Vendors | `GET vendors/`, `GET vendors/<id>/` | `procurement.vendor.view` |
| Categories | `GET/POST categories/` | `procurement.category.view` |
| Catalog | `GET catalog-items/`, `GET catalog-items/<id>/` | `procurement.catalog_item.view` |
| Requisitions | `requisitions/` (+ `<id>/`, `<id>/submit/`) | `procurement.requisition.view` / `.submit` |
| RFQs | `rfqs/` (+ `<id>/`, `<id>/issue/`, `<id>/cancel/`) | `procurement.rfq.view` / `.issue` |
| Quotations | `quotations/` (+ `<id>/`, `<id>/submit/`, `<id>/award/`) | `procurement.quotation.view` / `.submit` / `.award` |
| Purchase Orders | `purchase-orders/` (+ `<id>/`, `<id>/submit/`) | `procurement.purchase_order.view` / `.update` / `.submit` |
| Goods Receipts | `goods-receipts/` (+ `<id>/`, `<id>/post/`) | `procurement.goods_receipt.view` / `.update` / `.post` |
| Vendor Invoices | `vendor-invoices/` (+ `summary/`, `<id>/`, `<id>/match/`, `<id>/submit/`, `<id>/post/`) | `procurement.vendor_invoice.view` / `.create` / `.update` / `.match` / `.submit` / `.post` |
| Vendor Payments | `vendor-payments/` (+ `eligible-invoices/`, `<id>/`, `<id>/submit/`, `<id>/post/`, `<id>/cancel/`, `<id>/reverse/`) | `procurement.vendor_payment.view` / `.create` / `.update` / `.submit` / `.post` / `.cancel` / `.reverse` |
| Approvals | vs_workflow queue + `approvals/default-templates/` | `procurement.approval.manage` (+ workflow) |
| Contracts | `contracts/` (+ `renewals/`, `<id>/`, `activate/`, `renew/`, `terminate/`, `milestones/<id>/complete/`) | `procurement.contract.view` / `.update` / `.activate` / `.renew` / `.terminate` |
| Stock Items | `stock-items/` (+ `<id>/`, `<id>/issue/`, `<id>/adjust/`) | `procurement.stock.view` / `.issue` / `.adjust` |
| Stock Movements | `stock-movements/` | `procurement.stock.view` |
| Reports | `reports/dashboard/`, `ap-aging/`, `ap-reconciliation/`, `ap-cash-requirements/`, `grir/`, `grir-aging/`, `spend-analysis/`, `vendor-performance/`, `cycle-time/`, `stock-reorder/`, `stock-valuation/` | `procurement.report.view` |

FE API slice: `src/redux/services/procurement/procurement-api.ts` currently wires
only vendors / categories / catalog-items / requisitions / purchase-orders /
goods-receipts / vendor-invoices / vendor-payments. **Sourcing (rfqs, quotations),
contracts, stock, and every `reports/*` endpoint still need FE queries added** as
their screens are built.

## Screen-by-screen roadmap (build order: top-to-bottom by nav, Dashboard first)
Status legend: ☐ not started · ◐ in progress · ☑ done (redesigned to prototype).
All ☐ at time of writing. Study each screen's every state before building.

### 1. Dashboard ☑
Prototype: 5 KPI tiles (Total Spend MTD · Open Purchase Orders · Pending
Approvals · Overdue Invoices · Active Vendors) · **Spend by Category** donut ·
**Purchase Order Status** bars · **Monthly Spend Trend** line · **Recent Activity**
feed · **Approvals Awaiting You** list. Charts reuse the finance-ui `charts`.
**Data-source decision — resolved:** the screen uses the entity-scoped
`GET reports/dashboard/?entity=<code>` aggregate, gated by
`procurement.report.view`. One server response supplies KPIs, category spend, PO
statuses, the eight-month trend, safe procurement audit activity, and the
signed-in actor's pending procurement approvals. The server owns status and
period derivation, avoids client-side fan-out, and filters every contributing
record to the resolved entity. Honest adaptations: “On hold” is not presented as
“blacklisted”; the PO chart mirrors the persisted status used by the PO list
(receipt-aware open/partial counts remain KPI-only); spend is grouped by vendor
category; and only real workflow document types are included.

### 2. Procure to Pay
- **Requisitions ☑** — list (KPIs/status tabs) · detail drawer (lines, approval
  trail) · new-requisition drawer (line editor + catalog/category pickers) ·
  Submit action. Endpoints: `requisitions/` (+submit).
- **Purchase Orders ☑** — list · detail drawer (lines, linked requisition/quote,
  receipts) · new-PO drawer with delivery address and vendor-defaulted payment terms ·
  Save Draft / Create & Submit · draft order-term editing. Pending Approval is
  locked until the workflow returns the PO to Draft; copied requisition lines remain
  immutable. Email-to-vendor **deferred**. `purchase-orders/`.
- **Goods Receipts ☑** — list · detail drawer (Overview · Received Items · Quality
  Notes) · new-GRN drawer with PO lines, accepted/rejected quantities and inspection
  notes · **Post** with a real journal recap (`Dr Inventory/Expense · Cr GR/IR`).
  The authenticated user is stored as Received By without a redundant form field;
  Location is omitted because the current model has no location field. The prototype's final Create action is labelled
  **Create & Post** so its GL effect is explicit; Save Draft remains non-posting.
  Accepted and rejected quantities use whole-unit steppers; each input is clamped
  against the other and their sum cannot exceed the PO line's remaining quantity.
  List and detail rows show both lifecycle status (`DRAFT`/`POSTED`) and receipt
  coverage (`PARTIAL`/`FULL`/`REJECTED`) so coverage never hides editability.
  Each GRN line snapshots the PO remainder at creation, so sequential receipts read
  `4 of 12`, then `3 of 8` rather than reusing the original PO denominator. Draft
  line value and posting preview are calculated immediately as accepted quantity ×
  PO unit price; they do not wait for posting.
  Received Items uses shared aligned columns and falls back to the source PO item
  description for legacy receipts whose copied description is blank.
  Partial describes receipt coverage, not editability: partial drafts can be edited;
  posted receipts are immutable because their journal and PO quantities are authoritative,
  and expose **Receive Remaining** to create the next GRN against the outstanding PO quantity.
  `goods-receipts/` (+post).
- **Vendor Invoices ☑** — prototype-aligned KPI/list tabs plus a right-side create/edit
  drawer and detail tabs (Overview · Line Items · 3-Way Match · Payment History ·
  Activity). Ledger status, workflow approval, match outcome, payment coverage and
  overdue state remain separate fields; the list may show an actionable display
  overlay without replacing the persisted lifecycle. There is no configured match
  tolerance, so quantity and unit-price comparisons are exact and the UI says so
  instead of inventing a threshold. Draft edits clear the old match. Pending,
  approved and posted invoices are immutable; posting requires real workflow approval
  and re-prices/re-matches while holding the invoice and referenced PO-line row locks.
  Multiple invoice rows against one PO row are aggregated before the ordered/received
  caps are tested, closing the split-line overbilling gap. PO/vendor/GRN joins are
  entity-scoped and mutually validated, duplicate nonblank vendor invoice references
  are rejected per vendor, and create/edit is atomic. Posted detail recaps the actual
  journal (`Dr GR/IR or expense + input VAT · Cr AP`); drafts show the corresponding
  preview. `vendor-invoices/` (+summary/detail/update/match/submit/post). Export is
  intentionally absent. Verified against the real CODEX backend on desktop, tablet
  and 390px phone: the populated list, posted detail, line items, activity, create
  drawer and responsive cards rendered without console/page errors or page-level
  horizontal overflow. Real-data screenshots prove the posted, unpaid and overdue
  presentations; draft, pending-approval, approved-unposted, disputed, partial and
  paid rendering is covered by the distinct server contract and regression tests but
  was not visually proven because the seeded entity did not contain those lifecycle
  examples. The verifier was kept read-only and did not manufacture transactional
  invoice states merely to improve screenshot coverage.
- **Vendor Payments ☑** — implemented and verified against the real CODEX backend.
  Prototype-aligned list (Payment Ref · Vendor · Invoices · Date · Method · Net Paid ·
  separate ledger/approval/allocation pills), responsive detail drawer tabs
  (Overview · Invoices · Posting · Activity), and a create/edit drawer that selects
  exact posted-invoice allocations, a real active bank account, method/date/reference,
  optional WHT code/amount and narration. Export is intentionally absent.
  Draft allocation rows are an approval plan only: they do not touch invoice balances.
  Edits are limited to `DRAFT` payments in `NOT_SUBMITTED` or `REJECTED`; pending and
  approved drafts are locked. Submission uses the shared workflow. Posting requires
  `APPROVED`, revalidates vendor active/KYC/hold gates, the active postable asset bank
  account, WHT bounds, invoice entity/vendor/status/balances and the complete approved
  allocation plan under stable row locks before writing `Dr AP (gross) · Cr Bank
  (net) · Cr WHT payable`. Posted payments are immutable; Reverse creates the real
  journal reversal and restores invoice settlement totals while retaining allocation
  history. Cancel applies only to non-pending unposted payments. Finance activity
  messages now render Naira amounts, including legacy immutable audit rows whose
  metadata was stored in kobo. The same raw-minor-unit audit root cause was removed
  from GRN posting, quotation submit/award and stock issue/adjustment so adjacent
  Procurement feeds cannot leak internal kobo values. `vendor-payments/`
  (+eligible/detail/update/submit/post/cancel/reverse). Desktop proof covers the
  populated list, posted Overview/Invoices/Posting/Activity tabs, genuine pending
  approval controls, empty create drawer and populated edit drawer; every driven state
  rendered without console/page errors. The 390px phone and 820px tablet audit reported
  zero page-level horizontal overflow. Phone screenshots prove the complete card list,
  usable approval drawer and stacked create form. The drawer now resets to Overview when
  switching records—a screenshot-discovered regression fixed before completion. The
  verifier login/session/auth/audit rows were scrubbed after the run.
- **Approvals ☐** — the shared **vs_workflow** queue scoped to procurement
  (approve / reject with the real workflow actions). Confirm whether this reuses
  the existing Workflow screen or gets a procurement-framed view.

### 3. Vendors & Catalog
- **Vendors ☐** — list (avatar table, status) · detail drawer (contact, bank,
  contracts, spend, performance tabs) · new/edit vendor drawer. `vendors/`.
- **Categories ☐** — list/tree · create/edit drawer. `categories/`.
- **Catalog ☐** — catalog-item list (category, unit, price) · detail · create/edit
  drawer with category + vendor pickers. `catalog-items/`.

### 4. Sourcing
- **RFQs ☐** — list · detail (invited vendors, lines) · new-RFQ drawer · **Issue** /
  **Cancel** (email to vendors deferred). `rfqs/` (+issue/cancel). *(FE api todo.)*
- **Quotations ☐** — list · detail (bid lines vs RFQ) · Submit · **Award → PO**.
  `quotations/` (+submit/award). *(FE api todo.)*
- **Contracts ☐** — list (status, renewal dates) · detail (milestones, renewals) ·
  Activate / Renew / Terminate / Complete-milestone. `contracts/` (+ actions).
  *(FE api todo.)*

### 5. Inventory
- **Stock Items ☐** — list (on-hand, reorder point, valuation) · detail (movements,
  valuation) · **Issue** / **Adjust** (real journal recaps). `stock-items/`
  (+issue/adjust). *(FE api todo.)*
- **Movements ☐** — the stock ledger (receipts / issues / adjustments), read-only,
  filterable. `stock-movements/`. *(FE api todo.)*

### 6. Analytics (all read-only reports, `procurement.report.view`)
- **AP Aging ☐** — aging buckets by vendor. `reports/ap-aging/`.
- **GR/IR & Control ☐** — GR/IR clearing balance + aging (goods received not
  invoiced / invoiced not received). `reports/grir/` + `grir-aging/`.
- **Spend ☐** — spend analysis (by category / vendor / period). `reports/spend-analysis/`.
- **Vendor Performance ☐** — on-time, price variance, quality scores.
  `reports/vendor-performance/`.
- *(Also available if the prototype surfaces them: `ap-reconciliation/`,
  `ap-cash-requirements/`, `cycle-time/`, `stock-reorder/`, `stock-valuation/`.)*

## Running / verifying locally
- Backend: `cd backend/apps && ../cx/bin/python manage.py runserver --settings=apps.settings.local`
- `/verify-design /procurement/<route>` drives the real app, screenshots each
  route, and scrubs its test-login rows. **Read the screenshots** — a blank frame
  or the error boundary is a failure even if the run "succeeded". Entity-scoped
  screens need a ledger entity (CODEX / CREST in dev).

## Seeding data for checks & cleanup — READ before verifying a screen
Use entity **`CODEX`** for all checks (CREST also exists; stick to CODEX so data
is consistent — same convention finance uses). Procurement is entity-scoped over
the **same `vs_finance.LedgerEntity`**, and its postings write **real finance
journals**, so before any populated check the entity must have:
- **RBAC keys**: `python manage.py seed_procurement_permissions` (idempotent).
- **Finance chart of accounts + at least one OPEN fiscal period** for the posting
  date — `python manage.py seed_finance_ar_demo --all` gives CODEX its chart + 12
  open periods. Without them GRN/invoice/payment posting 409s `PERIOD_CLOSED`
  (or fails on a missing GL account: GR/IR clearing, AP, Inventory/Expense, Bank).

Run `python manage.py seed_procurement_demo` for repeatable CODEX dashboard data.
The command is idempotent and creates three vendors/categories, seven posted
monthly vendor invoices, four purchase orders, partial/full goods receipts, a real
operating `BankAccount`, and Vendor Payment examples covering draft, rejected,
approved-unposted, genuine workflow-pending, posted/partial allocation and reversed
states. Posting and reversal use the real procurement services; draft allocation rows
remain non-settling instructions. It expects the finance chart and open periods above
to exist. For screen-specific scenarios beyond that standing data, use the real
services, never raw status writes:
- Services: `create_po_from_requisition`, `issue_rfq`, `award_quotation`,
  `post_grn`, `match_vendor_invoice`, `post_vendor_invoice`, `post_vendor_payment`,
  `receive_stock`, `issue_stock` (in `vs_procurement`).
- Models: `Vendor`, `VendorCategory`, `CatalogItem`, `PurchaseOrder(+Line)`,
  `GoodsReceipt`, `VendorInvoice(+Line)`, `VendorPayment(+Allocation)`,
  `Requisition`, `Rfq(+Line)`, `VendorQuotation(+Line)`, `VendorContract(+Milestone)`,
  `StockItem`.
- Amounts are **kobo** (₦80,000 = `8000000`). The **canonical example of how to
  build valid records + open period + vendor + tax codes** is the fixture in
  `vs_procurement/tests.py` (`setUp` / the `_FixtureMixin` — it does
  `seed_chart_of_accounts(entity)` + an open `FiscalPeriod` + a `Vendor`). Copy it.

**Cleanup after a test:** `/verify-design` drives are **read-only**, and its
`scrub.sh` deletes **only** the test-login trail (loginsession / authattempt /
LOGIN_SUCCESS audit since the baseline + resets `last_login`) — it **never** touches
procurement business rows. So anything you seed **stays in the dev DB for reuse**;
delete ad-hoc rows by hand if you want a clean slate (harmless either way). Record
the standing demo rows you create here (as finance's notes do) so later checks know
what exists.

## Tests (mirror finance — security first)
Procurement tests live in `vs_procurement/tests.py`. For any backend change, add:
the **permission-denied (403)** case and **cross-entity isolation** first, then the
happy path + each action/filter. Run with `--keepdb` (avoids the `test_cx_db`
lock). Every posting test asserts the **real journal** (Dr/Cr) it writes.

## Status
Dashboard, Requisitions, Purchase Orders, Goods Receipts, Vendor Invoices and Vendor
Payments are rebuilt and verified. Vendor Payments has real workflow, posting,
allocation and reversal contracts; focused backend tests, Django/migration checks,
the frontend production build, populated desktop drawer inspection, and phone/tablet
overflow verification are green. Next: study **Approvals**—the next unchecked nav
section—before proposing its implementation plan.
