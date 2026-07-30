# Permission Protection Audit

Maps every UI element that is gated behind a permission check â sidebar items, page buttons, table actions â and the permission constant that guards it. Use this to verify what's working, what's missing, and what's not wired up yet.

Permission constants live in `src/permissions/index.ts`.  
The actual backend keys follow the pattern `module.resource.action`.

---

## 1. Sidebar Navigation (`src/components/app-sidebar.tsx`)

Parent items are hidden if the user lacks the listed permission. Sub-items inherit the parent's visibility unless they declare their own check.

| Menu Item | Sub-item | Permission Constant | Notes |
|---|---|---|---|
| Home | â | _(none â always visible)_ | |
| School Management | â | `P.BROWSE_SCHOOLS` | |
| Team Management | â | `P.ACCESS_TEAM_PANEL` | |
| Organogram | Org Chart | `P.VIEW_ORGANOGRAM` | parent group gated by this key |
| Organogram | Manage | `P.MANAGE_ORGANOGRAM` | own check via `hasPermission`; sub-item hidden without manage; backend enforces writes |
| Tasks | â | _(none â always visible)_ | ToDo â Org Accountability. Gated to CX staff at the API (`IsAuthenticatedAndActive & IsVisionStaff`); visibility + assignment bounded by the organogram server-side, so the nav carries no RBAC gate. Backend keys `todo.task.view/manage/assign` exist for future fine-grained wiring but are not yet enforced |
| Roles | Platform Roles | `P.VIEW_ROLES` | |
| Roles | User Assignments | `P.VIEW_ROLES` | inherits parent |
| Roles | Change Requests | `P.MODIFY_ROLE` | own check via `hasPermission`; nav enabled 2026-06-11 (was a disabled placeholder â page and backend endpoints are live) |
| Roles | Transfer Super Admin | `P.TRANSFER_SUPER_ADMIN` | own check via `hasPermission`; only super admin sees it; backend further restricts execution to the active super admin |
| Permissions | All Permissions | `P.VIEW_PERMISSIONS` | |
| Permissions | Modules | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Resources | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Actions | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Dependencies | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Permission Groups | `P.VIEW_PERMISSIONS` | inherits parent |
| Export | Exports | `P.VIEW_SAVED_EXPORTS` | own check via `hasPermission`; the recipes list + the builder |
| Export | Files | `P.VIEW_EXPORT_RUNS` | own check via `hasPermission`; Export Centre run/file list. Overview arrives later; Schedules are not in the MVP |
| Export | View Queues | _(none â always visible)_ | own queues open to any authenticated user (`IsAuthenticatedAndActive`); the All Queues scope is gated server-side (CX staff with `xvs_super_admin`/`xvs_platform_admin` role) and the Mine/All toggle only renders when the summary's `can_view_all` is true |
| Data Imports | Import Batches | `P.VIEW_IMPORT_BATCHES` | parent visible when user has either batch or template view; sub-item hidden without this permission |
| Data Imports | Import Templates | `P.VIEW_IMPORT_TEMPLATES` | sub-item hidden without this permission; create still gated by `P.CREATE_IMPORT_TEMPLATE` |
| Workflow | Approvals | _(none â always visible)_ | backend gates pending queue at `IsAuthenticatedAndActive` |
| Workflow | My Submissions | _(none â always visible)_ | requester's own submissions |
| Workflow | Delegations | _(none â always visible)_ | own delegations; admins see all (backend-enforced) |
| Workflow | All Instances | `P.VIEW_WORKFLOW_INSTANCES` | own check via `hasPermission`; admin monitoring |
| Workflow | Team Load | `P.VIEW_WORKFLOW_INSTANCES` | own check; same key as All Instances |
| Workflow | Templates | `P.VIEW_WORKFLOW_TEMPLATES` | own check via `hasPermission` |
| Finance | â | _(module access: any `finance.*` or `payments.*` key)_ | gated via `hasModuleAccess("finance.", "payments.")`, **not** a single `P.*` constant â a user with only `finance.report.view` should still reach the console. Opens its own sub-navigated console (`ConsoleShell` + `financeNav`); each area's sub-nav item is gated by the backend key prefixes its screens call |
| Procurement | â | _(module access: any `procurement.*` key)_ | gated via `hasModuleAccess("procurement.")`. Opens its own console (`ConsoleShell` + `procurementNav`); area sub-nav gated by key prefixes |
| Notifications | Inbox | _(none — always visible)_ | personal in-app feed (`/notify/`, recipient-scoped server-side) |
| Notifications | Administration | any of `P.AUDIT_NOTIFICATION_ACTIVITY` `P.ENFORCE_NOTIFICATION_SETTINGS` `P.CONFIGURE_NOTIFICATION_TEMPLATES` | child spread in only for holders (collapsible group appears); flat single item otherwise. Page at `/notifications/admin` re-checks and falls back to `PageAccessDenied` |
| Settings | — | any of `P.VIEW_CONFIG_VALUES` `P.VIEW_CONFIG_DEFINITIONS` `P.VIEW_CAPABILITIES` `P.VIEW_ENTITLEMENTS` `P.VIEW_CONFIG_OVERRIDES` `P.VIEW_CONFIG_AUDIT` | `permissionMode: "any"`; the page shows only the tabs the user can read and falls back to `PageAccessDenied` with none (direct-URL case) |
| Support | — | _(none — always visible)_ | anyone authenticated may file a ticket (backend keeps creation keyless; ticket visibility is participant/school-scoped server-side). Staff actions gate per-control on the detail page (see §2) |
| Health | Command Center / Uptime / API & Endpoints / Jobs & Queues / Incidents & Alerts / Tenant Health / SLOs | `P.VIEW_HEALTH` | one gate for the whole group; children inherit. Backend enforces `platform.health.view` on every read and `platform.health.manage` on writes (method-based) |

> The Workflow parent group is always visible (permission `null`) because Approvals/Submissions/Delegations are open to every authenticated user. Admin-only children (All Instances, Team Load, Templates) are spread in by their own permission check.

> **Finance & Procurement consoles** use module-prefix gating (`hasModuleAccess` in `src/hooks/use-permissions.ts`) for whole-console visibility, and per-area sub-nav gating by backend key prefix (see `financeNav` / `procurementNav`). Individual control gating uses `P.FIN_*` / `P.PROC_*` / `P.PAY_*` constants â the full key set (finance 99, procurement 57, payments 13) is registered in `src/permissions/index.ts`, each matching an `rbac_permission` on a backend view. Operations â **Bank Accounts**: **New bank account** is gated by `P.FIN_CREATE_BANK_ACCOUNT`; the detail-drawer **Settings â Save** by `P.FIN_UPDATE_BANK_ACCOUNT` (`finance.bankaccount.update`, on `PATCH /finance/bank-accounts/<id>/`); **Import statement** by `P.FIN_IMPORT_BANK` and **Auto-reconcile** by `P.FIN_RECONCILE_BANK`. The account number stays FLS-stripped to `â¢â¢â¢â¢` unless the caller holds `P.FIN_VIEW_BANK_SENSITIVE`. Operations â **Bank Reconciliation** (nav gated by prefix `finance.bankaccount.`): the workbench's **Match / Add adjusting entry / Auto-match / Complete reconciliation** are all gated by `P.FIN_RECONCILE_BANK` (`finance.bankaccount.reconcile`); the unmatched book-lines read is `finance.bankaccount.view`. No new permission keys â reuses view/reconcile. Operations â **Payroll** (tabs Payroll runs Â· Employee salaries Â· Salary structures Â· Payslips Â· Statutory returns): runs/roster/structures/payslips/statutory reads gate on `P.FIN_VIEW_PAYROLL`; **New run / Generate** on `P.FIN_CREATE_PAYROLL`; the roster + salary-structure CRUD (**Add-employee / Edit-employee / delete**, **New-structure / Edit-structure / delete**) now gate on the dedicated split resource `finance.salary.{create,update,delete}` (`P.FIN_CREATE_SALARY` 203002 / `P.FIN_UPDATE_SALARY` 203003 / `P.FIN_DELETE_SALARY` 203004, all SENSITIVE), **not** the payrollrun keys; **Post run** on `P.FIN_POST_PAYROLL`; **Pay net** on `P.FIN_PAY_PAYROLL`. Per-employee figures (payslip lines, the `components` breakdown snapshot **and** the employee-salary roster amounts) are FLS-stripped to `â¢â¢â¢â¢` unless the caller holds `P.FIN_VIEW_PAYROLL_SENSITIVE` (`finance.payrollrun.view_sensitive`); the **Statutory returns** PAYE/pension schedule print actions are disabled (with tooltip) when the run's lines are stripped, since a filing schedule needs per-employee figures. The Statutory drawer's **remittance status** reads the trial balance (`GET /finance/reports/trial-balance/`, gated by its own reports key) to show the real outstanding PAYE/pension payable balance; if that read is forbidden/unloaded it shows `â` (never a false "Settled"). The employee-salary CRUD and salary-structure CRUD (`/finance/salary-structures/`) gate on the split `finance.salary.*` resource (backend `EmployeeSalary*`/`SalaryStructure*` views); **generate-from-roster** still rides `finance.payrollrun.create`. Pay-figure FLS visibility stays keyed on `finance.payrollrun.view_sensitive` (NOT `finance.salary.*`); salary-structure rows are config (not individual pay), so they're not FLS-stripped. Operations â **Budgets & Forecasts** (`/finance/budgets/budgets`): the list, the variance **heatmap** (`GET /budgets/<id>/heatmap/`) and the per-account **variance** (`GET /budgets/<id>/variance/`) read on `finance.budget.view`; **New budget** (create-with-lines) gates on `P.FIN_CREATE_BUDGET`; the draft editor's writes â rename (`PATCH /budgets/<id>/`), replace lines (`PUT /budgets/<id>/lines/`), add one (`POST â¦/lines/`), delete one (`DELETE â¦/lines/<id>/`) â all gate on `P.FIN_EDIT_BUDGET` and are draft-only (the backend services refuse a locked budget; the editor only opens for drafts); **Approve & lock** on `P.FIN_APPROVE_BUDGET`; the draft editor's **Delete** (`DELETE /budgets/<id>/`, draft-only — the backend refuses an approved budget) on the new key `P.FIN_DELETE_BUDGET` (`finance.budget.delete`, 202304, SENSITIVE). Budget lines are income/expense GLs only (backend-enforced). The fiscal-year dropdown reads `GET /finance/fiscal-years/` (gated `finance.period.view`). No new keys; budget figures are GL aggregates (not per-person), so nothing is FLS-stripped. Operations â **Fixed Assets** (`/finance/budgets/assets`): the register, KPIs, filters and the depreciation **preview** (`GET /fixed-assets/run-depreciation/`) read on `finance.fixedasset.view`; **Add asset** gates on `P.FIN_CREATE_FIXED_ASSET`; **Acquire** on `P.FIN_ACQUIRE_FIXED_ASSET`; **Depreciate-to-date** (per-asset) and **Run depreciation** (period-wide, `POST /fixed-assets/run-depreciation/`) on `P.FIN_DEPRECIATE_FIXED_ASSET`; **Dispose** (`POST /fixed-assets/<id>/dispose/`) on the new key `P.FIN_DISPOSE_FIXED_ASSET` (`finance.fixedasset.dispose`, code 202441, CRITICAL â seeded via `seed_finance_permissions`, granted to the platform admin roles). Asset figures are GL aggregates, not FLS-stripped. Operations â **Tax Remittance** (`/finance/budgets/tax`): the filings list, KPIs and printable filing pack read on `finance.tax.view`; **New obligation** (`POST /finance/tax-obligations/`) gates on `P.FIN_MANAGE_TAX` (`finance.tax.manage`); **New filing** (`POST /finance/tax-filings/`, prepares/accrues from the GL) and **Mark-as-filed** (`POST â¦/file/`) on `P.FIN_FILE_TAX`; the drawer's new **Un-file** action (`POST .../unfile/`, reverts FILED->DRAFT and reverses the netting/penalty journal; only offered while `amount_paid == 0`, and the backend refuses once any remittance is recorded) also reuses `P.FIN_FILE_TAX`; **Pay/remit** (`POST â¦/pay/`, Dr liability Cr bank) on `P.FIN_PAY_TAX`. No new keys; tax figures are GL aggregates, not FLS-stripped. Collections â **Gateway** (`/finance/collections`): the checkout list, KPIs, filters and the detail drawer read on `P.PAY_VIEW_COLLECTIONS` (`payments.collection.view`, on `GET /payments/collections/`); **New checkout** and the drawer's **Re-verify**/**Copy link** gate on `P.PAY_CREATE_COLLECTION` (`payments.collection.create`, on `POST /payments/collections/` and the `?verify=1` confirm). **Export** is a client-side CSV of already-loaded rows (no extra endpoint). No new keys; the FLS-sensitive funding-account details live on the Virtual Accounts view, not here. Payments â **Payouts** (`/finance/payments/payouts`): the list, KPIs, filters and the detail drawer read on `P.PAY_VIEW_PAYOUTS` (`payments.payout.view`, on `GET /payments/payouts/`); **New payout** (pays a vendor, `POST /payments/payouts/`) gates on `P.PAY_CREATE_PAYOUT` (`payments.payout.create`). Beneficiary name/account stay **FLS-stripped to â¢â¢â¢â¢** unless the caller holds `P.PAY_VIEW_PAYOUT_SENSITIVE` (`payments.payout.view_sensitive`). **Bulk disbursement** is a route link to Batches (no extra grant); **Export** is a client-side CSV of loaded rows. No new permission keys. Payments â **Batches** (`/finance/payments/batches`): the batch list, KPIs and the detail drawer read on `P.PAY_VIEW_PAYOUTS` (`payments.payout.view`, on `GET /payments/payout-batches/` + `/<id>/`); **Build batch** (`POST /payments/payout-batches/`) and the detail drawer's **Submit batch** (`POST â¦/<id>/`) gate on `P.PAY_CREATE_PAYOUT` (`payments.payout.create`). **Maker-checker (opt-in by template):** when a `payments.payout_batch` vs_workflow template covers the batch's (school) scope, direct submit is refused (400) and the detail drawer's **Submit for approval** (`POST /payout-batches/<id>/submit-for-approval/`) routes it via the workflow engine — gated on the new key `P.PAY_SUBMIT_PAYOUT_BATCH` (`payments.payout_batch.submit`, 800530, SENSITIVE). The **approve** step happens in the workflow approvals inbox (`P.PAY_APPROVE_PAYOUT_BATCH` 800505 / `P.PAY_APPROVE_PAYOUT_BATCH_HIGH_VALUE` 800544, both CRITICAL), not on the batches screen. While `approval_required` isn't yet on the batch serializer the screen offers both submit actions; a gated batch created with `submit:true` stays DRAFT (the build drawer reports honestly, no longer claims "submitted"). Beneficiary details are FLS-masked to â¢â¢â¢â¢ without `P.PAY_VIEW_PAYOUT_SENSITIVE`. **Bank file** is a client CSV; **Upload CSV** is disabled (deferred). No new keys. Payments â **Settlement** (`/finance/payments/settlement`): the whole read-only reconciliation (KPIs + Matched/Unsettled/Unmatched tabs) reads on `payments.report.view` (`GET /payments/reports/settlement-reconciliation/`); **Re-run match** is a refetch (no write), **Export** a client CSV. It surfaces PSP fees as an observation but **posts nothing** â the authoritative book-vs-bank close stays in Bank Reconciliation (`finance.bankaccount.reconcile`). No new keys. Payments â **Transactions Log** (`/finance/payments/transactions`): a unified read-only feed of Collections + Payouts, so it reads on **both** `P.PAY_VIEW_COLLECTIONS` (`payments.collection.view`) and `P.PAY_VIEW_PAYOUTS` (`payments.payout.view`) â the two list endpoints it merges client-side; the row drawer shows only already-loaded data. Payout beneficiary details stay FLS-masked without `P.PAY_VIEW_PAYOUT_SENSITIVE`. **Export** is a client CSV. No new keys. **(Pagination update:)** all four gateway tables now paginate (page size 25); collections/payouts/payout-batches each gained a `/summary/` endpoint (same `payments.<resource>.view` key) for entity-wide header KPIs, and collections/payouts gained server-side status-group + provider filters. The Transactions Log is now backed by a new unified **movements** feed (`GET /payments/movements/` + `/summary/`, gated `payments.report.view`) â a paginated cross-model union of collections + payouts, FLS-masking payout beneficiary name/account without `P.PAY_VIEW_PAYOUT_SENSITIVE`. No new keys. Payments â **Virtual Accounts**: the list is gated by `P.PAY_VIEW_VIRTUAL_ACCOUNTS` (`payments.virtual_account.view`, enforced on `GET /payments/virtual-accounts/`); **New virtual account** by `P.PAY_CREATE_VIRTUAL_ACCOUNT`; the detail-drawer **Deactivate/Reactivate** by `P.PAY_MANAGE_VIRTUAL_ACCOUNT` (`payments.virtual_account.manage`, on `PATCH /payments/virtual-accounts/<id>/`). The funding account number/name stay FLS-stripped to `â¢â¢â¢â¢` unless the caller holds `P.PAY_VIEW_VA_SENSITIVE` (`payments.virtual_account.view_sensitive`). Receivables â **Fee Structures**: **New structure** is gated by `P.FIN_CREATE_FEE_STRUCTURE` and the detail-drawer **Edit** by `P.FIN_EDIT_FEE_STRUCTURE` (`finance.feestructure.edit`, enforced on `PATCH /finance/fee-structures/<id>/`); **Generate invoices** by `P.FIN_GENERATE_FEE_STRUCTURE` and additionally disabled in the UI for non-`CUSTOMER` `applies_to` (the backend also 400s a non-customer generate). Receivables â Customer Invoices: **New invoice** is gated by `P.FIN_CREATE_INVOICE` (`finance.invoice.create`, also enforced on `POST /finance/invoices/`) and **Batch generate** by `P.FIN_GENERATE_FEE_STRUCTURE`; the write-off action by `P.FIN_WRITE_OFF_INVOICE`. Receivables â **Refunds & Write-offs** nav is gated by prefixes `finance.refund.` **and** `finance.invoice.writeoff` (so a write-off-only user can reach it); inside, the New-action **Write off to expense** toggle is gated by `P.FIN_WRITE_OFF_INVOICE` and refunds by `P.FIN_CREATE_REFUND`/`P.FIN_POST_REFUND`. Its unified refunds + write-offs list reads `GET /finance/ar-adjustments/` (gated `finance.refund.view`; write-off rows sourced from the finance audit log). Reports & Close â **Trial Balance** (`/finance/reports/trial-balance`): the report + its CSV/XLSX/PDF export read on `finance.report.view` (`GET /finance/reports/trial-balance/`, `?export=` for the file); the period dropdown reads `GET /finance/periods/` (gated `finance.period.view`); the **Compare to prior period** toggle issues a *second* `finance.report.view` read for the previous fiscal period. No new keys; figures are GL aggregates, not FLS-stripped. Reports & Close -> **Fiscal Periods** (the period strip + close drawer): the strip/checklist read on `finance.period.view`; **Soft close / Run close steps** gate on `P.FIN_CLOSE_PERIOD`; the drawer's new **Re-open** (`POST /periods/<id>/reopen/`, CLOSED/SOFT_CLOSED -> OPEN; a LOCKED period can't be re-opened) on the new key `P.FIN_REOPEN_PERIOD` (`finance.period.reopen`, 200342, CRITICAL) and **Lock period** (`POST /periods/<id>/lock/`, CLOSED -> LOCKED, irreversible) on `P.FIN_LOCK_PERIOD` (`finance.period.lock`, 200343, CRITICAL). The fiscal-year summary's **Close year** (`POST /fiscal-years/<id>/close/`, posts the year-end closing entry — zeroes every P&L account, rolls net profit/loss into Retained Earnings 3200, seals the FY) reuses `P.FIN_CLOSE_PERIOD` (no new key); shown only while the FY status is OPEN, and sends `force` when periods are still open (surfaced in the confirm copy). Reports & Close â **Cost & Dimension Analysis** (`/finance/reports/analytics`): the slice + CSV/XLSX/PDF export read on `finance.report.view` (`GET /finance/reports/analytics-slice/?axis=cost_center|<DIM>`); the axis dropdown lists cost centre + active dimensions (`GET /finance/dimensions/`, `finance.dimension.view`). No new keys. Ledger & Setup â **Dimensions** (`/finance/setup/dimensions`, nav gated by prefix `finance.dimension.`): the list reads `finance.dimension.view`; **New/Edit dimension** (upsert, `POST /finance/dimensions/`) gates on `P.FIN_CREATE_DIMENSION` (`finance.dimension.create`). The **New journal entry** drawer's optional per-line cost-centre + dimension values post through `finance.directentry.post` (no extra key); the journal-detail Dimensions column is read-only. Receivables â **Customers / Payers** and **Receipts & Allocation** now paginate (`XVSPagination`); their header KPIs + status/method tab counts read dedicated summaries (`GET /finance/customers/summary/` Â· `/finance/payments/summary/`, gated `finance.customer.view` Â· `finance.payment.view`); all filters (search, status, method) are server-side. The allocation drawer's **oldest/largest-first** choice rides `allocation_strategy` on the existing receipt/allocate endpoints. No new keys for any of these. Operations → **Petty Cash**: the fund and its vouchers are now split RBAC resources. Fund reads gate on `finance.pettycash.view`; **Establish float** on `P.FIN_ESTABLISH_PETTY_CASH` (`finance.pettycash.establish`, 202040) and **Replenish** on `P.FIN_REPLENISH_PETTY_CASH`; fund edit on `P.FIN_UPDATE_PETTY_CASH` (`finance.pettycash.update`, 202003). Voucher reads gate on `finance.pettycashvoucher.view`; **New voucher** on `P.FIN_CREATE_PETTY_CASH_VOUCHER` (`finance.pettycashvoucher.create`, 202902); the voucher-row **Post**, the New-voucher **Save & post**, and the new **Void** action (`POST /petty-cash-vouchers/<id>/void/`, reverses the journal + returns the cash + CANCELLED) all on `P.FIN_POST_PETTY_CASH_VOUCHER` (`finance.pettycashvoucher.post`, 202913). The old `finance.pettycash.{manage,post}` keys are deprecated orphans (constants kept, no longer gate anything). Seed `seed_finance_permissions` + apply migration 0022.)

> **My Security** moved out of the sidebar into the header avatar menu (see Â§1a). The sidebar footer **Logout** also moved there.

---

## 1a. Header Avatar Menu (`src/components/layout/dashboard-layout.tsx`)

The top-right avatar opens a dropdown. All items are visible to every authenticated user (no permission gating â they are self-service).

| Item | Destination | Permission Constant |
|---|---|---|
| My Profile | `/me/profile` | _(none â own profile; backend `â¦/me/`)_ |
| My Security | `/me/security` | _(none â own security)_ |
| Logout | â | _(none)_ |

---

## 2. Page-level Buttons & Actions

> Category master editing added `procurement.category.update` in July 2026; the Procurement registry then contained 56 keys. The Sourcing rebuild (July 2026) added `procurement.rfq.update` and `procurement.quotation.update` for draft RFQ/quotation editing, bringing the Procurement registry to 58 keys.

### Procurement → Vendors

| Element | Type | Permission Constant |
|---|---|---|
| Vendor list and detail | backend view + route visibility | `P.PROC_VIEW_VENDORS` (`procurement.vendor.view`, `700201`) |
| Add Vendor | create drawer | `P.PROC_CREATE_VENDOR` (`procurement.vendor.create`, `700202`) |
| Edit Vendor | detail-drawer action | `P.PROC_UPDATE_VENDOR` (`procurement.vendor.update`, `700203`) |
| Contact, address, tax and bank fields | backend FLS + form sections | `P.PROC_VIEW_VENDOR_SENSITIVE` (`procurement.vendor.view_sensitive`, `700239`) |
| Spend/performance KPIs and tab | report reads | `P.PROC_VIEW_PROC_REPORTS` (`procurement.report.view`, `701401`) |

Sensitive vendor fields are absent from list responses and are stripped from detail responses without the exact FLS grant. Updating them requires both `vendor.update` and `vendor.view_sensitive`; frontend hiding is only a convenience. Contracts, POs, and invoices shown in Vendor history retain their own resource-view permissions.

### Procurement → Categories

| Element | Type | Permission Constant |
|---|---|---|
| Category list and detail | backend view + route visibility | `P.PROC_VIEW_CATEGORIES` (`procurement.category.view`, `700101`) |
| New Category | create drawer | `P.PROC_CREATE_CATEGORY` (`procurement.category.create`, `700102`) |
| Edit Category | detail-drawer action | `P.PROC_UPDATE_CATEGORY` (`procurement.category.update`, `700103`) |
| Spend MTD and Spend tab | aggregate report read | `P.PROC_VIEW_PROC_REPORTS` (`procurement.report.view`, `701401`) |

The backend independently scopes category rows, account references, linked-vendor counts,
and posted-invoice spend to the selected entity. Update is a distinct grant; hiding the
button is only a UI convenience. Inactive categories remain readable for history but are
excluded from new assignments and future purchasing defaults. Parent changes use the same
update grant and enforce same-entity ancestry, cycle prevention, active-parent governance,
and a maximum of three derived levels on the backend.

### Procurement → Sourcing (RFQs)

| Element | Type | Permission Constant |
|---|---|---|
| RFQ list, detail and summary KPIs | backend view + route visibility | `P.PROC_VIEW_RFQS` (`procurement.rfq.view`, `700601`) |
| New RFQ | create drawer | `P.PROC_CREATE_RFQ` (`procurement.rfq.create`, `700602`) |
| Edit RFQ (draft only) | detail-drawer action | `P.PROC_UPDATE_RFQ` (`procurement.rfq.update`, `700603`) |
| Issue / Close / Cancel RFQ | lifecycle actions | `P.PROC_ISSUE_RFQ` (`procurement.rfq.issue`, `700604`) |

Edit is exposed only for `DRAFT` RFQs (the backend refuses a non-draft PATCH). Close and
Cancel both reject the RFQ's still-in-contention quotations; Issue/Close/Cancel share the
`rfq.issue` grant. Every read and write is entity-scoped by `resolve_entity`.

### Procurement → Sourcing (Quotations)

| Element | Type | Permission Constant |
|---|---|---|
| Quotation list, detail and Compare | backend view + route visibility | `P.PROC_VIEW_QUOTATIONS` (`procurement.quotation.view`, `700701`) |
| New Quotation | create drawer | `P.PROC_CREATE_QUOTATION` (`procurement.quotation.create`, `700702`) |
| Edit Quotation (draft only) | detail-drawer action | `P.PROC_UPDATE_QUOTATION` (`procurement.quotation.update`, `700703`) |
| Submit Quotation | approval-into-contention action | `P.PROC_SUBMIT_QUOTATION` (`procurement.quotation.submit`, `700704`) |
| Award Quotation → draft PO | award action (list, drawer and Compare) | `P.PROC_AWARD_QUOTATION` (`procurement.quotation.award`, `700705`) |

Edit is draft-only. Quotation create/submit/award all re-check vendor purchasing
eligibility (active, not on hold, KYC not rejected); award additionally locks the
quotation and its RFQ, rejects a lapsed-validity bid, builds the draft PO from the quoted
lines and rejects the losing bids. Awarding across entities or from an ineligible vendor is
refused on the backend regardless of the frontend gate.

### Procurement → Sourcing (Contracts)

| Element | Type | Permission Constant |
|---|---|---|
| Contract list, detail, summary KPIs and renewal radar | backend view + route visibility | `P.PROC_VIEW_CONTRACTS` (`procurement.contract.view`, `700401`) |
| New contract / Save draft | create drawer | `P.PROC_CREATE_CONTRACT` (`procurement.contract.create`, `700402`) |
| Edit contract (draft/active) · Complete milestone | detail-drawer actions | `P.PROC_UPDATE_CONTRACT` (`procurement.contract.update`, `700403`) |
| Activate / Create & activate | lifecycle action | `P.PROC_ACTIVATE_CONTRACT` (`procurement.contract.activate`, `700427`) |
| Renew | lifecycle action | `P.PROC_RENEW_CONTRACT` (`procurement.contract.renew`, `700434`) |
| Terminate | lifecycle action | `P.PROC_TERMINATE_CONTRACT` (`procurement.contract.terminate`, `700435`) |
| Linked POs tab | separate backend read | `procurement.purchase_order.view` (`700301`) |

The contract reference is auto-generated server-side (sequential per entity). Edit is
refused on terminal contracts (expired/terminated/renewed) and a milestone that has already
responded/completed cannot be removed. The **Linked POs** tab is gated on the *purchase-order*
view key, not the contract key, so a user who can see the contract but not POs gets a forbidden
panel there. It returns explicit call-offs (POs whose `contract` FK points at this contract,
tagged `linked`) first, then same-vendor **unlinked** POs inside the term (tagged `association`);
overlapping contracts therefore no longer share the same POs. The **"Against contract"** call-off
link on a PO is set/cleared through the PO create/edit flow, so it is gated by
`procurement.purchase_order.create` / `.update` (a PO may only link to its own vendor's ACTIVE
contract — cross-vendor/non-ACTIVE rejected on the backend). The New-Contract **duplicate-type
warning** is a client-side, non-blocking advisory only (multiple contracts per vendor are valid);
it enforces nothing. Summary KPIs, list rows and the linked-POs join are all constrained to the
resolved entity; every lifecycle transition re-validates entity scope and (for activate/renew)
vendor purchasing-eligibility on the backend. No Export control. No new permission keys were added
for Contracts or for the PO contract link — all reuse existing contract / purchase-order keys.

### Procurement → Inventory (Stock Items & Movements)

| Element | Type | Permission Constant |
|---|---|---|
| Stock Items list, detail, KPI summary; Movements ledger | backend view + route visibility | `P.PROC_VIEW_STOCK` (`procurement.stock.view`, `701301`) |
| New stock item · Edit stock item | create/edit drawer | `P.PROC_MANAGE_STOCK` (`procurement.stock.manage`, `701308`) |
| Issue stock (Dr expense · Cr inventory) | detail-drawer posting action | `P.PROC_ISSUE_STOCK` (`procurement.stock.issue`, `701333`) |
| Adjust stock (write-up / shrinkage) | detail-drawer posting action | `P.PROC_ADJUST_STOCK` (`procurement.stock.adjust`, `701337`) |

The new `GET /procurement/stock-items/summary/` KPI aggregate (items tracked / low / out /
total value) is gated on the **existing** `procurement.stock.view` key — no new key. The item
`code` is normalised (trim + upper) and **immutable** after create; `inventory_account` must be
an active, postable **ASSET** account and `default_expense_account` / issue / adjustment accounts
active, postable **EXPENSE**, all resolved inside the selected entity. Issue rejects an over-issue
and posts at moving-average cost; Adjust guards a decrease against on-hand and posts the value
delta — both write a **real** journal under row locks and never drive on-hand or value negative.
`on_hand_qty` / `stock_value` are ledger-owned and never patchable. Movements are an immutable
read-only ledger (no create/edit) — receipts originate from GRN posting, issues/adjustments from
these actions. Every read and write is entity-scoped by `resolve_entity`. No Export control. **No
new permission keys were added for Inventory** — all reuse the existing `procurement.stock.*` set.

### Procurement → Purchase Orders

| Element | Type | Permission Constant |
|---|---|---|
| New Purchase Order / Save Draft | create drawer | `P.PROC_CREATE_PURCHASE_ORDER` |
| Edit draft order terms | detail drawer | `P.PROC_UPDATE_PURCHASE_ORDER` (`procurement.purchase_order.update`, `700803`) |
| Create & Submit / Submit for Approval | approval action | `P.PROC_SUBMIT_PURCHASE_ORDER` |

Pending-approval orders stay locked so a reviewer cannot approve values that changed during the active workflow.

### Procurement → Goods Receipts

| Element | Type | Permission Constant |
|---|---|---|
| New Goods Receipt / Save Draft | create drawer | `P.PROC_CREATE_GOODS_RECEIPT` |
| Edit draft receipt | detail drawer | `P.PROC_UPDATE_GOODS_RECEIPT` (`procurement.goods_receipt.update`, `700903`) |
| Receive Remaining | creates the next receipt for a posted partial | `P.PROC_CREATE_GOODS_RECEIPT` |
| Create & Post / Post Receipt | posting action | `P.PROC_POST_GOODS_RECEIPT` |

Posted receipts are immutable because they have already advanced PO quantities and created a journal; only `DRAFT` receipts expose Edit.

### Procurement → Vendor Invoices

| Element | Type | Permission Constant |
|---|---|---|
| Record Invoice / Save Draft | create drawer | `P.PROC_CREATE_VENDOR_INVOICE` |
| Edit unsubmitted/rejected draft | detail drawer | `P.PROC_UPDATE_VENDOR_INVOICE` (`procurement.vendor_invoice.update`, `701003`) |
| Run Match | 3-way match action | `P.PROC_MATCH_VENDOR_INVOICE` |
| Create & Submit / Submit for Approval | workflow submission | `P.PROC_SUBMIT_VENDOR_INVOICE` |
| Post Invoice | AP posting action | `P.PROC_POST_VENDOR_INVOICE` |

Pending, approved and posted invoices are locked. The backend independently enforces draft-only edits and requires completed workflow approval before posting.

### Procurement → Vendor Payments

| Element | Type | Permission Constant |
|---|---|---|
| New Payment / Save Draft | create drawer | `P.PROC_CREATE_VENDOR_PAYMENT` |
| Edit unsubmitted/rejected draft | detail drawer | `P.PROC_UPDATE_VENDOR_PAYMENT` (`procurement.vendor_payment.update`, `701103`) |
| Create & Submit / Submit for Approval | workflow submission | `P.PROC_SUBMIT_VENDOR_PAYMENT` (`procurement.vendor_payment.submit`, `701130`) |
| Post Payment | AP/bank posting action | `P.PROC_POST_VENDOR_PAYMENT` |
| Cancel | non-pending unposted lifecycle action | `P.PROC_CANCEL_VENDOR_PAYMENT` (`procurement.vendor_payment.cancel`, `701128`) |
| Reverse | posted journal/invoice-settlement reversal | `P.PROC_REVERSE_VENDOR_PAYMENT` (`procurement.vendor_payment.reverse`, `701114`) |

Pending and approved drafts are locked; posted payments are immutable. Every endpoint independently enforces its matching backend key, entity scope, and lifecycle state.

### Procurement → Analytics (AP Aging · GR/IR & Control · Spend · Vendor Performance)

| Element | Type | Permission Constant |
|---|---|---|
| All four report screens, their KPIs/charts/tables, and every row **detail drawer** | report reads (entity-scoped) | `P.PROC_VIEW_PROC_REPORTS` (`procurement.report.view`, `701401`) |
| Vendor Performance list of recorded assessments + the drawer's assessment history | list read (rides report.view) | `P.PROC_VIEW_PROC_REPORTS` (`procurement.report.view`, `701401`) |
| **New assessment** header button + the assessment form submit | create action | `P.PROC_CREATE_VENDOR_ASSESSMENT` (`procurement.vendor_assessment.create`, `701502`, **SENSITIVE**) |

The four screens all gate on `procurement.report.view` (the backend report views enforce it). The
row **drawers** are backed by report.view-gated detail endpoints — `GET /procurement/reports/ap-aging/vendor/`
(a vendor's aging buckets + open POSTED bills), `GET /procurement/reports/grir-aging/grn/` (a GRN's
GR/IR reconciliation + linked PO / matched invoices), and the existing `spend-analysis` with a new
`?category=` scope — so a report viewer opens them **without** needing `vendor_invoice.view` /
`goods_receipt.view`. The vendor-invoice `balance_due`/`payment_status`/`due_date` and GRN values are
exposed only through these aggregate report endpoints, never leaking a raw resource read.

**One new key** was added: `procurement.vendor_assessment.create` (`701502`, SENSITIVE) gates recording
a `VendorAssessment` — a point-in-time, **immutable** scorecard (four 0–100 criteria weighted OTD .35 /
Quality .30 / Invoice-accuracy .20 / Responsiveness .15 into a computed overall score + A/B/C grade).
Listing assessments and reading the latest scorecard on the performance report ride `report.view`; there
is no edit/delete. On-Time Delivery on the report stays the **computed** on-time rate — the assessment
never overwrites it; quality/accuracy/responsiveness/grade come only from a recorded assessment (else
"Not assessed"). Seed with `seed_procurement_permissions` + apply migration `0014_vendorassessment`.

### Roles (`src/pages/protected/rbac/roles/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New Role" button | `<PermissionGate>` | `P.DEFINE_ROLE` |
| Table row â "Edit" dropdown action | `hasPermission()` | `P.MODIFY_ROLE` |
| Table row â "Delete" dropdown action | `hasPermission()` | `P.REVOKE_ROLE` |

> Delete is also suppressed for system roles and locked roles regardless of permission.

---

### Roles â Platform User Assignments (`src/pages/protected/rbac/roles/platform-user-assignments.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Assign Role" button | `<PermissionGate>` | `P.ASSIGN_ROLE` |
| Table row â "Revoke" dropdown action (ACTIVE rows) | `hasPermission()` | `P.ASSIGN_ROLE` |
| Detail sheet â "Revoke Assignment" button | prop-passed `canRevoke` | `P.ASSIGN_ROLE` |

---

### Roles â Transfer Super Admin (`src/pages/protected/rbac/roles/transfer-super-admin.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| Whole page (visibility via sidebar) | `hasPermission()` | `P.TRANSFER_SUPER_ADMIN` |
| "Transfer Super Admin" button | UI guard (`isCurrentUserSuperAdmin`) + backend | `P.TRANSFER_SUPER_ADMIN` |

> The button is disabled unless the currently signed-in user holds the active `xvs_super_admin` role; the backend enforces the same rule.

---

### Permissions (`src/pages/protected/rbac/permissions/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add Permission" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row â "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row â "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions â Modules (`src/pages/protected/rbac/permissions/modules/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add Module" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row â "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row â "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions â Resources (`src/pages/protected/rbac/permissions/resources.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Resource" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row â "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row â "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions â Actions (`src/pages/protected/rbac/permissions/actions.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Action" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row â "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row â "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions â Dependencies (`src/pages/protected/rbac/permissions/dependencies.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add Dependency" button | `<PermissionGate>` | `P.MANAGE_PERMISSIONS` |
| Table row â "Remove" dropdown action | `hasPermission()` | `P.MANAGE_PERMISSIONS` |

> "View Chain" is read-only and always available to users who can see the page.

---

### Roles â Permission Groups (`src/pages/protected/rbac/roles/permission-groups/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New Group" button | `<PermissionGate>` | `P.MANAGE_PERMISSIONS` |
| Table row â "Edit" dropdown action | `hasPermission()` | `P.MANAGE_PERMISSIONS` |
| Table row â "Delete" dropdown action | `hasPermission()` | `P.MANAGE_PERMISSIONS` |

> Delete is also suppressed for system groups regardless of permission.

---

### School Management (`src/pages/protected/school-mgt/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New School" button | `<PermissionGate>` | `P.ONBOARD_SCHOOL` |
| Table row â "Edit School" dropdown action | `hasPermission()` | `P.MODIFY_SCHOOL` |

---

### Team Management â Members (`src/pages/protected/team-mgt/tabs/members.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New User" button | `<PermissionGate>` | `P.INVITE_TEAM_MEMBER` |
| Table row â "Edit" dropdown action | `hasPermission()` | `P.MODIFY_TEAM_MEMBER` |
| Table row â "Suspend" action (ACTIVE members only) | `hasPermission()` | `P.SUSPEND_TEAM_MEMBER` |
| Table row â "Reactivate" action (SUSPENDED members) | `hasPermission()` | `P.REACTIVATE_TEAM_MEMBER` |
| Table row â "Unlock" action (LOCKED members) | `hasPermission()` | `P.REACTIVATE_TEAM_MEMBER` |

> The `DELETE /user/users/{id}/` endpoint exists on the backend but is a soft-deactivate â functionally the same as Suspend. The UI therefore does not expose a separate Delete action; Suspend is the canonical deactivation flow.

---

### Team Management â Invites (`src/pages/protected/team-mgt/tabs/invites.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New User" button | `<PermissionGate>` | `P.INVITE_TEAM_MEMBER` |

---

### Data Imports â Templates list (`src/pages/protected/data-imports/templates/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Template" button | `<PermissionGate>` + `user_type === "CX_STAFF"` | `P.CREATE_IMPORT_TEMPLATE` |
| Download CSV / XLSX (table dropdown) | _(none â backend allows all viewers)_ | â |
| View Details (table dropdown) | _(none)_ | â |

> Backend has no update/delete endpoint for templates. Detail sheet is read-only after creation.

---

### Data Imports â Batches list (`src/pages/protected/data-imports/batches/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Import" button | `<PermissionGate>` | `P.UPLOAD_IMPORT_BATCH` â opens the 7-step upload wizard |
| Table row â "Delete" dropdown action | `hasPermission()` | `P.DELETE_IMPORT_BATCH` (also hidden for in-flight batches) |

---

### Data Imports â Batch detail (`src/pages/protected/data-imports/batches/view-batch.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Validate" button | `<PermissionGate>` | `P.RUN_IMPORT_VALIDATION` |
| "Start Import" button | `<PermissionGate>` | `P.EXECUTE_IMPORT_BATCH` |
| "Delete" button | `<PermissionGate>` | `P.DELETE_IMPORT_BATCH` |
| Issue row â "Resolve" button | `<PermissionGate>` | `P.RESOLVE_IMPORT_ISSUE` |
| Job row â "Rollback" button | `<PermissionGate>` | `P.RUN_IMPORT_ROLLBACK` |
| Tabs (Issues / Jobs / Row Results / Audit / Notifications) | _(always rendered if user can view batch)_ | backend further restricts each endpoint |

---

### Workflow â Templates list (`src/pages/protected/workflow/templates/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Template" button | `<PermissionGate>` | `P.MANAGE_WORKFLOW_TEMPLATES` |

### Workflow â Template detail (`src/pages/protected/workflow/templates/template-detail.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Edit" button | `<PermissionGate>` | `P.MANAGE_WORKFLOW_TEMPLATES` |

### Workflow â Instance detail (`src/pages/protected/workflow/instances/instance-detail.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Cancel workflow" button | `<PermissionGate>` | `P.CANCEL_WORKFLOW` |
| Recorded vote â "Reverse" button | `<PermissionGate>` | `P.REVERSE_WORKFLOW_ACTION` |

> Approval voting (Approve/Reject/Return), withdraw, and resubmit are **actor-level** â gated by the backend on eligibility/ownership, not by an RBAC permission key. The UI mirrors this: it shows the vote panel only when the current user is on the active stage's eligible-approver snapshot and hasn't already voted, and shows withdraw/resubmit only to the requester.

---

### Organogram â Org Chart (`src/pages/protected/organogram/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| Whole page (visibility via sidebar) | sidebar gate | `P.VIEW_ORGANOGRAM` |
| Detail drawer â person "Edit" link | `hasPermission()` | `P.MODIFY_STAFF_PROFILE` |

> Reads (tree, positions, departments, assignments, matrix, staff list) require `platform.organogram.view` / `platform.staff_profile.view` server-side. Payroll fields in the drawer are FLS-gated: the backend omits them unless the caller holds `platform.staff_payroll.view` or is the record owner â the UI shows a "restricted" notice on absence, never a masked value.

---

### Organogram â Manage (`src/pages/protected/organogram/manage/`)

| Element | Type | Permission Constant |
|---|---|---|
| Whole section (visibility via sidebar) | `hasPermission()` | `P.MANAGE_ORGANOGRAM` |
| New/Edit/Delete Department Â· Position Â· Matrix | UI (no per-button gate) | `P.MANAGE_ORGANOGRAM` |

> Tabs: Departments, Positions, Matrix â full CRUD. Reaching the page is gated by the sidebar `hasPermission(P.MANAGE_ORGANOGRAM)`; the backend (`platform.organogram.manage`) is the authoritative gate on every write. Assignments are managed via the staff profile (seat changes route through the assignments service to keep effective-dated history), not here.

---

### Organogram â Staff detail (`src/pages/protected/organogram/staff/staff-detail.tsx`)

Reached from Team Management "View Details" (by-user route) or the org chart drawer. The retired Staff Directory page is gone; "Create staff profile" appears on the by-user empty state.

| Element | Type | Permission Constant |
|---|---|---|
| "Edit" button | `<PermissionGate>` | `P.MODIFY_STAFF_PROFILE` |
| "Change" (email) beside work email | `hasPermission()` | `P.MODIFY_TEAM_MEMBER` (backend: `PATCH /user/:id/email/change/`) |
| "Create staff profile" (empty state) | `<PermissionGate>` | `P.CREATE_STAFF_PROFILE` |
| Payroll card | field absence (server FLS) | `platform.staff_payroll.view` (or owner) |

---

### Organogram â Staff create/edit (`src/pages/protected/organogram/staff/staff-form.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| Payroll fields (editable) | `hasPermission()` | `P.MANAGE_STAFF_PAYROLL` |

> Reaching create/edit is gated by the sidebar/detail buttons (`P.CREATE_STAFF_PROFILE` / `P.MODIFY_STAFF_PROFILE`); the backend is the authoritative gate. Payroll inputs render only with `P.MANAGE_STAFF_PAYROLL`; the server rejects payroll writes otherwise (owner excepted on `â¦/me/`).

---

### My Profile (`src/pages/protected/me-profile/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| Whole page + payroll editing | _(none â owner self-service via `â¦/me/`)_ | â |

> Owner can always read & write their own payroll (backend FLS owner exception), so payroll is editable here without `P.MANAGE_STAFF_PAYROLL`.

---

### Notifications (`src/pages/protected/notifications/`)

Inbox (`/notifications`) and administration (`/notifications/admin`) are separate pages.

| Element | Type | Permission Constant |
|---|---|---|
| Inbox: feed, detail drawer, mark-read / mark-all-read | page | _(none — recipient-scoped server-side)_ |
| Inbox → "Administration" header link | button | any of the three `communication.*` keys below |
| Administration page | page | any of the three keys; `PageAccessDenied` otherwise |
| History tab (delivery log) | admin tab | `P.AUDIT_NOTIFICATION_ACTIVITY` (`communication.message_activity.audit`) |
| Settings tab (channel matrix) | admin tab | `P.ENFORCE_NOTIFICATION_SETTINGS` (`communication.communication_permissions.enforce`) |
| Templates tab + editor | admin tab | `P.CONFIGURE_NOTIFICATION_TEMPLATES` (`communication.notification_templates.configure`) |
| Event types tab | admin tab | _(shown to anyone on the admin page; lists only `is_active` events — inactive registry entries are hidden until an emitter exists)_ |

> In-app toggles and transactional rows render disabled with a tooltip — backend policy (in-app always on; transactional always dispatches), not a missing grant.
> Workflow lifecycle events now actually emit (vs_workflow/services/routing.py): stage activation → approvers; returned/rejected/final-approved → requester.

---

### Settings (`src/pages/protected/settings/`)

Three tabs (2026-07-11 plain-language redesign): System Settings (GitHub-style rows — every typed setting grouped by module with an inline control: Switch for booleans, inline number/text with Save, JSON behind an Edit dialog; effective platform value = default overlaid by explicit row), Features (per-scope switchboard on `GET /config/effective-capabilities/` — "In plan" Switch writes the entitlement, "Status: Follow plan / Force on / Force off" select writes the override, row click opens a record drawer), Audit Trail. Entitlement/override rows are edited inline; the old Entitlements/Overrides tabs are gone (records visible in the drawer + audit).

| Element | Type | Permission Constant |
|---|---|---|
| System Settings tab | tab | any of `P.VIEW_CONFIG_DEFINITIONS` `P.VIEW_CONFIG_VALUES` |
| Features tab (incl. effective + record reads) | tab | `P.VIEW_CAPABILITIES` (row controls additionally read entitlement/override lists under `P.VIEW_ENTITLEMENTS` / `P.VIEW_CONFIG_OVERRIDES` server-side) |
| Audit trail tab | tab | `P.VIEW_CONFIG_AUDIT` |
| New setting | button | `P.CREATE_CONFIG_DEFINITION` |
| Archive setting / feature | row action | `P.ARCHIVE_CONFIG_DEFINITION` / `P.MANAGE_CAPABILITIES` |
| Inline setting controls (Switch / Save / Edit) | row control | `P.UPDATE_CONFIG_VALUES` (disabled without it) |
| New feature | button | `P.MANAGE_CAPABILITIES` |
| "In plan" toggle | row control | `P.MANAGE_ENTITLEMENTS` (disabled without it) |
| "Status" force-on/off select | row control | `P.MANAGE_CONFIG_OVERRIDES` (disabled without it) |
| Export snapshot | button | `P.EXPORT_CONFIG` |

> Definition/capability creation is additionally platform-only server-side (`platform_methods` guard rejects non-CX users regardless of grants). The school pickers read the school list (`GET /i/`, gated by `P.BROWSE_SCHOOLS` server-side); its list serializer now includes the school `id` pk that scoped config endpoints take.

---

### Support (`src/pages/protected/support/`)

| Element | Type | Permission Constant |
|---|---|---|
| List, dashboard KPIs, Create ticket | page | _(none — creation is deliberately keyless; visibility scoped server-side)_ |
| Edit ticket (detail sidebar) | button | `P.MANAGE_TICKETS` |
| Assignment select | control | `P.ASSIGN_TICKET` |
| Update status (transitions) | buttons | `P.MANAGE_TICKETS` |
| Internal note toggle | control | `P.POST_INTERNAL_NOTE` |
| View audit history | drawer | `P.VIEW_TICKET_AUDIT` |

> Comment/attachment posting renders ungated (participants always may); the backend enforces `tickets.comment.post` / `tickets.attachment.create` for non-participants.

---

### Health (`src/pages/protected/health/`)

| Element | Type | Permission Constant |
|---|---|---|
| All seven screens + drawers | pages | `P.VIEW_HEALTH` (`platform.health.view`, enforced on every /health/ read) |
| _(no write controls yet)_ | — | `P.MANAGE_HEALTH` (`platform.health.manage`) registered; backend gates non-GET methods with it, UI has no mutating controls |

> Telemetry is collected server-side (request middleware, celery-beat probes/snapshots); `seed_health` seeds configuration + the two permission rows only — never measurements.

### Export Centre (`src/pages/protected/export/`)

| Element | Type | Permission Constant |
|---|---|---|
| Saved exports (`saved.tsx`) | page | `P.VIEW_SAVED_EXPORTS` (`exports.definition.view`) |
| New export button | button | `P.CREATE_EXPORT` (`exports.definition.create`) — hidden without it |
| Row menu · Run now | menu item | `P.RUN_EXPORT`; also disabled for a draft or a withdrawn dataset |
| Row menu · Edit | menu item | `P.UPDATE_EXPORT`; also owner-only — sharing grants sight, never edit rights |
| Row menu · Duplicate | menu item | `P.CREATE_EXPORT` (a copy is a new definition, owned by the copier) |
| Row menu · Delete | menu item | `P.DELETE_EXPORT`; owner-only. Archives — files it produced survive |
| Builder (`builder/index.tsx`) | page | `P.CREATE_EXPORT` for /export/new, `P.UPDATE_EXPORT` for /export/:id/edit |
| Builder · Save and run | button | `P.RUN_EXPORT`, disabled-with-reason rather than hidden |
| Files list (`files.tsx`) | page | `P.VIEW_EXPORT_RUNS` (`exports.run.view`) — renders `PageAccessDenied` without it, and the table shows `ForbiddenState` on a 403 |
| Run detail (`run-detail.tsx`) | page | `P.VIEW_EXPORT_RUNS`; a 403 from the API also falls back to `PageAccessDenied` |
| Download (row action + file card) | button | `P.DOWNLOAD_EXPORT_FILE` (`exports.file.download`) — hidden in the row, disabled-with-reason on the card |
| Cancel run | button | `P.CANCEL_EXPORT_RUN` (`exports.run.cancel`); only shown while the run is live |
| Retry now | button | `P.RUN_EXPORT` (`exports.run.create`); only shown when the API says the failure is retryable |
| Download log | table | `P.VIEW_EXPORT_RUNS` (backend gates the endpoint with `exports.run.view`) |

> The backend is authoritative on every one of these. A download is re-authorised
> against the **downloader** (not the person who ran the export) plus the run's frozen
> entity/dataset and the file's expiry, and both allowed and refused attempts are
> logged — the FE check only decides whether to offer the button.

---

## 3. Route-level Guards

No route-level guards. The previous `RequirePermission` middleware was deleted as dead code. All page-level protection is handled inside the page components themselves via `<PermissionGate>` and `hasPermission()`. The backend is the authoritative gate â anyone who reaches a page they shouldn't see still gets a 403 from the API.

---

## 4. Permission Constants â What's Wired vs. Not

### Wired (actively used in UI)

| Constant | Backend Key |
|---|---|
| `P.BROWSE_SCHOOLS` | `platform.schools.view` |
| `P.ONBOARD_SCHOOL` | `platform.schools.create` |
| `P.MODIFY_SCHOOL` | `platform.schools.update` |
| `P.ACCESS_TEAM_PANEL` | `platform.team.view` |
| `P.INVITE_TEAM_MEMBER` | `platform.team.create` |
| `P.MODIFY_TEAM_MEMBER` | `platform.team.update` |
| `P.SUSPEND_TEAM_MEMBER` | `platform.team.suspend` |
| `P.REACTIVATE_TEAM_MEMBER` | `platform.team.reactivate` |
| `P.VIEW_ROLES` | `platform.roles.view` |
| `P.DEFINE_ROLE` | `platform.roles.create` |
| `P.MODIFY_ROLE` | `platform.roles.update` |
| `P.REVOKE_ROLE` | `platform.roles.delete` |
| `P.ASSIGN_ROLE` | `platform.roles.assign` |
| `P.TRANSFER_SUPER_ADMIN` | `platform.roles.transfer` |
| `P.VIEW_PERMISSIONS` | `platform.permissions.view` |
| `P.CREATE_PERMISSION` | `platform.permissions.create` |
| `P.MODIFY_PERMISSION` | `platform.permissions.update` |
| `P.DELETE_PERMISSION` | `platform.permissions.delete` |
| `P.MANAGE_PERMISSIONS` | `platform.permissions.manage` |
| `P.VIEW_AUDIT` | `platform.audit.view` |
| `P.EXPORT_AUDIT` | `platform.audit.export` |
| `P.MANAGE_AUDIT` | `platform.audit.manage` |
| `P.END_IMPERSONATION` | `platform.security.end_impersonation` |
| `P.CREATE_IMPORT_TEMPLATE` | `import.templates.create` |
| `P.DELETE_IMPORT_BATCH` | `import.batches.delete` |
| `P.RUN_IMPORT_VALIDATION` | `import.batches.run` |
| `P.EXECUTE_IMPORT_BATCH` | `import.batches.import` |
| `P.RESOLVE_IMPORT_ISSUE` | `import.validations.update` |
| `P.RUN_IMPORT_ROLLBACK` | `import.rollbacks.run` |
| `P.VIEW_WORKFLOW_TEMPLATES` | `workflow.template.view` |
| `P.MANAGE_WORKFLOW_TEMPLATES` | `workflow.template.manage` |
| `P.VIEW_WORKFLOW_INSTANCES` | `workflow.instance.view` |
| `P.CANCEL_WORKFLOW` | `workflow.instance.cancel` |
| `P.REVERSE_WORKFLOW_ACTION` | `workflow.action.reverse` |
| `P.VIEW_ORGANOGRAM` | `platform.organogram.view` |
| `P.CREATE_STAFF_PROFILE` | `platform.staff_profile.create` |
| `P.MODIFY_STAFF_PROFILE` | `platform.staff_profile.update` |
| `P.MANAGE_STAFF_PAYROLL` | `platform.staff_payroll.manage` |
| `P.MANAGE_ORGANOGRAM` | `platform.organogram.manage` |

> `P.SUBMIT_WORKFLOW` (`workflow.instance.submit`) is registered but not wired â submission happens inside feature modules, not the console (monitor-only).

### Not yet wired (defined but no UI check uses them)

| Constant | Backend Key | Likely Home |
|---|---|---|
| `P.SHARE_EXPORT` | `exports.definition.share` | **Cut from the MVP** — sharing an export with other people is not built. The backend key and endpoint remain; nothing in the UI calls them. |
| `P.EXPORT_SENSITIVE_FIELDS` | `exports.sensitive_field.export` | The catalogue already hides restricted fields server-side from anyone without it, so the picker needs no FE check. Not granted by default |
| `P.VIEW_EXPORT_ACTIVITY` | `exports.activity.view` | Admin all-activity console — slice 5. Super-admin only; the read is itself audited |
| `P.DISMISS_TEAM_MEMBER` | `platform.team.delete` | No UI surface â DELETE on the backend is a soft-deactivate equivalent to Suspend, which already has its own gated action. Consider deprecating this constant or repurposing if hard-delete is added later. |
| `P.VIEW_STAFF_PROFILE` | `platform.staff_profile.view` | Gates staff list/detail server-side; UI surfaces under the `P.VIEW_ORGANOGRAM` sidebar group. |
| `P.VIEW_STAFF_PAYROLL` | `platform.staff_payroll.view` | Read-side FLS â enforced server-side (fields stripped); no explicit UI check, the drawer/detail react to field absence. |
| `P.DECOMMISSION_SCHOOL` | `platform.schools.delete` | School table row â Delete action |
| `P.MANAGE_SCHOOL` | `platform.schools.manage` | School settings / config reset |
| `P.BROWSE_BRANCHES` | `platform.branches.view` | Branches sidebar item / page |
| `P.ADD_BRANCH` | `platform.branches.create` | Add Branch button |
| `P.MODIFY_BRANCH` | `platform.branches.update` | Branch table row â Edit |
| `P.MANAGE_BRANCH` | `platform.branches.manage` | Branch lifecycle transitions |
| `P.VIEW_DASHBOARD` | `platform.dashboard.view` | Home / Overview page |
| `P.VIEW_ROLES` / `P.VIEW_ORGANOGRAM` (Overview) | `platform.roles.view` / `platform.organogram.view` | "Getting started" checklist rows. Double-gated as of 2026-07-29: the FE key hides the row, and `/admin/dashboard/overview/` independently omits the matching `setup.*` flag under the same backend key — so the tick is never rendered from a number the caller could not fetch. A row whose flag is absent after load is dropped, not shown unticked. |
| `P.VIEW_SECURITY` | `platform.security.view` | Defined for future security-only read separation; today the Audit pages gate on `P.VIEW_AUDIT`. |
| `P.IMPERSONATE_USER` | `platform.security.impersonate` | "Start impersonation" entry point â not yet built; the current Impersonations page only lists sessions. Nav item enabled 2026-06-11 (was a disabled placeholder; the list page and `vs_admin_console` start/end endpoints are live). |
| `P.VIEW_IMPORT_TEMPLATES` | `import.templates.view` | Gates sidebar sub-item and list page (`PageAccessDenied` if missing). |
| `P.MANAGE_IMPORT_TEMPLATES` | `import.templates.manage` | Reserved for future edit/publish/retire flows once backend supports them. |
| `P.VIEW_IMPORT_BATCHES` | `import.batches.view` | Gates sidebar sub-item and list page (`PageAccessDenied` if missing). |
| `P.UPLOAD_IMPORT_BATCH` | `import.batches.create` | Wired to the "New Import" button â upload wizard (`import-wizard.tsx`). |
| `P.EDIT_IMPORT_BATCH` | `import.batches.update` | No UI surface yet â batch detail metadata edit (notes / sheet / header row) not exposed. |
| `P.VIEW_IMPORT_ISSUES` | `import.validations.view` | Defined; Issues tab inherits batch-view permission. |
| `P.VIEW_IMPORT_JOBS` | `import.jobs.view` | Defined; Jobs tab inherits batch-view permission. |
| `P.VIEW_IMPORT_ROLLBACKS` | `import.rollbacks.view` | Defined; rollback list not yet shown in UI (only the rollback action). |
| `P.VIEW_IMPORT_AUDIT` | `import.audit.view` | Defined; Audit tab inherits batch-view permission. |
| `P.VIEW_IMPORT_NOTIFICATIONS` | `import.notifications.view` | Defined; Notifications tab inherits batch-view permission. |

---

### Notifications / Settings / Support constants (added 2026-07-11)

All 26 registered in `src/permissions/index.ts` and wired in the UI (see the three page sections in §2): `CONFIGURE_NOTIFICATION_TEMPLATES` / `ENFORCE_NOTIFICATION_SETTINGS` / `AUDIT_NOTIFICATION_ACTIVITY` (communication, MM=40); the 14 `config.*` view/write keys (MM=90); the 9 `tickets.*` keys (MM=91) — of which `VIEW_TICKETS`, `UPDATE_TICKET`, `POST_TICKET_COMMENT`, `ATTACH_TICKET_FILE` and `VIEW_TICKET_REPORTS` are registered but not yet gating any control (list/create/comment/attach are deliberately open in the UI; reports page not built). Backend seeding: `seed_all_permissions` now runs `seed_config_permissions`, `seed_ticket_permissions` and the new `seed_notification_permissions` (grants to both platform roles; school-admin defaults for tickets + notification settings/history).

---

## 6. Audit & Security Pages â Permission Wiring

The "Audit & Security" sidebar group is gated by `P.VIEW_AUDIT`. The
two write-heavy sub-items (Audit Exports, Compliance Rules) are gated
individually so users with read-only `P.VIEW_AUDIT` don't see entries
they cannot actually open. Equivalent treatment was applied to the
"Change Requests" sub-item under Roles.

| Page | Sidebar gate | Action gates |
|---|---|---|
| `/audit` Security Dashboard | `P.VIEW_AUDIT` (group) | "Export view" â `P.EXPORT_AUDIT` |
| `/audit/events` Events Explorer | `P.VIEW_AUDIT` (group) | "Export filtered" â `P.EXPORT_AUDIT` |
| `/audit/entity-trails` and detail | `P.VIEW_AUDIT` (group) | â |
| `/audit/sessions` Live Sessions | `P.VIEW_AUDIT` (group) | "End session" â `P.SUSPEND_TEAM_MEMBER` (mirrors backend `platform.team.suspend`) |
| `/audit/login-attempts` | `P.VIEW_AUDIT` (group) | â (read-only) |
| `/audit/lockouts` | `P.VIEW_AUDIT` (group) | "Unlock account" â `P.REACTIVATE_TEAM_MEMBER` |
| `/audit/password-activity` | `P.VIEW_AUDIT` (group) | â (read-only) |
| `/audit/impersonations` | `P.VIEW_AUDIT` (group) | "End proxy session" â `P.END_IMPERSONATION` (backend `platform.impersonation.end` may terminate ANY active session since 2026-07-16; `start_*`-only holders stay owner-only) |
| `/audit/exports`, `/audit/exports/new` | `P.VIEW_AUDIT` (group) + `P.EXPORT_AUDIT` (sub-item) | "New export" â `P.EXPORT_AUDIT` |
| `/audit/compliance-rules` and form | `P.VIEW_AUDIT` (group) + `P.MANAGE_AUDIT` (sub-item) | Add / Edit / Delete â `P.MANAGE_AUDIT` |
| `/roles/change-requests` | `P.VIEW_ROLES` (group) + `P.MODIFY_ROLE` (sub-item) | â |
| `/me/security/*` (all 6 user pages) | none â self-service, every signed-in user can access | â |

## 7. Known Gaps

| Gap | Details |
|---|---|
| Data Imports nav parent | Parent menu has no gate; sub-items always visible. Page-level actions are gated individually (see Â§2 below). |
| Branches / Dashboard | Constants defined but the pages those constants would gate haven't been built yet. |
| `P.VIEW_SECURITY` / `P.IMPERSONATE_USER` | New audit pages currently gate on `P.VIEW_AUDIT`. Once the backend adds `platform.security.*` permission rows and the "Start impersonation" entry-point UI is built, wire those constants. |
| Backend permission seeding | The bootstrap (`apps/core/management/commands/create_superuser.py`) does not yet seed the new `platform.security.*` permission rows in the DB. Add them when wiring `P.VIEW_SECURITY` / `P.IMPERSONATE_USER`. |
