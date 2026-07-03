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
| Purchase Orders | `purchase-orders/` (+ `<id>/`, `<id>/submit/`) | `procurement.purchase_order.view` / `.submit` |
| Goods Receipts | `goods-receipts/` (+ `<id>/`, `<id>/post/`) | `procurement.goods_receipt.view` / `.post` |
| Vendor Invoices | `vendor-invoices/` (+ `<id>/`, `<id>/match/`, `<id>/submit/`, `<id>/post/`) | `procurement.vendor_invoice.view` / `.match` / `.submit` / `.post` |
| Vendor Payments | `vendor-payments/` (+ `<id>/`, `<id>/post/`) | `procurement.vendor_payment.view` / `.post` |
| Approvals | vs_workflow queue + `approvals/default-templates/` | `procurement.approval.manage` (+ workflow) |
| Contracts | `contracts/` (+ `renewals/`, `<id>/`, `activate/`, `renew/`, `terminate/`, `milestones/<id>/complete/`) | `procurement.contract.view` / `.update` / `.activate` / `.renew` / `.terminate` |
| Stock Items | `stock-items/` (+ `<id>/`, `<id>/issue/`, `<id>/adjust/`) | `procurement.stock.view` / `.issue` / `.adjust` |
| Stock Movements | `stock-movements/` | `procurement.stock.view` |
| Reports | `reports/ap-aging/`, `ap-reconciliation/`, `ap-cash-requirements/`, `grir/`, `grir-aging/`, `spend-analysis/`, `vendor-performance/`, `cycle-time/`, `stock-reorder/`, `stock-valuation/` | `procurement.report.view` |

FE API slice: `src/redux/services/procurement/procurement-api.ts` currently wires
only vendors / categories / catalog-items / requisitions / purchase-orders /
goods-receipts / vendor-invoices / vendor-payments. **Sourcing (rfqs, quotations),
contracts, stock, and every `reports/*` endpoint still need FE queries added** as
their screens are built.

## Screen-by-screen roadmap (build order: top-to-bottom by nav, Dashboard first)
Status legend: ☐ not started · ◐ in progress · ☑ done (redesigned to prototype).
All ☐ at time of writing. Study each screen's every state before building.

### 1. Dashboard ☐ (build FIRST)
Prototype: 5 KPI tiles (Total Spend MTD · Open Purchase Orders · Pending
Approvals · Overdue Invoices · Active Vendors) · **Spend by Category** donut ·
**Purchase Order Status** bars · **Monthly Spend Trend** line · **Recent Activity**
feed · **Approvals Awaiting You** list. Charts reuse the finance-ui `charts`.
**Open decision — data source:** there is **no** procurement dashboard aggregate
endpoint. Either (a) add one (`reports/dashboard/`, one payload like finance's
`FinanceDashboard`) — cleaner, one round-trip; or (b) compose client-side from
`spend-analysis/` + `ap-aging/` + list counts + the workflow queue. Resolve at
build time; (a) recommended. This is the **only** screen likely needing backend.

### 2. Procure to Pay
- **Requisitions ☐** — list (KPIs/status tabs) · detail drawer (lines, approval
  trail) · new-requisition drawer (line editor + catalog/category pickers) ·
  Submit action. Endpoints: `requisitions/` (+submit).
- **Purchase Orders ☐** — list · detail drawer (lines, linked requisition/quote,
  receipts) · new-PO drawer · Submit · email-to-vendor **deferred**. `purchase-orders/`.
- **Goods Receipts ☐** — list · detail drawer (received lines vs PO) · new-GRN
  drawer · **Post** with a real journal recap (`Dr Inventory/Expense · Cr GR/IR`).
  `goods-receipts/` (+post).
- **Vendor Invoices ☐** — list · detail drawer with the **3-way match** (PO ↔ GRN
  ↔ invoice, tolerance) · Match · Submit · **Post** (`Dr GR/IR · Cr AP`) recap.
  `vendor-invoices/` (+match/submit/post).
- **Vendor Payments ☐** — list · detail drawer (allocations) · new-payment drawer ·
  **Post** (`Dr AP · Cr Bank`) recap. `vendor-payments/` (+post).
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

## Status
Roadmap authored; **no screens rebuilt yet**. Nav/shell/backend already in place.
Next: build the **Dashboard** first (resolve its data-source decision), then work
top-to-bottom through the nav.
