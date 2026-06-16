// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION REGISTRY
//
// Single source of truth. The backend permission keys ("module.resource.action")
// exist ONLY inside REGISTRY below — nowhere else in the codebase.
//
// P.* names describe what the user is doing in the UI, not how the backend
// models the permission. A reader of any other file cannot infer the backend
// key format from the constant name alone.
//
// ── Code format: MM RR AA (6 digits) ─────────────────────────────────────────
//   MM = module group   10=platform  20=finance  30=academics  40=communication
//                       50=imports   60=workflow  70=procurement  80=payments
//   RR = resource       01 02 03 … (assigned sequentially per module)
//   AA = action         01=view   02=create  03=update  04=delete
//                       05=approve  06=export  08=manage
//                       09=suspend  10=reactivate  11=assign  12=transfer
//   Finance/Procurement document actions extend the AA vocabulary:
//                       13=post  14=reverse  15=settle  16=pay  17=reconcile
//                       18=import  19=file  20=allocate  21=writeoff  22=acquire
//                       23=depreciate  24=close  25=generate  26=send
//                       27=activate  28=cancel  29=refresh  30=submit  31=match
//                       32=award  33=issue  34=renew  35=terminate  36=replenish
//                       37=adjust  38=approve_senior  39=view_sensitive  40=establish
//
// ── Adding a permission ───────────────────────────────────────────────────────
//   1. Pick the next free code in the right MM RR range.
//   2. Add  "MMRRAA": "module.resource.action"  to REGISTRY.
//   3. Add a named constant to P that describes the UI capability.
//   4. Use P.YOUR_CONSTANT everywhere — never the raw key or the code directly.
//
// ── Adding a new module ───────────────────────────────────────────────────────
//   1. Pick the next free MM (30, 40, …).
//   2. Start RR at 01 and AA at 01 within that range.
//   3. Add a comment block and constants to P below.
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRY: Record<string, string> = {

  // ── platform / schools  (MM=10, RR=01) ────────────────────────────────────
  "100101": "platform.schools.view",
  "100102": "platform.schools.create",
  "100103": "platform.schools.update",
  "100104": "platform.schools.delete",
  "100108": "platform.schools.manage",

  // ── platform / branches  (MM=10, RR=02) ───────────────────────────────────
  "100201": "platform.branches.view",
  "100202": "platform.branches.create",
  "100203": "platform.branches.update",
  "100208": "platform.branches.manage",

  // ── platform / team  (MM=10, RR=03) ───────────────────────────────────────
  "100301": "platform.team.view",
  "100302": "platform.team.create",
  "100303": "platform.team.update",
  "100304": "platform.team.delete",
  "100309": "platform.team.suspend",
  "100310": "platform.team.reactivate",

  // ── platform / roles  (MM=10, RR=04) ──────────────────────────────────────
  "100401": "platform.roles.view",
  "100402": "platform.roles.create",
  "100403": "platform.roles.update",
  "100404": "platform.roles.delete",
  "100411": "platform.roles.assign",
  "100412": "platform.roles.transfer",

  // ── platform / permissions registry  (MM=10, RR=05) ──────────────────────
  "100501": "platform.permissions.view",
  "100502": "platform.permissions.create",
  "100503": "platform.permissions.update",
  "100504": "platform.permissions.delete",
  "100508": "platform.permissions.manage",

  // ── platform / audit  (MM=10, RR=06) ──────────────────────────────────────
  "100601": "platform.audit.view",
  "100606": "platform.audit.export",
  "100608": "platform.audit.manage",

  // ── platform / security  (MM=10, RR=08) ───────────────────────────────────
  "100801": "platform.security.view",
  "100811": "platform.security.impersonate",
  "100812": "platform.security.end_impersonation",

  // ── platform / dashboard  (MM=10, RR=07) ──────────────────────────────────
  "100701": "platform.dashboard.view",

  // ── platform / organogram  (MM=10, RR=09) ─────────────────────────────────
  "100901": "platform.organogram.view",
  "100908": "platform.organogram.manage",

  // ── platform / staff profile  (MM=10, RR=10) ──────────────────────────────
  "101001": "platform.staff_profile.view",
  "101002": "platform.staff_profile.create",
  "101003": "platform.staff_profile.update",

  // ── platform / staff payroll (FLS-gated)  (MM=10, RR=11) ───────────────────
  "101101": "platform.staff_payroll.view",
  "101108": "platform.staff_payroll.manage",

  // ── imports / templates  (MM=50, RR=01) ──────────────────────────────────
  "500101": "import.templates.view",
  "500102": "import.templates.create",
  "500108": "import.templates.manage",

  // ── imports / batches  (MM=50, RR=02) ────────────────────────────────────
  "500201": "import.batches.view",
  "500202": "import.batches.create",
  "500203": "import.batches.update",
  "500204": "import.batches.delete",
  "500207": "import.batches.run",      // trigger validation / re-validate
  "500213": "import.batches.import",   // trigger import execution

  // ── imports / validations  (MM=50, RR=03) ────────────────────────────────
  "500301": "import.validations.view",
  "500303": "import.validations.update",

  // ── imports / jobs  (MM=50, RR=05) ───────────────────────────────────────
  "500501": "import.jobs.view",

  // ── imports / rollbacks  (MM=50, RR=06) ──────────────────────────────────
  "500601": "import.rollbacks.view",
  "500607": "import.rollbacks.run",

  // ── imports / audit + notifications  (MM=50, RR=07/08) ───────────────────
  "500701": "import.audit.view",
  "500801": "import.notifications.view",

  // ── workflow / templates  (MM=60, RR=01) ─────────────────────────────────
  "600101": "workflow.template.view",
  "600108": "workflow.template.manage",

  // ── workflow / instances  (MM=60, RR=02) ─────────────────────────────────
  "600201": "workflow.instance.view",
  "600202": "workflow.instance.submit",   // submit a document for approval
  "600204": "workflow.instance.cancel",   // admin terminates a stuck instance

  // ── workflow / actions  (MM=60, RR=03) ───────────────────────────────────
  "600305": "workflow.action.reverse",    // admin reverses a recorded vote

  // ── FINANCE  (MM=20) ───────────────────────────────────────────────────────
  // Resource map (RR): 01 entity · 02 account · 03 period · 04 journal ·
  // 05 invoice · 06 creditnote · 07 refund · 08 concession · 09 paymentplan ·
  // 10 dunning · 11 directentry · 12 report · 13 currency · 14 fxrate ·
  // 15 taxcode · 16 costcenter · 17 dimension · 18 bankaccount · 19 expenseclaim ·
  // 20 pettycash · 21 tax · 22 payrollrun · 23 budget · 24 fixedasset · 25 audit.
  // Every key matches an rbac_permission on a vs_finance view (verified against source).
  "200101": "finance.entity.view",
  "200102": "finance.entity.create",
  "200201": "finance.account.view",
  "200301": "finance.period.view",
  "200324": "finance.period.close",
  "200401": "finance.journal.view",
  "200413": "finance.journal.post",
  "200414": "finance.journal.reverse",
  "200501": "finance.invoice.view",
  "200521": "finance.invoice.writeoff",
  "200601": "finance.creditnote.view",
  "200602": "finance.creditnote.create",
  "200613": "finance.creditnote.post",
  "200620": "finance.creditnote.allocate",
  "200701": "finance.refund.view",
  "200702": "finance.refund.create",
  "200713": "finance.refund.post",
  "200801": "finance.concession.view",
  "200802": "finance.concession.create",
  "200813": "finance.concession.post",
  "200901": "finance.paymentplan.view",
  "200902": "finance.paymentplan.create",
  "200927": "finance.paymentplan.activate",
  "200928": "finance.paymentplan.cancel",
  "201001": "finance.dunning.view",
  "201008": "finance.dunning.manage",
  "201025": "finance.dunning.generate",
  "201026": "finance.dunning.send",
  "201113": "finance.directentry.post",
  "201201": "finance.report.view",
  "201301": "finance.currency.view",
  "201302": "finance.currency.create",
  "201401": "finance.fxrate.view",
  "201402": "finance.fxrate.create",
  "201501": "finance.taxcode.view",
  "201502": "finance.taxcode.create",
  "201601": "finance.costcenter.view",
  "201602": "finance.costcenter.create",
  "201701": "finance.dimension.view",
  "201702": "finance.dimension.create",
  "201801": "finance.bankaccount.view",
  "201802": "finance.bankaccount.create",
  "201817": "finance.bankaccount.reconcile",
  "201818": "finance.bankaccount.import",
  "201839": "finance.bankaccount.view_sensitive",
  "201901": "finance.expenseclaim.view",
  "201902": "finance.expenseclaim.create",
  "201913": "finance.expenseclaim.post",
  "201915": "finance.expenseclaim.settle",
  "202001": "finance.pettycash.view",
  "202002": "finance.pettycash.create",
  "202008": "finance.pettycash.manage",
  "202013": "finance.pettycash.post",
  "202036": "finance.pettycash.replenish",
  "202101": "finance.tax.view",
  "202108": "finance.tax.manage",
  "202116": "finance.tax.pay",
  "202119": "finance.tax.file",
  "202201": "finance.payrollrun.view",
  "202202": "finance.payrollrun.create",
  "202213": "finance.payrollrun.post",
  "202216": "finance.payrollrun.pay",
  "202239": "finance.payrollrun.view_sensitive",
  "202301": "finance.budget.view",
  "202302": "finance.budget.create",
  "202303": "finance.budget.edit",
  "202305": "finance.budget.approve",
  "202401": "finance.fixedasset.view",
  "202402": "finance.fixedasset.create",
  "202422": "finance.fixedasset.acquire",
  "202423": "finance.fixedasset.depreciate",
  "202501": "finance.audit.view",
  "202601": "finance.customer.view",
  "202602": "finance.customer.create",
  "202701": "finance.feestructure.view",
  "202702": "finance.feestructure.create",
  "202725": "finance.feestructure.generate",

  // ── PROCUREMENT  (MM=70) ─────────────────────────────────────────────────────
  // RR: 01 category · 02 vendor · 03 catalog_item · 04 contract · 05 requisition ·
  // 06 rfq · 07 quotation · 08 purchase_order · 09 goods_receipt · 10 vendor_invoice ·
  // 11 vendor_payment · 12 approval · 13 stock · 14 report.
  "700101": "procurement.category.view",
  "700102": "procurement.category.create",
  "700201": "procurement.vendor.view",
  "700202": "procurement.vendor.create",
  "700239": "procurement.vendor.view_sensitive",
  "700301": "procurement.catalog_item.view",
  "700302": "procurement.catalog_item.create",
  "700303": "procurement.catalog_item.update",
  "700401": "procurement.contract.view",
  "700402": "procurement.contract.create",
  "700403": "procurement.contract.update",
  "700427": "procurement.contract.activate",
  "700434": "procurement.contract.renew",
  "700435": "procurement.contract.terminate",
  "700501": "procurement.requisition.view",
  "700502": "procurement.requisition.create",
  "700530": "procurement.requisition.submit",
  "700601": "procurement.rfq.view",
  "700602": "procurement.rfq.create",
  "700633": "procurement.rfq.issue",
  "700701": "procurement.quotation.view",
  "700702": "procurement.quotation.create",
  "700730": "procurement.quotation.submit",
  "700732": "procurement.quotation.award",
  "700801": "procurement.purchase_order.view",
  "700802": "procurement.purchase_order.create",
  "700830": "procurement.purchase_order.submit",
  "700901": "procurement.goods_receipt.view",
  "700902": "procurement.goods_receipt.create",
  "700913": "procurement.goods_receipt.post",
  "701001": "procurement.vendor_invoice.view",
  "701002": "procurement.vendor_invoice.create",
  "701013": "procurement.vendor_invoice.post",
  "701030": "procurement.vendor_invoice.submit",
  "701031": "procurement.vendor_invoice.match",
  "701101": "procurement.vendor_payment.view",
  "701102": "procurement.vendor_payment.create",
  "701113": "procurement.vendor_payment.post",
  "701205": "procurement.approval.approve",
  "701208": "procurement.approval.manage",
  "701238": "procurement.approval.approve_senior",
  "701301": "procurement.stock.view",
  "701308": "procurement.stock.manage",
  "701333": "procurement.stock.issue",
  "701337": "procurement.stock.adjust",
  "701401": "procurement.report.view",

  // ── PAYMENTS  (MM=80) ────────────────────────────────────────────────────────
  // RR: 01 collection · 02 virtual_account · 03 payout · 04 report.
  "800101": "payments.collection.view",
  "800102": "payments.collection.create",
  "800202": "payments.virtual_account.create",
  "800239": "payments.virtual_account.view_sensitive",
  "800301": "payments.payout.view",
  "800302": "payments.payout.create",
  "800339": "payments.payout.view_sensitive",
  "800401": "payments.report.view",

  // ── academics / subjects  (MM=30, RR=01) — uncomment when module ships ────
  // "300101": "academics.subjects.view",
  // "300102": "academics.subjects.create",

};

// ─────────────────────────────────────────────────────────────────────────────
// Public constants
// Names describe UI capabilities — not backend keys or permission structure.
// ─────────────────────────────────────────────────────────────────────────────
export const P = {

  // ── School Management ──────────────────────────────────────────────────────
  BROWSE_SCHOOLS:       "100101",  // view the school list and detail pages
  ONBOARD_SCHOOL:       "100102",  // register and add a new school
  MODIFY_SCHOOL:        "100103",  // edit school info and settings
  DECOMMISSION_SCHOOL:  "100104",  // permanently remove a school record
  MANAGE_SCHOOL:        "100108",  // reset config, manage school-level settings

  // ── Branch Management ──────────────────────────────────────────────────────
  BROWSE_BRANCHES:      "100201",  // view branches under a school
  ADD_BRANCH:           "100202",  // add a new branch to a school
  MODIFY_BRANCH:        "100203",  // edit branch details
  MANAGE_BRANCH:        "100208",  // transition branch lifecycle (active → suspended → closed)

  // ── Team Management ────────────────────────────────────────────────────────
  ACCESS_TEAM_PANEL:    "100301",  // view staff list and member profiles
  INVITE_TEAM_MEMBER:   "100302",  // invite a new CX staff member
  MODIFY_TEAM_MEMBER:   "100303",  // edit an existing team member's profile
  DISMISS_TEAM_MEMBER:  "100304",  // permanently delete a staff account
  SUSPEND_TEAM_MEMBER:  "100309",  // suspend a staff account
  REACTIVATE_TEAM_MEMBER: "100310", // reactivate a suspended or locked account

  // ── Roles ──────────────────────────────────────────────────────────────────
  VIEW_ROLES:           "100401",  // see available platform roles and assignments
  DEFINE_ROLE:          "100402",  // create a new platform role
  MODIFY_ROLE:          "100403",  // edit a role's permissions and metadata
  REVOKE_ROLE:          "100404",  // delete a platform role template
  ASSIGN_ROLE:          "100411",  // assign or revoke platform roles from users
  TRANSFER_SUPER_ADMIN: "100412",  // transfer the super admin role to another user

  // ── Permission Registry ────────────────────────────────────────────────────
  VIEW_PERMISSIONS:     "100501",  // view the global permission registry
  CREATE_PERMISSION:    "100502",  // add new permissions, modules, resources, or actions
  MODIFY_PERMISSION:    "100503",  // edit permission metadata
  DELETE_PERMISSION:    "100504",  // delete a permission from the registry
  MANAGE_PERMISSIONS:   "100508",  // manage groups, dependencies, and vocabulary

  // ── Audit & Compliance ─────────────────────────────────────────────────────
  VIEW_AUDIT:           "100601",  // view audit events and entity trails
  EXPORT_AUDIT:         "100606",  // export audit data to file
  MANAGE_AUDIT:         "100608",  // create and manage compliance rules

  // ── Security ───────────────────────────────────────────────────────────────
  VIEW_SECURITY:        "100801",  // view live sessions, login attempts, lockouts, impersonations
  IMPERSONATE_USER:     "100811",  // start an admin impersonation session
  END_IMPERSONATION:    "100812",  // forcibly end an active impersonation session

  // ── Data Imports ───────────────────────────────────────────────────────────
  VIEW_IMPORT_TEMPLATES:   "500101",  // browse system import templates
  CREATE_IMPORT_TEMPLATE:  "500102",  // CX_STAFF: define new templates
  MANAGE_IMPORT_TEMPLATES: "500108",  // CX_STAFF: edit drafts, publish, retire
  VIEW_IMPORT_BATCHES:     "500201",  // browse import batches
  UPLOAD_IMPORT_BATCH:     "500202",  // upload a new batch
  EDIT_IMPORT_BATCH:       "500203",  // edit batch metadata (notes, sheet, header row)
  DELETE_IMPORT_BATCH:     "500204",  // delete an import batch
  RUN_IMPORT_VALIDATION:   "500207",  // trigger validation pass
  EXECUTE_IMPORT_BATCH:    "500213",  // start actual import
  VIEW_IMPORT_ISSUES:      "500301",  // view validation issues
  RESOLVE_IMPORT_ISSUE:    "500303",  // mark validation issues resolved
  VIEW_IMPORT_JOBS:        "500501",  // view import job results
  VIEW_IMPORT_ROLLBACKS:   "500601",  // view rollback history
  RUN_IMPORT_ROLLBACK:     "500607",  // trigger a job rollback
  VIEW_IMPORT_AUDIT:       "500701",  // view per-batch audit log
  VIEW_IMPORT_NOTIFICATIONS: "500801", // view per-batch notification log

  // ── Workflow & Approvals ─────────────────────────────────────────────────────
  VIEW_WORKFLOW_TEMPLATES:   "600101",  // browse approval workflow templates
  MANAGE_WORKFLOW_TEMPLATES: "600108",  // publish/edit workflow templates
  VIEW_WORKFLOW_INSTANCES:   "600201",  // view all workflow instances (admin monitoring)
  SUBMIT_WORKFLOW:           "600202",  // submit a document for approval
  CANCEL_WORKFLOW:           "600204",  // admin-cancel a stuck instance
  REVERSE_WORKFLOW_ACTION:   "600305",  // admin-reverse a recorded approver vote

  // ── Dashboard ──────────────────────────────────────────────────────────────
  VIEW_DASHBOARD:       "100701",  // view admin dashboard metrics and statistics

  // ── Organogram ─────────────────────────────────────────────────────────────
  VIEW_ORGANOGRAM:      "100901",  // view the org chart: departments, positions, assignments
  MANAGE_ORGANOGRAM:    "100908",  // create/edit departments, positions, assignments, matrix lines

  // ── Staff profiles ─────────────────────────────────────────────────────────
  VIEW_STAFF_PROFILE:   "101001",  // view CX-staff HR/personal profiles
  CREATE_STAFF_PROFILE: "101002",  // create a staff profile for a CX user
  MODIFY_STAFF_PROFILE: "101003",  // edit a staff profile

  // ── Staff payroll (sensitive, field-level secured) ─────────────────────────
  VIEW_STAFF_PAYROLL:   "101101",  // read bank/account details on staff profiles
  MANAGE_STAFF_PAYROLL: "101108",  // edit bank/account details on staff profiles

  // ── Finance ─────────────────────────────────────────────────────────────────
  // Per-control gating key = the rbac_permission on the backend view it calls.
  // Whole-console visibility uses hasModuleAccess("finance.","payments.") instead.
  FIN_VIEW_ENTITIES:        "200101",
  FIN_CREATE_ENTITY:        "200102",
  FIN_VIEW_ACCOUNTS:        "200201",
  FIN_VIEW_PERIODS:         "200301",
  FIN_CLOSE_PERIOD:         "200324",
  FIN_VIEW_JOURNALS:        "200401",
  FIN_POST_JOURNAL:         "200413",
  FIN_REVERSE_JOURNAL:      "200414",
  FIN_VIEW_INVOICES:        "200501",
  FIN_WRITE_OFF_INVOICE:    "200521",
  FIN_VIEW_CREDIT_NOTES:    "200601",
  FIN_CREATE_CREDIT_NOTE:   "200602",
  FIN_POST_CREDIT_NOTE:     "200613",
  FIN_ALLOCATE_CREDIT_NOTE: "200620",
  FIN_VIEW_REFUNDS:         "200701",
  FIN_CREATE_REFUND:        "200702",
  FIN_POST_REFUND:          "200713",
  FIN_VIEW_CONCESSIONS:     "200801",
  FIN_CREATE_CONCESSION:    "200802",
  FIN_POST_CONCESSION:      "200813",
  FIN_VIEW_PAYMENT_PLANS:   "200901",
  FIN_CREATE_PAYMENT_PLAN:  "200902",
  FIN_ACTIVATE_PAYMENT_PLAN:"200927",
  FIN_CANCEL_PAYMENT_PLAN:  "200928",
  FIN_VIEW_DUNNING:         "201001",
  FIN_MANAGE_DUNNING:       "201008",
  FIN_GENERATE_DUNNING:     "201025",
  FIN_SEND_DUNNING:         "201026",
  FIN_VIEW_CUSTOMERS:       "202601",
  FIN_CREATE_CUSTOMER:      "202602",
  FIN_VIEW_FEE_STRUCTURES:  "202701",
  FIN_CREATE_FEE_STRUCTURE: "202702",
  FIN_GENERATE_FEE_STRUCTURE: "202725",
  FIN_POST_DIRECT_ENTRY:    "201113",
  FIN_VIEW_REPORTS:         "201201",
  FIN_VIEW_CURRENCIES:      "201301",
  FIN_CREATE_CURRENCY:      "201302",
  FIN_VIEW_FX_RATES:        "201401",
  FIN_CREATE_FX_RATE:       "201402",
  FIN_VIEW_TAX_CODES:       "201501",
  FIN_CREATE_TAX_CODE:      "201502",
  FIN_VIEW_COST_CENTERS:    "201601",
  FIN_CREATE_COST_CENTER:   "201602",
  FIN_VIEW_DIMENSIONS:      "201701",
  FIN_CREATE_DIMENSION:     "201702",
  FIN_VIEW_BANK_ACCOUNTS:   "201801",
  FIN_CREATE_BANK_ACCOUNT:  "201802",
  FIN_RECONCILE_BANK:       "201817",
  FIN_IMPORT_STATEMENT:     "201818",
  FIN_VIEW_BANK_SENSITIVE:  "201839",
  FIN_VIEW_EXPENSE_CLAIMS:  "201901",
  FIN_CREATE_EXPENSE_CLAIM: "201902",
  FIN_POST_EXPENSE_CLAIM:   "201913",
  FIN_SETTLE_EXPENSE_CLAIM: "201915",
  FIN_VIEW_PETTY_CASH:      "202001",
  FIN_CREATE_PETTY_CASH:    "202002",
  FIN_MANAGE_PETTY_CASH:    "202008",
  FIN_POST_PETTY_CASH:      "202013",
  FIN_REPLENISH_PETTY_CASH: "202036",
  FIN_VIEW_TAX:             "202101",
  FIN_MANAGE_TAX:           "202108",
  FIN_PAY_TAX:              "202116",
  FIN_FILE_TAX:             "202119",
  FIN_VIEW_PAYROLL:         "202201",
  FIN_CREATE_PAYROLL:       "202202",
  FIN_POST_PAYROLL:         "202213",
  FIN_PAY_PAYROLL:          "202216",
  FIN_VIEW_PAYROLL_SENSITIVE:"202239",
  FIN_VIEW_BUDGETS:         "202301",
  FIN_CREATE_BUDGET:        "202302",
  FIN_EDIT_BUDGET:          "202303",
  FIN_APPROVE_BUDGET:       "202305",
  FIN_VIEW_FIXED_ASSETS:    "202401",
  FIN_CREATE_FIXED_ASSET:   "202402",
  FIN_ACQUIRE_FIXED_ASSET:  "202422",
  FIN_DEPRECIATE_FIXED_ASSET:"202423",
  FIN_VIEW_FINANCE_AUDIT:   "202501",

  // ── Procurement ─────────────────────────────────────────────────────────────
  PROC_VIEW_CATEGORIES:     "700101",
  PROC_CREATE_CATEGORY:     "700102",
  PROC_VIEW_VENDORS:        "700201",
  PROC_CREATE_VENDOR:       "700202",
  PROC_VIEW_VENDOR_SENSITIVE:"700239",
  PROC_VIEW_CATALOG:        "700301",
  PROC_CREATE_CATALOG_ITEM: "700302",
  PROC_UPDATE_CATALOG_ITEM: "700303",
  PROC_VIEW_CONTRACTS:      "700401",
  PROC_CREATE_CONTRACT:     "700402",
  PROC_UPDATE_CONTRACT:     "700403",
  PROC_ACTIVATE_CONTRACT:   "700427",
  PROC_RENEW_CONTRACT:      "700434",
  PROC_TERMINATE_CONTRACT:  "700435",
  PROC_VIEW_REQUISITIONS:   "700501",
  PROC_CREATE_REQUISITION:  "700502",
  PROC_SUBMIT_REQUISITION:  "700530",
  PROC_VIEW_RFQS:           "700601",
  PROC_CREATE_RFQ:          "700602",
  PROC_ISSUE_RFQ:           "700633",
  PROC_VIEW_QUOTATIONS:     "700701",
  PROC_CREATE_QUOTATION:    "700702",
  PROC_SUBMIT_QUOTATION:    "700730",
  PROC_AWARD_QUOTATION:     "700732",
  PROC_VIEW_PURCHASE_ORDERS:"700801",
  PROC_CREATE_PURCHASE_ORDER:"700802",
  PROC_SUBMIT_PURCHASE_ORDER:"700830",
  PROC_VIEW_GOODS_RECEIPTS: "700901",
  PROC_CREATE_GOODS_RECEIPT:"700902",
  PROC_POST_GOODS_RECEIPT:  "700913",
  PROC_VIEW_VENDOR_INVOICES:"701001",
  PROC_CREATE_VENDOR_INVOICE:"701002",
  PROC_POST_VENDOR_INVOICE: "701013",
  PROC_SUBMIT_VENDOR_INVOICE:"701030",
  PROC_MATCH_VENDOR_INVOICE:"701031",
  PROC_VIEW_VENDOR_PAYMENTS:"701101",
  PROC_CREATE_VENDOR_PAYMENT:"701102",
  PROC_POST_VENDOR_PAYMENT: "701113",
  PROC_APPROVE_SPEND:       "701205",
  PROC_MANAGE_APPROVALS:    "701208",
  PROC_APPROVE_SPEND_SENIOR:"701238",
  PROC_VIEW_STOCK:          "701301",
  PROC_MANAGE_STOCK:        "701308",
  PROC_ISSUE_STOCK:         "701333",
  PROC_ADJUST_STOCK:        "701337",
  PROC_VIEW_PROC_REPORTS:   "701401",

  // ── Payments ────────────────────────────────────────────────────────────────
  PAY_VIEW_COLLECTIONS:     "800101",
  PAY_CREATE_COLLECTION:    "800102",
  PAY_CREATE_VIRTUAL_ACCOUNT:"800202",
  PAY_VIEW_VA_SENSITIVE:    "800239",
  PAY_VIEW_PAYOUTS:         "800301",
  PAY_CREATE_PAYOUT:        "800302",
  PAY_VIEW_PAYOUT_SENSITIVE:"800339",
  PAY_VIEW_PAYMENT_REPORTS: "800401",

  // ── Academics (uncomment when module ships) ────────────────────────────────
  // BROWSE_SUBJECTS:   "300101",
  // ADD_SUBJECT:       "300102",

} as const;

export type PermissionCode = (typeof P)[keyof typeof P];

// Internal resolver — used only by usePermissions and PermissionGate.
export function resolvePermissionKey(code: PermissionCode): string {
  return REGISTRY[code] ?? "";
}
