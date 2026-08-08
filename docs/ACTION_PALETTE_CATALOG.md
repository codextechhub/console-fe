# Action Palette Catalog - draft for review

The Cmd/Ctrl+E workspace search stops being a page finder and becomes an
**action palette**: everything a user can type is an *action* - including view
actions ("view schools") - and every action is permission-gated. This document
is the vocabulary. Nothing here is wired into code yet; review and edit the
phrases/aliases first, then we implement.

## Conventions

- **Two kinds of action.**
  - `view` - lands on a list/report screen. Destination is an existing route.
  - `do` - opens a create/upload/start flow directly (form or drawer already
    open). Where a dedicated route exists (e.g. `/roles/create`) we use it;
    where the flow is a drawer on a list screen (most of Finance/Procurement),
    the palette navigates to the list with `?action=new` and the screen opens
    its drawer on arrival - that hook is the main new wiring.
- **Gating.** An action is only listed (and only executes) when the user holds
  its gate. View actions reuse the exact gate the sidebar already uses for that
  screen; `do` actions use the specific create/do key. FE gating is
  convenience - the backend remains the enforcement. Gates marked *(confirm)*
  need a check against the backend registry during implementation.
- **Aliases.** Every action matches its label plus the listed aliases. Verb
  synonyms are global: `create = new = add = raise = register`; `view = open =
  show = go to = list`. So "raise payout", "new payout", "create payout" all
  hit the same action without listing each spelling.
- **Smart matching (initials / word-prefix).** Besides plain substring, the
  query is split into tokens (space or `-` separated) and each token
  prefix-matches a word of the action label (or an alias), in order - the same
  feel as the proxy-user search:
  - `vi ho` → **Vi**ew **Ho**me
  - `vi m-p` (or `vi m p`) → **Vi**ew **M**y **P**rofile
  - `cr sch` → **Cr**eate **Sch**ool
  - `v inv` → **V**iew AR **Inv**oices (tokens may skip words: `v` matches
    "View", `inv` matches a later word)
  Ranking: exact label > alias > word-prefix (initials) > substring.
- **Ambiguity is fine.** "new payment" legitimately matches *Record receipt*
  (AR), *New vendor payment* (procurement), and *New payout* (payments) - the
  palette shows all the ones the user is permitted to see and they pick.
- **Broad queries: top 4 + expand.** A short query like `v` matches dozens of
  actions. Collapsed, the dropdown shows only the **top 4** with a final
  footer row - e.g. **"4 of 65 - show all"** - that is itself part of the
  keyboard flow (ArrowDown past the 4th lands on it; Enter or click expands).
  Expanded, the list becomes a scrollable box (max ~60vh, `overflow-y-auto`)
  showing every match **grouped by console section** (Main / Finance /
  Procurement…) so 65 rows stay scannable; the highlight + arrows keep working
  inside it and the scroll follows the highlight. Changing the query collapses
  back to top-4. Fewer than 5 matches → no footer, exactly as today.
- **Popularity ranking (learned, local).** "Top" is not alphabetical:
  1. *Adaptive picks* - the palette remembers, per query prefix, which action
     the user actually chose (typed `v`, picked *View Home* → next `v` puts
     View Home first). Same trick VS Code's palette uses.
  2. *Frecency* - a per-action use counter with recency decay breaks ties, so
     each user's own frequent actions float up.
  3. *Match quality* - exact label > alias > initials > substring - still
     caps how far popularity can promote a weak match.
  Stored in `localStorage` (per browser, per user id); no backend. A
  shared/org-wide popularity signal can layer on later without changing the UI.
- **Entity scope.** Finance/Procurement actions land inside the console, which
  already handles entity selection; the palette does not pick entities.

---

## Main console

### Home & account
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View home | home, dashboard, overview | view | - | `/overview` |
| View my profile | profile, my account | view | - | `/me/profile` |
| View my security | password, sessions, login history | view | - | `/me/security` |
| Change my password | update password | do | - | `/me/security/password` |
| Proxy a user | impersonate, act as | do | any `platform.impersonation.start_*` | opens Proxy dialog *(needs `?action=proxy` hook or global handler)* |
| Log out | sign out, logout | do | - | opens logout confirm |

### School Management
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View schools | schools, school list | view | `BROWSE_SCHOOLS` | `/school-management` |
| Create school | onboard school, register school | do | `ONBOARD_SCHOOL` | `/school-management/create` |
| Create school (bulk)| onboard school, register school | do | `ONBOARD_SCHOOL` | *(destination TBD - Data Imports upload flow, or a dedicated bulk screen?)* |

*(Branch create/edit needs a school context - reached from the school view, not the palette, in v1.)*

### Users
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View CX users | cx users, team, staff list | view | `ACCESS_TEAM_PANEL` | `/users/cx` |
| View school users | school accounts | view | `ACCESS_TEAM_PANEL` | `/users/schools` |
| Invite CX user | create user, add team member, invite staff | do | `INVITE_TEAM_MEMBER` | `/users/cx/create` |

### Organogram
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View org chart | organogram, org structure | view | - | `/organogram` |
| Manage organogram | edit org chart, departments, positions | do | `MANAGE_ORGANOGRAM` | `/organogram/manage` |
| Create staff profile | new staff, add staff profile | do | `CREATE_STAFF_PROFILE` | `/organogram/staff/create` |

### Tasks
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View tasks | tasks, my tasks, todo | view | - | `/tasks` |
| Create task | new task, new todo | do | - *(confirm)* | `/tasks?action=new` *(drawer hook)* |

### Roles
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View roles | platform roles | view | `VIEW_ROLES` | `/roles` |
| Create role | define role, new role | do | `DEFINE_ROLE` | `/roles/create` |
| View role assignments | user assignments, who has what role | view | `VIEW_ROLES` | `/roles/user-assignments` |
| View role change requests | change requests | view | `MODIFY_ROLE` | `/roles/change-requests` |
| Transfer super admin | - | do | `TRANSFER_SUPER_ADMIN` | `/roles/transfer-super-admin` |

### Permissions
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View permissions | permission registry | view | `VIEW_PERMISSIONS` | `/permissions` |
| Create permission | new permission | do | `CREATE_PERMISSION` | `/permissions/create` |
| View permission modules | modules | view | `VIEW_PERMISSIONS` | `/permissions/modules` |
| View permission resources | resources | view | `VIEW_PERMISSIONS` | `/permissions/resources` |
| View permission actions | actions vocabulary | view | `VIEW_PERMISSIONS` | `/permissions/actions` |
| View permission dependencies | dependencies | view | `VIEW_PERMISSIONS` | `/permissions/dependencies` |
| View permission groups | groups | view | `VIEW_PERMISSIONS` | `/roles/permission-groups` |
| Create permission group | new group | do | `MANAGE_PERMISSIONS` | `/roles/permission-groups/create` |

### Data Imports
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View import batches | imports, batches | view | `VIEW_IMPORT_BATCHES` | `/data-imports/batches` |
| Upload import batch | new batch, bulk upload, import data | do | `UPLOAD_IMPORT_BATCH` | `/data-imports/batches/new` |
| View import templates | templates | view | `VIEW_IMPORT_TEMPLATES` | `/data-imports/templates` |
| Create import template | new template | do | `CREATE_IMPORT_TEMPLATE` | `/data-imports/templates/new` |

### Export
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View export queues | queues, my exports, downloads | view | - | `/export/queues` |

### Workflow
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View approvals | approval inbox, pending approvals | view | - | `/workflow/approvals` |
| View my submissions | submissions | view | - | `/workflow/my-submissions` |
| View delegations | delegate approvals | view | - | `/workflow/delegations` |
| View workflow instances | all instances | view | `VIEW_WORKFLOW_INSTANCES` | `/workflow/instances` |
| View team load | - | view | `VIEW_WORKFLOW_INSTANCES` | `/workflow/team-load` |
| View workflow templates | - | view | `VIEW_WORKFLOW_TEMPLATES` | `/workflow/templates` |
| Create workflow template | new workflow | do | `MANAGE_WORKFLOW_TEMPLATES` | `/workflow/templates/new` |

### Audit & Security
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View security dashboard | audit, security | view | `VIEW_AUDIT` | `/audit` |
| View audit events | events explorer | view | `VIEW_AUDIT` | `/audit/events` |
| View entity trails | - | view | `VIEW_AUDIT` | `/audit/entity-trails` |
| View live sessions | active sessions | view | `VIEW_AUDIT` | `/audit/sessions` |
| View login attempts | - | view | `VIEW_AUDIT` | `/audit/login-attempts` |
| View account lockouts | lockouts | view | `VIEW_AUDIT` | `/audit/lockouts` |
| View password activity | - | view | `VIEW_AUDIT` | `/audit/password-activity` |
| View proxy sessions | impersonations | view | `VIEW_AUDIT` | `/audit/impersonations` |
| View audit exports | - | view | `EXPORT_AUDIT` | `/audit/exports` |
| New audit export | export audit | do | `EXPORT_AUDIT` | `/audit/exports/new` |
| View compliance rules | - | view | `MANAGE_AUDIT` | `/audit/compliance-rules` |
| Create compliance rule | new rule | do | `MANAGE_AUDIT` | `/audit/compliance-rules/create` |

### Health
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View system health | health, command center | view | `VIEW_HEALTH` | `/health` |
| View uptime | - | view | `VIEW_HEALTH` | `/health/uptime` |
| View API endpoints | api health | view | `VIEW_HEALTH` | `/health/api-endpoints` |
| View jobs & queues | background jobs | view | `VIEW_HEALTH` | `/health/jobs` |
| View incidents | alerts | view | `VIEW_HEALTH` | `/health/incidents` |
| View tenant health | - | view | `VIEW_HEALTH` | `/health/tenants` |
| View SLOs | - | view | `VIEW_HEALTH` | `/health/slos` |

### Notifications, Settings, Support
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View notifications | inbox, my updates | view | - | `/notifications` |
| View notification administration | notif admin | view | any `communication.*` admin key | `/notifications/admin` |
| View settings | configuration | view | any `config.*` view key | `/settings` |
| View support | support tickets, help | view | - | `/support` |
| Raise support ticket | new ticket, contact support | do | - | `/support/tickets/new` |

---

## Finance console
*(all actions additionally require finance module access - same `hasModuleAccess` prefixes the sidebar uses)*

### Ledger & Setup
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View finance dashboard | finance | view | any `finance.*`/`payments.*` | `/finance` |
| View chart of accounts | accounts, COA | view | `FIN_VIEW_ACCOUNTS` | `/finance/setup/accounts` |
| Create GL account | new account | do | `FIN_CREATE_ACCOUNT` | `…/accounts?action=new` *(drawer hook)* |
| View general ledger | GL, journals | view | `FIN_VIEW_JOURNALS` | `/finance/ledger` |
| New journal entry | create journal, post journal | do | `FIN_SUBMIT_JOURNAL` *(confirm)* | `/finance/ledger?action=new` |
| View entities | ledger entities | view | `FIN_VIEW_ENTITIES` | `/finance/setup/entities` |
| Create entity | new entity | do | `FIN_CREATE_ENTITY` | `…/entities?action=new` |
| View fiscal periods | periods | view | `FIN_VIEW_PERIODS` | `/finance/setup/periods` |
| View currencies & FX | fx rates | view | `FIN_VIEW_CURRENCIES` | `/finance/setup/currencies` |
| View tax codes | - | view | `FIN_VIEW_TAX_CODES` | `/finance/setup/tax-codes` |
| Create tax code | new tax code | do | `FIN_CREATE_TAX_CODE` | `…/tax-codes?action=new` |
| View cost centres | cost centers | view | `FIN_VIEW_COST_CENTERS` | `/finance/setup/cost-centers` |
| Create cost centre | new cost centre | do | `FIN_CREATE_COST_CENTER` | `…/cost-centers?action=new` |
| View dimensions | - | view | `FIN_VIEW_DIMENSIONS` | `/finance/setup/dimensions` |

### Receivables
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View customers | payers, customer list | view | `FIN_VIEW_CUSTOMERS` | `/finance/receivables/customers` |
| Create customer | new payer | do | `FIN_CREATE_CUSTOMER` | `…/customers?action=new` |
| View AR invoices | invoices, receivables | view | `FIN_VIEW_INVOICES` | `/finance/receivables/invoices` |
| Create AR invoice | new invoice, raise invoice | do | `FIN_CREATE_INVOICE` | `…/invoices?action=new` |
| View receipts | receipts & allocation | view | `FIN_VIEW_PAYMENTS` | `/finance/receivables/receipts` |
| Record receipt | new receipt, record payment | do | `FIN_RECORD_PAYMENT` | `…/receipts?action=new` |
| View credit notes | debit notes | view | `FIN_VIEW_CREDIT_NOTES` | `/finance/receivables/credit-notes` |
| Create credit note | new credit note | do | `FIN_CREATE_CREDIT_NOTE` | `…/credit-notes?action=new` |
| View refunds & write-offs | refunds, write-offs | view | `FIN_VIEW_REFUNDS` | `/finance/receivables/refunds` |
| Create refund | new refund, raise refund | do | `FIN_CREATE_REFUND` | `…/refunds?action=new` |
| Create write-off | write off invoice | do | `FIN_CREATE_WRITE_OFF` | `…/refunds?action=new-writeoff` |
| View payment plans | instalments | view | `FIN_VIEW_PAYMENT_PLANS` | `/finance/receivables/payment-plans` |
| Create payment plan | new plan | do | `FIN_CREATE_PAYMENT_PLAN` | `…/payment-plans?action=new` |
| View concessions | discounts, scholarships | view | `FIN_VIEW_CONCESSIONS` | `/finance/receivables/concessions` |
| Create concession | new concession | do | `FIN_CREATE_CONCESSION` | `…/concessions?action=new` |
| View dunning | reminders | view | `FIN_VIEW_DUNNING` | `/finance/receivables/dunning` |
| View fee structures | fees | view | `FIN_VIEW_FEE_STRUCTURES` | `/finance/receivables/fee-structures` |
| Create fee structure | new fee structure | do | `FIN_CREATE_FEE_STRUCTURE` | `…/fee-structures?action=new` |

### Operations
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View bank accounts | banking | view | `FIN_VIEW_BANK_ACCOUNTS` | `/finance/banking` |
| Create bank account | new bank account | do | `FIN_CREATE_BANK_ACCOUNT` | `/finance/banking?action=new` |
| View bank reconciliation | recon | view | `FIN_VIEW_BANK_ACCOUNTS` | `/finance/bank-reconciliation` |
| Import bank statement | upload statement | do | `FIN_IMPORT_STATEMENT` | `/finance/bank-reconciliation?action=import` |
| View expense claims | expenses, claims | view | `FIN_VIEW_EXPENSE_CLAIMS` | `/finance/expenses/claims` |
| Create expense claim | new claim, raise expense | do | `FIN_CREATE_EXPENSE_CLAIM` | `…/claims?action=new` |
| View petty cash | - | view | `FIN_VIEW_PETTY_CASH` | `/finance/expenses/petty-cash` |
| New petty cash voucher | petty cash voucher | do | `FIN_CREATE_PETTY_CASH_VOUCHER` | `…/petty-cash?action=new-voucher` |
| View payroll | payroll runs | view | `FIN_VIEW_PAYROLL` | `/finance/payroll` |
| Create payroll run | new payroll | do | `FIN_CREATE_PAYROLL` | `/finance/payroll?action=new` |
| View budgets | forecasts | view | `FIN_VIEW_BUDGETS` | `/finance/budgets/budgets` |
| Create budget | new budget | do | `FIN_CREATE_BUDGET` | `…/budgets?action=new` |
| View fixed assets | assets | view | `FIN_VIEW_FIXED_ASSETS` | `/finance/budgets/assets` |
| Create fixed asset | new asset | do | `FIN_CREATE_FIXED_ASSET` | `…/assets?action=new` |
| View tax remittance | tax | view | `FIN_VIEW_TAX` | `/finance/budgets/tax` |

### Payments
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View collections | - | view | `PAY_VIEW_COLLECTIONS` | `/finance/collections` |
| View virtual accounts | VAs | view | `PAY_VIEW_VIRTUAL_ACCOUNTS` | `/finance/collections/virtual-accounts` |
| Create virtual account | new VA | do | `PAY_CREATE_VIRTUAL_ACCOUNT` | `…/virtual-accounts?action=new` |
| View payouts | payments out | view | `PAY_VIEW_PAYOUTS` | `/finance/payments/payouts` |
| **New payout** | **new payment**, raise payment, send money | do | `PAY_CREATE_PAYOUT` | `…/payouts?action=new` |
| View payout batches | batches | view | `PAY_VIEW_PAYOUTS` | `/finance/payments/batches` |
| View settlement | - | view | `PAY_VIEW_PAYMENT_REPORTS` | `/finance/payments/settlement` |
| View transactions log | transactions | view | `PAY_VIEW_PAYMENT_REPORTS` | `/finance/payments/transactions` |

### Reports & Close
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View trial balance | TB | view | `FIN_VIEW_REPORTS` | `/finance/reports/trial-balance` |
| View income statement | P&L, profit and loss | view | `FIN_VIEW_REPORTS` | `/finance/reports/income-statement` |
| View balance sheet | - | view | `FIN_VIEW_REPORTS` | `/finance/reports/balance-sheet` |
| View cash flow | - | view | `FIN_VIEW_REPORTS` | `/finance/reports/cash-flow` |
| View changes in equity | - | view | `FIN_VIEW_REPORTS` | `/finance/reports/changes-in-equity` |
| View cost & dimension analysis | analytics | view | `FIN_VIEW_REPORTS` | `/finance/reports/analytics` |
| View finance audit trail | - | view | `FIN_VIEW_FINANCE_AUDIT` | `/finance/audit` |

---

## Procurement console
*(all actions additionally require procurement module access)*

### Procure to Pay
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View procurement dashboard | procurement | view | any `procurement.*` | `/procurement` |
| View procurement approvals | purchase approvals, spend approvals | view | entity queue eligibility | `/procurement/approvals` |
| View requisitions | PR, PRs, purchase requisitions | view | `PROC_VIEW_REQUISITIONS` | `/procurement/requisitions` |
| Create requisition | new requisition, raise PR, new PR | do | `PROC_CREATE_REQUISITION` | `…/requisitions?action=new` |
| View purchase orders | PO, POs, purchase order | view | `PROC_VIEW_PURCHASE_ORDERS` | `/procurement/purchase-orders` |
| Create purchase order | new PO | do | `PROC_CREATE_PURCHASE_ORDER` | `…/purchase-orders?action=new` |
| View goods receipts | GRN, GRNs, goods receipt notes | view | `PROC_VIEW_GOODS_RECEIPTS` | `/procurement/goods-receipts` |
| Post goods receipt | new GRN, receive goods | do | `PROC_CREATE_GOODS_RECEIPT` | `…/goods-receipts?action=new` |
| View vendor invoices | AP invoice(s), supplier invoice(s) | view | `PROC_VIEW_VENDOR_INVOICES` | `/procurement/vendor-invoices` |
| Create vendor invoice | new vendor invoice, new AP invoice | do | `PROC_CREATE_VENDOR_INVOICE` | `…/vendor-invoices?action=new` |
| View vendor payments | AP payment(s), supplier payment(s) | view | `PROC_VIEW_VENDOR_PAYMENTS` | `/procurement/vendor-payments` |
| New vendor payment | pay vendor, **new payment** | do | `PROC_CREATE_VENDOR_PAYMENT` | `…/vendor-payments?action=new` |

### Vendors & Catalog / Sourcing / Inventory / Analytics
| Action | Aliases | Kind | Gate | Destination |
|---|---|---|---|---|
| View vendors | vendor, supplier(s), supplier master | view | `PROC_VIEW_VENDORS` | `/procurement/vendors/vendors` |
| Create vendor | new vendor, new/register supplier | do | `PROC_CREATE_VENDOR` | `…/vendors?action=new` |
| View categories | - | view | `PROC_VIEW_CATEGORIES` | `/procurement/vendors/categories` |
| Create category | new category | do | `PROC_CREATE_CATEGORY` | `…/categories?action=new` |
| View catalog | catalog items | view | `PROC_VIEW_CATALOG` | `/procurement/vendors/catalog` |
| Add catalog item | new item | do | `PROC_CREATE_CATALOG_ITEM` | `…/catalog?action=new` |
| View RFQs | RFQ, request(s) for quotation | view | `PROC_VIEW_RFQS` | `/procurement/sourcing/rfqs` |
| Create RFQ | new RFQ | do | `PROC_CREATE_RFQ` | `…/rfqs?action=new` |
| View quotations | quote(s), vendor quotes, supplier quotations | view | `PROC_VIEW_QUOTATIONS` | `/procurement/sourcing/quotations` |
| Create quotation | new quote | do | `PROC_CREATE_QUOTATION` | `…/quotations?action=new` |
| View contracts | - | view | `PROC_VIEW_CONTRACTS` | `/procurement/contracts` |
| Create contract | new contract | do | `PROC_CREATE_CONTRACT` | `/procurement/contracts?action=new` |
| View stock items | inventory, inventory items, stock | view | `PROC_VIEW_STOCK` | `/procurement/inventory/items` |
| Create stock item | new stock item, new inventory item | do | `PROC_MANAGE_STOCK` | `/procurement/inventory/items?action=new` |
| View stock movements | movements, inventory movements, stock ledger | view | `PROC_VIEW_STOCK` | `/procurement/inventory/movements` |
| View procurement analytics | procurement reports, purchasing analytics | view | `PROC_VIEW_PROC_REPORTS` | `/procurement/analytics` |
| View AP aging | - | view | `PROC_VIEW_PROC_REPORTS` | `/procurement/analytics/ap-aging` |
| View GR/IR control | - | view | `PROC_VIEW_PROC_REPORTS` | `/procurement/analytics/grir` |
| View spend analytics | spend | view | `PROC_VIEW_PROC_REPORTS` | `/procurement/analytics/spend` |
| View vendor performance | supplier performance, vendor analytics | view | `PROC_VIEW_PROC_REPORTS` | `/procurement/analytics/performance` |
| Create vendor assessment | new vendor/supplier assessment | do | `PROC_CREATE_VENDOR_ASSESSMENT` | `/procurement/analytics/performance?action=new` |

---

## Build status (2026-07-18)

**Shipped.** The engine, UI and gating are live (commit 4e499b8) and the
`?action=new` drawer hook is wired across every standard create screen
(slice 2). `src/lib/action-palette/` holds the registry + matcher + local
popularity; `useActionSearch` ranks the gated catalog; `useActionParam` opens a
list screen's create drawer on arrival and strips the param.

- **Auto-opening create drawers (32 screens):** launching a `do` action opens
  the form immediately - verified for New payout, Create AR invoice, Create
  vendor; a reload doesn't reopen (param stripped).
- **Navigate-only `do` actions (4)** - these screens have no standard create
  drawer to hook, so the palette lands on the right screen and the user clicks
  the create button: New journal entry (`/finance/ledger`), Import bank
  statement (`/finance/bank-reconciliation`), New petty cash voucher, Create
  write-off (`…/refunds?action=new-writeoff`). Wire these when convenient by
  giving each screen a `useActionParam(...)` against its open-state.

## Open questions (still open)

1. **Short codes** - do you also want SAP-style codes (`po`, `pr`, `grn`, `tb`)?
   The aliases column already carries the obvious ones; say the word and we
   standardise a code per action.
2. **Create school (bulk)** - destination still TBD (Data Imports upload flow,
   or a dedicated bulk screen?). Omitted from the registry until decided.
3. Items marked *(confirm)* had their backend gate assumed at build time
   (e.g. New journal entry → `FIN_SUBMIT_JOURNAL`); confirm against the registry.
