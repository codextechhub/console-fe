# Permission Protection Audit

Maps every UI element that is gated behind a permission check — sidebar items, page buttons, table actions — and the permission constant that guards it. Use this to verify what's working, what's missing, and what's not wired up yet.

Permission constants live in `src/permissions/index.ts`.  
The actual backend keys follow the pattern `module.resource.action`.

---

## 1. Sidebar Navigation (`src/components/app-sidebar.tsx`)

Parent items are hidden if the user lacks the listed permission. Sub-items inherit the parent's visibility.

| Menu Item | Sub-item | Permission Constant | Notes |
|---|---|---|---|
| Home | — | _(none — always visible)_ | |
| School Management | — | `P.BROWSE_SCHOOLS` | |
| Team Management | — | `P.ACCESS_TEAM_PANEL` | |
| Roles | Platform Roles | `P.VIEW_ROLES` | |
| Roles | User Assignments | `P.VIEW_ROLES` | inherits parent |
| Roles | Change Requests | `P.VIEW_ROLES` | inherits parent |
| Roles | Transfer Super Admin | `P.TRANSFER_SUPER_ADMIN` | only super admin sees it; backend further restricts execution to the active super admin |
| Permissions | All Permissions | `P.VIEW_PERMISSIONS` | |
| Permissions | Modules | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Resources | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Actions | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Dependencies | `P.VIEW_PERMISSIONS` | inherits parent |
| Permissions | Permission Groups | `P.VIEW_PERMISSIONS` | inherits parent |
| Data Imports | Import Templates | _(none — always visible)_ | not yet gated |
| Data Imports | Template Columns | _(none — always visible)_ | not yet gated |
| Data Imports | Import Batches | _(none — always visible)_ | not yet gated |

---

## 2. Page-level Buttons & Actions

### Roles (`src/pages/protected/rbac/roles/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New Role" button | `<PermissionGate>` | `P.DEFINE_ROLE` |
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MODIFY_ROLE` |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.REVOKE_ROLE` |

> Delete is also suppressed for system roles and locked roles regardless of permission.

---

### Permissions (`src/pages/protected/rbac/permissions/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add Permission" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

> Modules, Resources, Actions, Dependencies, and Permission Groups pages have **no per-button permission checks** — anyone who can see the Permissions nav item can use all controls on those sub-pages.

---

### School Management (`src/pages/protected/school-mgt/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New School" button | `<PermissionGate>` | `P.ONBOARD_SCHOOL` |
| Table row → "Edit School" dropdown action | `hasPermission()` | `P.MODIFY_SCHOOL` |

---

### Team Management — Members (`src/pages/protected/team-mgt/tabs/members.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New User" button | `<PermissionGate>` | `P.INVITE_TEAM_MEMBER` |
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MODIFY_TEAM_MEMBER` |
| Table row → "Suspend" action (ACTIVE members only) | `hasPermission()` | `P.SUSPEND_TEAM_MEMBER` |
| Table row → "Reactivate" action (SUSPENDED members) | `hasPermission()` | `P.REACTIVATE_TEAM_MEMBER` |
| Table row → "Unlock" action (LOCKED members) | `hasPermission()` | `P.REACTIVATE_TEAM_MEMBER` |

---

### Team Management — Invites (`src/pages/protected/team-mgt/tabs/invites.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New User" button | `<PermissionGate>` | `P.INVITE_TEAM_MEMBER` |

---

## 3. Route-level Guards

`src/middleware/require-permission.tsx` exists and is functional but **no routes currently use it**. All page-level protection is handled inside the page components themselves via `<PermissionGate>` and `hasPermission()`.

---

## 4. Permission Constants — What's Wired vs. Not

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
| `P.VIEW_PERMISSIONS` | `platform.permissions.view` |
| `P.CREATE_PERMISSION` | `platform.permissions.create` |
| `P.MODIFY_PERMISSION` | `platform.permissions.update` |
| `P.DELETE_PERMISSION` | `platform.permissions.delete` |

### Not yet wired (defined but no UI check uses them)

| Constant | Backend Key | Likely Home |
|---|---|---|
| `P.DECOMMISSION_SCHOOL` | `platform.schools.delete` | School table row → Delete action |
| `P.MANAGE_SCHOOL` | `platform.schools.manage` | School settings / config reset |
| `P.BROWSE_BRANCHES` | `platform.branches.view` | Branches sidebar item / page |
| `P.ADD_BRANCH` | `platform.branches.create` | Add Branch button |
| `P.MODIFY_BRANCH` | `platform.branches.update` | Branch table row → Edit |
| `P.MANAGE_BRANCH` | `platform.branches.manage` | Branch lifecycle transitions |
| `P.DISMISS_TEAM_MEMBER` | `platform.team.delete` | Team table row → Delete action |
| `P.ASSIGN_ROLE` | `platform.roles.assign` | User Assignments page — assign/revoke role |
| `P.TRANSFER_SUPER_ADMIN` | `platform.roles.transfer` | Super admin transfer flow |
| `P.MANAGE_PERMISSIONS` | `platform.permissions.manage` | Groups / Dependencies pages — write actions |
| `P.VIEW_AUDIT` | `platform.audit.view` | Audit log sidebar item / page |
| `P.EXPORT_AUDIT` | `platform.audit.export` | Audit log → Export button |
| `P.MANAGE_AUDIT` | `platform.audit.manage` | Compliance rules management |
| `P.VIEW_DASHBOARD` | `platform.dashboard.view` | Home / Overview page |

---

## 5. Known Gaps

| Gap | Details |
|---|---|
| Permissions sub-pages (Modules, Resources, Actions, Groups, Dependencies) | Write actions (create, edit, delete buttons) are unguarded. Anyone who sees the Permissions nav can use them. Should use `P.CREATE_PERMISSION` / `P.MODIFY_PERMISSION` / `P.DELETE_PERMISSION` or `P.MANAGE_PERMISSIONS`. |
| Team → Delete member action | Table row has no Delete action. `P.DISMISS_TEAM_MEMBER` is defined but not wired. |
| Data Imports nav section | No permission gate on any sub-item. |
| Route guards | `RequirePermission` middleware is unused — a user who guesses a URL bypasses all page-level guards. |
