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
const ChangeRequests = lazy(() => import("@/pages/protected/rbac/roles/change-requests"));
const TransferSuperAdmin = lazy(() => import("@/pages/protected/rbac/roles/transfer-super-admin"));
const PermissionGroupsList = lazy(() => import("@/pages/protected/rbac/roles/permission-groups"));
const CreatePermissionGroup = lazy(() => import("@/pages/protected/rbac/roles/permission-groups/create-group"));
const EditPermissionGroup = lazy(() => import("@/pages/protected/rbac/roles/permission-groups/edit-group"));
const PermissionsList = lazy(() => import("@/pages/protected/rbac/permissions"));
const CreatePermission = lazy(() => import("@/pages/protected/rbac/permissions/create-permission"));
const EditPermission = lazy(() => import("@/pages/protected/rbac/permissions/edit-permission"));
const PermissionModulesList = lazy(() => import("@/pages/protected/rbac/permissions/modules"));
const CreateModule = lazy(() => import("@/pages/protected/rbac/permissions/modules/create-module"));
const EditModule = lazy(() => import("@/pages/protected/rbac/permissions/modules/edit-module"));
const PermissionResources = lazy(() => import("@/pages/protected/rbac/permissions/resources"));
const CreateResource = lazy(() => import("@/pages/protected/rbac/permissions/resources/create-resource"));
const EditResource = lazy(() => import("@/pages/protected/rbac/permissions/resources/edit-resource"));
const PermissionActionsPage = lazy(() => import("@/pages/protected/rbac/permissions/actions"));
const CreateAction = lazy(() => import("@/pages/protected/rbac/permissions/actions/create-action"));
const EditAction = lazy(() => import("@/pages/protected/rbac/permissions/actions/edit-action"));
const PermissionDependencies = lazy(() => import("@/pages/protected/rbac/permissions/dependencies"));
const CreateDependency = lazy(() => import("@/pages/protected/rbac/permissions/create-dependency"));

export const rbacRoutes: RouteObject[] = [
  { path: "/roles", element: <RolesList />, handle: { title: "Platform Roles" } satisfies DashboardHandle },
  { path: "/roles/create", element: <CreateRole />, handle: { title: "Create Role", back: routesPath.PROTECTED.ROLES.INDEX } satisfies DashboardHandle },
  { path: "/roles/:id/edit", element: <EditRole />, handle: { title: "Edit Role", back: routesPath.PROTECTED.ROLES.INDEX } satisfies DashboardHandle },
  { path: "/roles/user-assignments", element: <PlatformUserAssignments />, handle: { title: "Platform User Assignments" } satisfies DashboardHandle },
  { path: "/roles/change-requests", element: <ChangeRequests />, handle: { title: "Change Requests" } satisfies DashboardHandle },
  { path: "/roles/transfer-super-admin", element: <TransferSuperAdmin />, handle: { title: "Transfer Super Admin" } satisfies DashboardHandle },
  { path: "/roles/permission-groups", element: <PermissionGroupsList />, handle: { title: "Permission Groups" } satisfies DashboardHandle },
  { path: "/roles/permission-groups/create", element: <CreatePermissionGroup />, handle: { title: "Create Permission Group", back: routesPath.PROTECTED.ROLES.GROUPS.INDEX } satisfies DashboardHandle },
  { path: "/roles/permission-groups/:id/edit", element: <EditPermissionGroup />, handle: { title: "Edit Permission Group", back: routesPath.PROTECTED.ROLES.GROUPS.INDEX } satisfies DashboardHandle },
  { path: "/permissions", element: <PermissionsList />, handle: { title: "Permissions" } satisfies DashboardHandle },
  { path: "/permissions/create", element: <CreatePermission />, handle: { title: "Create Permission", back: routesPath.PROTECTED.PERMISSIONS.INDEX } satisfies DashboardHandle },
  { path: "/permissions/:key/edit", element: <EditPermission />, handle: { title: "Edit Permission", back: routesPath.PROTECTED.PERMISSIONS.INDEX } satisfies DashboardHandle },
  { path: "/permissions/modules", element: <PermissionModulesList />, handle: { title: "Permission Modules" } satisfies DashboardHandle },
  { path: "/permissions/modules/create", element: <CreateModule />, handle: { title: "Create Module", back: routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX } satisfies DashboardHandle },
  { path: "/permissions/modules/:name/edit", element: <EditModule />, handle: { title: "Edit Module", back: routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX } satisfies DashboardHandle },
  { path: "/permissions/resources", element: <PermissionResources />, handle: { title: "Permission Resources" } satisfies DashboardHandle },
  { path: "/permissions/resources/create", element: <CreateResource />, handle: { title: "Create Resource", back: routesPath.PROTECTED.PERMISSIONS.RESOURCES.INDEX } satisfies DashboardHandle },
  { path: "/permissions/resources/:id/edit", element: <EditResource />, handle: { title: "Edit Resource", back: routesPath.PROTECTED.PERMISSIONS.RESOURCES.INDEX } satisfies DashboardHandle },
  { path: "/permissions/actions", element: <PermissionActionsPage />, handle: { title: "Permission Actions" } satisfies DashboardHandle },
  { path: "/permissions/actions/create", element: <CreateAction />, handle: { title: "Create Action", back: routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX } satisfies DashboardHandle },
  { path: "/permissions/actions/:name/edit", element: <EditAction />, handle: { title: "Edit Action", back: routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX } satisfies DashboardHandle },
  { path: "/permissions/dependencies", element: <PermissionDependencies />, handle: { title: "Permission Dependencies" } satisfies DashboardHandle },
  { path: "/permissions/dependencies/create", element: <CreateDependency />, handle: { title: "Add Dependency", back: routesPath.PROTECTED.PERMISSIONS.DEPENDENCIES.INDEX } satisfies DashboardHandle },
];
