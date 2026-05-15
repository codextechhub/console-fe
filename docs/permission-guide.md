# Frontend Permission Guide

This document explains how the Frontend Layout Security (FLS) system works in this codebase. Any developer adding new routes, menu items, or action buttons must follow this guide. If the permission system changes, update this file at the same time.

---

## Overview

Permissions come from the backend at login. The backend uses a role-based access control (RBAC) system where each user is assigned a role, and each role has a set of permission keys. The frontend receives these keys in the login response and stores them in Redux (persisted via `redux-persist` so they survive page refresh).

**Permission key format: `module.resource.action`**

Examples:
- `platform.schools.view`
- `platform.schools.create`
- `platform.schools.edit`
- `platform.team.view`

The backend is the source of truth. Always verify a permission key exists in the backend registry before using it on the frontend.

---

## Permission Registry

All backend permission keys live in **one file only**: `src/permissions/index.ts`.

Nowhere else in the codebase should reference a raw `"platform.x.y"` string. Everything uses the opaque numeric codes exported as `P.*` constants.

```ts
import { P } from "@/permissions";

// Names describe UI capabilities — never use raw strings or codes directly
P.BROWSE_SCHOOLS    // "100101"  →  "platform.schools.view" internally
P.ONBOARD_SCHOOL    // "100102"  →  "platform.schools.create"
P.ACCESS_TEAM_PANEL // "100201"  →  "platform.team.view"
// P.APPROVE_INVOICE  // "200105" — uncomment when finance module ships
```

The `P` object is a flat map of UI-intent names to opaque numeric codes. Names describe what the user is doing in the UI — not the backend key structure. A reader of any file outside `src/permissions/index.ts` cannot infer the backend key format from the constant name alone.

To add a new permission: pick the next code in the correct range, add it to `REGISTRY` and `P` with a UI-intent name, then use `P.YOUR_CONSTANT` everywhere.

**Code format: `MM RR AA`**

| Digits | Meaning | Examples |
|--------|---------|---------|
| MM | Module | 10=platform, 20=finance, 30=academics, 40=communication |
| RR | Resource within module | 01=schools, 02=team, 03=roles |
| AA | Action | 01=view, 02=create, 03=edit, 04=delete, 05=approve, 06=export |

---

## How Permissions Flow

```
Login response
  └── data.permissions: string[]        ← flat array of permitted keys
        └── stored in Redux auth slice   ← persisted to localStorage
              └── rehydrated on refresh  ← PersistGate blocks render until done
```

**Key files:**
| File | Role |
|------|------|
| `src/redux/features/auth/authSlice.ts` | Stores and exposes `permissions[]` |
| `src/redux/store/index.ts` | Persists `auth` slice (including permissions) |
| `src/hooks/use-permissions.ts` | Hook for checking permissions in components |
| `src/middleware/require-permission.tsx` | Route-level guard |
| `src/components/custom/permission-gate.tsx` | UI-level guard |
| `src/components/app-sidebar.tsx` | Sidebar filtering |

---

## The Three Enforcement Points

### 1. Sidebar — hide menu items the user cannot access

Each nav item in `app-sidebar.tsx` has a `permission` field. Items are filtered before render.

```ts
{
  title: "School Management",
  url: routesPath.PROTECTED.SCHOOL_MGT.INDEX,
  icon: SchoolIcon,
  permission: P.BROWSE_SCHOOLS,
  permissionMode: "any",
}

// Multiple permissions — any one grants visibility
{
  title: "Reports",
  url: routesPath.PROTECTED.REPORTS.INDEX,
  icon: ReportsIcon,
  permission: [P.EXPORT_RECORDS, P.ACCESS_SYSTEM_DATA],
  permissionMode: "any",   // visible if either key is present
}

// Multiple permissions — must have all
{
  title: "Admin Panel",
  permission: [P.VIEW_ROLES, P.MODIFY_ROLE],
  permissionMode: "all",   // visible only if both keys are present
}

// Always visible (no permission required)
{
  title: "Home",
  permission: null,
}
```

> **Sidebar alone is not enough.** A user can type the URL directly. Always add a `RequirePermission` guard on the route as well.

---

### 2. `RequirePermission` — block the route entirely

Use this as a layout route wrapping a group of paths. If the user lacks the permission, they are redirected to `/unauthorized`.

```tsx
// src/routes/protected/your-feature-routes.tsx

import RequirePermission from "@/middleware/require-permission";
import { P } from "@/permissions";

export const yourFeatureRoutes: RouteObject[] = [
  // ── View-only pages ────────────────────────────────────────
  {
    element: <RequirePermission permission={P.BROWSE_YOUR_FEATURE} />,
    children: [
      { path: routesPath.PROTECTED.FEATURE.INDEX, Component: FeatureList },
      { path: routesPath.PROTECTED.FEATURE.VIEW_PATH, Component: ViewFeature },
    ],
  },

  // ── Create page — requires view AND create ────────────────
  {
    element: (
      <RequirePermission
        permission={[P.BROWSE_YOUR_FEATURE, P.CREATE_YOUR_FEATURE]}
        mode="all"
      />
    ),
    children: [
      { path: routesPath.PROTECTED.FEATURE.CREATE, Component: CreateFeature },
    ],
  },

  // ── Edit page — requires view AND edit ───────────────────
  {
    element: (
      <RequirePermission
        permission={[P.BROWSE_YOUR_FEATURE, P.MODIFY_YOUR_FEATURE]}
        mode="all"
      />
    ),
    children: [
      { path: routesPath.PROTECTED.FEATURE.EDIT_PATH, Component: EditFeature },
    ],
  },
];
```

> **Important:** Edit and create routes must always include `view` as a required permission (using `mode="all"`). Without it, a user with only `edit` can bypass the list page by navigating directly to the edit URL.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `permission` | `string \| string[]` | required | One key or an array of keys |
| `mode` | `"any" \| "all"` | `"any"` | Whether any key or all keys must be present |

---

### 3. `PermissionGate` — hide or replace UI elements inside a page

Use this for buttons, sections, or any element inside a page the user can already visit.

```tsx
import PermissionGate from "@/components/custom/permission-gate";

// Hide entirely when permission is missing
<PermissionGate permission={P.ONBOARD_SCHOOL}>
  <Button>Add New School</Button>
</PermissionGate>

// Show a fallback instead
<PermissionGate
  permission={P.MODIFY_SCHOOL}
  fallback={<span className="text-gray-01 text-sm">View only</span>}
>
  <Button>Edit School</Button>
</PermissionGate>

// Render disabled button instead of hiding
<PermissionGate
  permission={P.DECOMMISSION_SCHOOL}
  fallback={<Button disabled>Delete</Button>}
>
  <Button>Delete</Button>
</PermissionGate>

// Multiple permissions — any one
<PermissionGate permission={[P.ONBOARD_SCHOOL, P.MODIFY_SCHOOL]}>
  <Button>Add</Button>
</PermissionGate>

// Multiple permissions — all required
<PermissionGate
  permission={[P.BROWSE_SCHOOLS, P.MODIFY_SCHOOL]}
  mode="all"
>
  <Button>Edit</Button>
</PermissionGate>
```

**For dropdown action lists** (plain object arrays, not JSX), use `usePermissions()` directly:

```tsx
import { usePermissions } from "@/hooks/use-permissions";

const { hasPermission } = usePermissions();

dropDownList={(row) => [
  {
    label: "View Details",
    onActionClick: () => navigate(routesPath.VIEW(row._slug)),
  },
  ...(hasPermission(P.MODIFY_SCHOOL) ? [{
    label: "Edit School",
    onActionClick: () => navigate(routesPath.EDIT(row._slug)),
  }] : []),
  ...(hasPermission(P.DECOMMISSION_SCHOOL) ? [{
    label: "Delete",
    className: "text-destructive",
    onActionClick: () => handleDelete(row._slug),
  }] : []),
]}
```

---

## Checklist: Adding a New Protected Feature

When adding a new section to the app, work through this checklist:

- [ ] **Verify the permission keys exist** in the backend registry (`vs_rbac` app). Don't invent keys — a typo silently denies access to everyone.
- [ ] **Add a sidebar item** in `app-sidebar.tsx` with the correct `permission` and `permissionMode`.
- [ ] **Create a route file** (e.g. `your-feature-routes.tsx`) and wrap each group of paths in `<RequirePermission />`.
- [ ] **Edit/create routes must include `view`** using `mode="all"` — never guard them with only the edit/create key.
- [ ] **Add `PermissionGate`** around action buttons inside the page (Add, Edit, Delete).
- [ ] **Use `hasPermission()` directly** to filter dropdown action items.
- [ ] **Register the routes** in `src/routes/protected/index.tsx`.
- [ ] **Test both paths**: (a) a user with the permission, (b) a user without — manually type the URL for the restricted page and confirm `/unauthorized` is shown.

---

## The `usePermissions` Hook

```ts
import { usePermissions } from "@/hooks/use-permissions";

const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

hasPermission(P.BROWSE_SCHOOLS)                                  // single key
hasAnyPermission(P.BROWSE_SCHOOLS, P.ACCESS_SYSTEM_DATA)         // at least one
hasAllPermissions(P.BROWSE_SCHOOLS, P.MODIFY_SCHOOL)             // all required
```

---

## Known Edge Cases

### 1. Permissions sync on mount and token refresh

Permissions are loaded at login. Two mechanisms keep them in sync after that:

- **On app mount** — `authenticated.tsx` calls `GET /user/auth/me/` via `useGetMeQuery`. The `onQueryStarted` handler dispatches `updatePermissions` with the fresh list. This catches any role changes that happened while the token was still valid.
- **On token refresh** — `baseApi.ts` calls `fetchFreshPermissions()` immediately after a successful token refresh and dispatches `updatePermissions`. This covers the silent re-authentication path.

**Remaining gap:** If a user's permissions are revoked and their token has not yet expired, there is a window (up to the token's lifespan) before the next app mount triggers a sync. The backend will still return 403 on any API call that requires the revoked permission, so the user cannot actually perform the action even if the UI briefly shows the button.

### 2. Token refresh syncs permissions — resolved

Previously only `setToken()` was dispatched on token refresh. `fetchFreshPermissions()` is now called immediately after and dispatches `updatePermissions` with the server's current list. See `baseApi.ts`.

### 3. Edit/create routes must also require `view`

Without requiring the view permission on edit/create routes, a user with only the edit code can navigate directly to `/feature/:id/edit` even though they cannot see the list page. Always use `mode="all"` with both codes on edit and create route guards (see checklist above).

### 4. Adding a wrong code fails silently

A code that doesn't exist in `REGISTRY` (e.g. a typo or a code that was never added) resolves to `""`, which will never match any backend permission. The guard denies everyone, including admins. TypeScript will catch a code that isn't a valid `PermissionCode` value, but it won't catch a valid code that was mapped to the wrong backend key. Always cross-reference with the backend's `PermissionKey` registry before committing.

### 5. Routes with `permission: null` (always-visible) are unguarded

The Home/Overview route is intentionally accessible to all authenticated users (`permission: null` in the sidebar, no `RequirePermission` on the route). If sensitive data is ever added to the Overview page, a permission guard must be added at that time — both on the route and on the sidebar item.

### 6. No permission bypass for superusers on the frontend

The frontend checks the flat `permissions[]` array. If a superuser's login response includes all permission keys (as the backend `get_effective_permissions()` should return), everything works. If a superuser somehow gets an empty permissions array from the login response, they will be blocked by every guard. Verify the backend returns the full set for superusers.

---

## Field-Level Security (FLS) — Hiding Stripped Response Fields

The backend serializer mixin (`FieldSecurityMixin` in `vs_rbac/fls.py`) can strip individual fields from an API response when the requesting user lacks the required read permission. Instead of sending the field at all, the backend appends a `_stripped_fields` array to the response listing every field it removed.

```json
{
  "name": "John Doe",
  "email": "john@school.com",
  "_stripped_fields": ["medical_notes", "guardian_contacts"]
}
```

This lets the frontend distinguish two different states:

| State | What it means | What to show |
|-------|--------------|-------------|
| Field in `_stripped_fields` | User has no permission to see it | Hide the element entirely |
| Field absent / null / empty, not stripped | Field exists, no data yet | Render `"—"` |

### Usage

Import from `@/utils/fls`:

```tsx
import { isStripped, strippedFields } from "@/utils/fls";

// Single field check
{!isStripped(student, "medical_notes") && (
  <Row label="Medical Notes" value={student.medical_notes ?? "—"} />
)}

// Multiple fields — build a Set once to avoid repeated .includes() calls
const stripped = strippedFields(student);

<Row label="Medical Notes"        hidden={stripped.has("medical_notes")}        value={student.medical_notes ?? "—"} />
<Row label="Guardian Contacts"    hidden={stripped.has("guardian_contacts")}    value={student.guardian_contacts ?? "—"} />
<Row label="Disciplinary Notes"   hidden={stripped.has("disciplinary_notes")}   value={student.disciplinary_notes ?? "—"} />
```

### Typing API responses

Wrap any RTK Query response type with `WithFls<T>` to make `_stripped_fields` visible to TypeScript:

```ts
import type { WithFls } from "@/utils/fls";

type StudentDetail = WithFls<{
  name: string;
  email: string;
  medical_notes?: string | null;
  guardian_contacts?: string | null;
}>;
```

### When to apply

Only relevant for serializers that use `FieldSecurityMixin`. If a serializer does not declare `read_permissions`, its responses will never contain `_stripped_fields` and you can use the normal `?? "—"` pattern for missing values.

### Rule: backend and frontend must be updated in the same PR

Whenever a serializer gains a `read_permissions` entry, the corresponding frontend page **must** be updated in the same PR to guard those fields with `isStripped` / `strippedFields`.

The two are always coupled. If the backend strips a field but the frontend does not guard it, the field silently disappears — the user sees no label, no dash, no explanation. `_stripped_fields` is the contract between them; one side without the other is a bug.

When writing the PR description, list which fields were added to `read_permissions` so the reviewer can verify the frontend side was updated too.

---

## Architecture Diagram

```
User navigates to URL
        │
        ▼
  Authenticated         ← checks for valid access token (cookie)
  middleware            ← redirects to /login if missing
        │
        ▼
  RequirePermission     ← checks Redux permissions[]
  (route guard)         ← redirects to /unauthorized if missing
        │
        ▼
  Page renders
        │
        ├── Sidebar     ← already filtered; matching items only shown
        │
        └── Page body
              ├── PermissionGate  ← hides/replaces buttons & sections
              └── hasPermission() ← filters dropdown action items
```

---

## Current Permission Map

| Feature | View route guard | Create route guard | Edit route guard | Sidebar key |
|---------|-----------------|-------------------|-----------------|-------------|
| School Management | `platform.schools.view` | `view` + `create` (all) | `view` + `edit` (all) | `platform.schools.view` |
| Team Management | `platform.team.view` | — | — | `platform.team.view` |
| Overview / Home | none (open to all authenticated users) | — | — | `null` |
