import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const RolesList = lazy(() => import("@/pages/protected/rbac/roles"));
const CreateRole = lazy(() => import("@/pages/protected/rbac/roles/create-role"));
const EditRole = lazy(() => import("@/pages/protected/rbac/roles/edit-role"));
const PlatformUserAssignments = lazy(() => import("@/pages/protected/rbac/roles/platform-user-assignments"));
const TransferSuperAdmin = lazy(() => import("@/pages/protected/rbac/roles/transfer-super-admin"));
const FieldAccess = lazy(() => import("@/pages/protected/rbac/field-access"));
const PermissionGroupsList = lazy(() => import("@/pages/protected/rbac/roles/permission-groups"));
const CreatePermissionGroup = lazy(() => import("@/pages/protected/rbac/roles/permission-groups/create-group"));
const EditPermissionGroup = lazy(() => import("@/pages/protected/rbac/roles/permission-groups/edit-group"));
const PermissionsList = lazy(() => import("@/pages/protected/rbac/permissions"));
const PermissionModulesList = lazy(() => import("@/pages/protected/rbac/permissions/modules"));
const PermissionResources = lazy(() => import("@/pages/protected/rbac/permissions/resources"));
const PermissionActionsPage = lazy(() => import("@/pages/protected/rbac/permissions/actions"));
const PermissionDependencies = lazy(() => import("@/pages/protected/rbac/permissions/dependencies"));

export const rbacRoutes: RouteObject[] = [
  { path: "/roles", element: <RolesList />, handle: { title: "Platform Roles" } satisfies DashboardHandle },
  { path: "/roles/create", element: <CreateRole />, handle: { title: "Create Role", back: routesPath.PROTECTED.ROLES.INDEX } satisfies DashboardHandle },
  { path: "/roles/:id/edit", element: <EditRole />, handle: { title: "Edit Role", back: routesPath.PROTECTED.ROLES.INDEX } satisfies DashboardHandle },
  { path: "/roles/user-assignments", element: <PlatformUserAssignments />, handle: { title: "Platform User Assignments" } satisfies DashboardHandle },
  { path: "/roles/transfer-super-admin", element: <TransferSuperAdmin />, handle: { title: "Transfer Super Admin" } satisfies DashboardHandle },
  { path: "/roles/field-access", element: <FieldAccess />, handle: { title: "Field Access" } satisfies DashboardHandle },
  { path: "/roles/permission-groups", element: <PermissionGroupsList />, handle: { title: "Permission Groups" } satisfies DashboardHandle },
  { path: "/roles/permission-groups/create", element: <CreatePermissionGroup />, handle: { title: "Create Group", back: routesPath.PROTECTED.ROLES.GROUPS.INDEX } satisfies DashboardHandle },
  { path: "/roles/permission-groups/:id/edit", element: <EditPermissionGroup />, handle: { title: "Edit Group", back: routesPath.PROTECTED.ROLES.GROUPS.INDEX } satisfies DashboardHandle },
  { path: "/permissions", element: <PermissionsList />, handle: { title: "Permissions" } satisfies DashboardHandle },
  { path: "/permissions/modules", element: <PermissionModulesList />, handle: { title: "Permission Modules" } satisfies DashboardHandle },
  { path: "/permissions/resources", element: <PermissionResources />, handle: { title: "Permission Resources" } satisfies DashboardHandle },
  { path: "/permissions/actions", element: <PermissionActionsPage />, handle: { title: "Permission Actions" } satisfies DashboardHandle },
  { path: "/permissions/dependencies", element: <PermissionDependencies />, handle: { title: "Permission Dependencies" } satisfies DashboardHandle },
];
