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
//   RR = resource       01 02 03 … (assigned sequentially per module)
//   AA = action         01=view   02=create  03=update  04=delete
//                       05=approve  06=export  08=manage
//                       09=suspend  10=reactivate  11=assign  12=transfer
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

  // ── platform / dashboard  (MM=10, RR=07) ──────────────────────────────────
  "100701": "platform.dashboard.view",

  // ── finance / invoice  (MM=20, RR=01) — uncomment when module ships ───────
  // "200101": "finance.invoice.view",
  // "200102": "finance.invoice.create",
  // "200105": "finance.invoice.approve",

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
  INVITE_TEAM_MEMBER:   "100302",  // invite a new Vision staff member
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

  // ── Dashboard ──────────────────────────────────────────────────────────────
  VIEW_DASHBOARD:       "100701",  // view admin dashboard metrics and statistics

  // ── Finance (uncomment when module ships) ──────────────────────────────────
  // VIEW_INVOICES:     "200101",
  // RAISE_INVOICE:     "200102",
  // APPROVE_INVOICE:   "200105",

  // ── Academics (uncomment when module ships) ────────────────────────────────
  // BROWSE_SUBJECTS:   "300101",
  // ADD_SUBJECT:       "300102",

} as const;

export type PermissionCode = (typeof P)[keyof typeof P];

// Internal resolver — used only by usePermissions, RequirePermission, PermissionGate.
export function resolvePermissionKey(code: PermissionCode): string {
  return REGISTRY[code] ?? "";
}
