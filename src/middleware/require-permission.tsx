/**
 * RequirePermission — wrap route groups that need FLS enforcement.
 * Import permission codes from @/permissions and use P.* constants.
 *
 * Single permission:
 *   element: <RequirePermission permission={P.BROWSE_SCHOOLS} />
 *
 * Any one of these (default mode):
 *   element: <RequirePermission permission={[P.BROWSE_SCHOOLS, P.MODIFY_SCHOOL]} />
 *
 * Must have ALL of these:
 *   element: <RequirePermission permission={[P.BROWSE_SCHOOLS, P.MODIFY_SCHOOL]} mode="all" />
 *
 * Unauthorised users are redirected to /unauthorized.
 */
import { type PermissionCode } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { Navigate, Outlet } from "react-router";

interface Props {
  permission: PermissionCode | PermissionCode[];
  mode?: "any" | "all";
}

export default function RequirePermission({ permission, mode = "any" }: Props) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const codes = Array.isArray(permission) ? permission : [permission];

  const allowed =
    codes.length === 1
      ? hasPermission(codes[0])
      : mode === "all"
        ? hasAllPermissions(...codes)
        : hasAnyPermission(...codes);

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
