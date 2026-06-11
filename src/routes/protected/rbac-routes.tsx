import { lazy } from "react";
import { type RouteObject } from "react-router";

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
  { path: "/roles", element: <RolesList /> },
  { path: "/roles/create", element: <CreateRole /> },
  { path: "/roles/:id/edit", element: <EditRole /> },
  { path: "/roles/user-assignments", element: <PlatformUserAssignments /> },
  { path: "/roles/change-requests", element: <ChangeRequests /> },
  { path: "/roles/transfer-super-admin", element: <TransferSuperAdmin /> },
  { path: "/roles/permission-groups", element: <PermissionGroupsList /> },
  { path: "/roles/permission-groups/create", element: <CreatePermissionGroup /> },
  { path: "/roles/permission-groups/:id/edit", element: <EditPermissionGroup /> },
  { path: "/permissions", element: <PermissionsList /> },
  { path: "/permissions/create", element: <CreatePermission /> },
  { path: "/permissions/:key/edit", element: <EditPermission /> },
  { path: "/permissions/modules", element: <PermissionModulesList /> },
  { path: "/permissions/modules/create", element: <CreateModule /> },
  { path: "/permissions/modules/:name/edit", element: <EditModule /> },
  { path: "/permissions/resources", element: <PermissionResources /> },
  { path: "/permissions/resources/create", element: <CreateResource /> },
  { path: "/permissions/resources/:id/edit", element: <EditResource /> },
  { path: "/permissions/actions", element: <PermissionActionsPage /> },
  { path: "/permissions/actions/create", element: <CreateAction /> },
  { path: "/permissions/actions/:name/edit", element: <EditAction /> },
  { path: "/permissions/dependencies", element: <PermissionDependencies /> },
  { path: "/permissions/dependencies/create", element: <CreateDependency /> },
];
