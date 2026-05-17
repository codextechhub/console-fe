# Permission Protection Audit

Maps every UI element that is gated behind a permission check — sidebar items, page buttons, table actions — and the permission constant that guards it. Use this to verify what's working, what's missing, and what's not wired up yet.

Permission constants live in `src/permissions/index.ts`.  
The actual backend keys follow the pattern `module.resource.action`.

---

## 1. Sidebar Navigation (`src/components/app-sidebar.tsx`)

Parent items are hidden if the user lacks the listed permission. Sub-items inherit the parent's visibility unless they declare their own check.

| Menu Item | Sub-item | Permission Constant | Notes |
|---|---|---|---|
| Home | — | _(none — always visible)_ | |
| School Management | — | `P.BROWSE_SCHOOLS` | |
| Team Management | — | `P.ACCESS_TEAM_PANEL` | |
| Roles | Platform Roles | `P.VIEW_ROLES` | |
| Roles | User Assignments | `P.VIEW_ROLES` | inherits parent |
| Roles | Change Requests | `P.VIEW_ROLES` | inherits parent |
| Roles | Transfer Super Admin | `P.TRANSFER_SUPER_ADMIN` | own check via `hasPermission`; only super admin sees it; backend further restricts execution to the active super admin |
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

### Roles → Platform User Assignments (`src/pages/protected/rbac/roles/platform-user-assignments.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Assign Role" button | `<PermissionGate>` | `P.ASSIGN_ROLE` |
| Table row → "Revoke" dropdown action (ACTIVE rows) | `hasPermission()` | `P.ASSIGN_ROLE` |
| Detail sheet → "Revoke Assignment" button | prop-passed `canRevoke` | `P.ASSIGN_ROLE` |

---

### Roles → Transfer Super Admin (`src/pages/protected/rbac/roles/transfer-super-admin.tsx`)

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
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions → Modules (`src/pages/protected/rbac/permissions/modules/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add Module" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions → Resources (`src/pages/protected/rbac/permissions/resources.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Resource" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions → Actions (`src/pages/protected/rbac/permissions/actions.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Action" button | `<PermissionGate>` | `P.CREATE_PERMISSION` |
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MODIFY_PERMISSION` |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.DELETE_PERMISSION` |

---

### Permissions → Dependencies (`src/pages/protected/rbac/permissions/dependencies.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add Dependency" button | `<PermissionGate>` | `P.MANAGE_PERMISSIONS` |
| Table row → "Remove" dropdown action | `hasPermission()` | `P.MANAGE_PERMISSIONS` |

> "View Chain" is read-only and always available to users who can see the page.

---

### Roles → Permission Groups (`src/pages/protected/rbac/roles/permission-groups/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New Group" button | `<PermissionGate>` | `P.MANAGE_PERMISSIONS` |
| Table row → "Edit" dropdown action | `hasPermission()` | `P.MANAGE_PERMISSIONS` |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.MANAGE_PERMISSIONS` |

> Delete is also suppressed for system groups regardless of permission.

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
| Table row → "Delete" action | `hasPermission()` | `P.DISMISS_TEAM_MEMBER` |

> Delete is suppressed for the currently signed-in user regardless of permission, and is preceded by a confirmation dialog.

---

### Team Management — Invites (`src/pages/protected/team-mgt/tabs/invites.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New User" button | `<PermissionGate>` | `P.INVITE_TEAM_MEMBER` |

---

## 3. Route-level Guards

No route-level guards. The previous `RequirePermission` middleware was deleted as dead code. All page-level protection is handled inside the page components themselves via `<PermissionGate>` and `hasPermission()`. The backend is the authoritative gate — anyone who reaches a page they shouldn't see still gets a 403 from the API.

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
| `P.DISMISS_TEAM_MEMBER` | `platform.team.delete` |
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

### Not yet wired (defined but no UI check uses them)

| Constant | Backend Key | Likely Home |
|---|---|---|
| `P.DECOMMISSION_SCHOOL` | `platform.schools.delete` | School table row → Delete action |
| `P.MANAGE_SCHOOL` | `platform.schools.manage` | School settings / config reset |
| `P.BROWSE_BRANCHES` | `platform.branches.view` | Branches sidebar item / page |
| `P.ADD_BRANCH` | `platform.branches.create` | Add Branch button |
| `P.MODIFY_BRANCH` | `platform.branches.update` | Branch table row → Edit |
| `P.MANAGE_BRANCH` | `platform.branches.manage` | Branch lifecycle transitions |
| `P.VIEW_AUDIT` | `platform.audit.view` | Audit log sidebar item / page |
| `P.EXPORT_AUDIT` | `platform.audit.export` | Audit log → Export button |
| `P.MANAGE_AUDIT` | `platform.audit.manage` | Compliance rules management |
| `P.VIEW_DASHBOARD` | `platform.dashboard.view` | Home / Overview page |

---

## 5. Known Gaps

| Gap | Details |
|---|---|
| Data Imports nav section | No permission gate on any sub-item. Defer until the data-imports backend lands. |
| Branches / Audit / Dashboard | Constants defined but the pages those constants would gate haven't been built yet. |
