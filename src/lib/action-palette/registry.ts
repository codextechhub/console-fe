// The action catalog. One entry per row in docs/ACTION_PALETTE_CATALOG.md.
// Destinations use routesPath constants so a route rename propagates here.
// `do` actions that open a drawer on a list screen navigate with `?action=new`
// (or a variant); the target screen opens its drawer via useActionParam.

import { routesPath } from "@/routes/routes-path";
import { P } from "@/permissions";
import type { ActionDef } from "./types";

const R = routesPath.PROTECTED;
const F = R.FINANCE;
const PR = R.PROCUREMENT;

// A `do` destination that a list screen turns into an open-drawer instruction.
const withAction = (base: string, action = "new") => `${base}?action=${action}`;

export const ACTIONS: ActionDef[] = [
  // ── Main · Home & account ────────────────────────────────────────────────
  { id: "view-home", label: "View home", aliases: ["home", "dashboard", "overview"], console: "Main", group: "Home & account", kind: "view", gate: null, run: { to: R.OVERVIEW.INDEX } },
  { id: "view-my-profile", label: "View my profile", aliases: ["profile", "my account"], console: "Main", group: "Home & account", kind: "view", gate: null, run: { to: R.ME_PROFILE.INDEX } },
  { id: "view-my-security", label: "View my security", aliases: ["password", "sessions", "login history"], console: "Main", group: "Home & account", kind: "view", gate: null, run: { to: R.ME_SECURITY.OVERVIEW } },
  { id: "change-my-password", label: "Change my password", aliases: ["update password"], console: "Main", group: "Home & account", kind: "do", gate: null, run: { to: R.ME_SECURITY.PASSWORD } },
  { id: "proxy-user", label: "Proxy a user", aliases: ["impersonate", "act as", "switch user"], console: "Main", group: "Home & account", kind: "do", gate: { module: ["platform.impersonation.start_"] }, run: { command: "proxy" } },
  { id: "logout", label: "Log out", aliases: ["sign out", "logout"], console: "Main", group: "Home & account", kind: "do", gate: null, run: { command: "logout" } },

  // ── Main · School Management ─────────────────────────────────────────────
  { id: "view-schools", label: "View schools", aliases: ["schools", "school list"], console: "Main", group: "School Management", kind: "view", gate: { perm: P.BROWSE_SCHOOLS }, run: { to: R.SCHOOL_MGT.INDEX } },
  { id: "create-school", label: "Create school", aliases: ["onboard school", "register school"], console: "Main", group: "School Management", kind: "do", gate: { perm: P.ONBOARD_SCHOOL }, run: { to: R.SCHOOL_MGT.CREATE } },

  // ── Main · Users ─────────────────────────────────────────────────────────
  { id: "view-cx-users", label: "View CX users", aliases: ["cx users", "team", "staff list"], console: "Main", group: "Users", kind: "view", gate: { perm: P.ACCESS_TEAM_PANEL }, run: { to: R.TEAM_MGT.CX } },
  { id: "view-school-users", label: "View school users", aliases: ["school accounts"], console: "Main", group: "Users", kind: "view", gate: { perm: P.ACCESS_TEAM_PANEL }, run: { to: R.TEAM_MGT.SCHOOL } },
  { id: "invite-cx-user", label: "Invite CX user", aliases: ["create user", "add team member", "invite staff", "new user"], console: "Main", group: "Users", kind: "do", gate: { perm: P.INVITE_TEAM_MEMBER }, run: { to: R.TEAM_MGT.CREATE } },

  // ── Main · Organogram ────────────────────────────────────────────────────
  { id: "view-org-chart", label: "View org chart", aliases: ["organogram", "org structure"], console: "Main", group: "Organogram", kind: "view", gate: { perm: P.VIEW_ORGANOGRAM }, run: { to: R.ORGANOGRAM.INDEX } },
  { id: "manage-organogram", label: "Manage organogram", aliases: ["edit org chart", "departments", "positions"], console: "Main", group: "Organogram", kind: "do", gate: { perm: P.MANAGE_ORGANOGRAM }, run: { to: R.ORGANOGRAM.MANAGE } },
  { id: "create-staff-profile", label: "Create staff profile", aliases: ["new staff", "add staff profile"], console: "Main", group: "Organogram", kind: "do", gate: { perm: P.CREATE_STAFF_PROFILE }, run: { to: R.ORGANOGRAM.STAFF_CREATE } },

  // ── Main · Tasks ─────────────────────────────────────────────────────────
  { id: "view-tasks", label: "View tasks", aliases: ["tasks", "my tasks", "todo"], console: "Main", group: "Tasks", kind: "view", gate: null, run: { to: R.TODO.INDEX } },

  // ── Main · Roles ─────────────────────────────────────────────────────────
  { id: "view-roles", label: "View roles", aliases: ["platform roles"], console: "Main", group: "Roles", kind: "view", gate: { perm: P.VIEW_ROLES }, run: { to: R.ROLES.INDEX } },
  { id: "create-role", label: "Create role", aliases: ["define role", "new role"], console: "Main", group: "Roles", kind: "do", gate: { perm: P.DEFINE_ROLE }, run: { to: R.ROLES.CREATE } },
  { id: "view-role-assignments", label: "View role assignments", aliases: ["user assignments", "who has what role"], console: "Main", group: "Roles", kind: "view", gate: { perm: P.VIEW_ROLES }, run: { to: R.ROLES.USER_ASSIGNMENTS } },
  { id: "view-role-change-requests", label: "View role change requests", aliases: ["change requests"], console: "Main", group: "Roles", kind: "view", gate: { perm: P.MODIFY_ROLE }, run: { to: R.ROLES.CHANGE_REQUESTS } },
  { id: "transfer-super-admin", label: "Transfer super admin", aliases: [], console: "Main", group: "Roles", kind: "do", gate: { perm: P.TRANSFER_SUPER_ADMIN }, run: { to: R.ROLES.TRANSFER_SUPER_ADMIN } },

  // ── Main · Permissions ───────────────────────────────────────────────────
  { id: "view-permissions", label: "View permissions", aliases: ["permission registry"], console: "Main", group: "Permissions", kind: "view", gate: { perm: P.VIEW_PERMISSIONS }, run: { to: R.PERMISSIONS.INDEX } },
  { id: "create-permission", label: "Create permission", aliases: ["new permission"], console: "Main", group: "Permissions", kind: "do", gate: { perm: P.CREATE_PERMISSION }, run: { to: R.PERMISSIONS.CREATE } },
  { id: "view-permission-modules", label: "View permission modules", aliases: ["modules"], console: "Main", group: "Permissions", kind: "view", gate: { perm: P.VIEW_PERMISSIONS }, run: { to: R.PERMISSIONS.MODULES.INDEX } },
  { id: "view-permission-resources", label: "View permission resources", aliases: ["resources"], console: "Main", group: "Permissions", kind: "view", gate: { perm: P.VIEW_PERMISSIONS }, run: { to: R.PERMISSIONS.RESOURCES.INDEX } },
  { id: "view-permission-actions", label: "View permission actions", aliases: ["actions vocabulary"], console: "Main", group: "Permissions", kind: "view", gate: { perm: P.VIEW_PERMISSIONS }, run: { to: R.PERMISSIONS.ACTIONS.INDEX } },
  { id: "view-permission-dependencies", label: "View permission dependencies", aliases: ["dependencies"], console: "Main", group: "Permissions", kind: "view", gate: { perm: P.VIEW_PERMISSIONS }, run: { to: R.PERMISSIONS.DEPENDENCIES.INDEX } },
  { id: "view-permission-groups", label: "View permission groups", aliases: ["groups"], console: "Main", group: "Permissions", kind: "view", gate: { perm: P.VIEW_PERMISSIONS }, run: { to: R.ROLES.GROUPS.INDEX } },
  { id: "create-permission-group", label: "Create permission group", aliases: ["new group"], console: "Main", group: "Permissions", kind: "do", gate: { perm: P.MANAGE_PERMISSIONS }, run: { to: R.ROLES.GROUPS.CREATE } },

  // ── Main · Data Imports ──────────────────────────────────────────────────
  { id: "view-import-batches", label: "View import batches", aliases: ["imports", "batches"], console: "Main", group: "Data Imports", kind: "view", gate: { perm: P.VIEW_IMPORT_BATCHES }, run: { to: R.DATA_IMPORTS.BATCHES.INDEX } },
  { id: "upload-import-batch", label: "Upload import batch", aliases: ["new batch", "bulk upload", "import data"], console: "Main", group: "Data Imports", kind: "do", gate: { perm: P.UPLOAD_IMPORT_BATCH }, run: { to: R.DATA_IMPORTS.BATCHES.NEW } },
  { id: "view-import-templates", label: "View import templates", aliases: ["templates"], console: "Main", group: "Data Imports", kind: "view", gate: { perm: P.VIEW_IMPORT_TEMPLATES }, run: { to: R.DATA_IMPORTS.TEMPLATES.INDEX } },
  { id: "create-import-template", label: "Create import template", aliases: ["new template"], console: "Main", group: "Data Imports", kind: "do", gate: { perm: P.CREATE_IMPORT_TEMPLATE }, run: { to: R.DATA_IMPORTS.TEMPLATES.NEW } },

  // ── Main · Export ────────────────────────────────────────────────────────
  { id: "view-export-queues", label: "View export queues", aliases: ["queues", "my exports", "downloads"], console: "Main", group: "Export", kind: "view", gate: null, run: { to: R.EXPORT.QUEUES } },

  // ── Main · Workflow ──────────────────────────────────────────────────────
  { id: "view-approvals", label: "View approvals", aliases: ["approval inbox", "pending approvals"], console: "Main", group: "Workflow", kind: "view", gate: null, run: { to: R.WORKFLOW.APPROVALS } },
  { id: "view-my-submissions", label: "View my submissions", aliases: ["submissions"], console: "Main", group: "Workflow", kind: "view", gate: null, run: { to: R.WORKFLOW.MY_SUBMISSIONS } },
  { id: "view-delegations", label: "View delegations", aliases: ["delegate approvals"], console: "Main", group: "Workflow", kind: "view", gate: null, run: { to: R.WORKFLOW.DELEGATIONS } },
  { id: "view-workflow-instances", label: "View workflow instances", aliases: ["all instances"], console: "Main", group: "Workflow", kind: "view", gate: { perm: P.VIEW_WORKFLOW_INSTANCES }, run: { to: R.WORKFLOW.INSTANCES } },
  { id: "view-team-load", label: "View team load", aliases: [], console: "Main", group: "Workflow", kind: "view", gate: { perm: P.VIEW_WORKFLOW_INSTANCES }, run: { to: R.WORKFLOW.TEAM_LOAD } },
  { id: "view-workflow-templates", label: "View workflow templates", aliases: [], console: "Main", group: "Workflow", kind: "view", gate: { perm: P.VIEW_WORKFLOW_TEMPLATES }, run: { to: R.WORKFLOW.TEMPLATES } },
  { id: "create-workflow-template", label: "Create workflow template", aliases: ["new workflow"], console: "Main", group: "Workflow", kind: "do", gate: { perm: P.MANAGE_WORKFLOW_TEMPLATES }, run: { to: R.WORKFLOW.TEMPLATE_NEW } },

  // ── Main · Audit & Security ──────────────────────────────────────────────
  { id: "view-security-dashboard", label: "View security dashboard", aliases: ["audit", "security"], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.DASHBOARD } },
  { id: "view-audit-events", label: "View audit events", aliases: ["events explorer"], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.EVENTS } },
  { id: "view-entity-trails", label: "View entity trails", aliases: [], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.ENTITY_TRAILS } },
  { id: "view-live-sessions", label: "View live sessions", aliases: ["active sessions"], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.SESSIONS } },
  { id: "view-login-attempts", label: "View login attempts", aliases: [], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.LOGIN_ATTEMPTS } },
  { id: "view-account-lockouts", label: "View account lockouts", aliases: ["lockouts"], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.LOCKOUTS } },
  { id: "view-password-activity", label: "View password activity", aliases: [], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.PASSWORD_ACTIVITY } },
  { id: "view-proxy-sessions", label: "View proxy sessions", aliases: ["impersonations"], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.VIEW_AUDIT }, run: { to: R.AUDIT.IMPERSONATIONS } },
  { id: "view-audit-exports", label: "View audit exports", aliases: [], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.EXPORT_AUDIT }, run: { to: R.AUDIT.EXPORTS } },
  { id: "new-audit-export", label: "New audit export", aliases: ["export audit"], console: "Main", group: "Audit & Security", kind: "do", gate: { perm: P.EXPORT_AUDIT }, run: { to: R.AUDIT.EXPORT_NEW } },
  { id: "view-compliance-rules", label: "View compliance rules", aliases: [], console: "Main", group: "Audit & Security", kind: "view", gate: { perm: P.MANAGE_AUDIT }, run: { to: R.AUDIT.COMPLIANCE_RULES } },
  { id: "create-compliance-rule", label: "Create compliance rule", aliases: ["new rule"], console: "Main", group: "Audit & Security", kind: "do", gate: { perm: P.MANAGE_AUDIT }, run: { to: R.AUDIT.COMPLIANCE_RULE_CREATE } },

  // ── Main · Health ────────────────────────────────────────────────────────
  { id: "view-system-health", label: "View system health", aliases: ["health", "command center"], console: "Main", group: "Health", kind: "view", gate: { perm: P.VIEW_HEALTH }, run: { to: R.HEALTH.INDEX } },
  { id: "view-uptime", label: "View uptime", aliases: [], console: "Main", group: "Health", kind: "view", gate: { perm: P.VIEW_HEALTH }, run: { to: R.HEALTH.UPTIME } },
  { id: "view-api-endpoints", label: "View API endpoints", aliases: ["api health"], console: "Main", group: "Health", kind: "view", gate: { perm: P.VIEW_HEALTH }, run: { to: R.HEALTH.API } },
  { id: "view-jobs-queues", label: "View jobs & queues", aliases: ["background jobs"], console: "Main", group: "Health", kind: "view", gate: { perm: P.VIEW_HEALTH }, run: { to: R.HEALTH.JOBS } },
  { id: "view-incidents", label: "View incidents", aliases: ["alerts"], console: "Main", group: "Health", kind: "view", gate: { perm: P.VIEW_HEALTH }, run: { to: R.HEALTH.INCIDENTS } },
  { id: "view-tenant-health", label: "View tenant health", aliases: [], console: "Main", group: "Health", kind: "view", gate: { perm: P.VIEW_HEALTH }, run: { to: R.HEALTH.TENANTS } },
  { id: "view-slos", label: "View SLOs", aliases: [], console: "Main", group: "Health", kind: "view", gate: { perm: P.VIEW_HEALTH }, run: { to: R.HEALTH.SLOS } },

  // ── Main · Notifications, Settings, Support ──────────────────────────────
  { id: "view-notifications", label: "View notifications", aliases: ["inbox", "my updates"], console: "Main", group: "Notifications", kind: "view", gate: null, run: { to: R.NOTIFICATIONS } },
  { id: "view-notification-administration", label: "View notification administration", aliases: ["notif admin"], console: "Main", group: "Notifications", kind: "view", gate: { any: [P.AUDIT_NOTIFICATION_ACTIVITY, P.ENFORCE_NOTIFICATION_SETTINGS, P.CONFIGURE_NOTIFICATION_TEMPLATES] }, run: { to: R.NOTIFICATIONS_ADMIN } },
  { id: "view-settings", label: "View settings", aliases: ["configuration"], console: "Main", group: "Settings", kind: "view", gate: { any: [P.VIEW_CONFIG_VALUES, P.VIEW_CONFIG_DEFINITIONS, P.VIEW_CAPABILITIES, P.VIEW_ENTITLEMENTS, P.VIEW_CONFIG_OVERRIDES, P.VIEW_CONFIG_AUDIT] }, run: { to: R.SETTINGS.INDEX } },
  { id: "view-support", label: "View support", aliases: ["support tickets", "help"], console: "Main", group: "Support", kind: "view", gate: null, run: { to: R.SUPPORT.INDEX } },
  { id: "raise-support-ticket", label: "Raise support ticket", aliases: ["new ticket", "contact support"], console: "Main", group: "Support", kind: "do", gate: null, run: { to: R.SUPPORT.NEW } },

  // ── Finance · Ledger & Setup ─────────────────────────────────────────────
  { id: "view-finance-dashboard", label: "View finance dashboard", aliases: ["finance"], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { module: ["finance.", "payments."] }, run: { to: F.INDEX } },
  { id: "view-chart-of-accounts", label: "View chart of accounts", aliases: ["accounts", "coa"], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_ACCOUNTS }, run: { to: `${F.SETUP}/accounts` } },
  { id: "create-gl-account", label: "Create GL account", aliases: ["new account"], console: "Finance", group: "Ledger & Setup", kind: "do", gate: { perm: P.FIN_CREATE_ACCOUNT }, run: { to: withAction(`${F.SETUP}/accounts`) } },
  { id: "view-general-ledger", label: "View general ledger", aliases: ["gl", "journals"], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_JOURNALS }, run: { to: F.LEDGER } },
  { id: "new-journal-entry", label: "New journal entry", aliases: ["create journal", "post journal"], console: "Finance", group: "Ledger & Setup", kind: "do", gate: { perm: P.FIN_SUBMIT_JOURNAL }, run: { to: withAction(F.LEDGER) } },
  { id: "view-entities", label: "View entities", aliases: ["ledger entities"], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_ENTITIES }, run: { to: `${F.SETUP}/entities` } },
  { id: "create-entity", label: "Create entity", aliases: ["new entity"], console: "Finance", group: "Ledger & Setup", kind: "do", gate: { perm: P.FIN_CREATE_ENTITY }, run: { to: withAction(`${F.SETUP}/entities`) } },
  { id: "view-fiscal-periods", label: "View fiscal periods", aliases: ["periods"], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_PERIODS }, run: { to: `${F.SETUP}/periods` } },
  { id: "view-currencies-fx", label: "View currencies & FX", aliases: ["fx rates", "currencies"], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_CURRENCIES }, run: { to: `${F.SETUP}/currencies` } },
  { id: "view-tax-codes", label: "View tax codes", aliases: [], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_TAX_CODES }, run: { to: `${F.SETUP}/tax-codes` } },
  { id: "create-tax-code", label: "Create tax code", aliases: ["new tax code"], console: "Finance", group: "Ledger & Setup", kind: "do", gate: { perm: P.FIN_CREATE_TAX_CODE }, run: { to: withAction(`${F.SETUP}/tax-codes`) } },
  { id: "view-cost-centres", label: "View cost centres", aliases: ["cost centers"], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_COST_CENTERS }, run: { to: `${F.SETUP}/cost-centers` } },
  { id: "create-cost-centre", label: "Create cost centre", aliases: ["new cost centre", "new cost center"], console: "Finance", group: "Ledger & Setup", kind: "do", gate: { perm: P.FIN_CREATE_COST_CENTER }, run: { to: withAction(`${F.SETUP}/cost-centers`) } },
  { id: "view-dimensions", label: "View dimensions", aliases: [], console: "Finance", group: "Ledger & Setup", kind: "view", gate: { perm: P.FIN_VIEW_DIMENSIONS }, run: { to: `${F.SETUP}/dimensions` } },

  // ── Finance · Receivables ────────────────────────────────────────────────
  { id: "view-customers", label: "View customers", aliases: ["payers", "customer list"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_CUSTOMERS }, run: { to: `${F.RECEIVABLES}/customers` } },
  { id: "create-customer", label: "Create customer", aliases: ["new payer", "new customer"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_CUSTOMER }, run: { to: withAction(`${F.RECEIVABLES}/customers`) } },
  { id: "view-ar-invoices", label: "View AR invoices", aliases: ["invoices", "receivables"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_INVOICES }, run: { to: `${F.RECEIVABLES}/invoices` } },
  { id: "create-ar-invoice", label: "Create AR invoice", aliases: ["new invoice", "raise invoice"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_INVOICE }, run: { to: withAction(`${F.RECEIVABLES}/invoices`) } },
  { id: "view-receipts", label: "View receipts", aliases: ["receipts & allocation", "receipts"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_PAYMENTS }, run: { to: `${F.RECEIVABLES}/receipts` } },
  { id: "record-receipt", label: "Record receipt", aliases: ["new receipt", "record payment"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_RECORD_PAYMENT }, run: { to: withAction(`${F.RECEIVABLES}/receipts`) } },
  { id: "view-credit-notes", label: "View credit notes", aliases: ["debit notes"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_CREDIT_NOTES }, run: { to: `${F.RECEIVABLES}/credit-notes` } },
  { id: "create-credit-note", label: "Create credit note", aliases: ["new credit note"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_CREDIT_NOTE }, run: { to: withAction(`${F.RECEIVABLES}/credit-notes`) } },
  { id: "view-refunds", label: "View refunds & write-offs", aliases: ["refunds", "write-offs"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_REFUNDS }, run: { to: `${F.RECEIVABLES}/refunds` } },
  { id: "create-refund", label: "Create refund", aliases: ["new refund", "raise refund"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_REFUND }, run: { to: withAction(`${F.RECEIVABLES}/refunds`) } },
  { id: "create-write-off", label: "Create write-off", aliases: ["write off invoice"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_WRITE_OFF }, run: { to: withAction(`${F.RECEIVABLES}/refunds`, "new-writeoff") } },
  { id: "view-payment-plans", label: "View payment plans", aliases: ["instalments", "installments"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_PAYMENT_PLANS }, run: { to: `${F.RECEIVABLES}/payment-plans` } },
  { id: "create-payment-plan", label: "Create payment plan", aliases: ["new plan"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_PAYMENT_PLAN }, run: { to: withAction(`${F.RECEIVABLES}/payment-plans`) } },
  { id: "view-concessions", label: "View concessions", aliases: ["discounts", "scholarships"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_CONCESSIONS }, run: { to: `${F.RECEIVABLES}/concessions` } },
  { id: "create-concession", label: "Create concession", aliases: ["new concession"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_CONCESSION }, run: { to: withAction(`${F.RECEIVABLES}/concessions`) } },
  { id: "view-dunning", label: "View dunning", aliases: ["reminders"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_DUNNING }, run: { to: `${F.RECEIVABLES}/dunning` } },
  { id: "view-fee-structures", label: "View fee structures", aliases: ["fees"], console: "Finance", group: "Receivables", kind: "view", gate: { perm: P.FIN_VIEW_FEE_STRUCTURES }, run: { to: `${F.RECEIVABLES}/fee-structures` } },
  { id: "create-fee-structure", label: "Create fee structure", aliases: ["new fee structure"], console: "Finance", group: "Receivables", kind: "do", gate: { perm: P.FIN_CREATE_FEE_STRUCTURE }, run: { to: withAction(`${F.RECEIVABLES}/fee-structures`) } },

  // ── Finance · Operations ─────────────────────────────────────────────────
  { id: "view-bank-accounts", label: "View bank accounts", aliases: ["banking"], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_BANK_ACCOUNTS }, run: { to: F.BANKING } },
  { id: "create-bank-account", label: "Create bank account", aliases: ["new bank account"], console: "Finance", group: "Operations", kind: "do", gate: { perm: P.FIN_CREATE_BANK_ACCOUNT }, run: { to: withAction(F.BANKING) } },
  { id: "view-bank-reconciliation", label: "View bank reconciliation", aliases: ["recon"], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_BANK_ACCOUNTS }, run: { to: F.BANK_RECON } },
  { id: "import-bank-statement", label: "Import bank statement", aliases: ["upload statement"], console: "Finance", group: "Operations", kind: "do", gate: { perm: P.FIN_IMPORT_STATEMENT }, run: { to: withAction(F.BANK_RECON, "import") } },
  { id: "view-expense-claims", label: "View expense claims", aliases: ["expenses", "claims"], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_EXPENSE_CLAIMS }, run: { to: `${F.EXPENSES}/claims` } },
  { id: "create-expense-claim", label: "Create expense claim", aliases: ["new claim", "raise expense"], console: "Finance", group: "Operations", kind: "do", gate: { perm: P.FIN_CREATE_EXPENSE_CLAIM }, run: { to: withAction(`${F.EXPENSES}/claims`) } },
  { id: "view-petty-cash", label: "View petty cash", aliases: [], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_PETTY_CASH }, run: { to: `${F.EXPENSES}/petty-cash` } },
  { id: "new-petty-cash-voucher", label: "New petty cash voucher", aliases: ["petty cash voucher"], console: "Finance", group: "Operations", kind: "do", gate: { perm: P.FIN_CREATE_PETTY_CASH_VOUCHER }, run: { to: withAction(`${F.EXPENSES}/petty-cash`, "new-voucher") } },
  { id: "view-payroll", label: "View payroll", aliases: ["payroll runs"], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_PAYROLL }, run: { to: F.PAYROLL } },
  { id: "create-payroll-run", label: "Create payroll run", aliases: ["new payroll"], console: "Finance", group: "Operations", kind: "do", gate: { perm: P.FIN_CREATE_PAYROLL }, run: { to: withAction(F.PAYROLL) } },
  { id: "view-budgets", label: "View budgets", aliases: ["forecasts"], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_BUDGETS }, run: { to: `${F.BUDGETS}/budgets` } },
  { id: "create-budget", label: "Create budget", aliases: ["new budget"], console: "Finance", group: "Operations", kind: "do", gate: { perm: P.FIN_CREATE_BUDGET }, run: { to: withAction(`${F.BUDGETS}/budgets`) } },
  { id: "view-fixed-assets", label: "View fixed assets", aliases: ["assets"], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_FIXED_ASSETS }, run: { to: `${F.BUDGETS}/assets` } },
  { id: "create-fixed-asset", label: "Create fixed asset", aliases: ["new asset"], console: "Finance", group: "Operations", kind: "do", gate: { perm: P.FIN_CREATE_FIXED_ASSET }, run: { to: withAction(`${F.BUDGETS}/assets`) } },
  { id: "view-tax-remittance", label: "View tax remittance", aliases: ["tax"], console: "Finance", group: "Operations", kind: "view", gate: { perm: P.FIN_VIEW_TAX }, run: { to: `${F.BUDGETS}/tax` } },

  // ── Finance · Payments ───────────────────────────────────────────────────
  { id: "view-collections", label: "View collections", aliases: [], console: "Finance", group: "Payments", kind: "view", gate: { perm: P.PAY_VIEW_COLLECTIONS }, run: { to: F.COLLECTIONS } },
  { id: "view-virtual-accounts", label: "View virtual accounts", aliases: ["vas"], console: "Finance", group: "Payments", kind: "view", gate: { perm: P.PAY_VIEW_VIRTUAL_ACCOUNTS }, run: { to: `${F.COLLECTIONS}/virtual-accounts` } },
  { id: "create-virtual-account", label: "Create virtual account", aliases: ["new va"], console: "Finance", group: "Payments", kind: "do", gate: { perm: P.PAY_CREATE_VIRTUAL_ACCOUNT }, run: { to: withAction(`${F.COLLECTIONS}/virtual-accounts`) } },
  { id: "view-payouts", label: "View payouts", aliases: ["payments out"], console: "Finance", group: "Payments", kind: "view", gate: { perm: P.PAY_VIEW_PAYOUTS }, run: { to: `${F.PAYMENTS}/payouts` } },
  { id: "new-payout", label: "New payout", aliases: ["new payment", "raise payment", "send money"], console: "Finance", group: "Payments", kind: "do", gate: { perm: P.PAY_CREATE_PAYOUT }, run: { to: withAction(`${F.PAYMENTS}/payouts`) } },
  { id: "view-payout-batches", label: "View payout batches", aliases: ["batches"], console: "Finance", group: "Payments", kind: "view", gate: { perm: P.PAY_VIEW_PAYOUTS }, run: { to: `${F.PAYMENTS}/batches` } },
  { id: "view-settlement", label: "View settlement", aliases: [], console: "Finance", group: "Payments", kind: "view", gate: { perm: P.PAY_VIEW_PAYMENT_REPORTS }, run: { to: `${F.PAYMENTS}/settlement` } },
  { id: "view-transactions-log", label: "View transactions log", aliases: ["transactions"], console: "Finance", group: "Payments", kind: "view", gate: { perm: P.PAY_VIEW_PAYMENT_REPORTS }, run: { to: `${F.PAYMENTS}/transactions` } },

  // ── Finance · Reports & Close ────────────────────────────────────────────
  { id: "view-trial-balance", label: "View trial balance", aliases: ["tb"], console: "Finance", group: "Reports & Close", kind: "view", gate: { perm: P.FIN_VIEW_REPORTS }, run: { to: `${F.REPORTS}/trial-balance` } },
  { id: "view-income-statement", label: "View income statement", aliases: ["p&l", "profit and loss"], console: "Finance", group: "Reports & Close", kind: "view", gate: { perm: P.FIN_VIEW_REPORTS }, run: { to: `${F.REPORTS}/income-statement` } },
  { id: "view-balance-sheet", label: "View balance sheet", aliases: [], console: "Finance", group: "Reports & Close", kind: "view", gate: { perm: P.FIN_VIEW_REPORTS }, run: { to: `${F.REPORTS}/balance-sheet` } },
  { id: "view-cash-flow", label: "View cash flow", aliases: [], console: "Finance", group: "Reports & Close", kind: "view", gate: { perm: P.FIN_VIEW_REPORTS }, run: { to: `${F.REPORTS}/cash-flow` } },
  { id: "view-changes-in-equity", label: "View changes in equity", aliases: [], console: "Finance", group: "Reports & Close", kind: "view", gate: { perm: P.FIN_VIEW_REPORTS }, run: { to: `${F.REPORTS}/changes-in-equity` } },
  { id: "view-cost-dimension-analysis", label: "View cost & dimension analysis", aliases: ["analytics"], console: "Finance", group: "Reports & Close", kind: "view", gate: { perm: P.FIN_VIEW_REPORTS }, run: { to: `${F.REPORTS}/analytics` } },
  { id: "view-finance-audit-trail", label: "View finance audit trail", aliases: [], console: "Finance", group: "Reports & Close", kind: "view", gate: { perm: P.FIN_VIEW_FINANCE_AUDIT }, run: { to: F.AUDIT } },

  // ── Procurement · Procure to Pay ─────────────────────────────────────────
  { id: "view-procurement-dashboard", label: "View procurement dashboard", aliases: ["procurement"], console: "Procurement", group: "Procure to Pay", kind: "view", gate: { module: ["procurement."] }, run: { to: PR.INDEX } },
  { id: "view-requisitions", label: "View requisitions", aliases: ["prs"], console: "Procurement", group: "Procure to Pay", kind: "view", gate: { perm: P.PROC_VIEW_REQUISITIONS }, run: { to: PR.REQUISITIONS } },
  { id: "create-requisition", label: "Create requisition", aliases: ["new requisition", "raise pr"], console: "Procurement", group: "Procure to Pay", kind: "do", gate: { perm: P.PROC_CREATE_REQUISITION }, run: { to: withAction(PR.REQUISITIONS) } },
  { id: "view-purchase-orders", label: "View purchase orders", aliases: ["pos"], console: "Procurement", group: "Procure to Pay", kind: "view", gate: { perm: P.PROC_VIEW_PURCHASE_ORDERS }, run: { to: PR.PURCHASE_ORDERS } },
  { id: "create-purchase-order", label: "Create purchase order", aliases: ["new po"], console: "Procurement", group: "Procure to Pay", kind: "do", gate: { perm: P.PROC_CREATE_PURCHASE_ORDER }, run: { to: withAction(PR.PURCHASE_ORDERS) } },
  { id: "view-goods-receipts", label: "View goods receipts", aliases: ["grns"], console: "Procurement", group: "Procure to Pay", kind: "view", gate: { perm: P.PROC_VIEW_GOODS_RECEIPTS }, run: { to: PR.GOODS_RECEIPTS } },
  { id: "post-goods-receipt", label: "Post goods receipt", aliases: ["new grn", "receive goods"], console: "Procurement", group: "Procure to Pay", kind: "do", gate: { perm: P.PROC_CREATE_GOODS_RECEIPT }, run: { to: withAction(PR.GOODS_RECEIPTS) } },
  { id: "view-vendor-invoices", label: "View vendor invoices", aliases: ["ap invoices"], console: "Procurement", group: "Procure to Pay", kind: "view", gate: { perm: P.PROC_VIEW_VENDOR_INVOICES }, run: { to: PR.VENDOR_INVOICES } },
  { id: "create-vendor-invoice", label: "Create vendor invoice", aliases: ["new vendor invoice"], console: "Procurement", group: "Procure to Pay", kind: "do", gate: { perm: P.PROC_CREATE_VENDOR_INVOICE }, run: { to: withAction(PR.VENDOR_INVOICES) } },
  { id: "view-vendor-payments", label: "View vendor payments", aliases: ["ap payments"], console: "Procurement", group: "Procure to Pay", kind: "view", gate: { perm: P.PROC_VIEW_VENDOR_PAYMENTS }, run: { to: PR.VENDOR_PAYMENTS } },
  { id: "new-vendor-payment", label: "New vendor payment", aliases: ["pay vendor", "new payment"], console: "Procurement", group: "Procure to Pay", kind: "do", gate: { perm: P.PROC_CREATE_VENDOR_PAYMENT }, run: { to: withAction(PR.VENDOR_PAYMENTS) } },

  // ── Procurement · Vendors & Catalog / Sourcing / Inventory / Analytics ───
  { id: "view-vendors", label: "View vendors", aliases: ["suppliers"], console: "Procurement", group: "Vendors & Catalog", kind: "view", gate: { perm: P.PROC_VIEW_VENDORS }, run: { to: `${PR.VENDORS}/vendors` } },
  { id: "create-vendor", label: "Create vendor", aliases: ["new vendor", "register supplier"], console: "Procurement", group: "Vendors & Catalog", kind: "do", gate: { perm: P.PROC_CREATE_VENDOR }, run: { to: withAction(`${PR.VENDORS}/vendors`) } },
  { id: "view-categories", label: "View categories", aliases: [], console: "Procurement", group: "Vendors & Catalog", kind: "view", gate: { perm: P.PROC_VIEW_CATEGORIES }, run: { to: `${PR.VENDORS}/categories` } },
  { id: "create-category", label: "Create category", aliases: ["new category"], console: "Procurement", group: "Vendors & Catalog", kind: "do", gate: { perm: P.PROC_CREATE_CATEGORY }, run: { to: withAction(`${PR.VENDORS}/categories`) } },
  { id: "view-catalog", label: "View catalog", aliases: ["catalog items"], console: "Procurement", group: "Vendors & Catalog", kind: "view", gate: { perm: P.PROC_VIEW_CATALOG }, run: { to: `${PR.VENDORS}/catalog` } },
  { id: "add-catalog-item", label: "Add catalog item", aliases: ["new item"], console: "Procurement", group: "Vendors & Catalog", kind: "do", gate: { perm: P.PROC_CREATE_CATALOG_ITEM }, run: { to: withAction(`${PR.VENDORS}/catalog`) } },
  { id: "view-rfqs", label: "View RFQs", aliases: [], console: "Procurement", group: "Sourcing", kind: "view", gate: { perm: P.PROC_VIEW_RFQS }, run: { to: `${PR.SOURCING}/rfqs` } },
  { id: "create-rfq", label: "Create RFQ", aliases: ["new rfq"], console: "Procurement", group: "Sourcing", kind: "do", gate: { perm: P.PROC_CREATE_RFQ }, run: { to: withAction(`${PR.SOURCING}/rfqs`) } },
  { id: "view-quotations", label: "View quotations", aliases: ["quotes"], console: "Procurement", group: "Sourcing", kind: "view", gate: { perm: P.PROC_VIEW_QUOTATIONS }, run: { to: `${PR.SOURCING}/quotations` } },
  { id: "create-quotation", label: "Create quotation", aliases: ["new quote"], console: "Procurement", group: "Sourcing", kind: "do", gate: { perm: P.PROC_CREATE_QUOTATION }, run: { to: withAction(`${PR.SOURCING}/quotations`) } },
  { id: "view-contracts", label: "View contracts", aliases: [], console: "Procurement", group: "Sourcing", kind: "view", gate: { perm: P.PROC_VIEW_CONTRACTS }, run: { to: PR.CONTRACTS } },
  { id: "create-contract", label: "Create contract", aliases: ["new contract"], console: "Procurement", group: "Sourcing", kind: "do", gate: { perm: P.PROC_CREATE_CONTRACT }, run: { to: withAction(PR.CONTRACTS) } },
  { id: "view-stock-items", label: "View stock items", aliases: ["inventory"], console: "Procurement", group: "Inventory", kind: "view", gate: { perm: P.PROC_VIEW_STOCK }, run: { to: `${PR.INVENTORY}/items` } },
  { id: "view-stock-movements", label: "View stock movements", aliases: ["movements"], console: "Procurement", group: "Inventory", kind: "view", gate: { perm: P.PROC_VIEW_STOCK }, run: { to: `${PR.INVENTORY}/movements` } },
  { id: "view-ap-aging", label: "View AP aging", aliases: [], console: "Procurement", group: "Analytics", kind: "view", gate: { perm: P.PROC_VIEW_PROC_REPORTS }, run: { to: `${PR.ANALYTICS}/ap-aging` } },
  { id: "view-grir-control", label: "View GR/IR control", aliases: ["grir"], console: "Procurement", group: "Analytics", kind: "view", gate: { perm: P.PROC_VIEW_PROC_REPORTS }, run: { to: `${PR.ANALYTICS}/grir` } },
  { id: "view-spend-analytics", label: "View spend analytics", aliases: ["spend"], console: "Procurement", group: "Analytics", kind: "view", gate: { perm: P.PROC_VIEW_PROC_REPORTS }, run: { to: `${PR.ANALYTICS}/spend` } },
  { id: "view-vendor-performance", label: "View vendor performance", aliases: [], console: "Procurement", group: "Analytics", kind: "view", gate: { perm: P.PROC_VIEW_PROC_REPORTS }, run: { to: `${PR.ANALYTICS}/performance` } },
];
