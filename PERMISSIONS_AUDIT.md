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
| Data Imports | Import Batches | _(none — always visible)_ | parent always visible; page-level actions gated individually |
| Data Imports | Import Templates | _(none — always visible)_ | parent always visible; create gated by `P.CREATE_IMPORT_TEMPLATE` |

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

> The `DELETE /user/users/{id}/` endpoint exists on the backend but is a soft-deactivate — functionally the same as Suspend. The UI therefore does not expose a separate Delete action; Suspend is the canonical deactivation flow.

---

### Team Management — Invites (`src/pages/protected/team-mgt/tabs/invites.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Add New User" button | `<PermissionGate>` | `P.INVITE_TEAM_MEMBER` |

---

### Data Imports — Templates list (`src/pages/protected/data-imports/templates/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Template" button | `<PermissionGate>` + `user_type === "CX_STAFF"` | `P.CREATE_IMPORT_TEMPLATE` |
| Download CSV / XLSX (table dropdown) | _(none — backend allows all viewers)_ | — |
| View Details (table dropdown) | _(none)_ | — |

> Backend has no update/delete endpoint for templates. Detail sheet is read-only after creation.

---

### Data Imports — Batches list (`src/pages/protected/data-imports/batches/index.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "New Import" button | `<PermissionGate>` | `P.UPLOAD_IMPORT_BATCH` (currently disabled — wizard not yet built) |
| Table row → "Delete" dropdown action | `hasPermission()` | `P.DELETE_IMPORT_BATCH` (also hidden for in-flight batches) |

---

### Data Imports — Batch detail (`src/pages/protected/data-imports/batches/view-batch.tsx`)

| Element | Type | Permission Constant |
|---|---|---|
| "Validate" button | `<PermissionGate>` | `P.RUN_IMPORT_VALIDATION` |
| "Start Import" button | `<PermissionGate>` | `P.EXECUTE_IMPORT_BATCH` |
| "Delete" button | `<PermissionGate>` | `P.DELETE_IMPORT_BATCH` |
| Issue row → "Resolve" button | `<PermissionGate>` | `P.RESOLVE_IMPORT_ISSUE` |
| Job row → "Rollback" button | `<PermissionGate>` | `P.RUN_IMPORT_ROLLBACK` |
| Tabs (Issues / Jobs / Row Results / Audit / Notifications) | _(always rendered if user can view batch)_ | backend further restricts each endpoint |

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

### Not yet wired (defined but no UI check uses them)

| Constant | Backend Key | Likely Home |
|---|---|---|
| `P.DISMISS_TEAM_MEMBER` | `platform.team.delete` | No UI surface — DELETE on the backend is a soft-deactivate equivalent to Suspend, which already has its own gated action. Consider deprecating this constant or repurposing if hard-delete is added later. |
| `P.DECOMMISSION_SCHOOL` | `platform.schools.delete` | School table row → Delete action |
| `P.MANAGE_SCHOOL` | `platform.schools.manage` | School settings / config reset |
| `P.BROWSE_BRANCHES` | `platform.branches.view` | Branches sidebar item / page |
| `P.ADD_BRANCH` | `platform.branches.create` | Add Branch button |
| `P.MODIFY_BRANCH` | `platform.branches.update` | Branch table row → Edit |
| `P.MANAGE_BRANCH` | `platform.branches.manage` | Branch lifecycle transitions |
| `P.VIEW_DASHBOARD` | `platform.dashboard.view` | Home / Overview page |
| `P.VIEW_SECURITY` | `platform.security.view` | Defined for future security-only read separation; today the Audit pages gate on `P.VIEW_AUDIT`. |
| `P.IMPERSONATE_USER` | `platform.security.impersonate` | "Start impersonation" entry point — not yet built; the current Impersonations page only lists sessions. |
| `P.VIEW_IMPORT_TEMPLATES` | `import.templates.view` | Defined for parity with backend; FE doesn't gate the list page (everyone authenticated can hit it; backend filters). |
| `P.MANAGE_IMPORT_TEMPLATES` | `import.templates.manage` | Reserved for future edit/publish/retire flows once backend supports them. |
| `P.VIEW_IMPORT_BATCHES` | `import.batches.view` | Defined; FE doesn't gate the list page (backend filters). |
| `P.UPLOAD_IMPORT_BATCH` | `import.batches.create` | Wired to "New Import" button which is disabled until the upload wizard ships. |
| `P.EDIT_IMPORT_BATCH` | `import.batches.update` | No UI surface yet — batch detail metadata edit (notes / sheet / header row) not exposed. |
| `P.VIEW_IMPORT_ISSUES` | `import.validations.view` | Defined; Issues tab inherits batch-view permission. |
| `P.VIEW_IMPORT_JOBS` | `import.jobs.view` | Defined; Jobs tab inherits batch-view permission. |
| `P.VIEW_IMPORT_ROLLBACKS` | `import.rollbacks.view` | Defined; rollback list not yet shown in UI (only the rollback action). |
| `P.VIEW_IMPORT_AUDIT` | `import.audit.view` | Defined; Audit tab inherits batch-view permission. |
| `P.VIEW_IMPORT_NOTIFICATIONS` | `import.notifications.view` | Defined; Notifications tab inherits batch-view permission. |

---

## 6. Audit & Security Pages — Permission Wiring

The "Audit & Security" sidebar group is gated by `P.VIEW_AUDIT`. The
two write-heavy sub-items (Audit Exports, Compliance Rules) are gated
individually so users with read-only `P.VIEW_AUDIT` don't see entries
they cannot actually open. Equivalent treatment was applied to the
"Change Requests" sub-item under Roles.

| Page | Sidebar gate | Action gates |
|---|---|---|
| `/audit` Security Dashboard | `P.VIEW_AUDIT` (group) | "Export view" → `P.EXPORT_AUDIT` |
| `/audit/events` Events Explorer | `P.VIEW_AUDIT` (group) | "Export filtered" → `P.EXPORT_AUDIT` |
| `/audit/entity-trails` and detail | `P.VIEW_AUDIT` (group) | — |
| `/audit/sessions` Live Sessions | `P.VIEW_AUDIT` (group) | "End session" → `P.SUSPEND_TEAM_MEMBER` (mirrors backend `platform.team.suspend`) |
| `/audit/login-attempts` | `P.VIEW_AUDIT` (group) | — (read-only) |
| `/audit/lockouts` | `P.VIEW_AUDIT` (group) | "Unlock account" → `P.REACTIVATE_TEAM_MEMBER` |
| `/audit/password-activity` | `P.VIEW_AUDIT` (group) | — (read-only) |
| `/audit/impersonations` | `P.VIEW_AUDIT` (group) | "End impersonation" → `P.END_IMPERSONATION` |
| `/audit/exports`, `/audit/exports/new` | `P.VIEW_AUDIT` (group) + `P.EXPORT_AUDIT` (sub-item) | "New export" → `P.EXPORT_AUDIT` |
| `/audit/compliance-rules` and form | `P.VIEW_AUDIT` (group) + `P.MANAGE_AUDIT` (sub-item) | Add / Edit / Delete → `P.MANAGE_AUDIT` |
| `/roles/change-requests` | `P.VIEW_ROLES` (group) + `P.MODIFY_ROLE` (sub-item) | — |
| `/me/security/*` (all 6 user pages) | none — self-service, every signed-in user can access | — |

## 7. Known Gaps

| Gap | Details |
|---|---|
| Data Imports nav parent | Parent menu has no gate; sub-items always visible. Page-level actions are gated individually (see §2 below). |
| Data Imports upload flow | "New Import" button on Batches list is disabled — full upload wizard not yet built. The `UPLOAD_IMPORT_BATCH` permission is wired but the action is a no-op. |
| Branches / Dashboard | Constants defined but the pages those constants would gate haven't been built yet. |
| `P.VIEW_SECURITY` / `P.IMPERSONATE_USER` | New audit pages currently gate on `P.VIEW_AUDIT`. Once the backend adds `platform.security.*` permission rows and the "Start impersonation" entry-point UI is built, wire those constants. |
| Backend permission seeding | The bootstrap (`apps/core/management/commands/create_superuser.py`) does not yet seed the new `platform.security.*` permission rows in the DB. Add them when wiring `P.VIEW_SECURITY` / `P.IMPERSONATE_USER`. |
