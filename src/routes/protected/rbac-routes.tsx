import { type RouteObject } from "react-router";
import RolesList from "@/pages/protected/rbac/roles";
import CreateRole from "@/pages/protected/rbac/roles/create-role";
import EditRole from "@/pages/protected/rbac/roles/edit-role";
import UserAssignments from "@/pages/protected/rbac/roles/user-assignments";
import ChangeRequests from "@/pages/protected/rbac/roles/change-requests";
import PermissionGroupsList from "@/pages/protected/rbac/roles/permission-groups";
import CreatePermissionGroup from "@/pages/protected/rbac/roles/permission-groups/create-group";
import EditPermissionGroup from "@/pages/protected/rbac/roles/permission-groups/edit-group";
import PermissionsList from "@/pages/protected/rbac/permissions";
import CreatePermission from "@/pages/protected/rbac/permissions/create-permission";
import EditPermission from "@/pages/protected/rbac/permissions/edit-permission";
import PermissionModulesList from "@/pages/protected/rbac/permissions/modules";
import CreateModule from "@/pages/protected/rbac/permissions/modules/create-module";
import EditModule from "@/pages/protected/rbac/permissions/modules/edit-module";
import PermissionResources from "@/pages/protected/rbac/permissions/resources";
import CreateResource from "@/pages/protected/rbac/permissions/resources/create-resource";
import EditResource from "@/pages/protected/rbac/permissions/resources/edit-resource";
import PermissionActionsPage from "@/pages/protected/rbac/permissions/actions";
import CreateAction from "@/pages/protected/rbac/permissions/actions/create-action";
import EditAction from "@/pages/protected/rbac/permissions/actions/edit-action";
import PermissionDependencies from "@/pages/protected/rbac/permissions/dependencies";

export const rbacRoutes: RouteObject[] = [
  { path: "/roles", element: <RolesList /> },
  { path: "/roles/create", element: <CreateRole /> },
  { path: "/roles/:id/edit", element: <EditRole /> },
  { path: "/roles/user-assignments", element: <UserAssignments /> },
  { path: "/roles/change-requests", element: <ChangeRequests /> },
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
];
