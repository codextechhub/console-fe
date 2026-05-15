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
//   AA = action         01=view  02=create  03=edit  04=delete
//                       05=approve  06=export  07=import  08=manage
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
  "100103": "platform.schools.edit",
  "100104": "platform.schools.delete",

  // ── platform / team  (MM=10, RR=02) ───────────────────────────────────────
  "100201": "platform.team.view",
  "100202": "platform.team.create",
  "100203": "platform.team.edit",
  "100204": "platform.team.delete",

  // ── platform / roles  (MM=10, RR=03) ──────────────────────────────────────
  "100301": "platform.roles.view",
  "100302": "platform.roles.create",
  "100303": "platform.roles.edit",
  "100304": "platform.roles.delete",

  // ── platform / data  (MM=10, RR=04) ───────────────────────────────────────
  "100401": "platform.data.view",
  "100406": "platform.data.export",
  "100407": "platform.data.import",

  // ── finance / invoice  (MM=20, RR=01) — uncomment when module ships ───────
  // "200101": "finance.invoice.view",
  // "200102": "finance.invoice.create",
  // "200105": "finance.invoice.approve",

  // ── academics / subjects  (MM=30, RR=01) — uncomment when module ships ────
  // "300101": "academics.subjects.view",
  // "300102": "academics.subjects.create",

  // ── communication / announcements  (MM=40, RR=01) ─────────────────────────
  // "400101": "communication.announcements.view",
  // "400102": "communication.announcements.create",

};

// ─────────────────────────────────────────────────────────────────────────────
// Public constants
// Names describe UI capabilities — not backend keys or permission structure.
// ─────────────────────────────────────────────────────────────────────────────
export const P = {

  // ── School Management ──────────────────────────────────────────────────────
  BROWSE_SCHOOLS:       "100101",  // view the school list and detail pages
  ONBOARD_SCHOOL:       "100102",  // register and add a new school
  MODIFY_SCHOOL:        "100103",  // edit school info and branch details
  DECOMMISSION_SCHOOL:  "100104",  // permanently remove a school

  // ── Team Management ────────────────────────────────────────────────────────
  ACCESS_TEAM_PANEL:    "100201",  // view staff list and member profiles
  INVITE_TEAM_MEMBER:   "100202",  // add or invite a new team member
  MODIFY_TEAM_MEMBER:   "100203",  // edit an existing team member's profile
  DISMISS_TEAM_MEMBER:  "100204",  // remove a team member from the system

  // ── Roles & Permissions ────────────────────────────────────────────────────
  VIEW_ROLES:           "100301",  // see available roles
  DEFINE_ROLE:          "100302",  // create a new role
  MODIFY_ROLE:          "100303",  // edit a role's permissions
  REVOKE_ROLE:          "100304",  // delete a role

  // ── Data & Records ─────────────────────────────────────────────────────────
  ACCESS_SYSTEM_DATA:   "100401",  // read raw system data
  EXPORT_RECORDS:       "100406",  // download/export data
  IMPORT_RECORDS:       "100407",  // upload/import data

  // ── Finance (uncomment when module ships) ──────────────────────────────────
  // VIEW_INVOICES:     "200101",
  // RAISE_INVOICE:     "200102",
  // APPROVE_INVOICE:   "200105",

  // ── Academics (uncomment when module ships) ────────────────────────────────
  // BROWSE_SUBJECTS:   "300101",
  // ADD_SUBJECT:       "300102",

  // ── Communication (uncomment when module ships) ────────────────────────────
  // READ_ANNOUNCEMENTS:  "400101",
  // POST_ANNOUNCEMENT:   "400102",

} as const;

export type PermissionCode = (typeof P)[keyof typeof P];

// Internal resolver — used only by usePermissions, RequirePermission, PermissionGate.
export function resolvePermissionKey(code: PermissionCode): string {
  return REGISTRY[code] ?? "";
}
