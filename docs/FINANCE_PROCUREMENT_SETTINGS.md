# Finance and Procurement Settings

## Purpose

This document is the canonical implementation guide for the Finance Settings and
Procurement Settings consoles. It explains what was built, why each setting exists,
where each value is stored, which backend workflows enforce it, how permissions and
tenant isolation work, and how future settings should be added without creating a
second source of truth.

The implementation spans two repositories:

- `console-fe`: routes, navigation, forms, permission-aware UI, API types, and the
  shared settings presentation components.
- `backend`: typed models, validation, entity scoping, runtime enforcement, audit
  records, permissions, migrations, and regression tests.

Settings are not cosmetic preferences. A value belongs in these consoles only when it
is an entity-wide default or policy that can be enforced consistently by the backend.

## The mental model

The active ledger entity is the settings boundary. Finance and Procurement use the
same entity selector because purchasing documents eventually affect that entity's
books.

```text
asserted tenant
    -> selected ledger entity
        -> typed Finance or Procurement settings
            -> backend service or write endpoint
                -> document, posting, or eligibility outcome
                    -> immutable audit record when the setting changes
```

There are three kinds of items in the consoles:

1. Configurable settings, which have typed storage and backend enforcement.
2. Enforced invariants, which are intentionally displayed but cannot be weakened from
   a settings screen.
3. Links to existing master-data or workflow screens, which remain the source of truth
   for records such as accounts, tax codes, fee structures, vendors, and approvals.

This separation prevents a settings page from becoming an untyped collection of
switches or a duplicate editor for operational records.

## Navigation and information architecture

Finance Settings is available at `/finance/settings` and contains:

- Overview
- Entities
- Fiscal calendar
- Accounting defaults
- Documents
- Reference data
- Approvals

Procurement Settings is available at `/procurement/settings` and contains:

- Overview
- General defaults
- Purchasing policy
- Invoice matching
- Accounting integration
- Approvals
- Reference data

Both routes are registered in the action palette and appear under Administration in
their respective console navigation. Navigation visibility is permission-gated, but
the backend independently checks every read and write.

On desktop, the section menu is a left rail. On smaller screens it becomes a
horizontally scrollable strip, while forms stack into one column. The implementation
was verified at 390px, 820px, and desktop width without page-level horizontal
overflow.

## Shared implementation rules

### Typed storage

Settings use explicit model fields and enum choices. They are not stored in a generic
JSON blob. This gives each value a database type, a default, a validation boundary,
and a discoverable runtime consumer.

### Defaults without eager rows

A GET request does not create a database row just to show defaults. The resolver
returns an unsaved model instance carrying the model defaults when no entity-specific
row exists. A row is created when a meaningful setting is saved.

This matters because an untouched entity should continue to inherit stable defaults
without accumulating empty configuration rows.

### Entity scoping

Every settings request carries both:

- `tenant=<asserted tenant slug>`, injected centrally by the frontend API layer.
- `entity=<ledger entity id or code>`, supplied by the active entity selector.

The backend resolves the entity only inside `request.tenant`. An unknown entity and an
entity belonging to another tenant are both hidden behind the same not-found response.
Changing a query string or foreign-key id cannot cross the tenant boundary.

### Partial writes

PATCH endpoints accept only known setting names. Unknown keys are rejected. Each value
is validated again on the backend even when the frontend already constrains the input.

### Audit behavior

Successful changes are written to `FinanceAuditLog` with the actor, entity, timestamp,
target type, and effective before-and-after values. Unchanged values are omitted from
the audit payload. The settings screen shows the ten newest relevant audit records;
the complete immutable history remains in the Finance Audit Trail.

Object values such as a collection bank account are rendered by name in the settings
history rather than as `[object Object]`.

### Save behavior

The frontend disables Save until:

- the user has the update permission;
- the form differs from the last server response;
- numeric values are valid; and
- a save is not already in progress.

After a successful mutation, RTK Query invalidates the settings and audit tags so the
form and recent history are refreshed from the server response.

## Finance Settings

### Permissions

| Purpose | Backend permission | Frontend key |
| --- | --- | --- |
| View Finance settings | `finance.settings.view` | `FIN_VIEW_SETTINGS` |
| Update Finance settings | `finance.settings.update` | `FIN_UPDATE_SETTINGS` |
| Create a ledger entity | `finance.entity.create` | `FIN_CREATE_ENTITY` |

`finance.settings.update` is classified as sensitive. Entity creation deliberately
uses its own structural permission because provisioning a new set of books is more
significant than changing a default inside an existing entity.

### Entity creation

The Entities section reuses the ledger entity list and adds a permission-gated New
entity flow. The form accepts:

- Entity code, required and normalized to uppercase.
- Reporting code, optional, globally unique, and limited to three characters.
- Name, required.
- Base currency, defaulting to NGN.
- First fiscal year, defaulting to the current year.
- Fiscal start month and day.
- Monthly or quarterly period frequency.

Creation is atomic. The backend creates the active entity, ensures currencies exist,
seeds the starter chart of accounts, and opens the first fiscal calendar. If any part
fails, none of the new set of books remains.

Important numbering nuance:

- `LedgerEntity.code` identifies the set of books.
- `LedgerEntity.number_code` is a short reporting identifier and is auto-derived when
  omitted.
- Live document numbers do not use `number_code`. They use the protected tenant-level
  daily sequence in `vs_tenants.numbering`, shared by entities owned by that tenant.
- The reserved platform entity code remains `CODEX`. This must agree with the seed
  migration and `LedgerEntity.objects.platform()`.

### Accounting defaults

Finance stores only overrides in `FinanceAccountMapping`. Each row maps one stable role
to one account inside the same entity. If an override does not exist, the resolver uses
the starter-chart code shown below.

| Stable role | Starter code | Required account type | Main use |
| --- | ---: | --- | --- |
| Cash and bank | 1100 | Asset | Cash reporting and bank-related fallbacks |
| Accounts receivable | 1200 | Asset | Default customer control account |
| Accounts payable | 2100 | Liability | Default vendor control account |
| Customer credit | 2140 | Liability | Unapplied receipts, overpayments, and refunds |
| GR/IR clearing | 2150 | Liability | Goods receipt and vendor invoice clearing |
| Output VAT | 2200 | Liability | Collected sales tax |
| WHT payable | 2300 | Liability | Withholding tax on supplier payments |
| Retained earnings | 3200 | Equity | Opening balances and year-end close |
| Bad debt expense | 5300 | Expense | Invoice write-off fallback |
| Bank charges | 5500 | Expense | Bank adjustment fallback |
| Inventory asset | 1400 | Asset | Perpetual inventory value |
| Inventory adjustment | 5150 | Expense | Stock gains, losses, and write-downs |
| Purchase price variance | 5160 | Expense | Receipt-to-invoice price differences |

Only active, postable accounts of the expected account type are selectable. The
backend repeats those checks, constrains the lookup to the selected entity, and calls
`full_clean()` on the mapping model. A cross-entity account id, inactive account,
non-postable account, or wrong account type is rejected.

Choosing “Use default” deletes the override. It does not copy the starter account into
another configuration row. The next resolution falls back to the starter code.

Posting and reporting services use `resolve_mapped_account()` or
`resolve_default_code_mapping()`. This shared boundary replaced scattered direct code
lookups in receivables, customer credit, write-offs, bank charges, year-end close, cash
reporting, Procurement posting, GR/IR reporting, and vendor creation. If the effective
account is missing or unusable, the service fails closed with a configuration error
instead of posting to an arbitrary account.

Account mapping changes use the `FINANCE_SETTINGS_UPDATED` audit action and record the
effective account codes before and after the change.

### Document and collection policy

Finance document policy is stored in the one-to-one `FinanceDocumentSettings` model.

| Setting | Default | Validation | Runtime behavior |
| --- | --- | --- | --- |
| Default invoice due days | 30 | Whole number, 0 to 365 | Used when a manual or fee-generated invoice omits `due_date` |
| Default invoice narration | Blank | Trimmed, maximum 255 characters | Used when a manual invoice omits narration |
| Post manual invoices immediately | On | Boolean | Controls the default value of `post` for manual invoices |
| Allow customer opening balances | On | Boolean | Rejects non-zero opening balances on customer create or edit when off |
| Primary collection account | Automatic fallback | Active bank account in the same entity, or blank | Controls the pay-to bank printed on invoices and receipts |

Explicit document input wins over a default:

- An explicit invoice `due_date` is retained.
- An explicit narration is retained.
- An explicit `post` choice is retained.
- Setting auto-post off causes an omitted `post` value to create and price a draft.

The opening-balance policy blocks only a requested non-zero opening balance. It does
not prevent ordinary edits to a customer that already has historical balance data.

The primary collection account is not duplicated in `FinanceDocumentSettings`.
`BankAccount.is_primary_collection` remains the source of truth, with a database
constraint allowing at most one per entity. Saving the setting locks the entity's bank
rows, clears the former primary, and marks the selected active account. Clearing the
setting restores automatic fallback behavior.

Printed documents resolve their payment destination in this order:

1. The active account marked `is_primary_collection`.
2. The first active bank account.
3. No bank block when the entity has no active bank account.

The settings API deliberately returns bank id, display name, bank name, and currency.
It does not expose the account number in the settings response. The print-document
service accesses the account number only when building the actual invoice or receipt.

Document policy changes use `FIN_DOCUMENT_SETTINGS_UPDATED`. The shorter stored value
fits the audit action column's 32-character limit while the display label remains
“Finance document settings updated.”

### Read-only Finance sections

Several Finance Settings sections are navigation and explanation surfaces, not new
stores:

- Fiscal calendar links to the existing fiscal period workbench. Open, close, reopen,
  and lock behavior remains protected by the posting-period services.
- Reference data links to the chart of accounts, tax codes, currencies and FX, cost
  centres, and dimensions.
- Approvals links to the shared workflow templates for journals, refunds, and
  write-offs. Approval never bypasses ledger balance or period checks.
- Fee structures and dunning policies remain in their existing Accounts Receivable
  managers. The Documents section links to them instead of copying their fields.

## Procurement Settings

### Permissions

| Purpose | Backend permission | Frontend key |
| --- | --- | --- |
| View Procurement settings | `procurement.settings.view` | `PROC_VIEW_SETTINGS` |
| Update Procurement settings | `procurement.settings.update` | `PROC_UPDATE_SETTINGS` |

The update permission is sensitive. Procurement's Accounting integration section also
requires `finance.settings.view`, because it reads the Finance-owned account mappings.
Procurement never maintains a second AP, GR/IR, inventory, or variance account map.

### Typed Procurement settings

All configurable values are stored in the entity's one-to-one
`ProcurementSettings` row.

| Setting | Default | Validation | Runtime behavior |
| --- | --- | --- | --- |
| Default payment terms | NET_30 | PaymentTerms enum | Applied to new vendors and new contracts when omitted |
| Default delivery address | Blank | Trimmed, maximum 2,000 characters | Applied to new purchase orders when omitted |
| Quantity tolerance | 0 basis points | Whole number, 0 to 10,000 | Allows cumulative billed quantity above ordered and received quantity |
| Price tolerance | 0 basis points | Whole number, 0 to 10,000 | Allows absolute unit-price variance from the PO price |
| Allow non-PO invoices | On | Boolean | Determines whether an invoice without PO evidence can auto-match |
| Vendor purchase KYC requirement | Pending or verified | Enum | Controls vendors eligible for new purchasing commitments |
| Require a PO for goods receipts | Off | Boolean | Rejects receipt creation without purchase-order evidence when on |
| Default requisition lead days | 0 | Whole number, 0 to 365 | Sets `needed_by` from `request_date` when omitted; 0 leaves it blank |
| Contract renewal notice days | 30 | Whole number, 0 to 365 | Applied to new contracts when omitted |

The frontend displays percentages for match tolerance, but the API and database store
basis points. For example, 5.25% is stored as 525 basis points. This avoids floating
point policy comparisons.

All Procurement settings changes use `PROCUREMENT_SETTINGS_UPDATED`. General,
Purchasing, and Matching sections display the same entity-level history because they
edit different fields on the same settings record.

### Invoice matching details

Matching runs at the backend service boundary, not in the settings UI.

For each PO line, the matcher adds the current invoice quantity to the line's already
invoiced quantity. This cumulative calculation prevents a buyer from splitting an
over-bill across several invoice rows or invoices.

The quantity limit is:

```text
allowed quantity = ordered or received quantity * (10,000 + tolerance bps) / 10,000
```

The match results are:

- `OVER_BILLED` when cumulative billed quantity exceeds ordered quantity plus
  tolerance.
- `UNDER_RECEIVED` when cumulative billed quantity exceeds received quantity plus
  tolerance.
- `PRICE_VARIANCE` when absolute unit-price variance exceeds the configured price
  tolerance.
- `NON_PO_BLOCKED` when the invoice has no PO-backed line and non-PO invoices are off.
- `AUTO_MATCHED` when none of the blocking or variance conditions applies.

If the expected PO price is zero, any non-zero difference is outside tolerance. Price
variance remains visible and can use the existing dedicated variance-override
permission. Quantity over-billing, under-receipt, and blocked non-PO outcomes remain
blocking.

### Vendor eligibility details

Universal purchasing blocks remain in force regardless of the configurable KYC
threshold:

- Inactive vendors cannot receive new purchasing commitments.
- Vendors on hold cannot receive new purchasing commitments.
- Vendors with rejected KYC cannot receive new purchasing commitments.

The configurable threshold adds one of two rules:

- `PENDING_OR_VERIFIED`: pending and verified KYC are eligible, subject to the
  universal blocks.
- `VERIFIED_ONLY`: only verified KYC is eligible.

The shared `vendor_purchase_block_reason()` boundary is used by sourcing invitations,
quotation submission and award, catalog preferred-vendor links, purchase orders, and
contract creation or activation. Purchase-eligible vendor lists apply the same rule.

Bulk RFQ invitation validation resolves the policy once and passes it to each vendor
check. This avoids a settings query for every invited vendor.

Payment is intentionally stricter than purchase eligibility. Vendor payments always
require an active, verified, non-held vendor, even when the purchasing threshold allows
pending KYC. A purchasing setting cannot weaken the cash-disbursement control.

### Purchasing defaults and invariants

When default requisition lead days is greater than zero and `needed_by` is omitted,
the backend computes it from the request date. An explicitly supplied date wins.

When “Require a purchase order for goods receipts” is on, receipt creation rejects a
missing PO before creating a receipt header. Existing checks still require the PO to
belong to the entity, match the selected vendor, and be approved.

New contracts inherit default payment terms and renewal notice days when those values
are omitted. The selected vendor is checked against the entity's purchasing eligibility
policy before the draft contract is created.

Some controls are shown as always enforced and are not editable:

- A purchase order requires an approved requisition from the same entity.
- Vendor payments require a verified vendor.
- Interactive vendor payments must complete approval before posting.

These are load-bearing workflow or cash controls. They should not become general
settings without a separate security and accounting design review.

### Finance-owned accounting integration

The Procurement Accounting integration section is read-only. It resolves the Finance
roles for Accounts Payable, GR/IR clearing, WHT payable, inventory asset, inventory
adjustment, and purchase price variance.

This is deliberate. Finance owns the chart and posting roles; Procurement consumes
them. Editing is routed back to Finance Settings so there is one source of truth.

### Procurement reference and workflow sections

The settings console links to existing managers for vendors, categories, catalog
items, contracts, stock items, and shared workflow templates. Those records have their
own lifecycle, history, and permissions and are not copied into ProcurementSettings.

## API contracts

### Finance account mappings

```http
GET   /v1/finance/settings/account-mappings/?tenant=<slug>&entity=<code>
PATCH /v1/finance/settings/account-mappings/?tenant=<slug>&entity=<code>
```

PATCH body:

```json
{
  "mappings": {
    "CASH_BANK": 42,
    "BAD_DEBT_EXPENSE": null
  }
}
```

An account id or code selects an override. `null` or an empty value removes the
override and returns the role to its starter-code fallback.

### Finance document settings

```http
GET   /v1/finance/settings/documents/?tenant=<slug>&entity=<code>
PATCH /v1/finance/settings/documents/?tenant=<slug>&entity=<code>
```

PATCH body fields are partial:

```json
{
  "default_invoice_due_days": 14,
  "default_invoice_narration": "School fees",
  "auto_post_manual_invoices": false,
  "allow_customer_opening_balances": false,
  "primary_collection_bank_account": 7
}
```

Use `null` for `primary_collection_bank_account` to return to automatic fallback.

### Procurement settings

```http
GET   /v1/procurement/settings/?tenant=<slug>&entity=<code>
PATCH /v1/procurement/settings/?tenant=<slug>&entity=<code>
```

All Procurement sections PATCH the same typed resource with only their fields.

Example:

```json
{
  "vendor_purchase_kyc_requirement": "VERIFIED_ONLY",
  "require_purchase_order_for_receipts": true,
  "default_requisition_lead_days": 7,
  "contract_renewal_notice_days": 45
}
```

All three endpoints return a standard success envelope containing the effective
settings and recent history. Finance account mappings additionally return bounded
account options. Finance document settings additionally return safe bank-account
options.

## Transaction, concurrency, and audit nuances

- Settings writes run inside database transactions.
- Existing settings rows are read with `select_for_update()` so concurrent saves are
  serialized.
- Finance collection-account changes also lock the entity's bank rows before switching
  the unique primary flag.
- Mapping writes use `update_or_create()` under the transaction.
- Audit rows are created in the same transaction as the successful configuration
  change.
- Only effective changes are audited. Sending the current value again does not create
  a misleading change record.
- Finance document settings may change only the existing BankAccount primary flag. In
  that case no otherwise-empty FinanceDocumentSettings row needs to be created.
- `updated_by` uses `PROTECT` so a user referenced by configuration history cannot be
  deleted in a way that silently removes attribution.

## Security boundaries

The frontend permission gate is usability, not security. The backend provides the
actual authorization boundary.

Every settings endpoint requires an authenticated active user and the matching RBAC
permission. Entity resolution then applies tenant ownership. Foreign account and bank
ids are resolved only inside that entity.

The settings serializers return only the fields needed by the editor. In particular,
the bank selector omits account numbers and other unnecessary banking details.

The permission seed commands add:

- `finance.settings.view`
- `finance.settings.update`
- `procurement.settings.view`
- `procurement.settings.update`

Platform administration roles receive the seeded permissions through the existing
permission seeding process.

## Migrations

The settings implementation uses these migrations:

- Finance `0013`: Finance account mapping model and Finance settings audit choice.
- Finance `0014`: Finance document settings model and document-settings audit choice.
- Procurement `0016`: Procurement settings model and the non-PO blocked match status.
- Procurement `0017`: purchasing KYC, receipt evidence, requisition lead-time, and
  contract-renewal policy fields.

Run migrations before enabling the new routes. Run the Finance and Procurement
permission seed commands for environments that do not automatically reseed permission
definitions during deployment.

## Main code locations

### Frontend repository

- `src/pages/protected/finance/settings.tsx`
- `src/pages/protected/procurement/settings.tsx`
- `src/components/finance-ui/settings-layout.tsx`
- `src/pages/protected/finance/setup/entities-tab.tsx`
- `src/pages/protected/finance/setup/entity-create-payload.ts`
- `src/redux/services/finance/setup-api.ts`
- `src/redux/services/procurement/procurement-api.ts`
- `src/permissions/index.ts`
- `src/routes/protected/finance-routes.tsx`
- `src/routes/protected/procurement-routes.tsx`

### Backend repository

- `apps/vs_finance/account_mappings.py`
- `apps/vs_finance/document_settings.py`
- `apps/vs_finance/views_settings.py`
- `apps/vs_finance/models/core.py`
- `apps/vs_finance/models/ops.py`
- `apps/vs_procurement/settings.py`
- `apps/vs_procurement/views/settings.py`
- `apps/vs_procurement/models.py`
- The Finance and Procurement service and view files that consume the settings.

## Regression coverage and verification

Backend settings tests cover:

- Permission-denied GET and PATCH requests.
- Default responses without eagerly creating rows.
- Typed validation and unknown or invalid values.
- Cross-tenant and cross-entity reference rejection.
- Effective account mapping resolution.
- Audit before-and-after payloads.
- Finance invoice due date, narration, and draft behavior.
- Customer opening-balance rejection.
- Procurement matching tolerances and non-PO policy.
- Vendor KYC purchasing eligibility.
- Requisition needed-by calculation.
- Required purchase-order evidence for receipts.
- Contract payment-term and renewal-notice defaults.

The completed implementation was also checked with frontend lint, a production build,
the full frontend unit suite, Django checks, migration consistency, targeted backend
tests, and real-backend browser verification on desktop, phone, and tablet.

## How to add the next setting safely

Use this checklist for future Finance or Procurement policy expansion:

1. Confirm the value is truly entity-wide and is not already owned by a master-data or
   workflow screen.
2. Add an explicit typed model field with a conservative default and bounded
   validation.
3. Include it in the backend resolver, serializer, and partial-update allowlist.
4. Enforce it at the lowest shared backend boundary used by every relevant caller.
5. Keep explicit document input precedence clear when the value is a default rather
   than a mandatory rule.
6. Apply entity scoping to every referenced object.
7. Audit only effective changes with useful before-and-after values.
8. Use view and sensitive update permissions; do not rely on hidden frontend controls.
9. Add frontend types, query or mutation support, validation, read-only behavior, and
   audit rendering.
10. Test permission denial, cross-tenant isolation, default behavior, changed behavior,
    invalid values, and the real runtime consumer.
11. Verify the populated screen against the real backend at desktop and phone widths.

The critical rule is simple: a settings control is complete only when the backend
operation that it claims to govern actually reads and enforces it.
