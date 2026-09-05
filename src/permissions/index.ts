/**
 * PERMISSION REGISTRY
 *
 * Single source of truth. The backend permission keys ("module.resource.action")
 * exist ONLY inside REGISTRY below - nowhere else in the codebase.
 *
 * P.* names describe what the user is doing in the UI, not how the backend
 * models the permission. A reader of any other file cannot infer the backend
 * key format from the constant name alone.
 *
 * ── Code format: MM RR AA (6 digits) ─────────────────────────────────────────
 *   MM = module group   10=platform  20=finance  30=academics  40=communication
 *                       50=imports   60=workflow  70=procurement  80=payments
 *                       90=config    91=tickets   92=exports
 *   RR = resource       01 02 03 … (assigned sequentially per module)
 *   AA = action         01=view   02=create  03=update  04=delete
 *                       05=approve  06=export  08=manage
 *                       09=suspend  10=reactivate  11=assign  12=transfer
 *   Finance/Procurement document actions extend the AA vocabulary:
 *                       13=post  14=reverse  15=settle  16=pay  17=reconcile
 *                       18=import  19=file  20=allocate  21=writeoff  22=acquire
 *                       23=depreciate  24=close  25=generate  26=send
 *                       27=activate  28=cancel  29=refresh  30=submit  31=match
 *                       32=award  33=issue  34=renew  35=terminate  36=replenish
 *                       37=adjust  38=approve_senior  39=view_sensitive  40=establish
 *                       41=dispose  42=reopen  43=lock  44=approve_high_value
 *                       45=share  46=download  47=override_variance  48=replay
 *                       49=attach  50=email  51=email_statement  52=reject
 *                       53=view_all (every tenant, not only the caller's own)
 *
 * ── Adding a permission ───────────────────────────────────────────────────────
 *   1. Pick the next free code in the right MM RR range.
 *   2. Add  "MMRRAA": "module.resource.action"  to REGISTRY.
 *   3. Add a named constant to P that describes the UI capability.
 *   4. Use P.YOUR_CONSTANT everywhere - never the raw key or the code directly.
 *
 * ── Adding a new module ───────────────────────────────────────────────────────
 *   1. Pick the next free MM (30, 40, …).
 *   2. Start RR at 01 and AA at 01 within that range.
 *   3. Add a comment block and constants to P below.
 */

const REGISTRY_BASE: Record<string, string> = {

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
  "101201": "platform.health.view",
  "101208": "platform.health.manage",

  // ── platform / per-user permission exceptions  (MM=10, RR=13) ──────────────
  // CRITICAL + restricted. Seeing that a user HAS exceptions is itself
  // sensitive - without `.view` the affected user must not learn they exist.
  "101301": "platform.team_overrides.view",
  "101308": "platform.team_overrides.manage",

  // ── platform / requirements document library  (MM=10, RR=14) ───────────────
  // CX-internal product specs (the MRD and the per-module FRDs). The backend
  // additionally requires the caller's home tenant to be the platform one, so
  // this key on a school-tenant role grants nothing.
  "101401": "platform.documents.view",

  // ── platform / school onboarding progress  (MM=10, RR=15) ──────────────────
  // A different backend namespace ("onboarding.", not "platform."), because the
  // keys are TENANT-scoped and a school holds them for its own onboarding. The
  // decisions CodeX makes ABOUT a school - reinstating one, approving its
  // go-live - are additionally gated backend-side on the caller's own tenant
  // being the platform one, so holding the key inside a school grants nothing.
  //
  "101510": "onboarding.progress.reactivate",

  // ── platform / school go-live decisions  (MM=10, RR=16) ────────────────────
  // The queue and the two decisions taken from it. `view` is held by both
  // sides: a school reads its own request history with the same key CodeX
  // reads every school's queue with, and which rows come back is decided by
  // the caller's tenant kind rather than by the key.
  "101601": "onboarding.go_live.view",
  "101605": "onboarding.go_live.approve",
  "101652": "onboarding.go_live.reject",

  // ── platform / background task monitor  (MM=10, RR=17) ─────────────────────
  // Three keys, and the split is the point. `.view` carries the REDACTED queue
  // and both platform roles hold it. The other two are CRITICAL and seeded to
  // the Super Admin alone: `.view_all` reads every tenant at once, and
  // `.view_sensitive` reads the raw failure text, which routinely contains the
  // value a database constraint rejected - a guardian's email address, say.
  // Reading it writes an audit event against the school's own tenant.
  "101701": "platform.tasks.view",
  "101753": "platform.tasks.view_all",
  "101739": "platform.tasks.view_sensitive",

  // ── communication / global notifications  (MM=40) ────────────────────────
  "400108": "communication.notification_templates.configure",
  "400208": "communication.communication_permissions.enforce",
  "400307": "communication.message_activity.audit",

  // ── configuration catalogue and scoped values  (MM=90) ───────────────────
  "900101": "config.definition.view",
  "900102": "config.definition.create",
  "900103": "config.definition.update",
  "900104": "config.definition.archive",
  "900201": "config.value.view",
  "900203": "config.value.update",
  "900301": "config.capability.view",
  "900308": "config.capability.manage",
  "900401": "config.entitlement.view",
  "900408": "config.entitlement.manage",
  "900501": "config.override.view",
  "900508": "config.override.manage",
  "900601": "config.audit.view",
  "900606": "config.audit.export",
  "900702": "config.export.create",
  "900801": "config.security.view",
  "900808": "config.security.manage",
  "900901": "config.integration.view",
  "900908": "config.integration.manage",

  // ── support tickets  (MM=91) ──────────────────────────────────────────────
  "910101": "tickets.ticket.view",
  "910103": "tickets.ticket.update",
  "910108": "tickets.ticket.manage",
  "910111": "tickets.ticket.assign",
  "910205": "tickets.comment.post",
  "910305": "tickets.internal_note.post",
  "910402": "tickets.attachment.create",
  "910501": "tickets.audit.view",
  "910601": "tickets.report.view",

  // ── Export Centre  (MM=92) - vs_exports.constants.ExportPermission ────────
  "920101": "exports.catalogue.view",
  "920201": "exports.definition.view",
  "920202": "exports.definition.create",
  "920203": "exports.definition.update",
  "920204": "exports.definition.delete",
  "920245": "exports.definition.share",
  "920301": "exports.run.view",
  "920302": "exports.run.create",
  "920328": "exports.run.cancel",
  "920446": "exports.file.download",
  // Not granted with the rest by seed_exports_permissions: including a
  // restricted column is a separate decision from being allowed to export, and
  // reading other people's export activity is an admin power whose read is
  // itself audited.
  "920506": "exports.sensitive_field.export",
  "920601": "exports.activity.view",

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
  "600108": "workflow.template.manage",

  // ── workflow / instances  (MM=60, RR=02) ─────────────────────────────────
  "600201": "workflow.instance.view",
  "600202": "workflow.instance.submit",   // submit a document for approval
  "600204": "workflow.instance.cancel",   // admin terminates a stuck instance

  // ── workflow / actions  (MM=60, RR=03) ───────────────────────────────────
  "600305": "workflow.action.reverse",    // admin reverses a recorded vote

  // ── workflow / approver groups  (MM=60, RR=04) ───────────────────────────
  "600401": "workflow.group.view",
  "600408": "workflow.group.manage",      // create groups and edit membership

  // ── FINANCE  (MM=20) ───────────────────────────────────────────────────────
  // Resource map (RR): 01 entity · 02 account · 03 period · 04 journal ·
  // 05 invoice · 06 creditnote · 07 refund · 08 concession · 09 paymentplan ·
  // 10 dunning · 11 directentry · 12 report · 13 currency · 14 fxrate ·
  // 15 taxcode · 16 costcenter · 17 dimension · 18 bankaccount · 19 expenseclaim ·
  // 20 pettycash · 21 tax · 22 payrollrun · 23 budget · 24 fixedasset · 25 audit ·
  // 26 customer · 27 feestructure · 28 payment · 29 pettycashvoucher · 30 salary ·
  // 31 writeoff · 32 settings.
  // Every key matches an rbac_permission on a vs_finance view (verified against source).
  "200201": "finance.account.view",
  "200401": "finance.journal.view",
  "200413": "finance.journal.post",
  "200405": "finance.journal.approve",
  "200438": "finance.journal.approve_high_value",
  "200501": "finance.invoice.view",
  "202801": "finance.payment.view",
  "200601": "finance.creditnote.view",
  "200630": "finance.creditnote.submit",
  "200613": "finance.creditnote.post",
  "200701": "finance.refund.view",
  "200705": "finance.refund.approve",
  "200738": "finance.refund.approve_high_value",
  "200801": "finance.concession.view",
  "200901": "finance.paymentplan.view",
  "201001": "finance.dunning.view",
  "201301": "finance.currency.view",
  "201302": "finance.currency.create",
  "201401": "finance.fxrate.view",
  "201501": "finance.taxcode.view",
  "201601": "finance.costcenter.view",
  "201701": "finance.dimension.view",
  "201801": "finance.bankaccount.view",
  "201839": "finance.bankaccount.view_sensitive",
  "201901": "finance.expenseclaim.view",
  "202001": "finance.pettycash.view",
  "202002": "finance.pettycash.create",
  "202003": "finance.pettycash.update",
  "202008": "finance.pettycash.manage",       // orphan - superseded by the split below
  "202013": "finance.pettycash.post",         // orphan - now finance.pettycashvoucher.post
  // petty cash *voucher* - split out as its own resource (RR=29)
  "202901": "finance.pettycashvoucher.view",
  "202101": "finance.tax.view",
  "202201": "finance.payrollrun.view",
  "202239": "finance.payrollrun.view_sensitive",
  "202301": "finance.budget.view",
  "202303": "finance.budget.edit",
  "202401": "finance.fixedasset.view",
  "202501": "finance.audit.view",
  "202601": "finance.customer.view",
  "202701": "finance.feestructure.view",
  // salary roster / structures - own resource so editing them isn't conflated with
  // running payroll (pay-figure FLS visibility stays on finance.payrollrun.view_sensitive)
  "203001": "finance.salary.view",
  "203101": "finance.writeoff.view",
  "203105": "finance.writeoff.approve",
  "203138": "finance.writeoff.approve_high_value",

  // ── PROCUREMENT  (MM=70) ─────────────────────────────────────────────────────
  // RR: 01 category · 02 vendor · 03 catalog_item · 04 contract · 05 requisition ·
  // 06 rfq · 07 quotation · 08 purchase_order · 09 goods_receipt · 10 vendor_invoice ·
  // 11 vendor_payment · 12 approval · 13 stock · 14 report · 15 assessment ·
  // 16 settings · 17 competitive-policy exceptions.
  "700101": "procurement.category.view",
  "700201": "procurement.vendor.view",
  "700301": "procurement.catalog_item.view",
  "700501": "procurement.requisition.view",
  "700601": "procurement.rfq.view",
  "700701": "procurement.quotation.view",
  "700901": "procurement.goods_receipt.view",
  "701101": "procurement.vendor_payment.view",
  "701205": "procurement.approval.approve",
  "701208": "procurement.approval.manage",
  "701238": "procurement.approval.approve_senior",

  // ── PAYMENTS  (MM=80) ────────────────────────────────────────────────────────
  // RR: 01 collection · 02 virtual_account · 03 payout · 04 report · 05 payout_batch
  //     · 06 webhook · 07 unattributed_webhook.
  "800101": "payments.collection.view",
  "800201": "payments.virtual_account.view",
  "800239": "payments.virtual_account.view_sensitive",
  "800301": "payments.payout.view",
  "800339": "payments.payout.view_sensitive",
  "800401": "payments.report.view",
  // bulk-payout-batch approval (maker-checker over the highest-risk cash-out path)
  "800505": "payments.payout_batch.approve",
  "800544": "payments.payout_batch.approve_high_value",
  // inbound provider webhooks that could not be booked (money moved, we did not record it)
  "800601": "payments.webhook.view",
  // the platform-scope half: events that matched neither a collection nor a payout and
  // so belong to no entity. Separate resource because the reach is different - these
  // span every tenant, and the backend additionally requires CX (platform) staff.
  "800701": "payments.unattributed_webhook.view",
  "800748": "payments.unattributed_webhook.replay",

  // ── academics / subjects  (MM=30, RR=01) - uncomment when module ships ────
  // "300101": "academics.subjects.view",
  // "300102": "academics.subjects.create",

}

// The finance codes ship with their own mappings; see @xvs/finance.
const REGISTRY: Record<string, string> = { ...FINANCE_REGISTRY, ...REGISTRY_BASE };;

// ─────────────────────────────────────────────────────────────────────────────
// Public constants
// Names describe UI capabilities - not backend keys or permission structure.
// ─────────────────────────────────────────────────────────────────────────────
import { P as FINANCE_CODES, FINANCE_PERMISSION_REGISTRY as FINANCE_REGISTRY } from "@xvs/finance/permissions";

export const P = {
  // The finance and procurement codes are OWNED by @xvs/finance, because they
  // gate that package's screens. Spread in rather than duplicated: two copies
  // of a permission code are how one product silently stops gating a screen.
  ...FINANCE_CODES,

  // ── School Management ──────────────────────────────────────────────────────
  BROWSE_SCHOOLS:       "100101",  // view the school list and detail pages
  ONBOARD_SCHOOL:       "100102",  // register and add a new school
  MODIFY_SCHOOL:        "100103",  // edit school info and settings
  DECOMMISSION_SCHOOL:  "100104",  // permanently remove a school record
  MANAGE_SCHOOL:        "100108",  // reset config, take a school out of service

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
  MANAGE_WORKFLOW_TEMPLATES: "600108",  // publish/edit workflow templates
  VIEW_WORKFLOW_INSTANCES:   "600201",  // view all workflow instances (admin monitoring)
  SUBMIT_WORKFLOW:           "600202",  // submit a document for approval
  CANCEL_WORKFLOW:           "600204",  // admin-cancel a stuck instance
  REVERSE_WORKFLOW_ACTION:   "600305",  // admin-reverse a recorded approver vote
  VIEW_APPROVER_GROUPS:      "600401",  // browse the named approver pools
  MANAGE_APPROVER_GROUPS:    "600408",  // create groups, add/remove members

  // ── Dashboard ──────────────────────────────────────────────────────────────
  VIEW_DASHBOARD:       "100701",  // view admin dashboard metrics and statistics

  // ── Organogram ─────────────────────────────────────────────────────────────
  VIEW_ORGANOGRAM:      "100901",  // view the organogram summary/KPI strip
  MANAGE_ORGANOGRAM:    "100908",  // create/edit departments, positions, assignments, matrix lines

  // ── Staff profiles ─────────────────────────────────────────────────────────
  VIEW_STAFF_PROFILE:   "101001",  // view CX-staff HR/personal profiles
  CREATE_STAFF_PROFILE: "101002",  // create a staff profile for a CX user
  MODIFY_STAFF_PROFILE: "101003",  // edit a staff profile

  // ── Staff payroll (sensitive, field-level secured) ─────────────────────────
  VIEW_STAFF_PAYROLL:   "101101",  // read bank/account details on staff profiles
  MANAGE_STAFF_PAYROLL: "101108",  // edit bank/account details on staff profiles
  VIEW_HEALTH: "101201",
  MANAGE_HEALTH: "101208",

  // Background task monitor. VIEW_TASK_MONITOR opens the redacted queue;
  // VIEW_RAW_TASK_DIAGNOSTIC opens one run's unredacted failure text and is
  // audited on every read.
  VIEW_TASK_MONITOR: "101701",
  VIEW_ALL_TENANT_TASKS: "101753",
  VIEW_RAW_TASK_DIAGNOSTIC: "101739",

  // ── Per-user permission exceptions ─────────────────────────────────────────
  // Gating follows the ACTOR's namespace, never the target's: a CX actor uses
  // these keys on BOTH a CX member profile and a school user's profile (the
  // school case additionally asserts ?tenant=<school-slug>). The school-side
  // keys (school.user_overrides.*) belong to school-fe, not this console.
  VIEW_PERMISSION_EXCEPTIONS:   "101301",  // see a user's permission exceptions
  MANAGE_PERMISSION_EXCEPTIONS: "101308",  // add or lift a permission exception

  // ── Requirements library ───────────────────────────────────────────────────
  VIEW_REQUIREMENTS_DOCS: "101401",  // browse and download the MRD / module FRDs
  REINSTATE_SCHOOL:     "101510",  // return a suspended school to onboarding
  VIEW_GO_LIVE:         "101601",  // read the go-live queue
  APPROVE_GO_LIVE:      "101605",  // approve a request and take the school live
  REJECT_GO_LIVE:       "101652",  // decline a request, with a reason

  // ── Notifications administration ──────────────────────────────────────────
  CONFIGURE_NOTIFICATION_TEMPLATES: "400108",
  ENFORCE_NOTIFICATION_SETTINGS:    "400208",
  AUDIT_NOTIFICATION_ACTIVITY:      "400307",

  // ── Settings / configuration ──────────────────────────────────────────────
  VIEW_CONFIG_DEFINITIONS: "900101", CREATE_CONFIG_DEFINITION: "900102",
  UPDATE_CONFIG_DEFINITION: "900103", ARCHIVE_CONFIG_DEFINITION: "900104",
  VIEW_CONFIG_VALUES: "900201", UPDATE_CONFIG_VALUES: "900203",
  VIEW_CAPABILITIES: "900301", MANAGE_CAPABILITIES: "900308",
  VIEW_ENTITLEMENTS: "900401", MANAGE_ENTITLEMENTS: "900408",
  VIEW_CONFIG_OVERRIDES: "900501", MANAGE_CONFIG_OVERRIDES: "900508",
  VIEW_CONFIG_AUDIT: "900601", EXPORT_CONFIG_AUDIT: "900606", EXPORT_CONFIG: "900702",
  VIEW_SECURITY_SETTINGS: "900801", MANAGE_SECURITY_SETTINGS: "900808",
  VIEW_INTEGRATION_SETTINGS: "900901", MANAGE_INTEGRATION_SETTINGS: "900908",

  // ── Export Centre ──────────────────────────────────────────────────────────
  // Whole-console visibility uses VIEW_EXPORT_RUNS: seeing the Files list is the
  // least a person can do here, and every finer control gates on its own key.
  VIEW_EXPORT_CATALOGUE: "920101",
  VIEW_SAVED_EXPORTS:    "920201", CREATE_EXPORT:        "920202",
  UPDATE_EXPORT:         "920203", DELETE_EXPORT:        "920204",
  SHARE_EXPORT:          "920245",
  VIEW_EXPORT_RUNS:      "920301", RUN_EXPORT:           "920302",
  CANCEL_EXPORT_RUN:     "920328", DOWNLOAD_EXPORT_FILE: "920446",
  EXPORT_SENSITIVE_FIELDS: "920506", VIEW_EXPORT_ACTIVITY: "920601",

  // ── Support ────────────────────────────────────────────────────────────────
  VIEW_TICKETS: "910101", UPDATE_TICKET: "910103", MANAGE_TICKETS: "910108",
  ASSIGN_TICKET: "910111", POST_TICKET_COMMENT: "910205",
  POST_INTERNAL_NOTE: "910305", ATTACH_TICKET_FILE: "910402",
  VIEW_TICKET_AUDIT: "910501", VIEW_TICKET_REPORTS: "910601",

  // ── Finance ─────────────────────────────────────────────────────────────────
  // Per-control gating key = the rbac_permission on the backend view it calls.
  // Whole-console visibility uses hasModuleAccess("finance.","payments.") instead.
  FIN_VIEW_ACCOUNTS:        "200201",
  FIN_VIEW_JOURNALS:        "200401",
  FIN_POST_JOURNAL:         "200413",
  FIN_APPROVE_JOURNAL:      "200405",
  FIN_APPROVE_HIGH_VALUE_JOURNAL: "200438",
  FIN_VIEW_INVOICES:        "200501",
  // Emailing a document to the customer is gated apart from viewing it: reading a
  // document internally and putting it in a customer's inbox are different acts.
  FIN_VIEW_PAYMENTS:        "202801",
  FIN_VIEW_CREDIT_NOTES:    "200601",
  FIN_SUBMIT_CREDIT_NOTE:   "200630",
  FIN_POST_CREDIT_NOTE:     "200613",
  FIN_VIEW_REFUNDS:         "200701",
  FIN_APPROVE_REFUND:       "200705",
  FIN_APPROVE_HIGH_VALUE_REFUND: "200738",
  FIN_VIEW_WRITE_OFFS:      "203101",
  FIN_APPROVE_WRITE_OFF:    "203105",
  FIN_APPROVE_HIGH_VALUE_WRITE_OFF: "203138",
  FIN_VIEW_CONCESSIONS:     "200801",
  FIN_VIEW_PAYMENT_PLANS:   "200901",
  FIN_VIEW_DUNNING:         "201001",
  FIN_VIEW_CUSTOMERS:       "202601",
  FIN_VIEW_FEE_STRUCTURES:  "202701",
  FIN_VIEW_CURRENCIES:      "201301",
  FIN_CREATE_CURRENCY:      "201302",
  FIN_VIEW_FX_RATES:        "201401",
  FIN_VIEW_TAX_CODES:       "201501",
  FIN_VIEW_COST_CENTERS:    "201601",
  FIN_VIEW_DIMENSIONS:      "201701",
  FIN_VIEW_BANK_ACCOUNTS:   "201801",
  FIN_VIEW_BANK_SENSITIVE:  "201839",
  FIN_VIEW_EXPENSE_CLAIMS:  "201901",
  FIN_VIEW_PETTY_CASH:      "202001",
  FIN_CREATE_PETTY_CASH:    "202002",
  FIN_UPDATE_PETTY_CASH:    "202003",
  FIN_MANAGE_PETTY_CASH:    "202008",   // deprecated - see the split keys below
  FIN_POST_PETTY_CASH:      "202013",   // deprecated - use FIN_POST_PETTY_CASH_VOUCHER
  FIN_VIEW_PETTY_CASH_VOUCHER:   "202901",
  FIN_VIEW_TAX:             "202101",
  FIN_VIEW_PAYROLL:         "202201",
  FIN_VIEW_PAYROLL_SENSITIVE:"202239",
  FIN_VIEW_SALARIES:        "203001",
  FIN_VIEW_BUDGETS:         "202301",
  FIN_EDIT_BUDGET:          "202303",
  FIN_VIEW_FIXED_ASSETS:    "202401",
  FIN_VIEW_FINANCE_AUDIT:   "202501",

  // ── Procurement ─────────────────────────────────────────────────────────────
  PROC_VIEW_CATEGORIES:     "700101",
  PROC_VIEW_VENDORS:        "700201",
  PROC_VIEW_CATALOG:        "700301",
  PROC_VIEW_REQUISITIONS:   "700501",
  PROC_VIEW_RFQS:           "700601",
  PROC_VIEW_QUOTATIONS:     "700701",
  PROC_VIEW_GOODS_RECEIPTS: "700901",
  // Filing the supplier's own paper is separate from editing the bill's amounts,
  // and stays available after the bill is posted.
  PROC_VIEW_VENDOR_PAYMENTS:"701101",
  PROC_APPROVE_SPEND:       "701205",
  PROC_MANAGE_APPROVALS:    "701208",
  PROC_APPROVE_SPEND_SENIOR:"701238",

  // ── Payments ────────────────────────────────────────────────────────────────
  PAY_VIEW_COLLECTIONS:     "800101",
  PAY_VIEW_VIRTUAL_ACCOUNTS: "800201",
  PAY_VIEW_VA_SENSITIVE:    "800239",
  PAY_VIEW_PAYOUTS:         "800301",
  PAY_VIEW_PAYOUT_SENSITIVE:"800339",
  PAY_VIEW_PAYMENT_REPORTS: "800401",
  PAY_APPROVE_PAYOUT_BATCH: "800505",  // approve a routed batch (done in the workflow inbox)
  PAY_APPROVE_PAYOUT_BATCH_HIGH_VALUE: "800544",
  PAY_VIEW_WEBHOOKS:        "800601",  // provider events that failed to book
  PAY_VIEW_UNATTRIBUTED_WEBHOOKS: "800701",  // platform-scope: events that match no tenant
  PAY_REPLAY_UNATTRIBUTED_WEBHOOK: "800748",

  // ── Academics (uncomment when module ships) ────────────────────────────────
  // BROWSE_SUBJECTS:   "300101",
  // ADD_SUBJECT:       "300102",

} as const;

export type PermissionCode = (typeof P)[keyof typeof P];

// Internal resolver - used only by usePermissions and PermissionGate.
export function resolvePermissionKey(code: PermissionCode): string {
  return REGISTRY[code] ?? "";
}

/** The module segment of a key ("finance.invoice.view" → "finance"). */
export function permissionModule(key: string): string {
  return key.split(".")[0] || "other";
}
