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
| Vendors | `vendors/` (+ `summary/`, `<id>/`, `<id>/insights/`) | `procurement.vendor.view` / `.create` / `.update`; sensitive detail fields use `.view_sensitive`; summary/insights use `procurement.report.view` |
| Categories | `categories/` (+ `<id>/`, `insights/`) | `procurement.category.view` / `.create` / `.update`; spend insights use `procurement.report.view` |
| Catalog | `GET catalog-items/`, `GET catalog-items/<id>/` | `procurement.catalog_item.view` |
| Requisitions | `requisitions/` (+ `<id>/`, `<id>/submit/`) | `procurement.requisition.view` / `.submit` |
| RFQs | `rfqs/` (+ `<id>/`, `<id>/issue/`, `<id>/cancel/`) | `procurement.rfq.view` / `.issue` |
| Quotations | `quotations/` (+ `<id>/`, `<id>/submit/`, `<id>/award/`) | `procurement.quotation.view` / `.submit` / `.award` |
| Purchase Orders | `purchase-orders/` (+ `<id>/`, `<id>/submit/`) | `procurement.purchase_order.view` / `.update` / `.submit` |
| Goods Receipts | `goods-receipts/` (+ `<id>/`, `<id>/post/`) | `procurement.goods_receipt.view` / `.update` / `.post` |
| Vendor Invoices | `vendor-invoices/` (+ `summary/`, `<id>/`, `<id>/match/`, `<id>/submit/`, `<id>/post/`) | `procurement.vendor_invoice.view` / `.create` / `.update` / `.match` / `.submit` / `.post` |
| Vendor Payments | `vendor-payments/` (+ `eligible-invoices/`, `<id>/`, `<id>/submit/`, `<id>/post/`, `<id>/cancel/`, `<id>/reverse/`) | `procurement.vendor_payment.view` / `.create` / `.update` / `.submit` / `.post` / `.cancel` / `.reverse` |
| Approvals | `approvals/` (+ `<workflow_id>/`, `<workflow_id>/actions/`, `default-templates/`) backed by vs_workflow | Actor eligibility snapshot + entity entitlement; template setup uses `procurement.approval.manage` |
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
- **Approvals ☑** — **decision resolved:** a Procurement-framed queue at
  `/procurement/approvals`, not a link to the global Workflow console. The backend
  adapters resolve the selected ledger entity against the real generic workflow
  target, restrict document types to Requisition / Purchase Order / Vendor Invoice /
  Vendor Payment, and return only the signed-in actor's current frozen approver
  snapshots. They delegate votes directly to `vs_workflow` so row locking, requester
  self-approval protection, delegated eligibility, quorum/threshold rules, skipped
  stages, returns, terminal decisions, callbacks and audit remain authoritative.
  `procurement.approval.manage` is only for provisioning templates; it is deliberately
  not required to open the personal queue because a frozen delegation can make a user
  eligible without the source RBAC grant. List/detail responses re-resolve the real
  document inside `?entity=`, bulk-load generic targets to avoid N+1 queries, paginate
  server-side, and exclude raw workflow audit context/metadata. The screen matches the
  prototype's pending-only table and Overview/Activity right drawer, with real stage
  progress and actions. Approval comments are optional; revision and rejection reasons
  are required by the shared engine. Reject copy reflects the stage's actual terminal
  vs return-to-requester policy. Terminal/returned items leave this actionable inbox;
  no fake history tabs or Export control are added. The canonical Procurement workflow
  allow-list now includes Vendor Payments, fixing the adjacent dashboard omission.
  Verified against the real CODEX backend with the genuine pending Vendor Payment
  `COD-VP-2600006`: the populated desktop table, Overview decision panel, real Manager
  approval trail and Activity tab rendered without console/page errors. The read-only
  drive did not cast a business decision; approve/return/reject transitions are proven
  by focused service/API tests instead. The 390px phone and 820px tablet audits reported
  zero page-level horizontal overflow; inspected phone screenshots show the full card
  and a stacked, reachable decision drawer. Verifier-created login/session/auth/audit
  rows were scrubbed afterward.

### 3. Vendors & Catalog
- **Vendors ☑** — prototype-aligned responsive avatar list, authoritative status/KYC
  filters, report-backed KPI strip, five-tab detail drawer (Profile · Contacts · Bank &
  Compliance · Contracts & History · Performance), and new/edit form drawers. **Add Vendor**
  follows the console convention beside the page title; dismissing an edit drawer clears
  its local unsaved state and performs no mutation until **Save Changes** is pressed.
  **Contract/security decisions:** list payloads never contain contact, address, tax or
  bank fields; detail FLS strips all of those unless the caller holds
  `procurement.vendor.view_sensitive`; sensitive writes require that key in addition to
  the new `procurement.vendor.update`. Create always starts Active, not on hold, Low risk
  and KYC Pending, so a creator cannot self-verify a supplier. Code is trimmed/uppercased,
  case-insensitively unique per entity and immutable after creation; model-level
  normalization protects non-API ORM writes too. Tax identifiers use
  a private punctuation-insensitive canonical column with an entity-scoped conditional
  unique constraint. Account/category/tax references are resolved inside the selected
  entity and account types/postability are validated; text lengths, emails, enums and
  booleans are rejected before persistence when invalid. Spend and performance come from a
  vendor-specific `procurement.report.view` endpoint over posted invoices, real POs,
  posted GRNs and posted payment allocations; no quality grade, responsiveness score,
  compliance documents or manual assessment is invented. Contracts, POs and invoices
  retain their own view permissions in History. The prototype's “Blacklisted” state is
  rendered as the authoritative **On Hold**, and Export is omitted. A shared eligibility
  rule blocks inactive/on-hold/KYC-rejected vendors at direct PO, draft PO reassignment,
  quotation award and contract activation/renewal; payment retains its stricter Verified
  KYC rule and now locks the vendor master row while revalidating. Direct PO, quotation
  and contract services also reject cross-entity vendors and lock the vendor row while
  creating a commitment. Existing invoices and receipts remain processable so suspending
  a vendor does not erase an already-incurred liability. “Active POs” counts only approved
  orders with at least one unreceived line. Verification fixtures add master-only pending/
  rejected/inactive examples and one real contract without fabricating spend or payment
  history. Verified 2026-07-18: all 94 Procurement backend tests pass; Django and migration
  drift checks are green; the production frontend build passes; populated desktop list,
  all five detail tabs and create/edit drawers render with zero console/page errors; 390px
  phone and 820px tablet screenshots were inspected with zero page overflow; verification
  login rows were scrubbed. `vendors/`.
- **Categories ☑** — prototype-aligned three-level taxonomy tree with All / Active /
  Inactive filters, debounced search, linked-vendor counts, report-gated realised spend,
  three-tab detail drawer (Overview · Usage · Spend), and create/edit form drawers.
  **Hierarchy contract:** `VendorCategory.parent` is an optional same-entity self-FK.
  Level is derived from ancestry: roots are Level 1, their children Level 2, and
  grandchildren Level 3; users never type a level number. The backend rejects level-4
  creation, cycles, self/descendant parents, cross-entity parents, and re-parenting that
  would push any existing descendant below Level 3. Hierarchy mutations lock the entity's
  bounded category set so concurrent re-parenting cannot race those checks. Active
  categories require active parents, and an active parent cannot be deactivated until its
  active direct children are deactivated. The list and vendor CategoryPicker render the
  persisted hierarchy with indentation and explicit level/parent labels. Catalog items
  still have no category relation, so Usage does not invent item counts. Codes are
  trimmed/uppercased, immutable after
  creation, and case-insensitively unique per entity at both API and database boundaries.
  Default accounts are entity-scoped, active, postable EXPENSE accounts. Inactive
  categories remain visible on historical vendor links but cannot be assigned to another
  vendor or seed a new PO, quotation-award or contract default; unrelated edits preserve
  an existing inactive link. Updates require the dedicated
  `procurement.category.update`, not the broader view/create grants. Linked-vendor counts
  and posted-invoice spend explicitly constrain every join to the selected entity; no
  export is offered. Dismissing create/edit outside the drawer clears only local state and
  was request-monitored to emit zero POST/PATCH calls. Verification fixtures persist a
  populated Level 1 → Level 2 → Level 3 branch plus one inactive Level 2 category without
  fabricating transactions. Verified 2026-07-18:
  all 108 Procurement backend tests pass; Django, migration-drift and production frontend
  build checks are green; populated desktop list, all three detail tabs, and create/edit
  states rendered without console/page errors; inspected 390px phone and 820px tablet
  states show complete cards and drawers with zero page overflow; verifier login rows were
  scrubbed. `categories/`.
- **Catalog ☐** — catalog-item list (category, unit, price) · detail · create/edit
  drawer with category + vendor pickers. `catalog-items/`.

### 4. Sourcing
- **RFQs ☑ / Quotations ☑** — rebuilt and verified **together as one section** (one
  competitive-sourcing flow: issue → quote → submit → award; the RFQ drawer lists
  quotations, Compare awards them, award flips both documents). Contracts ships
  separately afterwards. **Resolved decisions (2026-07-20, approved):**
  - *Honest adaptations*: the prototype's invited-vendor list/count, category,
    budget estimate, warranty, spec compliance, vendor grade and free-text
    Evaluation/Recommendation have **no model backing and are not invented**.
    Real replacements: response count, requisition link, line specs, and — in
    Compare — only real criteria (total, `lead_time_days`, valid-until,
    submitted date, reference, status, per-`rfq_line` unit-price matrix, honest
    lowest-total highlight).
  - *Contracts*: split list vs detail serializers. RFQ list adds
    `response_count`/`line_count`/`requisition_number` annotations + `?q=`
    search; detail adds lines, quotations summary and an `activity` audit feed
    (invoice pattern). Quotation list adds `vendor_name`; detail adds lines,
    `awarded_po_number`, activity. New `rfqs/summary/` KPI endpoint (Draft ·
    Open · Responses in · Closing ≤7d) gated `procurement.rfq.view`.
  - *Lifecycle*: new `rfqs/<id>/close/` (ISSUED→CLOSED, no award) on the
    `.issue` key; close/cancel flip still-in-contention quotations to REJECTED
    (audited). Award row-locks RFQ+quotation (fixes a double-award race),
    rejects quotes past `valid_until`. `EXPIRED` is a server-computed
    `is_expired` display overlay, never a status rewrite (no scheduler).
  - *Draft editing*: PATCH for DRAFT RFQs/quotations only (fields + line
    replacement, re-price) behind new `procurement.rfq.update` /
    `procurement.quotation.update` keys.
  - *Eligibility*: `vendor_purchase_block_reason` now also gates quotation
    create/submit (was award-only); already-linked legacy vendors preserved.
  - *Validation hardening*: quantities positive/bounded; kobo strictly integer
    ≥0; text lengths; `response_due_date ≥ issue_date`, `valid_until ≥
    quote_date`; line expense accounts active postable EXPENSE in-entity; tax
    codes entity-scoped; quotation create requires an ISSUED same-entity RFQ
    and `rfq_line`s belonging to *that* RFQ (fixes a cross-RFQ line leak).
  - *Preservation*: submitted/awarded/rejected documents immutable; award still
    snapshots quoted prices/accounts onto the DRAFT PO; nothing rewrites
    requisitions/POs/journals.
  - *Seed*: `seed_procurement_demo` gains idempotent real-service fixtures — a
    draft RFQ, an issued RFQ with 3 competing submitted quotes, an awarded RFQ
    with its real draft PO + rejected siblings, and a cancelled RFQ.
  - *FE*: `sourcing.tsx` replaced by `sourcing/rfqs.tsx` +
    `sourcing/quotations.tsx` + a shared compare/status module (routes
    unchanged). Compare is a centered modal (prototype shows one) with
    per-column permission-gated Award. Email-to-vendors stays deferred; no
    Export anywhere.
  `rfqs/` (+detail/issue/cancel/close/summary/PATCH), `quotations/`
  (+detail/submit/award/PATCH).
  - **Invited vendors + budget estimate (2026-07-21 correction).** The first
    build wrongly dropped the prototype's **Invite Vendors** section and **Budget
    Estimate (₦)** field; both are now built end-to-end. New `RfqInvitation`
    model (`rfq` CASCADE FK, `vendor` PROTECT FK, `unique_together(rfq, vendor)`,
    index on `rfq`) — a pure addressee record with **no status field**:
    "responded" is *derived* (a quotation exists from that vendor on that RFQ).
    New `budget_estimate` MoneyField (nullable) on `RequestForQuotation`.
    Migration `0012_requestforquotation_budget_estimate_rfqinvitation`.
    **Product rules (approved):** (1) **Invited-only** — a vendor may submit a
    quotation against an RFQ *only if it holds an invitation on that RFQ*;
    enforced at quotation-create (400) and defensively in `submit_quotation`
    (422). (2) **Issue requires ≥1 invitation** as well as ≥1 line ("an RFQ must
    invite at least one vendor before it can be issued"). Invitations are set via
    `sourcing.set_rfq_invitations(rfq, vendors)` — draft-only, same-entity +
    purchase-eligible, de-duplicated, and it **refuses to drop a vendor that has
    already responded** (removing it would strand that bid's history). RFQ
    create/PATCH accept `invited_vendors` (codes or ids) + `budget_estimate`
    (strict integer kobo ≥0; float/negative rejected). RfqList adds
    `invited_count` (annotation) + `budget_estimate`; RfqDetail adds
    `budget_estimate` + `invitations[]` (`{vendor_id, vendor_code, vendor_name,
    responded, quotation_id, quotation_status, quotation_total}`, joined in Python
    over prefetched invitations+quotations — no N+1). No new permission keys
    (invitations ride `rfq.create`/`rfq.update`, quoting rides
    `quotation.create`). **FE:** the New/Edit RFQ drawer gained a **Budget
    estimate** `MoneyInput` and an **Invite vendors** chip editor (purchase-
    eligible `SearchSelect` → removable chips; a responded vendor's ✕ is disabled
    with a tooltip), and its footer is now **Save Draft / Create & Issue**
    (Create & Issue enabled only with ≥1 invited vendor AND ≥1 line, matching the
    backend). The RFQ drawer gained a **Vendors invited** tab (Responded/Awaited
    pill + quotation total) plus Budget/Invited overview fields; the list gained an
    **Invited** column. The New Quotation drawer's Vendor picker is now
    constrained to the selected RFQ's invited, not-yet-quoted vendors (honest with
    the invited-only rule). Seed extended idempotently: the issued demo RFQ invites
    the three quoting vendors **plus** a fourth (`SIDMACH`) that never responds (a
    real "Awaited" row) and carries a budget; awarded/draft/cancelled RFQs invite
    1–2 vendors; every RFQ is invited before it is issued.
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
The command is idempotent and creates three transactional vendors/categories plus
pending, rejected and inactive vendor-master fixtures, an active sample contract,
seven posted monthly vendor invoices, four purchase orders, partial/full goods receipts, a real
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
Dashboard, Requisitions, Purchase Orders, Goods Receipts, Vendor Invoices, Vendor
Payments are rebuilt and verified. Vendor Payments has real workflow, posting,
allocation and reversal contracts; focused backend tests, Django/migration checks,
the frontend production build, populated desktop drawer inspection, and phone/tablet
overflow verification are green. Approvals is rebuilt and verified with the entity-safe
shared-workflow adapter, Procurement-framed responsive list/drawer, focused security and
workflow regression tests, a clean frontend production build, Django/migration checks,
and populated desktop/phone/tablet visual proof. Vendors is now rebuilt and verified
with safe list/detail contracts, backend field-level security, entity-scoped uniqueness
and references, governance-aware commitment/payment locking, authoritative aggregates,
94 passing Procurement tests, a clean production build, and inspected desktop/phone/
tablet states with no overflow or runtime errors. Categories is now rebuilt and verified
as an entity-safe three-level hierarchy with derived depth, cycle-safe re-parenting,
governed inactive-category assignment, 108 passing Procurement tests, a clean production
build, and inspected desktop/phone/tablet list and drawer states.

Catalog is now rebuilt (FE) as a dedicated `vendors/catalog-tab.tsx` component replacing
the old inline stub in `vendors/index.tsx`: All/Active/Inactive tabs, debounced search,
category + preferred-vendor filters, prototype-aligned `DataTable` columns (Item/SKU,
Category, Unit, Standard price, Preferred vendor, Lead time, Stock*, Status) with phone
cards, a `DetailDrawer` with Overview / Vendor Pricing / Purchase History tabs (real
insights via `/catalog-items/{id}/insights/`, honest empty states — no fabricated pricing
or history), and a `FormDrawer` create/edit with immutable code, hierarchy-aware category,
`MoneyInput`, eligible-vendor/`AccountPicker`/`TaxCodePicker` defaults, and changed-fields-
only PATCH. Pickers now filter to purchasing-eligible vendors / active-postable accounts /
usable purchase-tax codes (keeping an already-linked ineligible value). Categories usage
tab now shows the real `catalog_item_count`. `?action=new` action-palette landing preserved.
Verified against the real backend (migration `0011` applied + `seed_procurement_demo`
extended with 4 catalog items): populated list, all three drawer tabs, edit form (Save
gated on dirty), categories no longer 500, zero console errors, no phone/tablet overflow.
`StatusPill` gained IN_STOCK/LOW_STOCK/OUT_OF_STOCK/NOT_TRACKED variants.

Backend follow-ups (separate repo, still uncommitted): (1) `makemigrations --check` reports
drift — migration `0011`'s catalog index name doesn't match the model Meta's auto-name
(wants a `0012` rename); align the name before the backend commit. (2) A pre-existing FE
build-breaker in `src/hooks/use-action-search.ts` (userId typed `number` passed to string
popularity helpers) was fixed here — unrelated to Catalog.

Sourcing (RFQs + Quotations) is now rebuilt and verified as one section. FE: `sourcing.tsx`
replaced by `sourcing/rfqs.tsx` + `sourcing/quotations.tsx` + `sourcing/shared.tsx`
(components: Field/ExpiredPill/ActivityFeed/Compare modal) + `sourcing/helpers.ts` (pure
tab/date/forbidden helpers, split out so shared.tsx stays component-only for Fast Refresh);
router points the two leaf routes at the two pages and the old single-component page is
deleted. RFQs: real summary KPI strip (Draft/Open/Responses in/Closing ≤7d), status tabs,
debounced search, `DataTable` with phone cards, `DetailDrawer` (Overview · Lines ·
Quotations · Activity), Issue/Close/Cancel footer actions, and a draft-only create/edit
`FormDrawer` with an approved-requisition prefill. Quotations: `Compare` + `New Quotation`
beside the heading, status tabs + RFQ/vendor filters + search, list with honest amber
`Expired` overlay pill (never replacing the persisted status), `DetailDrawer` (Overview ·
Line comparison with real sibling-lowest per RFQ line · Activity), Submit/Award footer,
awarded "Locked — awarded to <PO>" hint, and a draft-only create/edit drawer with an
ISSUED-only RfqPicker, purchase-eligible VendorPicker, MoneyInput priced rows and RFQ-line
prefill. The **Compare modal** is the deliberate improvement over the prototype: it drops
the prototype's invented warranty/spec-compliance/vendor-grade/recommendation and shows only
real recorded criteria (total with lowest-bid tag, lead time, valid-until with expiry flag,
submitted, reference, status) plus a per-RFQ-line unit-price matrix with per-line lowest
highlighted, an Award button per eligible column, and an explicit "no spec/warranty/grade in
the data" footer. Backend: split list/detail serializers with count/requisition annotations
and an audit `activity` feed; new `rfqs/summary/` KPI endpoint; new `close_rfq`
(ISSUED→CLOSED) and draft-only PATCH for RFQs and quotations behind new
`procurement.rfq.update` / `procurement.quotation.update` keys (registry now 58); award now
row-locks the quotation **and** its RFQ (closes the double-award race), rejects a
lapsed-validity award, and close/cancel reject the RFQ's live quotations (audited); quotation
create/submit/award all re-check vendor purchasing eligibility; quotation-line `rfq_line`
must belong to the referenced RFQ (cross-RFQ leak fixed); quantities are positive/bounded,
kobo strictly integer ≥0, dates order-checked, line accounts active-postable EXPENSE in
entity. Two new audit actions (`RFQ_CLOSED`, `QUOTATION_REJECTED`) → choices-only migration
`vs_finance/0008_alter_financeauditlog_action` (no schema change). `seed_procurement_demo`
gains idempotent real-service fixtures: a draft RFQ, an issued RFQ with 3 competing submitted
quotes, an awarded RFQ with its real draft PO + rejected sibling, and a cancelled RFQ.
Verified 2026-07-21 against the real CODEX backend: 126 Procurement tests pass (was 108 — adds
sourcing security/lifecycle/eligibility/award-idempotency coverage **and** the previously
deferred Catalog insights-permission/entity-scoping/code-immutability/validation coverage);
Django check + `makemigrations --check` clean; frontend production build + changed-file lint
clean. Populated desktop RFQ/quotation lists, RFQ drawer (all 4 tabs), quotation drawer (line
comparison with real lowest), the Compare modal on the 3-bid RFQ, and both create drawers were
driven with zero console errors; outside-click dismissal fired **zero** create/update
mutations (request-monitored); 390px phone + 820px tablet audit reported zero page overflow
with genuine card layouts. Verifier login/audit rows scrubbed. The unrelated `vs_audit`
rename remains untouched and is not part of these commits.

**Sourcing correction (2026-07-21) — invited vendors + budget estimate.** The section
above shipped without the prototype's invited-vendor list and budget-estimate field; both
are now added end-to-end (see the §4 "Invited vendors + budget estimate" note for the full
contract). New `RfqInvitation` model + `budget_estimate` MoneyField (migration `0012`),
invited-only quotation enforcement, and the issue-requires-invitation rule. Backend: 134
`vs_procurement` tests pass (was 126 — adds invite validation/dedupe, issue-requires-
invitation, invited-only create + defensive submit, PATCH replace + responded-removal
protection, budget-estimate bounds, and RfqDetail responded-derivation + invited_count
entity-scoping); `manage.py check` and `makemigrations --check` clean. Frontend: production
build + changed-file ESLint clean. Not yet re-verified with `/verify-design` or the mobile
audit (orchestrator runs those). No new permission keys; `PERMISSIONS_AUDIT.md` unchanged.
