import { type RouteObject } from "react-router";
import RolesList from "@/pages/protected/rbac/roles";
import CreateRole from "@/pages/protected/rbac/roles/create-role";
import EditRole from "@/pages/protected/rbac/roles/edit-role";
import PermissionGroupsList from "@/pages/protected/rbac/roles/permission-groups";
import CreatePermissionGroup from "@/pages/protected/rbac/roles/permission-groups/create-group";
import EditPermissionGroup from "@/pages/protected/rbac/roles/permission-groups/edit-group";
import PermissionsList from "@/pages/protected/rbac/permissions";
import CreatePermission from "@/pages/protected/rbac/permissions/create-permission";
import EditPermission from "@/pages/protected/rbac/permissions/edit-permission";
import PermissionModulesList from "@/pages/protected/rbac/permissions/modules";

export const rbacRoutes: RouteObject[] = [
  { path: "/roles", element: <RolesList /> },
  { path: "/roles/create", element: <CreateRole /> },
  { path: "/roles/:id/edit", element: <EditRole /> },
  { path: "/roles/permission-groups", element: <PermissionGroupsList /> },
  { path: "/roles/permission-groups/create", element: <CreatePermissionGroup /> },
  { path: "/roles/permission-groups/:id/edit", element: <EditPermissionGroup /> },
  { path: "/permissions", element: <PermissionsList /> },
  { path: "/permissions/create", element: <CreatePermission /> },
  { path: "/permissions/:key/edit", element: <EditPermission /> },
  { path: "/permissions/modules", element: <PermissionModulesList /> },
];
